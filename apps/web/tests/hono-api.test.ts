import 'dotenv/config'

// Force the server to bind to a random free port and flag it as a Hono process
process.env.PORT = '0'
process.env.IS_HONO_SERVER = 'true'

import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import prisma from '../src/lib/prisma'

// Load app dynamically after process.env.PORT has been set to '0'
async function getApp() {
  const mod = await import('../server/index')
  return mod.default
}

const createdUserIds: string[] = []
const createdIssueIds: string[] = []
const createdCommentIds: string[] = []
const createdNotificationIds: string[] = []

after(async () => {
  // Clean up data in reverse order of dependency
  if (createdCommentIds.length > 0) {
    await prisma.comment.deleteMany({ where: { id: { in: createdCommentIds } } })
  }
  if (createdNotificationIds.length > 0) {
    await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } })
  }
  if (createdIssueIds.length > 0) {
    await prisma.issueHistory.deleteMany({ where: { issueId: { in: createdIssueIds } } })
    await prisma.issue.deleteMany({ where: { id: { in: createdIssueIds } } })
  }
  if (createdUserIds.length > 0) {
    await prisma.issueHistory.deleteMany({ where: { actorId: { in: createdUserIds } } })
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  }
  await prisma.$disconnect()

  // Close the Hono server instance to let the event loop exit
  const mod = await import('../server/index')
  if (mod.server) {
    mod.server.close()
  }
})

// Helper to make requests in-memory with correct Host headers for Better Auth
async function performRequest(app: any, path: string, options: { method?: string; cookie?: string; body?: any } = {}) {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3002'
  const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`
  const host = new URL(fullUrl).host

  const headers = new Headers()
  headers.set('Host', host)
  if (options.cookie) {
    headers.set('Cookie', options.cookie)
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return app.request(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body instanceof FormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
  })
}

test('Hono API Integration - Auth Router', async () => {
  const app = await getApp()

  const email = `hono-auth-${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const passwordHash = await bcrypt.hash(password, 10)

  // Create a user directly in the DB
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Hono Auth Test User',
      password: passwordHash,
      role: 'USER',
    },
  })
  createdUserIds.push(user.id)

  // 1. GET /api/auth/get-session with no cookie -> null
  const resNoCookie = await performRequest(app, '/api/auth/get-session')
  assert.equal(resNoCookie.status, 200)
  const sessionNoCookie = await resNoCookie.json()
  assert.equal(sessionNoCookie, null)

  // 2. POST /api/auth/sign-in/email with invalid credentials -> 401
  const resBadSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email, password: 'wrongpassword' },
  })
  assert.equal(resBadSignin.status, 401)
  const badSigninBody = await resBadSignin.json()
  assert.ok(badSigninBody.error)

  // 3. POST /api/auth/sign-in/email with valid credentials -> 200
  const resSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email, password },
  })
  assert.equal(resSignin.status, 200)
  const signinBody = await resSignin.json()
  assert.equal(signinBody.user.email, email)

  const setCookie = resSignin.headers.get('set-cookie')
  assert.ok(setCookie)
  const cookieHeader = setCookie.split(';')[0]

  // 4. GET /api/auth/get-session with valid cookie -> returns user session
  const resSession = await performRequest(app, '/api/auth/get-session', {
    cookie: cookieHeader,
  })
  assert.equal(resSession.status, 200)
  const sessionBody = await resSession.json()
  assert.ok(sessionBody?.user)
  assert.equal(sessionBody.user.id, user.id)

  // 5. POST /api/auth/sign-out -> 200
  const resSignout = await performRequest(app, '/api/auth/sign-out', {
    method: 'POST',
    cookie: cookieHeader,
  })
  assert.equal(resSignout.status, 200)
  const signoutBody = await resSignout.json()
  assert.equal(signoutBody.success, true)

  // After signout, session should be null
  const resSessionAfter = await performRequest(app, '/api/auth/get-session', {
    cookie: cookieHeader,
  })
  assert.equal(resSessionAfter.status, 200)
  const sessionBodyAfter = await resSessionAfter.json()
  assert.equal(sessionBodyAfter, null)
})

