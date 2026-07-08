/**
 * VERBATIM port of `parseEnumValue` from apps/web/src/lib/issueValidation.ts,
 * adapted to accept `string | null` (the admin routes pass query/body strings).
 * Upper-cases the trimmed input and returns it only if in the allowed set.
 */
export function parseEnumValue<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const v = (trimmed ? trimmed.toUpperCase() : undefined) as T | undefined;
  if (v && (allowed as readonly string[]).includes(v)) return v;
  return null;
}
