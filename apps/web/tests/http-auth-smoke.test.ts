import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

function runScript() {
  return new Promise<number>((resolve, reject) => {
    const proc = spawn('npx', ['tsx', 'scripts/http-auth-smoke.ts'], {
      stdio: 'inherit',
      shell: false,
    })

    proc.on('error', reject)
    proc.on('exit', (code) => resolve(code ?? 1))
  })
}

test('HTTP auth smoke test passes', async () => {
  const code = await runScript()
  assert.equal(code, 0)
})
