import { z } from 'zod'

/**
 * Safely omits common system-managed database fields (id, createdAt, updatedAt)
 * from a base generated Prisma Zod schema, allowing it to be reused for creation payloads.
 */
export function omitSystemFields(schema: any): any {
  return schema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
}
