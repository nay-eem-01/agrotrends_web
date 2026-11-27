import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`question feed placeholders align with question cards at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let release!: () => void
    const response = new Promise<void>((resolve) => { release = resolve })
    const question = {
      questionId: 5,
      title: 'How should I track feed costs?',
      content: '<p>We run five ponds.</p>',
      imageUrls: ['/favicon.svg'],
      category: { id: 2, categoryName: 'Fisheries' },
    }
    await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
      const isQuestions = new URL(route.request().url()).pathname === '/api/questions/all'
      if (isQuestions) await response
      await route.fulfill({ json: { success: true, payload: { content: isQuestions ? [question] : [], last: true, number: 0 } } })
    })
    await page.goto('/questions')
    const skeleton = page.getByRole('status', { name: 'Loading questions' }).locator('..')
    const row = skeleton.locator('div.divide-y > div').first()
    const loadingText = await row.locator('[data-slot="skeleton"]').first().boundingBox()
    const loadingPhoto = await row.locator('[data-slot="skeleton"]').last().boundingBox()
    release()

    const heading = page.getByRole('heading', { name: question.title })
    await expect(heading).toBeVisible()
    const text = await heading.boundingBox()
    const photo = await heading.locator('xpath=ancestor::li[1]').locator('img[src="/favicon.svg"]').boundingBox()
    expect(Math.abs(loadingText!.x - text!.x)).toBeLessThan(2)
    expect(Math.abs(loadingPhoto!.x - photo!.x)).toBeLessThan(2)
  })
}
