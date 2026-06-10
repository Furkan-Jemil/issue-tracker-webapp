import 'dotenv/config'

import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import net from 'node:net'
import bcrypt from 'bcryptjs'

import prisma from '../src/lib/prisma'

const PORT = 4011

after(async () => {
  await prisma.$disconnect()
})

async function waitForPort(port: number, host = '127.0.0.1', timeout = 10000) {
  const start = Date.now()
  return new Promise<void>((resolve, reject) => {
    const tryConnect = () => {
      const sock = net.createConnection(port, host)
      sock.on('connect', () => {
        sock.destroy()
        resolve()
      })
      sock.on('error', () => {
        sock.destroy()
        if (Date.now() - start > timeout) reject(new Error('timeout waiting for port'))
        else setTimeout(tryConnect, 200)
      })
    }
    tryConnect()
  })
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

test('sign in -> get session (integration)', async () => {
  const email = `itest+${Date.now()}@example.com`
  const password = 'TestPass123!'
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: 'IT Test',
      password: passwordHash,
      role: 'ADMIN',
    },
    select: { id: true },
  })

  const proc = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: String(PORT) },
  })

  try {
    await waitForPort(PORT, '127.0.0.1', 15000)

    let signinRes: Response | null = null
    let signinText = ''
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      signinRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual',
      })

      if (signinRes.ok) break

      signinText = await signinRes.text()
      if (attempt < 5 && (signinRes.status >= 500 || signinText.includes('ETIMEDOUT'))) {
        await sleep(1500)
        continue
      }

      throw new Error(`sign-in failed ${signinRes.status}: ${signinText}`)
    }

    const setCookie = signinRes.headers.get('set-cookie')
    assert.ok(setCookie)

    const cookieToken = setCookie!.split(';')[0]
    const sessionRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/get-session`, {
      method: 'GET',
      headers: { Cookie: cookieToken },
    })
    assert.equal(sessionRes.ok, true)
    const body = await sessionRes.json()
    assert.ok(body?.user)
    assert.equal(body.user.id, user.id)
    assert.equal(body.user.email, email)
  } finally {
    proc.kill()
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('sign out clears the session (integration)', async () => {
  const email = `itest-signout+${Date.now()}@example.com`
  const password = 'TestPass123!'
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: 'IT Signout Test',
      password: passwordHash,
      role: 'ADMIN',
    },
    select: { id: true },
  })

  const proc = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: String(PORT + 2) },
  })

  try {
    await waitForPort(PORT + 2, '127.0.0.1', 15000)

    let signinRes: Response | null = null
    let signinText = ''
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      signinRes = await fetch(`http://127.0.0.1:${PORT + 2}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual',
      })

      if (signinRes.ok) break

      signinText = await signinRes.text()
      if (attempt < 5 && (signinRes.status >= 500 || signinText.includes('ETIMEDOUT'))) {
        await sleep(1500)
        continue
      }

      throw new Error(`sign-in failed ${signinRes.status}: ${signinText}`)
    }

    assert.ok(signinRes?.ok)
    const setCookie = signinRes.headers.get('set-cookie')
    assert.ok(setCookie)
    const cookieToken = setCookie!.split(';')[0]

    const signOutRes = await fetch(`http://127.0.0.1:${PORT + 2}/api/auth/sign-out`, {
      method: 'POST',
      headers: { Cookie: cookieToken },
      redirect: 'manual',
    })

    assert.equal(signOutRes.ok, true)

    const sessionRes = await fetch(`http://127.0.0.1:${PORT + 2}/api/auth/get-session`, {
      method: 'GET',
      headers: { Cookie: cookieToken },
    })

    assert.equal(sessionRes.ok, true)
    const body = await sessionRes.json()
    assert.equal(body, null)
  } finally {
    proc.kill()
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('sign in sets a Secure cookie in production', async () => {
  const email = `itest-secure+${Date.now()}@example.com`
  const password = 'TestPass123!'
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: 'IT Secure Test',
      password: passwordHash,
      role: 'ADMIN',
    },
    select: { id: true },
  })

  const proc = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: String(PORT + 1), NODE_ENV: 'production' },
  })

  try {
    await waitForPort(PORT + 1, '127.0.0.1', 15000)

    let signinRes: Response | null = null
    let signinText = ''
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      signinRes = await fetch(`http://127.0.0.1:${PORT + 1}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual',
      })

      if (signinRes.ok) break

      signinText = await signinRes.text()
      if (attempt < 5 && (signinRes.status >= 500 || signinText.includes('ETIMEDOUT'))) {
        await sleep(1500)
        continue
      }

      throw new Error(`sign-in failed ${signinRes.status}: ${signinText}`)
    }

    assert.ok(signinRes?.ok)
    const setCookie = signinRes.headers.get('set-cookie')
    assert.ok(setCookie)
    assert.match(setCookie!, /Secure/)
  } finally {
    proc.kill()
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
})
