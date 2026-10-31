import { expect, test } from 'vitest'
import { passwordStrength } from './password'

test('a password scores a point each for length, a capital, a number and a symbol', () => {
  expect(passwordStrength('')).toBe(0)
  expect(passwordStrength('paddy')).toBe(0)
  expect(passwordStrength('paddyfield')).toBe(1)
  expect(passwordStrength('Paddyfield')).toBe(2)
  expect(passwordStrength('Paddy2026')).toBe(3)
  expect(passwordStrength('Paddy2026!')).toBe(4)
})
