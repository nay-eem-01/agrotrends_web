import { storyDate } from './dates'

test('dates drop the year when it is this year', () => {
  const now = new Date('2026-10-08T12:00:00')
  expect(storyDate('2026-10-07T12:00:00', now)).toBe('Oct 7')
  expect(storyDate('2025-03-02T12:00:00', now)).toBe('Mar 2, 2025')
  expect(storyDate('nonsense', now)).toBe('')
  expect(storyDate(undefined, now)).toBe('')
})
