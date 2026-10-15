import { readFileSync } from 'node:fs'
import { expect, test, type Browser, type Page } from '@playwright/test'

/**
 * The Q&A community end to end, against a running backend with dev mail (links logged instead of sent):
 * sign up, confirm, ask, answer, notification, vote, accept, three reports hide, an admin dismisses.
 * - E2E_MAIL_LOG: the backend's log file, where the dev mailer writes confirmation links (skipped without it).
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD: an admin with CONTENT_MODERATE for the last step (skipped without them).
 */
const mailLog = process.env.E2E_MAIL_LOG
const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const PASSWORD = 'Paddy2026!'

test.describe.configure({ mode: 'serial' })
test.skip(!mailLog, 'Set E2E_MAIL_LOG to the backend log (dev mail) to run the community flow')

const run = Date.now().toString(36)
const asker = { name: 'Smoke Asker', email: `smoke-asker-${run}@example.com` }
const answerer = { name: 'Smoke Answerer', email: `smoke-answerer-${run}@example.com` }
const title = `Smoke: why are my seedlings yellow? ${run}`
let questionPath = ''

/** The confirmation link the dev mailer logged for `email`. */
async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const line = readFileSync(mailLog!, 'utf8')
      .split('\n')
      .reverse()
      .find((l) => l.includes(`e-mail confirmation for ${email}`))
    const token = line?.match(/token=([\w-]+)/)?.[1]
    if (token) return `/verify-email?token=${token}`
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`No confirmation link for ${email} in ${mailLog}`)
}

const mobile = () => `17${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`

async function signUpAndConfirm(page: Page, person: { name: string; email: string }) {
  await page.goto('/sign-up')
  await page.getByLabel('Full name').fill(person.name)
  await page.getByLabel('E-mail').fill(person.email)
  await page.getByLabel('Mobile number').fill(mobile())
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to AgroTrends' })).toBeVisible()
  await page.getByRole('link', { name: 'Skip for now' }).click()
  await expect(page.getByRole('region', { name: 'Confirm your e-mail' })).toBeVisible()
  await page.goto(await confirmationLink(person.email))
  await expect(page.getByRole('heading', { name: 'E-mail confirmed' })).toBeVisible()
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/sign-in')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: /Account/ })).toBeVisible()
}

async function asUser(browser: Browser, email: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page, email)
  return { page, close: () => context.close() }
}

test('two people sign up and confirm their e-mail', async ({ browser }) => {
  for (const person of [asker, answerer]) {
    const context = await browser.newContext()
    await signUpAndConfirm(await context.newPage(), person)
    await context.close()
  }
})

test('the asker asks; the answerer answers; the asker is notified', async ({ browser }) => {
  const a = await asUser(browser, asker.email)
  await a.page.goto('/questions/ask')
  await a.page.getByLabel('Your question').fill(title)
  await a.page.getByLabel('Details').fill('BRRI dhan29, 30 days old, after a cold week. Asked by the smoke test.')
  await a.page.getByLabel('Topic').selectOption({ index: 1 })
  await a.page.getByLabel('Tags').fill('smoke{Enter}')
  await a.page.getByRole('button', { name: 'Post question' }).click()
  await expect(a.page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  questionPath = new URL(a.page.url()).pathname

  const b = await asUser(browser, answerer.email)
  await b.page.goto(questionPath)
  await b.page.getByLabel('Your answer').fill('Cold injury: keep water on the field at night. (smoke test)')
  await b.page.getByRole('button', { name: 'Post answer' }).click()
  await expect(b.page.getByRole('article', { name: `Answer by ${answerer.name}` })).toBeVisible()
  await b.close()

  await a.page.reload()
  await expect(a.page.getByRole('button', { name: /Notifications, 1 unread/ })).toBeVisible()
  await a.page.getByRole('button', { name: /Notifications/ }).click()
  await expect(a.page.getByRole('region', { name: 'Notifications', exact: true }).getByText(`${answerer.name} answered your question`)).toBeVisible()
  await a.close()
})

test('the asker upvotes and accepts the answer', async ({ browser }) => {
  const a = await asUser(browser, asker.email)
  await a.page.goto(questionPath)
  const card = a.page.getByRole('article', { name: `Answer by ${answerer.name}` })
  await card.getByRole('button', { name: 'Upvote this answer' }).click()
  await expect(card.getByRole('button', { name: 'Upvote this answer' })).toHaveAttribute('aria-pressed', 'true')
  await card.getByRole('button', { name: 'Accept answer' }).click()
  await expect(a.page.getByText('Accepted by the asker')).toBeVisible()
  // The vote and the score survive a reload (my-votes and the answer's score).
  await a.page.reload()
  const reloaded = a.page.getByRole('article', { name: `Answer by ${answerer.name}` })
  await expect(reloaded.getByRole('button', { name: 'Upvote this answer' })).toHaveAttribute('aria-pressed', 'true')
  await expect(reloaded.getByText('Score 1')).toBeVisible()
  await a.close()
})

test('three different people reporting the question hide it', async ({ browser }) => {
  for (let i = 1; i <= 3; i++) {
    const context = await browser.newContext()
    const page = await context.newPage()
    const reporter = { name: `Smoke Reporter ${i}`, email: `smoke-reporter-${i}-${run}@example.com` }
    await signUpAndConfirm(page, reporter)
    await page.goto(questionPath)
    await page.getByRole('button', { name: 'Report' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Report this question' })
    await dialog.getByRole('radio', { name: /Spam/ }).check()
    await dialog.getByRole('button', { name: 'Send report' }).click()
    await expect(dialog.getByText('Thanks, moderators will look at it.')).toBeVisible()
    await context.close()
  }
  const visitor = await browser.newContext()
  const page = await visitor.newPage()
  await page.goto(questionPath)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await visitor.close()
})

test('an admin dismisses the reports and the question is back', async ({ browser }) => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (CONTENT_MODERATE) to run this step')
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/admin/reports')
  await page.getByLabel('Admin e-mail').fill(adminEmail!)
  await page.getByLabel('Password').fill(adminPassword!)
  await page.getByRole('button', { name: 'Sign in as admin' }).click()
  const id = questionPath.split('/').pop()
  const group = page.getByRole('article', { name: `Question ${id}` })
  await expect(group.getByText('Hidden')).toBeVisible()
  await group.getByRole('button', { name: 'Dismiss' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Dismiss' }).click()
  await expect(group).toHaveCount(0)
  await page.goto(questionPath)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await context.close()
})
