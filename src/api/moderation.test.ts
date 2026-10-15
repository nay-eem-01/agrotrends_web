import { expect, test } from 'vitest'
import { groupReports } from './moderation'

test('open reports group by post, keeping the hidden snapshot', () => {
  const groups = groupReports([
    { id: 1, targetType: 'QUESTION', targetId: 5, reason: 'SPAM' },
    { id: 2, targetType: 'ANSWER', targetId: 5, reason: 'ABUSE' },
    { id: 3, targetType: 'QUESTION', targetId: 5, reason: 'HARMFUL_ADVICE', snapshot: 'Spray 10x' },
  ])
  expect(groups.map((g) => [g.key, g.reports.map((r) => r.id), g.snapshot])).toEqual([
    ['QUESTION:5', [1, 3], 'Spray 10x'],
    ['ANSWER:5', [2], undefined],
  ])
})
