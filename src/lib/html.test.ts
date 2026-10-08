import { excerpt, htmlToText } from './html'

test('story HTML becomes plain text with paragraphs kept apart', () => {
  expect(htmlToText('<h2>Boro</h2><p>Transplant <b>early</b>.</p><p>Then&nbsp;irrigate.</p>')).toBe('Boro Transplant early. Then irrigate.')
  expect(htmlToText('<p>a<br>b</p>')).toBe('a b')
  expect(htmlToText(null)).toBe('')
})

test('scripts are not run and their markup is not kept', () => {
  const text = htmlToText('<img src=x onerror="window.__pwned=1"><p>Safe</p>')
  expect(text).toBe('Safe')
  expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
})

test('excerpts end on a word', () => {
  expect(excerpt('Short text.')).toBe('Short text.')
  expect(excerpt('Rice blast spreads fast in humid weather, so scout often.', 30)).toBe('Rice blast spreads fast in…')
  expect(excerpt('x'.repeat(50), 20)).toBe(`${'x'.repeat(20)}…`)
})
