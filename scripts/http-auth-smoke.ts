import 'dotenv/config'
import net from 'net'
import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

const PORT = 4010

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

async function run() {
  const { spawn } = await import('child_process')
  
  const email = 'admin@example.com'
  const password = 'password'

  // Pre-seed admin@example.com
  const passwordHash = await bcrypt.hash(password, 10)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    const user = await prisma.user.create({
      data: {
        name: 'Smoke Test Admin',
        email,
        password: passwordHash,
        role: 'ADMIN',
      },
    })
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: passwordHash,
      },
    })
    console.log('Created admin@example.com user')
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: passwordHash, role: 'ADMIN' },
    })
    const account = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: 'credential' },
    })
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: passwordHash },
      })
    } else {
      await prisma.account.create({
        data: {
          userId: existing.id,
          accountId: existing.id,
          providerId: 'credential',
          password: passwordHash,
        },
      })
    }
    console.log('Ensured admin@example.com user exists with correct credentials')
  }

  console.log(`Starting server on ${PORT}...`)
  const proc = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: String(PORT) },
  })

  try {
    await waitForPort(PORT, '127.0.0.1', 15000)
    console.log(`Server listening on ${PORT}`)

    // sign in
    console.log('Signing in')
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
        console.log(`sign-in attempt ${attempt} failed; retrying...`)
        await sleep(1500)
        continue
      }

      throw new Error(`sign-in failed ${signinRes.status}: ${signinText}`)
    }

    if (!signinRes) throw new Error('no sign-in response')
    const setCookie = signinRes.headers.get('set-cookie')
    if (!setCookie) throw new Error('no set-cookie header from sign-in')
    console.log('sign-in OK; cookie set')

    // get session using cookie
    console.log('Fetching session')
    const cookieToken = setCookie.split(';')[0]
    const sessionRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/get-session`, {
      method: 'GET',
      headers: { Cookie: cookieToken },
    })

    if (!sessionRes.ok) throw new Error(`get-session failed ${sessionRes.status}`)
    const body = await sessionRes.json()
    if (!body || !body.user) throw new Error('session did not return user')
    console.log('get-session OK', body.user.email)

    console.log('Smoke test passed')
  } finally {
    console.log('Shutting down server')
    proc.kill()
    const cleanupUser = await prisma.user.findUnique({ where: { email } })
    if (cleanupUser) {
      await prisma.session.deleteMany({ where: { userId: cleanupUser.id } })
      await prisma.account.deleteMany({ where: { userId: cleanupUser.id } })
      await prisma.user.delete({ where: { id: cleanupUser.id } })
      console.log('Cleaned up admin@example.com user')
    }
    await prisma.$disconnect()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
