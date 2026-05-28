import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeDatabaseUrl } from '../lib/database-url'

test('normalizeDatabaseUrl strips channel_binding=require from the URL', () => {
  assert.equal(
    normalizeDatabaseUrl('postgresql://user:pass@host:5432/db?sslmode=require&channel_binding=require'),
    'postgresql://user:pass@host:5432/db?sslmode=require',
  )
})

test('normalizeDatabaseUrl throws when the URL is missing', () => {
  assert.throws(() => normalizeDatabaseUrl(undefined), /DATABASE_URL is not set/i)
})