import 'dotenv/config'
import prisma from '../index'
import { auth } from '../../../apps/web/src/lib/auth'

async function run() {
  const email = `test-better-auth-${Date.now()}@example.com`
  const password = 'TestPassword123!'

  try {
    // 1. Sign up using Better Auth API
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: 'Better Auth Debug User',
      },
      asResponse: true,
    })
    console.log("Sign Up Response Status:", signUpRes.status)

    // 2. Sign in using Better Auth API
    const signInRes = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: true,
    })

    console.log("Sign In Response Status:", signInRes.status)
    const setCookie = signInRes.headers.get('set-cookie')
    console.log("Sign In set-cookie:", setCookie)

    if (setCookie) {
      // 3. Get session using the cookie returned by sign-in
      const headers = new Headers()
      headers.set('Cookie', setCookie.split(';')[0])
      headers.set('Host', 'localhost:3002')

      const session = await auth.api.getSession({
        headers,
      })
      console.log("getSession Result:", session)
    }
  } catch (err) {
    console.error("Error:", err)
  } finally {
    // Cleanup user and session
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await prisma.account.deleteMany({ where: { userId: user.id } })
      await prisma.session.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
    await prisma.$disconnect()
  }
}

run()
