import { expect, test } from 'vitest'
import { nextVote, optimisticScore } from './votes'

test('the same arrow again withdraws the vote; the other one switches it', () => {
  expect(nextVote(undefined, 'UP')).toBe('UP')
  expect(nextVote('UP', 'UP')).toBeNull()
  expect(nextVote('UP', 'DOWN')).toBe('DOWN')
})

test('the optimistic score undoes the old vote and adds the new one', () => {
  expect(optimisticScore(4, undefined, 'UP')).toBe(5)
  expect(optimisticScore(5, 'UP', null)).toBe(4)
  expect(optimisticScore(5, 'UP', 'DOWN')).toBe(3)
  expect(optimisticScore(0, 'DOWN', null)).toBe(1)
})
