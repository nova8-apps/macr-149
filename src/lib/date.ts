// src/lib/date.ts — Single source of truth for local-time day bucketing.
//
// NEVER use toISOString().split('T')[0] for "what day is it" — that returns
// a UTC date, which is wrong for any user west of UTC after ~5 PM local.

/**
 * Returns `YYYY-MM-DD` in the device's LOCAL timezone.
 */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses a `YYYY-MM-DD` string and returns the epoch-ms at LOCAL midnight.
 * `new Date(y, m-1, d)` uses the device's current zone rules, so DST
 * (23h spring-forward / 25h fall-back days) is handled automatically.
 */
export function localStartOfDayMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}
