import type { Schemas } from '../api/types'

export type Season = NonNullable<Schemas['AgriInfo']['season']>

export const SEASON_LABELS: Record<Season, string> = {
  RABI: 'Rabi',
  KHARIF_1: 'Kharif-1',
  KHARIF_2: 'Kharif-2',
  YEAR_ROUND: 'Year-round',
}
