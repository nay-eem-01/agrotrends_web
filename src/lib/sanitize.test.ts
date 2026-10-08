import { looksLikeHtml, sanitizeHtml } from './sanitize'

test('scripts, handlers and styles are removed', () => {
  const clean = sanitizeHtml('<p onclick="x()" style="color:red">Hi<script>alert(1)</script><img src="/a.png" onerror="x()"></p>')
  expect(clean).toBe('<p>Hi<img src="/a.png"></p>')
})

test('frames and forms are removed', () => {
  expect(sanitizeHtml('<iframe src="https://evil"></iframe><form><input></form><p>ok</p>')).toBe('<p>ok</p>')
})

test('external links open in a new tab without the opener', () => {
  expect(sanitizeHtml('<a href="https://dae.gov.bd">DAE</a>')).toBe(
    '<a href="https://dae.gov.bd" target="_blank" rel="noopener noreferrer nofollow">DAE</a>',
  )
  expect(sanitizeHtml('<a href="/stories/x">x</a>')).toBe('<a href="/stories/x">x</a>')
})

test('script-like and protocol-relative links lose their href', () => {
  expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
  expect(sanitizeHtml('<a href="data:text/html,hi">x</a>')).toBe('<a>x</a>')
  expect(sanitizeHtml('<a href="//evil.example">x</a>')).toBe('<a>x</a>')
})

test('plain text is told apart from HTML', () => {
  expect(looksLikeHtml('Too much nitrogen makes rice blast worse.')).toBe(false)
  expect(looksLikeHtml('Yield < 5 t/ha and > 3')).toBe(false)
  expect(looksLikeHtml('<p>Hi</p>')).toBe(true)
})
