/**
 * @nova8/backend/anthropic — Anthropic Claude via Nova8's secret-key proxy
 * ──────────────────────────────────────────────────────────────────────────
 * Call Claude Messages / Complete APIs from a generated phone app WITHOUT
 * embedding a secret key in the shipped binary.
 *
 * Security model (from the server's perspective):
 *   - Dual auth (project-api-key + app-token) proves the request is from a
 *     signed-in Nova8 app user.
 *   - Only whitelisted paths are allowed: v1/messages, v1/complete.
 *   - Per-project cap (default 500 Anthropic calls/day) prevents runaway bills.
 *
 * @example
 *   import { anthropic, auth } from "@/nova8/backend";
 *
 *   if (!auth.currentUser()) { router.replace("/signin"); return; }
 *
 *   const res = await anthropic.messages({
 *     model: "claude-haiku-4-5",
 *     max_tokens: 512,
 *     messages: [{ role: "user", content: "Say hi" }],
 *   });
 *   console.log(res.content[0].text);
 */

import { getApiBase, getProjectId, getProjectApiKey } from "./_config";
import { getToken } from "./auth";

async function forward(
  upstreamPath: string,
  body: Record<string, unknown>,
): Promise<any> {
  const token = await getToken();
  if (!token) {
    throw new Error(
      "[nova8/anthropic] No signed-in user. Call auth.signInWithEmail / signInWithApple / signInWithGoogle first.",
    );
  }
  const url = `${getApiBase()}/api/app/${getProjectId()}/proxy/anthropic/${upstreamPath}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nova8-project-api-key": getProjectApiKey(),
      "x-nova8-app-token": token,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: any;
  try { parsed = text ? JSON.parse(text) : {}; }
  catch { parsed = { raw: text }; }

  if (!res.ok) {
    const msg =
      parsed?.error?.message ??
      parsed?.message ??
      `Nova8 Anthropic proxy: HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status: number; code: string | null };
    err.status = res.status;
    err.code = parsed?.error?.type ?? parsed?.error ?? null;
    throw err;
  }
  return parsed;
}

export interface MessagesRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: "user" | "assistant";
    content: string | Array<{
      type: "text" | "image" | "tool_use" | "tool_result";
      text?: string;
      source?: { type: "base64" | "url"; media_type?: string; data?: string; url?: string };
      [k: string]: unknown;
    }>;
  }>;
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  tools?: unknown[];
  tool_choice?: unknown;
  [k: string]: unknown;
}

export interface MessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: "text"; text: string } | { type: "tool_use"; [k: string]: unknown }>;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Messages API — the primary Claude endpoint. Supports vision (image content).
 */
export function messages(body: MessagesRequest): Promise<MessagesResponse> {
  return forward("v1/messages", body as unknown as Record<string, unknown>);
}

/**
 * Legacy Complete API — prefer messages() for new code.
 */
export function complete(body: {
  model: string;
  prompt: string;
  max_tokens_to_sample: number;
  [k: string]: unknown;
}): Promise<any> {
  return forward("v1/complete", body as unknown as Record<string, unknown>);
}

/**
 * Current Anthropic proxy cap for this project (daily).
 */
export async function getUsage(): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetsAt: string;
}> {
  const token = await getToken();
  if (!token) throw new Error("[nova8/anthropic] No signed-in user.");
  const url = `${getApiBase()}/api/app/${getProjectId()}/proxy/usage`;
  const res = await fetch(url, {
    headers: {
      "x-nova8-project-api-key": getProjectApiKey(),
      "x-nova8-app-token": token,
    },
  });
  if (!res.ok) throw new Error(`Nova8 Anthropic getUsage: HTTP ${res.status}`);
  const data = (await res.json()) as { usage: Record<string, any> };
  return data.usage.anthropic;
}