test('Hono API Integration - Admin Router', async () => {
  const app = await getApp()

  const adminEmail = `hono-admin-${Date.now()}@example.com`
  const userEmail = `hono-reguser-${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const passwordHash = await bcrypt.hash(password, 10)

  // Create an admin user and a regular user
  const adminUser = await prisma.user.create({
    data: { email: adminEmail, name: 'Hono Admin User', password: passwordHash, role: 'ADMIN' },
  })
  const regularUser = await prisma.user.create({
    data: { email: userEmail, name: 'Hono Regular User', password: passwordHash, role: 'USER' },
  })
  createdUserIds.push(adminUser.id, regularUser.id)

  // Log in both to get valid session cookies
  const adminSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email: adminEmail, password },
  })
  const adminCookie = adminSignin.headers.get('set-cookie')!.split(';')[0]

  const userSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email: userEmail, password },
  })
  const userCookie = userSignin.headers.get('set-cookie')!.split(';')[0]

  // 1. GET /api/admin/users as regular user -> 403 Forbidden
  const resGetUsersForbidden = await performRequest(app, '/api/admin/users', {
    cookie: userCookie,
  })
  assert.equal(resGetUsersForbidden.status, 403)

  // 2. GET /api/admin/users as admin -> 200 OK
  const resGetUsersOk = await performRequest(app, '/api/admin/users?pageSize=5', {
    cookie: adminCookie,
  })
  assert.equal(resGetUsersOk.status, 200)
  const getUsersBody = await resGetUsersOk.json()
  assert.ok(Array.isArray(getUsersBody.users))
  assert.ok(getUsersBody.total > 0)
  assert.equal(getUsersBody.pageSize, 5)

  // 3. POST /api/admin/users/bulk-role as regular user -> 403 Forbidden
  const resBulkRoleForbidden = await performRequest(app, '/api/admin/users/bulk-role', {
    method: 'POST',
    cookie: userCookie,
    body: { ids: [regularUser.id], role: 'TESTER' },
  })
  assert.equal(resBulkRoleForbidden.status, 403)

  // 4. POST /api/admin/users/bulk-role as admin - self demotion attempt -> 400 Bad Request
  const resSelfDemote = await performRequest(app, '/api/admin/users/bulk-role', {
    method: 'POST',
    cookie: adminCookie,
    body: { ids: [adminUser.id], role: 'USER' },
  })
  assert.equal(resSelfDemote.status, 400)
  const selfDemoteBody = await resSelfDemote.json()
  assert.match(selfDemoteBody.error, /Cannot remove your own admin role/)

  // 5. POST /api/admin/users/bulk-role as admin - success changing regular user to TESTER -> 200 OK
  const resBulkRoleSuccess = await performRequest(app, '/api/admin/users/bulk-role', {
    method: 'POST',
    cookie: adminCookie,
    body: { ids: [regularUser.id], role: 'TESTER' },
  })
  assert.equal(resBulkRoleSuccess.status, 200)
  const bulkRoleBody = await resBulkRoleSuccess.json()
  assert.equal(bulkRoleBody.success, true)
  assert.equal(bulkRoleBody.updatedCount, 1)

  // Verify DB updated
  const updatedUser = await prisma.user.findUnique({ where: { id: regularUser.id } })
  assert.equal(updatedUser?.role, 'TESTER')

  // 6. GET /api/admin/export as regular user -> 403 Forbidden
  const resExportForbidden = await performRequest(app, '/api/admin/export', {
    cookie: userCookie,
  })
  assert.equal(resExportForbidden.status, 403)

  // 7. GET /api/admin/export as admin -> 200 OK
  const resExportOk = await performRequest(app, '/api/admin/export', {
    cookie: adminCookie,
  })
  assert.equal(resExportOk.status, 200)
  const exportBody = await resExportOk.json()
  assert.ok(exportBody.metadata)
  assert.ok(Array.isArray(exportBody.users))
})

test('Hono API Integration - Comments Router', async () => {
  const app = await getApp()

  const userAEmail = `hono-usera-${Date.now()}@example.com`
  const userBEmail = `hono-userb-${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const passwordHash = await bcrypt.hash(password, 10)

  // Create two users
  const userA = await prisma.user.create({
    data: { email: userAEmail, name: 'User A', password: passwordHash, role: 'USER' },
  })
  const userB = await prisma.user.create({
    data: { email: userBEmail, name: 'User B', password: passwordHash, role: 'USER' },
  })
  createdUserIds.push(userA.id, userB.id)

  // Log in both
  const userASignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email: userAEmail, password },
  })
  const userACookie = userASignin.headers.get('set-cookie')!.split(';')[0]

  const userBSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email: userBEmail, password },
  })
  const userBCookie = userBSignin.headers.get('set-cookie')!.split(';')[0]

  // Create an issue owned by userA
  const issue = await prisma.issue.create({
    data: {
      title: 'Hono Test Issue',
      description: 'Issue description',
      type: 'BUG',
      priority: 'MEDIUM',
      severity: 'MINOR',
      createdBy: userA.id,
    },
  })
  createdIssueIds.push(issue.id)

  // 1. POST /api/comments as User B (non-owner regular user) -> 403 Forbidden
  const resCommentForbidden = await performRequest(app, '/api/comments', {
    method: 'POST',
    cookie: userBCookie,
    body: { issueId: issue.id, content: 'This is User B comment' },
  })
  assert.equal(resCommentForbidden.status, 403)

  // 2. POST /api/comments as User A (owner) -> 200 OK
  const resCommentOk = await performRequest(app, '/api/comments', {
    method: 'POST',
    cookie: userACookie,
    body: { issueId: issue.id, content: 'This is a valid comment by owner' },
  })
  assert.equal(resCommentOk.status, 200)
  const commentBody = await resCommentOk.json()
  assert.equal(commentBody.content, 'This is a valid comment by owner')
  createdCommentIds.push(commentBody.id)

  // 3. POST /api/comments validation: empty -> 400
  const resCommentEmpty = await performRequest(app, '/api/comments', {
    method: 'POST',
    cookie: userACookie,
    body: { issueId: issue.id, content: '   ' },
  })
  assert.equal(resCommentEmpty.status, 400)

  // 4. POST /api/comments validation: too long -> 400
  const resCommentTooLong = await performRequest(app, '/api/comments', {
    method: 'POST',
    cookie: userACookie,
    body: { issueId: issue.id, content: 'A'.repeat(4001) },
  })
  assert.equal(resCommentTooLong.status, 400)
})

