/**
 * @nova8/backend/openai — OpenAI via Nova8's secret-key proxy
 * ──────────────────────────────────────────────────────────────────────────
 * Call OpenAI's Chat, Responses, Embeddings, Images, Audio, and Moderations
 * APIs from a generated phone app WITHOUT embedding a secret key in the
 * shipped binary.
 *
 * How it works: your app makes a request to nova8.dev/api/app/:id/proxy/openai/*
 * with the usual Nova8 dual auth (project-api-key + app-token). Nova8 strips
 * any client-supplied auth headers, injects its own OPENAI_API_KEY, and
 * forwards to api.openai.com. The upstream response is returned verbatim.
 *
 * Security model (from the server's perspective):
 *   - Dual auth proves the request is from a signed-in Nova8 app user.
 *   - Only whitelisted paths are allowed:
 *       v1/chat/completions, v1/responses, v1/embeddings,
 *       v1/images/generations, v1/audio/transcriptions, v1/audio/speech,
 *       v1/moderations
 *   - Per-project cap (default 500 OpenAI calls/day) prevents runaway bills.
 *
 * You get the full OpenAI surface — use any model you have access to on
 * Nova8's platform key (gpt-4o, gpt-4o-mini, o1, text-embedding-3-small,
 * dall-e-3, whisper-1, tts-1, etc.).
 *
 * @example
 *   import { openai, auth } from "@/nova8/backend";
 *
 *   if (!auth.currentUser()) { router.replace("/signin"); return; }
 *
 *   // Chat
 *   const res = await openai.chat({
 *     model: "gpt-4o-mini",
 *     messages: [{ role: "user", content: "Say hi" }],
 *   });
 *   console.log(res.choices[0].message.content);
 *
 *   // Vision (same chat endpoint, image_url content part)
 *   const vision = await openai.chat({
 *     model: "gpt-4o-mini",
 *     messages: [{
 *       role: "user",
 *       content: [
 *         { type: "text", text: "What's in this photo?" },
 *         { type: "image_url", image_url: { url: photoUrl } },
 *       ],
 *     }],
 *   });
 *
 *   // Embeddings
 *   const emb = await openai.embeddings({
 *     model: "text-embedding-3-small",
 *     input: "hello world",
 *   });
 */

import { getApiBase, getProjectId, getProjectApiKey } from "./_config";
import { getToken } from "./auth";

// ── Shared forwarder ──────────────────────────────────────────────────────────

async function forward(
  upstreamPath: string,
  body: Record<string, unknown>,
): Promise<any> {
  const token = await getToken();
  if (!token) {
    throw new Error(
      "[nova8/openai] No signed-in user. Call auth.signInWithEmail / signInWithApple / signInWithGoogle first.",
    );
  }

  const url = `${getApiBase()}/api/app/${getProjectId()}/proxy/openai/${upstreamPath}`;

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
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    // Surface both proxy errors (path_not_allowed, cap_exceeded, etc.) and
    // upstream OpenAI errors with the provider's real message.
    const msg =
      parsed?.error?.message ??
      parsed?.message ??
      `Nova8 OpenAI proxy: HTTP ${res.status}`;
    const err = new Error(msg) as Error & {
      status: number;
      code: string | null;
      resetsAt?: string;
    };
    err.status = res.status;
    err.code = parsed?.error?.code ?? parsed?.error ?? null;
    if (parsed?.resetsAt) err.resetsAt = parsed.resetsAt;
    throw err;
  }

  return parsed;
}

// ── Types (minimal — keeps the surface provider-faithful) ─────────────────────

export interface ChatMessagePart {
  type: "text" | "image_url" | "input_audio";
  text?: string;
  image_url?: { url: string; detail?: "low" | "high" | "auto" };
  input_audio?: { data: string; format: "wav" | "mp3" };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ChatMessagePart[];
  name?: string;
  tool_call_id?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  n?: number;
  stop?: string | string[];
  response_format?: { type: "text" | "json_object" | "json_schema"; json_schema?: unknown };
  tools?: unknown[];
  tool_choice?: unknown;
  seed?: number;
  // Proxy forwards the rest of the OpenAI body unchanged.
  [k: string]: unknown;
}

export interface ChatResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: { role: string; content: string | null; tool_calls?: unknown[] };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface EmbeddingsRequest {
  model: string;
  input: string | string[] | number[] | number[][];
  encoding_format?: "float" | "base64";
  dimensions?: number;
  [k: string]: unknown;
}

