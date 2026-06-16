const CHANNEL_BINDING_PARAM = /([?&])channel_binding=require(&?)/i

function stripTrailingSeparators(value: string): string {
  return value.replace(/[?&]$/, '')
}

export function normalizeDatabaseUrl(input?: string | null): string {
  const url = input?.trim()
  if (!url) {
    throw new Error('DATABASE_URL is not set. Check your .env file.')
  }

  let normalized = url.replace(CHANNEL_BINDING_PARAM, '$1')
  normalized = stripTrailingSeparators(normalized)
  return normalized
}

export function applyDatabaseUrlNormalization(): string {
  const normalized = normalizeDatabaseUrl(process.env.DATABASE_URL)
  process.env.DATABASE_URL = normalized
  return normalized
}