test('Hono API Integration - Notifications Router', async () => {
  const app = await getApp()

  const userEmail = `hono-notif-${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: { email: userEmail, name: 'Notification User', password: passwordHash, role: 'USER' },
  })
  createdUserIds.push(user.id)

  // Log in
  const userSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email: userEmail, password },
  })
  const userCookie = userSignin.headers.get('set-cookie')!.split(';')[0]

  // Create issue and notification
  const issue = await prisma.issue.create({
    data: {
      title: 'Hono Notif Issue',
      description: 'Issue description',
      type: 'BUG',
      priority: 'MEDIUM',
      severity: 'MINOR',
      createdBy: user.id,
    },
  })
  createdIssueIds.push(issue.id)

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      issueId: issue.id,
      message: 'New comment on your issue',
      isRead: false,
    },
  })
  createdNotificationIds.push(notification.id)

  // 1. GET /api/notifications -> 200 OK
  const resGetNotifs = await performRequest(app, '/api/notifications', {
    cookie: userCookie,
  })
  assert.equal(resGetNotifs.status, 200)
  const notifsBody = await resGetNotifs.json()
  assert.ok(Array.isArray(notifsBody.notifications))
  assert.equal(notifsBody.notifications[0].id, notification.id)

  // 2. GET /api/notifications/unread -> returns count = 1
  const resUnreadCount = await performRequest(app, '/api/notifications/unread', {
    cookie: userCookie,
  })
  assert.equal(resUnreadCount.status, 200)
  const unreadBody = await resUnreadCount.json()
  assert.equal(unreadBody.count, 1)

  // 3. GET /api/notifications/:id -> returns single notification
  const resSingleNotif = await performRequest(app, `/api/notifications/${notification.id}`, {
    cookie: userCookie,
  })
  assert.equal(resSingleNotif.status, 200)
  const singleNotifBody = await resSingleNotif.json()
  assert.equal(singleNotifBody.notification.id, notification.id)

  // 4. PATCH /api/notifications/:id (mark single read) -> 200 OK
  const resPatchSingle = await performRequest(app, `/api/notifications/${notification.id}`, {
    method: 'PATCH',
    cookie: userCookie,
  })
  assert.equal(resPatchSingle.status, 200)
  const patchSingleBody = await resPatchSingle.json()
  assert.equal(patchSingleBody.success, true)

  // 5. Verify unread count is now 0
  const resUnreadCountAfter = await performRequest(app, '/api/notifications/unread', {
    cookie: userCookie,
  })
  assert.equal(resUnreadCountAfter.status, 200)
  const unreadBodyAfter = await resUnreadCountAfter.json()
  assert.equal(unreadBodyAfter.count, 0)
})

test('Hono API Integration - Health Router', async () => {
  const app = await getApp()

  // 1. GET /health -> 200 OK
  const resHealth = await performRequest(app, '/health')
  assert.equal(resHealth.status, 200)
  const healthBody = await resHealth.json()
  assert.equal(healthBody.ok, true)

  // 2. GET /api/health -> 200 OK
  const resApiHealth = await performRequest(app, '/api/health')
  assert.equal(resApiHealth.status, 200)
  const apiHealthBody = await resApiHealth.json()
  assert.equal(apiHealthBody.status, 'ok')
  assert.equal(apiHealthBody.db, 'ok')
})

test('Hono API Integration - Upload Router', async () => {
  const app = await getApp()

  const userEmail = `hono-upload-${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: { email: userEmail, name: 'Upload User', password: passwordHash, role: 'USER' },
  })
  createdUserIds.push(user.id)

  // Log in
  const userSignin = await performRequest(app, '/api/auth/sign-in/email', {
    method: 'POST',
    body: { email: userEmail, password },
  })
  const userCookie = userSignin.headers.get('set-cookie')!.split(';')[0]

  // 1. POST /api/upload without auth -> 401 Unauthorized
  const resUploadNoAuth = await performRequest(app, '/api/upload', {
    method: 'POST',
  })
  assert.equal(resUploadNoAuth.status, 401)

  // 2. POST /api/upload with auth and valid PNG screenshot file -> 200 OK
  const formData = new FormData()
  // PNG Magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const blob = new Blob([pngBytes], { type: 'image/png' })
  formData.append('screenshots', blob, 'screenshot.png')

  const resUpload = await performRequest(app, '/api/upload', {
    method: 'POST',
    cookie: userCookie,
    body: formData,
  })
  assert.equal(resUpload.status, 200)
  const uploadBody = await resUpload.json()
  assert.ok(Array.isArray(uploadBody.files))
  assert.equal(uploadBody.files.length, 1)
  assert.equal(uploadBody.files[0].filename, 'screenshot.png')
  assert.equal(uploadBody.files[0].mimeType, 'image/png')
})