export interface EmbeddingsResponse {
  data: Array<{ index: number; embedding: number[]; object: "embedding" }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface ImageGenerationRequest {
  model?: string;
  prompt: string;
  n?: number;
  size?: "1024x1024" | "1792x1024" | "1024x1792" | "512x512" | "256x256";
  quality?: "standard" | "hd";
  style?: "natural" | "vivid";
  response_format?: "url" | "b64_json";
  [k: string]: unknown;
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
}

export interface ModerationsRequest {
  model?: string;
  input: string | string[];
}

export interface ResponsesRequest {
  model: string;
  input: string | unknown[];
  [k: string]: unknown;
}

// ── Public surface ────────────────────────────────────────────────────────────

/**
 * Chat completion. Supports text, vision (image_url), and audio content parts.
 */
export function chat(body: ChatRequest): Promise<ChatResponse> {
  return forward("v1/chat/completions", body as unknown as Record<string, unknown>);
}

/**
 * Newer Responses API — unified replacement for chat/completions.
 * Use this if you want structured outputs or tool-calling first-class.
 */
export function responses(body: ResponsesRequest): Promise<any> {
  return forward("v1/responses", body as unknown as Record<string, unknown>);
}

/**
 * Text embeddings — use with text-embedding-3-small / text-embedding-3-large.
 */
export function embeddings(body: EmbeddingsRequest): Promise<EmbeddingsResponse> {
  return forward("v1/embeddings", body as unknown as Record<string, unknown>);
}

/**
 * Image generation — DALL·E 3 / gpt-image-1.
 */
export function imagesGenerate(
  body: ImageGenerationRequest,
): Promise<ImageGenerationResponse> {
  return forward("v1/images/generations", body as unknown as Record<string, unknown>);
}

/**
 * Content moderation — cheap safety check before calling chat/vision.
 */
export function moderations(body: ModerationsRequest): Promise<any> {
  return forward("v1/moderations", body as unknown as Record<string, unknown>);
}

/**
 * Text-to-speech (audio synthesis) — returns a URL the upstream would have
 * returned as a binary body. Nova8 transcodes to JSON { audio_b64, format }
 * so phone apps can decode and play without dealing with streaming binary.
 *
 * NOTE: v1/audio/speech returns raw mp3/wav bytes. The proxy passes them
 * through as Content-Type: audio/*, so the caller must read the response as
 * a blob. We expose a slightly higher-level helper below for convenience.
 */
export async function audioSpeech(body: {
  model: string;
  input: string;
  voice: string;
  response_format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  speed?: number;
}): Promise<ArrayBuffer> {
  const token = await getToken();
  if (!token) {
    throw new Error("[nova8/openai] No signed-in user.");
  }
  const url = `${getApiBase()}/api/app/${getProjectId()}/proxy/openai/v1/audio/speech`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nova8-project-api-key": getProjectApiKey(),
      "x-nova8-app-token": token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Nova8 OpenAI audio/speech: ${msg}`);
  }
  return res.arrayBuffer();
}

/**
 * Speech-to-text (Whisper). `file` is a FormData-compatible blob; the proxy
 * forwards multipart/form-data through unchanged.
 */
export async function audioTranscriptions(formData: FormData): Promise<{
  text: string;
  [k: string]: unknown;
}> {
  const token = await getToken();
  if (!token) {
    throw new Error("[nova8/openai] No signed-in user.");
  }
  const url = `${getApiBase()}/api/app/${getProjectId()}/proxy/openai/v1/audio/transcriptions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-nova8-project-api-key": getProjectApiKey(),
      "x-nova8-app-token": token,
      // Do NOT set Content-Type manually — fetch computes the multipart
      // boundary automatically when you pass a FormData body.
    },
    body: formData,
  });
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(parsed?.error?.message ?? parsed?.message ?? `HTTP ${res.status}`);
  }
  return parsed;
}

// ── Usage introspection ───────────────────────────────────────────────────────

/**
 * Current OpenAI proxy cap for this project (daily).
 */
export async function getUsage(): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetsAt: string;
}> {
  const token = await getToken();
  if (!token) throw new Error("[nova8/openai] No signed-in user.");
  const url = `${getApiBase()}/api/app/${getProjectId()}/proxy/usage`;
  const res = await fetch(url, {
    headers: {
      "x-nova8-project-api-key": getProjectApiKey(),
      "x-nova8-app-token": token,
    },
  });
  if (!res.ok) {
    throw new Error(`Nova8 OpenAI getUsage: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { usage: Record<string, any> };
  return data.usage.openai;
}
