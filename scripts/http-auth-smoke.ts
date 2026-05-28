import 'dotenv/config'
import net from 'net'

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
  console.log(`Starting server on ${PORT}...`)
  const proc = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: String(PORT) },
  })

  try {
    await waitForPort(PORT, '127.0.0.1', 15000)
    console.log(`Server listening on ${PORT}`)

    const email = 'admin@example.com'
    const password = 'password'

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
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
