import { test, expect, type Page } from '@playwright/test'

test.describe('Critical flows', () => {
  const assertRouteHealthy = async (page: Page, route: string) => {
    const response = await page.goto(route)
    expect(response?.ok()).toBeTruthy()
    await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}$`))
    await expect(page.locator('body')).not.toContainText('Application error')
  }

  test('root redirects to dashboard and renders shell', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('login page renders and can navigate to forgot password', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)
    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible()
  })

  test('signup validates password mismatch on client', async ({ page }) => {
    await page.goto('/signup')

    await page.getByPlaceholder('Full name').fill('Test User')
    await page.getByPlaceholder('Email address').fill('test@example.com')
    await page.getByPlaceholder('Password', { exact: true }).fill('password123')
    await page.getByPlaceholder('Confirm password', { exact: true }).fill('different123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('reset password validates minimum password length on client', async ({ page }) => {
    await page.goto('/reset-password')

    await page.getByPlaceholder('New password', { exact: true }).fill('123')
    await page.getByPlaceholder('Confirm new password', { exact: true }).fill('123')
    await page.getByRole('button', { name: 'Update password' }).click()

    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible()
  })

  test('cross-hub critical navigation remains healthy', async ({ page }) => {
    const coreRoutes = [
      '/contacts',
      '/companies',
      '/deals',
      '/quotes',
      '/tickets',
      '/service/inbox',
      '/sales/forecast',
      '/marketing/analytics',
      '/content/blog',
      '/data/sync',
      '/ai-assistant',
      '/ai-assistant/agents/prospecting',
    ]

    for (const route of coreRoutes) {
      await assertRouteHealthy(page, route)
    }
  })

  test('security and release operations pages render', async ({ page }) => {
    const securityRoutes = [
      '/settings/sso',
      '/settings/policies',
      '/qa/performance',
      '/qa/release-readiness',
    ]

    for (const route of securityRoutes) {
      await assertRouteHealthy(page, route)
    }
  })
})
