import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrismaPredicate,
  buildWhitelistedWhere,
} from './filter-engine';

test('buildPrismaPredicate parses simple scalars and operators', () => {
  assert.equal(buildPrismaPredicate('OPEN'), 'OPEN');
  assert.deepEqual(buildPrismaPredicate(['OPEN', 'RESOLVED']), {
    in: ['OPEN', 'RESOLVED'],
  });
  assert.deepEqual(buildPrismaPredicate('gt:100'), { gt: '100' });
  assert.deepEqual(buildPrismaPredicate('gte:2026-01-01'), { gte: '2026-01-01' });
  assert.equal(buildPrismaPredicate('eq:MINOR'), 'MINOR');
  assert.deepEqual(buildPrismaPredicate({ lt: 50 }), { lt: 50 });
});

test('buildWhitelistedWhere filters out unwhitelisted fields and prototype pollution', () => {
  const allowed = ['status', 'priority', 'createdAt'] as const;
  const input = {
    status: 'OPEN',
    priority: 'in:HIGH,CRITICAL', // unsupported raw string left intact or parsed if split
    unauthorizedField: 'DROP TABLE issues;',
    __proto__: { polluted: true },
    constructor: 'bad',
  };

  const where = buildWhitelistedWhere(input, allowed);
  assert.equal(where.status, 'OPEN');
  assert.equal(where.unauthorizedField, undefined);
  assert.equal((where as any).polluted, undefined);
});
