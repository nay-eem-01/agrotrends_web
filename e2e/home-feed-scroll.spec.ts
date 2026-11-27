import { expect, test, type Page } from '@playwright/test'

const pageSize = 10

async function mockDiscover(page: Page, kind: 'story' | 'question', total: number, failSecondPage = false) {
  const requests: number[] = []
  const endpoint = kind === 'story' ? '/api/blogs/all' : '/api/questions/all'
  await page.addInitScript(() => localStorage.setItem('agrotrends.refreshToken', 'fixture'))
  await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const url = new URL(route.request().url())
    const envelope = (payload: unknown) => ({ success: true, payload })
    if (url.pathname === '/api/auth/refresh-token') {
      await route.fulfill({ json: envelope({ accessToken: 'fixture', user: { id: 9, name: 'Rafiq Ahmed' } }) })
      return
    }
    if (url.pathname === '/api/me/recommended-experts' || url.pathname === '/api/me/following/categories') {
      await route.fulfill({ json: envelope([]) })
      return
    }
    if (url.pathname !== endpoint || url.searchParams.has('unanswered')) {
      await route.fulfill({ json: envelope({ content: [], number: 0, last: true }) })
      return
    }

    const number = Number(url.searchParams.get('pageNo'))
    requests.push(number)
    if (failSecondPage && number === 1 && requests.filter((request) => request === 1).length <= 2) {
      await route.fulfill({ status: 503, json: { success: false, message: 'Could not load the next batch.' } })
      return
    }
    const content = Array.from({ length: Math.min(pageSize, total - number * pageSize) }, (_, index) => {
      const id = number * pageSize + index + 1
      return kind === 'story'
        ? { id, slug: `field-story-${id}`, title: `Field story ${id}`, excerpt: 'Notes from this season.' }
        : { questionId: id, title: `Field question ${id}`, content: '<p>What should I look for this week?</p>', authorName: 'Rafiq Ahmed' }
    })
    await route.fulfill({ json: envelope({ content, number, last: (number + 1) * pageSize >= total }) })
  })
  return requests
}

test('scrolling Discover loads all 100 stories without pressing a button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 })
  const requests = await mockDiscover(page, 'story', 100)
  await page.goto('/?show=stories')
  const feed = page.getByRole('region', { name: 'Your feed' })
  for (let end = pageSize; end < 100; end += pageSize) {
    await feed.getByRole('link', { name: `Field story ${end}`, exact: true }).scrollIntoViewIfNeeded()
  }
  await expect(feed.getByRole('link', { name: 'Field story 100', exact: true })).toBeVisible()
  await expect(feed.getByRole('link', { name: /^Field story \d+$/ })).toHaveCount(100)
  await expect(feed.getByText("You're all caught up.")).toBeVisible()
  expect(requests.filter((number) => number > 0)).toEqual(Array.from({ length: 9 }, (_, index) => index + 1))
})

test('a failed question batch can be retried while keeping the loaded questions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  const requests = await mockDiscover(page, 'question', 21, true)
  await page.goto('/?scope=all')
  const feed = page.getByRole('region', { name: 'Your feed' })
  await feed.getByRole('link', { name: 'Field question 10', exact: true }).scrollIntoViewIfNeeded()
  const retry = feed.getByRole('button', { name: 'Try again' })
  await expect(retry).toBeVisible()
  await expect(feed.getByRole('link', { name: 'Field question 1', exact: true })).toBeVisible()
  expect(requests.filter((number) => number > 0)).toEqual([1, 1])
  await retry.click()
  await feed.getByRole('link', { name: 'Field question 20', exact: true }).scrollIntoViewIfNeeded()
  await expect(feed.getByRole('link', { name: 'Field question 21', exact: true })).toBeVisible()
  await expect(feed.getByRole('link', { name: /^Field question \d+$/ })).toHaveCount(21)
  expect(requests.filter((number) => number > 0)).toEqual([1, 1, 1, 2])
})
