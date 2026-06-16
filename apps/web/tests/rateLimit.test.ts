import test from 'node:test'
import assert from 'node:assert/strict'

import { checkRateLimit } from '../server/middleware/rateLimit'

test('checkRateLimit allows requests until the limit is exceeded', () => {
  const prefix = `test:${Date.now()}`

  assert.equal(checkRateLimit(prefix, 'user-1', 2, 60_000), null)
  assert.equal(checkRateLimit(prefix, 'user-1', 2, 60_000), null)

  const limited = checkRateLimit(prefix, 'user-1', 2, 60_000)
  assert.ok(limited)
  assert.equal(limited?.status, 429)
  assert.deepEqual(limited?.body, { error: 'Too many requests' })
  assert.equal(limited?.headers?.['Retry-After'], '60')
})