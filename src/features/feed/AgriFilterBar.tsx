import { useT } from '../../lib/i18n'
import { Faders, X } from '@phosphor-icons/react'
import { useId, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { filterPath, SEASON_LABELS, SOIL_LABELS, type AgriFilters, type Soil } from '../../lib/agri'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'

const FILTER_NAMES: Record<keyof AgriFilters, string> = { crop: 'Crop', season: 'Season', region: 'Region', soil: 'Soil' }

function label(key: keyof AgriFilters, filters: AgriFilters, t: (text: string) => string): string {
  if (key === 'season' && filters.season) return t(SEASON_LABELS[filters.season])
  if (key === 'soil' && filters.soil) return t(SOIL_LABELS[filters.soil])
  return filters[key] ?? ''
}

/** The active farming filters as removable chips, and a small form to filter by crop, region and soil. */
export function AgriFilterBar({ filters }: { filters: AgriFilters }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const formId = useId()
  const active = (Object.keys(FILTER_NAMES) as (keyof AgriFilters)[]).filter((key) => filters[key])

  return (
    <div className="border-b border-rule py-3">
      <div className="flex flex-wrap items-center gap-2">
        {active.map((key) => {
          const { [key]: _removed, ...rest } = filters
          return (
            <span key={key} className="inline-flex h-8 items-center gap-1 rounded-full bg-ink pr-1 pl-3 text-sm text-paper">
              <span className="sr-only">{t(FILTER_NAMES[key])}: </span>
              {label(key, filters, t)}
              <Link
                to={filterPath(rest, pathname)}
                aria-label={`Remove filter ${FILTER_NAMES[key].toLowerCase()} ${label(key, filters, t)}`}
                className="flex size-7 items-center justify-center rounded-full hover:bg-paper/20"
              >
                <X size={14} aria-hidden="true" />
              </Link>
            </span>
          )
        })}
        {active.length > 1 && (
          <Link to={pathname} className="px-2 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            {t('Clear all')}
          </Link>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto inline-flex h-11 items-center gap-1.5 px-1 text-sm text-ink-muted hover:text-ink"
        >
          <Faders size={18} aria-hidden="true" />
          {t('Filter by crop, region or soil')}
        </button>
      </div>
      {open && <FilterForm id={formId} filters={filters} onDone={() => setOpen(false)} />}
    </div>
  )
}

function FilterForm({ id, filters, onDone }: { id: string; filters: AgriFilters; onDone: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [crop, setCrop] = useState(filters.crop ?? '')
  const [region, setRegion] = useState(filters.region ?? '')
  const [soil, setSoil] = useState<Soil | ''>(filters.soil ?? '')
  const soilId = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    navigate(filterPath({ season: filters.season, crop: crop.trim() || undefined, region: region.trim() || undefined, soil: soil || undefined }, pathname))
    onDone()
  }

  return (
    <form id={id} onSubmit={submit} className="mt-3 grid gap-4 sm:grid-cols-3">
      <TextField label={t('Crop')} placeholder="boro rice" value={crop} onChange={(e) => setCrop(e.target.value)} />
      <TextField label={t('Region')} placeholder="rangpur" value={region} onChange={(e) => setRegion(e.target.value)} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={soilId} className="text-sm font-medium text-ink">
          {t('Soil')}
        </label>
        <select
          id={soilId}
          value={soil}
          onChange={(e) => setSoil(e.target.value as Soil | '')}
          className="h-11 rounded-lg border border-rule bg-paper px-3 text-base text-ink focus:border-paddy focus:outline-none"
        >
          <option value="">{t('Any soil')}</option>
          {(Object.keys(SOIL_LABELS) as Soil[]).map((value) => (
            <option key={value} value={value}>
              {t(SOIL_LABELS[value])}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3">
        <Button type="submit" size="sm">
          {t('Show stories')}
        </Button>
      </div>
    </form>
  )
}
