import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

async function signIn(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('E-mail').fill(email!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible()
}

test('a visitor reads the home feed and opens a story', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Crop seasons' })).toBeVisible()
  const first = page.locator('article h2 a').first()
  const title = await first.textContent()
  await first.click()
  await expect(page.getByRole('heading', { level: 1, name: title! })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Responses/ })).toBeVisible()
})

test('a visitor browses questions, search and the advisor', async ({ page }) => {
  await page.goto('/questions')
  await expect(page.getByRole('heading', { level: 1, name: 'Questions' })).toBeVisible()
  await page.goto('/search?q=rice')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Results for')
  await page.goto('/advisor')
  await expect(page.getByRole('button', { name: 'Sign in to ask' })).toBeVisible()
})

test('the interface switches to Bengali and back', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'বাংলা' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(page.getByRole('link', { name: 'প্রশ্ন' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test.describe('signed in', () => {
  test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD (an author account) to run these')

  test('an author writes, publishes and deletes a story', async ({ page }) => {
    await signIn(page)
    const title = `Smoke test ${Date.now()}`
    await page.goto('/write')
    await page.getByRole('textbox', { name: 'Title' }).fill(title)
    await page.getByRole('textbox', { name: 'Story' }).fill('Written by the smoke test; it deletes itself.')
    await page.getByRole('button', { name: 'Publish' }).click()
    const sheet = page.getByRole('dialog')
    await sheet.getByLabel('Category').selectOption({ index: 1 })
    await sheet.getByRole('button', { name: 'Publish now' }).click()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

    await page.goto('/me/stories?tab=published')
    await page.getByRole('button', { name: `Delete ${title}` }).click()
    await page.getByRole('button', { name: 'Delete story' }).click()
    await expect(page.getByRole('link', { name: title })).toHaveCount(0)
  })

  test('a reader asks and deletes a question', async ({ page }) => {
    await signIn(page)
    const title = `Smoke test question ${Date.now()}?`
    await page.goto('/questions/ask')
    await page.getByLabel('Your question').fill(title)
    await page.getByLabel('Details').fill('Asked by the smoke test; it deletes itself.')
    await page.getByRole('button', { name: 'Post question' }).click()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page).toHaveURL(/\/questions$/)
  })
})
