import { z } from 'zod';

/**
 * Enterprise Query DTO Factories
 *
 * Implements Decision (D) — Additive Sorting & Forgiving Pagination:
 * - createPaginationSchema: coerces page/pageSize or limit/offset with safe fallbacks
 * - createSortSchema: safely whitelists sortBy and sortOrder ('asc' | 'desc'),
 *   reproducing exact legacy ordering when omitted.
 */
export function createPaginationSchema(
  defaultPageSize = 20,
  maxPageSize = 100,
) {
  return z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce
      .number()
      .int()
      .positive()
      .max(maxPageSize)
      .optional()
      .default(defaultPageSize),
    limit: z.coerce.number().int().positive().max(maxPageSize).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
  });
}

export function createSortSchema<
  const TFields extends readonly [string, ...string[]],
>(
  allowedFields: TFields,
  defaultSortBy?: TFields[number],
  defaultSortOrder: 'asc' | 'desc' = 'desc',
) {
  return z.object({
    sortBy: z.enum(allowedFields).optional().default(defaultSortBy as any),
    sortOrder: z.enum(['asc', 'desc']).optional().default(defaultSortOrder),
  });
}
