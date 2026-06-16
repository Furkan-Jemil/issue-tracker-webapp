import 'dotenv/config'
import { applyDatabaseUrlNormalization } from '../database-url'

async function main() {
  applyDatabaseUrlNormalization()

  const { default: prisma } = await import('../index')

  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log(
      JSON.stringify(
        {
          db: 'ok',
          uptimeMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Database check failed')
  console.error(error)
  process.exit(1)
})