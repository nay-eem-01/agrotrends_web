import { formatNumber, getLang, setLang, translate } from './i18n'

afterEach(() => setLang('en'))

test('Bengali comes from the dictionary and falls back to English', () => {
  expect(translate('bn', 'Sign in')).toBe('সাইন ইন')
  expect(translate('bn', 'Not in the dictionary')).toBe('Not in the dictionary')
  expect(translate('en', 'Sign in')).toBe('Sign in')
})

test('placeholders are filled', () => {
  expect(translate('en', '{n} min read', { n: 4 })).toBe('4 min read')
  expect(translate('bn', '{n} min read', { n: '৪' })).toBe('৪ মিনিটে পড়া')
})

test('the choice is remembered and set on the page', () => {
  setLang('bn')
  expect(getLang()).toBe('bn')
  expect(localStorage.getItem('agrotrends.lang')).toBe('bn')
  expect(document.documentElement.lang).toBe('bn')
})

test('numbers use Bengali digits in Bengali', () => {
  expect(formatNumber(1250, 'bn')).toBe('১,২৫০')
  expect(formatNumber(1250, 'en')).toBe('1,250')
})
