/**
 * formatRelative
 *
 * Converts a date value into a human-readable relative time string.
 * Intentionally avoids Intl.RelativeTimeFormat for predictability and
 * zero-dependency status.
 *
 * Examples:
 *   formatRelative(new Date())           → "just now"
 *   formatRelative(twoMinutesAgo)        → "2m ago"
 *   formatRelative(threeDaysAgo)         → "3d ago"
 *   formatRelative(twoMonthsAgo)         → "2mo ago"
 *   formatRelative(lastYear)             → "1y ago"
 */
export function formatRelative(date: string | Date | number): string {
  const then = new Date(date).getTime();

  // Guard against invalid dates — fall back to an empty string rather than
  // crashing, so callers don't need try/catch.
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;

  // Handle future dates gracefully (clock skew, SSR hydration edge cases).
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * formatAbsolute
 *
 * A deterministic ISO-like formatter that avoids locale-dependent
 * toLocaleString() output (which differs across server/client environments).
 * Used for <time datetime="…"> title attributes alongside formatRelative.
 *
 * Output: "14/06/2025, 09:23"
 */
export function formatAbsolute(date: string | Date | number): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}
