import { filterPath, readAgriFilters, readQuestionFilters, seasonCalendar } from './agri'

test('the season follows the DAE calendar', () => {
  expect(seasonCalendar(new Date(2026, 9, 8)).current).toBe('KHARIF_2')
  expect(seasonCalendar(new Date(2026, 9, 16)).current).toBe('RABI')
  expect(seasonCalendar(new Date(2027, 0, 20)).current).toBe('RABI')
  expect(seasonCalendar(new Date(2027, 2, 15)).current).toBe('RABI')
  expect(seasonCalendar(new Date(2027, 2, 16)).current).toBe('KHARIF_1')
  expect(seasonCalendar(new Date(2027, 6, 16)).current).toBe('KHARIF_2')
})

test('segments cover the farming year and today sits inside its season', () => {
  const { segments, position } = seasonCalendar(new Date(2026, 9, 8))
  expect(segments.map((s) => s.season)).toEqual(['RABI', 'KHARIF_1', 'KHARIF_2'])
  expect(segments.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1)
  expect(segments[0].share).toBeGreaterThan(segments[2].share)
  expect(position).toBeGreaterThan(1 - segments[2].share)
  expect(position).toBeLessThan(1)
  expect(seasonCalendar(new Date(2026, 9, 16)).position).toBe(0)
})

test('filters are read from the URL and unknown values dropped', () => {
  const params = new URLSearchParams('crop=%20boro%20rice%20&season=RABI&soil=MUD&region=')
  expect(readAgriFilters(params)).toEqual({ crop: 'boro rice', season: 'RABI' })
  expect(readAgriFilters(new URLSearchParams('season=WINTER'))).toEqual({})
})

test('filter paths round-trip', () => {
  const path = filterPath({ crop: 'boro rice', season: 'RABI', soil: 'CLAY_LOAM' })
  expect(path).toBe('/stories?crop=boro+rice&season=RABI&soil=CLAY_LOAM')
  expect(readAgriFilters(new URLSearchParams(path.split('?')[1]))).toEqual({ crop: 'boro rice', season: 'RABI', soil: 'CLAY_LOAM' })
  expect(filterPath({})).toBe('/stories')
})

test('farming filters keep the other parameters of a list', () => {
  const keep = new URLSearchParams('crop=jute&categoryId=3&tag=pests&unanswered=true')
  expect(filterPath({ season: 'RABI' }, '/', keep)).toBe('/?season=RABI&categoryId=3&tag=pests&unanswered=true')
  expect(readQuestionFilters(keep)).toEqual({ crop: 'jute', categoryId: 3, tag: 'pests', unanswered: true })
  expect(readQuestionFilters(new URLSearchParams('categoryId=x&unanswered=1'))).toEqual({})
})
