import { z } from 'zod'

/**
 * Safely omits common system-managed database fields (id, createdAt, updatedAt)
 * from a base generated Prisma Zod schema by dynamically checking their presence,
 * allowing it to be safely reused for creation payloads without throwing runtime errors.
 */
export function omitSystemFields(schema: any): any {
  const mask: Record<string, boolean> = {}
  const shape = schema.shape
  if (shape) {
    if ('id' in shape) mask.id = true
    if ('createdAt' in shape) mask.createdAt = true
    if ('updatedAt' in shape) mask.updatedAt = true
  }
  return schema.omit(mask)
}
