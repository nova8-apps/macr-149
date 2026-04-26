/**
 * @nova8/backend/storage — Cloudflare R2 file storage for generated Nova8 apps
 * ───────────────────────────────────────────────────────────────────────────────
 * All calls go through nova8.dev's public /api/app/:projectId/storage/*
 * endpoints (Wave 3e). Apps never touch R2 directly. Per-user isolation is
 * enforced structurally by Nova8 — user A cannot list, download, or delete
 * user B's files.
 *
 * Auth (dual-header, auto-wired):
 *   x-nova8-project-key : public key from expo.extra.nova8ProjectApiKey
 *   x-nova8-app-token       : end-user session token from @nova8/backend/auth
 *
 * Caps (shared with other storage calls on this project):
 *   Free tier: 1 GB total / 100 uploads/day / 1000 downloads/day per project.
 *   50 MB max per single file. Response 429 { resetsAt } when exceeded.
 *
 * Upload flow (3 steps handled inside upload()):
 *   1. POST /storage/upload-url   → returns presigned R2 PUT URL
 *   2. XHR PUT <bytes> → R2       (out-of-band; Nova8 never proxies the bytes)
 *   3. POST /storage/finalize     → writes Firestore metadata and confirms size
 *
 * @example
 *   import { storage, auth } from "@/nova8/backend";
 *
 *   // Requires a signed-in user.
 *   if (!auth.currentUser()) { router.replace("/signin"); return; }
 *
 *   const file = await storage.upload(someFile, { folder: "avatars" });
 *   const url  = await storage.getUrl(file.id);
 *   const all  = await storage.list({ folder: "avatars" });
 *   await storage.remove(file.id);
 */

import { getApiBase, getProjectId, getProjectApiKey } from "./_config";
import { getToken } from "./auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FileMeta {
  id: string;
  key: string;
  filename: string;
  folder: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ── Request helper ────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error(
      "[nova8/storage] No signed-in user. Call auth.signInWithEmail / signInWithApple / signInWithGoogle first.",
    );
  }

  const url = `${getApiBase()}/api/app/${getProjectId()}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-nova8-project-key": getProjectApiKey(),
      "x-nova8-app-token": token,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let message = `Nova8 Storage: HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string; code?: string; error?: string };
      if (data.message) message = data.message;
      // Friendly messages for common cap errors
      if (res.status === 413 || data.code === "STORAGE_FILE_TOO_LARGE") {
        message = "Nova8 Storage: 50 MB file size limit exceeded.";
      } else if (res.status === 429) {
        message = "Nova8 Storage: Daily upload cap reached. Resets at midnight UTC.";
      }
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── XHR upload with progress ──────────────────────────────────────────────────

function xhrPut(
  url: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType || "application/octet-stream");

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Nova8 Storage: R2 PUT failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Nova8 Storage: Network error during upload."));
    xhr.ontimeout = () => reject(new Error("Nova8 Storage: Upload timed out."));
    xhr.timeout = 5 * 60 * 1000;
    xhr.send(file);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upload a file to Cloudflare R2 via presigned URL.
 * Returns FileMeta on success.
 *
 * @param file Browser File / Blob, or a React Native blob-like with `name`,
 *             `size`, and `type`. React Native's `fetch` supports blob bodies
 *             since SDK 50, so this works on device as well as web.
 */
export async function upload(
  file: File | (Blob & { name?: string }),
  opts?: { folder?: string; onProgress?: (pct: number) => void },
): Promise<FileMeta> {
  const filename =
    (file as { name?: string }).name ??
    `upload-${Date.now()}.${(file.type?.split("/")[1] ?? "bin")}`;
  const contentType = file.type || "application/octet-stream";

  // Step 1: Get presigned PUT URL
  const presign = await request<{
    fileId: string;
    uploadUrl: string;
    key: string;
    expiresIn: number;
  }>("POST", "/storage/upload-url", {
    filename,
    contentType,
    size: file.size,
    folder: opts?.folder,
  });

  // Step 2: PUT file bytes directly to R2
  await xhrPut(presign.uploadUrl, file, contentType, opts?.onProgress);

  // Step 3: Finalize to record metadata
  const meta = await request<FileMeta>("POST", "/storage/finalize", {
    fileId: presign.fileId,
    filename,
    folder: opts?.folder,
    contentType,
  });

  return meta;
}

/**
 * List files (scoped to the signed-in user). Optionally filter by folder.
 */
export async function list(opts?: {
  folder?: string;
  limit?: number;
}): Promise<FileMeta[]> {
  const params = new URLSearchParams();
  if (opts?.folder) params.set("folder", opts.folder);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const result = await request<{ files: FileMeta[]; nextCursor: string | null }>(
    "GET",
    `/storage/files${qs ? `?${qs}` : ""}`,
  );
  return result.files;
}

/**
 * Get metadata for a single file by ID (scoped to the signed-in user).
 * Returns null if not found (or owned by another user).
 */
export async function get(fileId: string): Promise<FileMeta | null> {
  try {
    return await request<FileMeta>(
      "GET",
      `/storage/files/${encodeURIComponent(fileId)}`,
    );
  } catch (err) {
    if (err instanceof Error && /404|not_found/i.test(err.message)) return null;
    throw err;
  }
}

/**
 * Get a presigned download URL for a file.
 * Safe to use directly as an <Image source={{ uri }}> or download href.
 * Default TTL is 1 hour; max is 24 hours.
 */
export async function getUrl(
  fileId: string,
  opts?: { ttlSeconds?: number },
): Promise<string> {
  const params = new URLSearchParams();
  if (opts?.ttlSeconds) params.set("ttlSeconds", String(opts.ttlSeconds));
  const qs = params.toString();
  const result = await request<{ url: string; filename: string; expiresIn: number }>(
    "GET",
    `/storage/files/${encodeURIComponent(fileId)}/download-url${qs ? `?${qs}` : ""}`,
  );
  return result.url;
}

/**
 * Delete a file by ID (scoped to the signed-in user).
 */
export async function remove(fileId: string): Promise<void> {
  await request("DELETE", `/storage/files/${encodeURIComponent(fileId)}`);
}
