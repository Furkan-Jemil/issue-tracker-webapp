/**
 * Dynamic REST API Filtering Engine (Prisma Predicate Builder)
 *
 * Provides a whitelisted, injection-safe filter mapping utility for REST query
 * parameters to Prisma where predicates (`eq`, `gt`, `lt`, `gte`, `in`, `contains`).
 *
 * Guarantees zero query injection by enforcing strict field whitelisting and
 * operator sanitization.
 */

export type FilterOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'in' | 'contains';

export interface FilterCondition {
  operator: FilterOperator;
  value: any;
}

const SUPPORTED_OPERATORS = new Set<FilterOperator>([
  'eq',
  'gt',
  'lt',
  'gte',
  'in',
  'contains',
]);

/**
 * Sanitizes a key to ensure it prevents prototype pollution and unwhitelisted access.
 */
function isSafeField(field: string, allowedFields: readonly string[]): boolean {
  if (
    field === '__proto__' ||
    field === 'constructor' ||
    field === 'prototype'
  ) {
    return false;
  }
  return allowedFields.includes(field);
}

/**
 * Parses a raw value or structured operator expression into a safe Prisma predicate.
 * Supports:
 *   - Plain scalar: "OPEN" -> "OPEN"
 *   - Operator string: "gt:100" -> { gt: "100" }
 *   - Operator object: { gte: 10 } -> { gte: 10 }
 *   - Array/in filter: ["OPEN", "RESOLVED"] -> { in: ["OPEN", "RESOLVED"] }
 */
export function buildPrismaPredicate(val: any): any {
  if (val === undefined || val === null) return undefined;

  if (Array.isArray(val)) {
    return { in: val };
  }

  if (typeof val === 'object') {
    const predicate: Record<string, any> = {};
    for (const [key, rawValue] of Object.entries(val)) {
      if (SUPPORTED_OPERATORS.has(key as FilterOperator)) {
        if (key === 'eq') {
          return rawValue;
        }
        predicate[key] = rawValue;
      }
    }
    return Object.keys(predicate).length > 0 ? predicate : undefined;
  }

  if (typeof val === 'string' && val.includes(':')) {
    const [op, ...rest] = val.split(':');
    const opStr = op.toLowerCase() as FilterOperator;
    const operand = rest.join(':');
    if (SUPPORTED_OPERATORS.has(opStr)) {
      if (opStr === 'eq') return operand;
      return { [opStr]: operand };
    }
  }

  return val;
}

/**
 * Builds a safe Prisma `where` clause object from incoming query params using a strict
 * whitelist of permitted database attributes.
 *
 * @param queryInput Incoming query object (DTO or query map)
 * @param allowedFields Whitelisted attribute names permitted for dynamic filtering
 * @returns Sanitized Prisma where object
 */
export function buildWhitelistedWhere<TWhere = Record<string, any>>(
  queryInput: Record<string, any> | undefined | null,
  allowedFields: readonly string[],
): TWhere {
  const where: Record<string, any> = {};

  if (!queryInput || typeof queryInput !== 'object') {
    return where as TWhere;
  }

  for (const [field, rawValue] of Object.entries(queryInput)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    if (!isSafeField(field, allowedFields)) {
      continue;
    }

    const predicate = buildPrismaPredicate(rawValue);
    if (predicate !== undefined) {
      where[field] = predicate;
    }
  }

  return where as TWhere;
}
