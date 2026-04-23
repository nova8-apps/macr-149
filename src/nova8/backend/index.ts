/**
 * @nova8/backend — Nova8 backend abstractions for generated apps
 * ───────────────────────────────────────────────────────────────
 * Stable public API surface. Import from here, not from sub-modules,
 * so Nova8 can swap vendors (Firestore, R2, OpenAI, Anthropic, Stripe)
 * without breaking your app code.
 *
 * All modules share the same auth model (dual-header with project API key
 * and signed-in-user token). The user session is managed by `auth` and
 * every other module reads the current token through it — so as soon as
 * a user signs in, db / storage / openai / anthropic "just work".
 *
 * @example
 *   import { auth, db, storage, openai } from "@/nova8/backend";
 *
 *   // Sign in first
 *   await auth.signInWithEmail(email, password);
 *
 *   // Now any of these work, scoped to the signed-in user
 *   const notes = await db.list("notes");
 *   const file  = await storage.upload(someFile);
 *   const resp  = await openai.chat({
 *     model: "gpt-4o-mini",
 *     messages: [{ role: "user", content: "hello" }],
 *   });
 */

export * as auth from "./auth";
export * as db from "./db";
export * as storage from "./storage";
export * as openai from "./openai";
export * as anthropic from "./anthropic";

// Kept for backwards-compat imports, but both throw until their public-app
// endpoints ship (Wave 3i and 3j respectively).
export * as payments from "./payments";
export * as push from "./push";
