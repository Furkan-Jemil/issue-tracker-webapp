import 'dotenv/config'
import { test, expect } from '@playwright/test'
import prisma from '../lib/prisma'
import { auth } from '../lib/auth'

test.describe('E2E Authenticated Flow', () => {
  const email = 'playwright-admin@example.com'
  const password = 'Password123!'
  let userId: string | null = null

  test.beforeAll(async () => {
    // Clean up any stale test user
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      await prisma.issueHistory.deleteMany({ where: { actorId: existing.id } })
      await prisma.session.deleteMany({ where: { userId: existing.id } })
      await prisma.account.deleteMany({ where: { userId: existing.id } })
      await prisma.user.delete({ where: { id: existing.id } })
    }

    // Seed test admin user via Better Auth API
    const user = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: 'Playwright Admin',
      },
    })
    userId = user.user.id

    // Promote to ADMIN
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    })
  })

  test.afterAll(async () => {
    if (userId) {
      // Clean up test admin user data
      await prisma.issueHistory.deleteMany({ where: { actorId: userId } })
      await prisma.session.deleteMany({ where: { userId } })
      await prisma.account.deleteMany({ where: { userId } })
      await prisma.user.delete({ where: { id: userId } })
    }
    await prisma.$disconnect()
  })

  test('should log in, view dashboard, inspect users table, and download JSON export', async ({ page }) => {
    // 1. Login flow
    await page.goto('/login')
    await page.fill('input#email', email)
    await page.fill('input#password', password)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard (higher timeout to allow Next.js compilation)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 })
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 15000 })

    // 2. Navigate to users table
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/.*admin\/users/, { timeout: 30000 })
    await expect(page.locator('h1')).toContainText('Users', { timeout: 15000 })
    
    // Assert our admin user is in the list
    await expect(page.locator('table')).toContainText('Playwright Admin', { timeout: 15000 })

    // 3. Navigate to settings for data export (redirects to audit-log)
    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/.*admin\/audit-log/, { timeout: 30000 })

    // Trigger download of JSON export
    const downloadPromise = page.waitForEvent('download')
    await page.click('button[aria-label="Download JSON export"]')
    const download = await downloadPromise

    // Verify filename
    expect(download.suggestedFilename()).toBe('issue-tracker-export.json')
  })
})
