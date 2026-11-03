import { expect, test } from 'vitest'
import { splitAskDraft } from './askDraft'

test('one short line is the title', () => {
  expect(splitAskDraft('  Why are my boro seedlings turning yellow?  ')).toEqual({ title: 'Why are my boro seedlings turning yellow?', details: '' })
})

test('the first line is the title and the lines after it the details', () => {
  expect(splitAskDraft('Tilapia gasping at dawn\n\nPond of 30 decimals.\nWater is dark green.')).toEqual({
    title: 'Tilapia gasping at dawn',
    details: 'Pond of 30 decimals.\nWater is dark green.',
  })
})

test('a long first line keeps its first sentence as the title and moves the rest into the details', () => {
  const rest = 'The pond is 30 decimals, stocked in June, and the water turned dark green last week. '.repeat(3).trim()
  expect(splitAskDraft(`Why are my tilapia gasping at the surface? ${rest}`)).toEqual({ title: 'Why are my tilapia gasping at the surface?', details: rest })
  expect(splitAskDraft(`আমার ধানের চারা হলুদ হচ্ছে কেন। ${rest}`).title).toBe('আমার ধানের চারা হলুদ হচ্ছে কেন।')
})

test('a long line with no sentence end is cut at a whole word, and nothing is lost', () => {
  const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')
  const { title, details } = splitAskDraft(words)
  expect(title.length).toBeLessThanOrEqual(200)
  expect(`${title} ${details}`).toBe(words)
})

test('nothing typed is an empty draft', () => {
  expect(splitAskDraft('   ')).toEqual({ title: '', details: '' })
})
