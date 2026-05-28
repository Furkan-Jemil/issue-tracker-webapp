import { Context } from 'hono'
import prisma from '../../lib/prisma'

export async function getHealth(c: Context) {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`

    return c.json({
      status: 'ok',
      db: 'ok',
      uptimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed', error)

    return c.json(
      {
        status: 'degraded',
        db: 'error',
        uptimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      503,
    )
  }
}