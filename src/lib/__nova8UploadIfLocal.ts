// Wave 23.60 — auto-injected by the persistence audit.
// Uploads a local device URI (e.g. file:///var/.../IMG.jpg from
// expo-image-picker) to durable cloud storage and returns a
// presigned URL that is safe to save in Firestore. If the input
// is already an http(s) URL, returns it unchanged. Null/empty
// inputs return null so the caller can write `photoUrl: null`
// without a separate guard.
import { storage } from '@/nova8/backend/storage';

export async function __nova8UploadIfLocal(
  uri: string | null | undefined,
  folder: string = 'uploads',
): Promise<string | null> {
  if (!uri || typeof uri !== 'string') return null;
  // Already remote — pass through.
  if (/^https?:\/\//i.test(uri)) return uri;
  // Local device URI shapes we handle: file:, content:, ph:,
  // assets-library:, plus React Native's "/var/.../tmp/..."
  // fallback when the platform omits the scheme.
  const looksLocal =
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph:') ||
    uri.startsWith('assets-library:') ||
    uri.startsWith('/');
  if (!looksLocal) return uri;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const meta = await storage.upload(blob, { folder });
    const url = await storage.getUrl(meta.id, { ttlSeconds: 60 * 60 * 24 * 7 });
    return url;
  } catch (e) {
    // If the upload fails we'd rather not block the DB write —
    // return null so the field round-trips as "no photo" instead
    // of leaving a dead local URI in the database.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[__nova8UploadIfLocal] upload failed:', e);
    }
    return null;
  }
}
