import { isEmail, passwordProblem, safeNext, signInPath, splitList } from './auth'

test('password rules match the backend', () => {
  expect(passwordProblem('')).toBe('Enter a password.')
  expect(passwordProblem('Abc 123!x')).toMatch(/spaces/)
  expect(passwordProblem('Ab1!')).toMatch(/8 to 16/)
  expect(passwordProblem('Abcdefgh1!abcdefg')).toMatch(/8 to 16/)
  expect(passwordProblem('abcdefg1!')).toMatch(/capital/)
  expect(passwordProblem('Abcdefgh!')).toMatch(/number/)
  expect(passwordProblem('Abcdefgh1')).toMatch(/symbol/)
  expect(passwordProblem('Paddy2026!')).toBeNull()
})

test('email check is a light shape check', () => {
  expect(isEmail('karim@farm.bd')).toBe(true)
  expect(isEmail(' karim@farm.bd ')).toBe(true)
  expect(isEmail('karim@farm')).toBe(false)
  expect(isEmail('karim farm.bd')).toBe(false)
})

test('comma lists are trimmed and blanks dropped', () => {
  expect(splitList('rice, jute ,, soil health ')).toEqual(['rice', 'jute', 'soil health'])
  expect(splitList('  ')).toEqual([])
})

test('only same-site paths are followed after sign-in', () => {
  expect(safeNext('/stories/boro-rice?x=1')).toBe('/stories/boro-rice?x=1')
  expect(safeNext(null)).toBe('/')
  expect(safeNext('https://evil.example')).toBe('/')
  expect(safeNext('//evil.example')).toBe('/')
  expect(safeNext('/\\evil.example')).toBe('/')
  expect(safeNext('/sign-in?next=/x')).toBe('/')
})

test('sign-in links carry the way back', () => {
  expect(signInPath('/stories/a?b=1')).toBe('/sign-in?next=%2Fstories%2Fa%3Fb%3D1')
  expect(signInPath('/')).toBe('/sign-in')
})
