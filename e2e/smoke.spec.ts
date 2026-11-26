import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

async function signIn(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('E-mail or phone number', { exact: true }).fill(email!)
  await page.getByLabel('Password', { exact: true }).fill(password!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: /Account/ })).toBeVisible()
}

test('the mobile Stories header shows the leaf, name, and a way home', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/stories')
  const header = page.getByRole('banner')
  const home = header.getByRole('link', { name: 'AgroTrends home' })
  await expect(home.locator('svg')).toBeVisible()
  await expect(home.getByText('AgroTrends', { exact: true })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Menu' })).toBeInViewport({ ratio: 1 })
  await header.getByRole('button', { name: 'Go back' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('a visitor opens a published story from Discover', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'What farmers are asking' })).toBeVisible()
  await page.getByRole('link', { name: 'All stories', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Stories' })).toBeVisible()
  const first = page.locator('main article h2 a').first()
  await expect(first).toBeVisible()
  const title = await first.innerText()
  await first.click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
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
  test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD (a confirmed account) to run these')

  test('a member writes, publishes and deletes a story', async ({ page }) => {
    await signIn(page)
    const title = `Smoke test ${Date.now()}`
    await page.goto('/write')
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title)
    await page.getByRole('textbox', { name: 'Story' }).fill('Written by the smoke test; it deletes itself.')
    const settings = page.getByRole('complementary', { name: 'Story settings' })
    await settings.getByRole('button', { name: 'Show options' }).click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
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
    const topic = page.getByRole('group', { name: 'Topic', exact: true })
    const firstTopic = topic.locator('label').filter({ has: page.locator('input[type=radio]') }).first()
    await firstTopic.click()
    await page.getByRole('button', { name: 'Post question' }).click()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await page.getByRole('button', { name: 'More actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page).toHaveURL(/\/questions$/)
  })
})
