import { expect, test } from '@playwright/test'

for (const width of [320, 1440]) {
  test(`the advisor input expands above its send button at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 })
    await page.goto('/advisor')

    const field = page.getByRole('textbox', { name: 'Your question' })
    const send = page.getByRole('button', { name: 'Sign in to ask' })
    await expect(field).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const empty = (await field.boundingBox())!
    const button = (await send.boundingBox())!
    expect(button.y).toBeGreaterThanOrEqual(empty.y + empty.height)

    await field.fill('First line\nSecond line\nThird line')
    expect((await field.boundingBox())!.height).toBeGreaterThan(empty.height)

    await field.fill('More details about my plants\n'.repeat(18))
    const { clientHeight, scrollHeight } = await field.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
    expect(scrollHeight).toBeGreaterThan(clientHeight)

    await field.clear()
    expect((await field.boundingBox())!.height).toBe(empty.height)
  })
}
