/**
 * @nova8/backend/db — Firestore-backed database client for generated Nova8 apps
 * ───────────────────────────────────────────────────────────────────────────────
 * All calls go through nova8.dev's public /api/app/:projectId/db/* endpoints
 * (Wave 3d). Your app NEVER gets raw Firestore credentials. Per-user isolation
 * is enforced structurally by Nova8 — user A cannot list, get, update, or
 * delete user B's documents, even with a guessed document ID.
 *
 * Auth (dual-header, auto-wired):
 *   x-nova8-project-api-key : public key from expo.extra.nova8ProjectApiKey
 *   x-nova8-app-token       : end-user session token from @nova8/backend/auth
 *
 * Caps (shared with other db calls on this project):
 *   Free tier: 10,000 reads/day, 2,000 writes/day per project.
 *   Response 429 { resetsAt } when exceeded.
 *
 * @example
 *   import { db, auth } from "@/nova8/backend";
 *
 *   // The end user must be signed in first — without an app token, calls 401.
 *   const user = auth.currentUser();
 *   if (!user) { router.replace("/signin"); return; }
 *
 *   // Create a document scoped to this user (Nova8 handles isolation).
 *   const note = await db.create("notes", { title: "Hello", body: "World" });
 *
 *   // List documents — only this user's, automatically.
 *   const notes = await db.list("notes");
 *
 *   // Query
 *   const recent = await db.query("notes", "createdAt", ">", "2026-01-01", {
 *     orderBy: "createdAt",
 *     orderDir: "desc",
 *     limit: 20,
 *   });
 */

import { getApiBase, getProjectId, getProjectApiKey } from "./_config";
import { getToken } from "./auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocResult {
  id: string;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type WhereOp =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "array-contains";

// ── Request helper ────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error(
      "[nova8/db] No signed-in user. Call auth.signInWithEmail / signInWithApple / signInWithGoogle first.",
    );
  }

  const url = `${getApiBase()}/api/app/${getProjectId()}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-nova8-project-api-key": getProjectApiKey(),
      "x-nova8-app-token": token,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 429) {
    const err = (await res.json().catch(() => ({}))) as any;
    const resetsAt = err.resetsAt ? ` Resets at ${err.resetsAt}.` : "";
    throw new Error(
      `Nova8DB: Daily cap reached — ${err.limit?.toLocaleString() ?? "?"} ${
        err.message?.includes("read") ? "reads" : "writes"
      }/day.${resetsAt}`,
    );
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as any;
    throw new Error(`Nova8DB: ${err.message ?? res.statusText} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * List documents in a collection (scoped to the signed-in user).
 * Returns up to `opts.limit` docs (default 50, max 200).
 */
export async function list(
  collection: string,
  opts?: { limit?: number; startAfter?: string },
): Promise<DocResult[]> {
  const params = new URLSearchParams();
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts?.startAfter) params.set("startAfter", opts.startAfter);
  const qs = params.toString();
  const result = await request<{ docs: DocResult[]; nextCursor: string | null }>(
    "GET",
    `/db/collections/${encodeURIComponent(collection)}/docs${qs ? `?${qs}` : ""}`,
  );
  return result.docs;
}

/**
 * List every collection name that has at least one doc for this user.
 */
export async function listCollections(): Promise<string[]> {
  const result = await request<{ collections: string[] }>("GET", "/db/collections");
  return result.collections;
}

/**
 * Get a single document by ID (scoped to the signed-in user).
 * Returns null if not found.
 */
export async function get(
  collection: string,
  id: string,
): Promise<DocResult | null> {
  try {
    return await request<DocResult>(
      "GET",
      `/db/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    );
  } catch (err: any) {
    if (err?.message?.includes("(404)")) return null;
    throw err;
  }
}

/**
 * Create a new document (scoped to the signed-in user).
 * Optionally specify a custom ID. Returns the created document.
 */
export async function create(
  collection: string,
  data: Record<string, unknown>,
  id?: string,
): Promise<DocResult> {
  return request<DocResult>(
    "POST",
    `/db/collections/${encodeURIComponent(collection)}/docs`,
    { data, ...(id !== undefined ? { id } : {}) },
  );
}

/**
 * Update (merge) an existing document (scoped to the signed-in user).
 * Merges `data` into the existing fields — does NOT replace the whole document.
 */
export async function update(
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<DocResult> {
  return request<DocResult>(
    "PATCH",
    `/db/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    { data },
  );
}

/**
 * Delete a document (scoped to the signed-in user). Idempotent.
 */
export async function remove(collection: string, id: string): Promise<void> {
  await request<{ ok: true }>(
    "DELETE",
    `/db/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
  );
}

/**
 * Run a simple where-clause query on a collection.
 * op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains"
 *
 * @example
 *   const done = await db.query("tasks", "completed", "==", true);
 *   const top  = await db.query("tasks", "priority", ">=", 4, {
 *     orderBy: "priority",
 *     orderDir: "desc",
 *     limit: 10,
 *   });
 */
export async function query(
  collection: string,
  field: string,
  op: WhereOp,
  value: unknown,
  opts?: { limit?: number; orderBy?: string; orderDir?: "asc" | "desc" },
): Promise<DocResult[]> {
  const result = await request<{ docs: DocResult[] }>("POST", "/db/query", {
    collection,
    field,
    op,
    value,
    ...opts,
  });
  return result.docs;
}
