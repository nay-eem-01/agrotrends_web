import { getTheme, setTheme } from './theme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('a chosen theme is remembered and set on the page', () => {
  // jsdom has no matchMedia, so the system theme reads as light.
  expect(getTheme()).toBe('light')
  setTheme('dark')
  expect(getTheme()).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('agrotrends.theme')).toBe('dark')
})

test("choosing the system's theme goes back to following the system", () => {
  setTheme('dark')
  setTheme('light')
  expect(localStorage.getItem('agrotrends.theme')).toBeNull()
  expect(document.documentElement.dataset.theme).toBeUndefined()
})
