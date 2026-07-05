/**
 * Lightweight client-side validators for auth forms.
 *
 * These mirror the kind of checks any real login system does before hitting
 * the network — catch obvious mistakes early and give the user a clear message.
 */

// Pragmatic email regex: one @, a domain, and a TLD. Not RFC-perfect on purpose
// (full RFC 5322 is overkill and rejects nothing users actually type).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize an email the way the backend stores it: trimmed + lowercased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** True when `email` looks like a valid address. */
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

/**
 * Validate an email field. Returns an error message, or null when valid.
 */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!isValidEmail(email)) return 'Enter a valid email address.';
  return null;
}

/**
 * Validate a password field. Returns an error message, or null when valid.
 * `min` defaults to 1 for sign-in (just "required"); pass 8 for registration.
 */
export function validatePassword(password: string, min = 1): string | null {
  if (!password) return 'Password is required.';
  if (password.length < min) return `Password must be at least ${min} characters.`;
  return null;
}
