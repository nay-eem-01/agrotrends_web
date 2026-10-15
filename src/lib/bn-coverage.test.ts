import { expect, test } from 'vitest'
import { BN } from './bn'

// Every literal passed to t('…') in the app has a Bengali string (dynamic keys are covered by the screen tests).
const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!../api/schema.d.ts', '!./bn.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

test('every t() literal has a Bengali translation', () => {
  const missing = new Set<string>()
  for (const [file, source] of Object.entries(sources)) {
    for (const match of source.matchAll(/\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g)) {
      const key = (match[1] ?? match[2]).replace(/\\'/g, "'")
      if (!(key in BN)) missing.add(`${key}  (${file})`)
    }
  }
  expect([...missing]).toEqual([])
})
