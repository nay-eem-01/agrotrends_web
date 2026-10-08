import type { Schemas } from '../api/types'

export type Season = NonNullable<Schemas['AgriInfo']['season']>
export type Soil = NonNullable<Schemas['AgriInfo']['soil']>

export const SEASON_LABELS: Record<Season, string> = {
  RABI: 'Rabi',
  KHARIF_1: 'Kharif-1',
  KHARIF_2: 'Kharif-2',
  YEAR_ROUND: 'Year-round',
}

export const SOIL_LABELS: Record<Soil, string> = {
  CLAY: 'Clay',
  LOAM: 'Loam',
  CLAY_LOAM: 'Clay loam',
  SANDY: 'Sandy',
  SANDY_LOAM: 'Sandy loam',
  SILT: 'Silt',
  PEAT: 'Peat',
  SALINE: 'Saline',
  ACIDIC: 'Acidic',
}

export interface SeasonSpan {
  season: Exclude<Season, 'YEAR_ROUND'>
  /** Shown under the name, e.g. "Mid-Oct to mid-Mar". */
  months: string
  /** Start as [month (1-12), day]; each season runs to the day before the next one starts. */
  start: [number, number]
}

/** Bangladesh's cropping seasons as the DAE dates them; the farming year starts with Rabi. */
export const SEASON_SPANS: SeasonSpan[] = [
  { season: 'RABI', months: 'Mid-Oct to mid-Mar', start: [10, 16] },
  { season: 'KHARIF_1', months: 'Mid-Mar to mid-Jul', start: [3, 16] },
  { season: 'KHARIF_2', months: 'Mid-Jul to mid-Oct', start: [7, 16] },
]

const DAY = 86_400_000

/** The farming year (from 16 Oct) that `date` falls in: its start and end. */
function farmingYear(date: Date): { start: Date; end: Date } {
  const year = date >= new Date(date.getFullYear(), 9, 16) ? date.getFullYear() : date.getFullYear() - 1
  return { start: new Date(year, 9, 16), end: new Date(year + 1, 9, 16) }
}

function spanStart(span: SeasonSpan, yearStart: Date): Date {
  const [month, day] = span.start
  const year = month >= 10 ? yearStart.getFullYear() : yearStart.getFullYear() + 1
  return new Date(year, month - 1, day)
}

/**
 * Where `date` sits in the farming year: the season and how far through the year (0-1), plus each season's share
 * of the year, for drawing the strip.
 */
export function seasonCalendar(date = new Date()) {
  const { start, end } = farmingYear(date)
  const length = (end.getTime() - start.getTime()) / DAY
  const segments = SEASON_SPANS.map((span, index) => {
    const from = spanStart(span, start)
    const to = index + 1 < SEASON_SPANS.length ? spanStart(SEASON_SPANS[index + 1], start) : end
    return { ...span, share: (to.getTime() - from.getTime()) / DAY / length, from, to }
  })
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const current = segments.find((segment) => today >= segment.from && today < segment.to) ?? segments[0]
  return { segments, current: current.season, position: (today.getTime() - start.getTime()) / DAY / length }
}

export interface AgriFilters {
  crop?: string
  season?: Season
  region?: string
  soil?: Soil
}

const isSeason = (value: string | null): value is Season => value !== null && value in SEASON_LABELS
const isSoil = (value: string | null): value is Soil => value !== null && value in SOIL_LABELS

/** The farming filters in a URL's query; unknown seasons or soils are ignored rather than sent. */
export function readAgriFilters(params: URLSearchParams): AgriFilters {
  const filters: AgriFilters = {}
  const crop = params.get('crop')?.trim()
  const region = params.get('region')?.trim()
  const season = params.get('season')
  const soil = params.get('soil')
  if (crop) filters.crop = crop
  if (isSeason(season)) filters.season = season
  if (region) filters.region = region
  if (isSoil(soil)) filters.soil = soil
  return filters
}

export function hasAgriFilters(filters: AgriFilters): boolean {
  return Object.keys(filters).length > 0
}

/** The home URL showing stories that match `filters`. */
export function filterPath(filters: AgriFilters): string {
  const params = new URLSearchParams()
  for (const key of ['crop', 'season', 'region', 'soil'] as const) {
    const value = filters[key]
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/?${query}` : '/'
}
