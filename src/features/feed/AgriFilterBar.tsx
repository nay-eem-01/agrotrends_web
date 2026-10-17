import { useT } from '../../lib/i18n'
import { X } from '@phosphor-icons/react'
import { lazy, Suspense, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { filterPath, SEASON_LABELS, SOIL_LABELS, type AgriFilters } from '../../lib/agri'

// The popover and its form load after the page (they pull in the positioning code); a same-size box holds the place.
const FilterButtonImpl = lazy(() => import('./FilterButton').then((m) => ({ default: m.FilterButton })))

/** "Filter", with the number of active farming filters; opens the crop, region, season and soil form. */
export function FilterButton({ filters, className }: { filters: AgriFilters; className?: string }) {
  return (
    <Suspense fallback={<span aria-hidden="true" className={cn('inline-block h-10 w-24 shrink-0 rounded-lg border border-border-strong', className)} />}>
      <FilterButtonImpl filters={filters} className={className} />
    </Suspense>
  )
}

const FILTER_NAMES: Record<keyof AgriFilters, string> = { crop: 'Crop', season: 'Season', region: 'Region', soil: 'Soil' }

function label(key: keyof AgriFilters, filters: AgriFilters, t: (text: string) => string): string {
  if (key === 'season' && filters.season) return t(SEASON_LABELS[filters.season])
  if (key === 'soil' && filters.soil) return t(SOIL_LABELS[filters.soil])
  return filters[key] ?? ''
}

export const activeKeys = (filters: AgriFilters) => (Object.keys(FILTER_NAMES) as (keyof AgriFilters)[]).filter((key) => filters[key])

/** The farming filters for feeds without their own toolbar (stories): active chips, then the Filter button. */
export function AgriFilterBar({ filters }: { filters: AgriFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border py-3">
      <ActiveFilters filters={filters} />
      <FilterButton filters={filters} className="ml-auto" />
    </div>
  )
}

/** A removable sage chip; `removeLabel` names the remove link for screen readers. */
export function FilterChip({ children, to, removeLabel }: { children: ReactNode; to: string; removeLabel: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-0.5 rounded-full bg-secondary pr-0.5 pl-3 text-sm text-secondary-foreground">
      {children}
      <Link to={to} aria-label={removeLabel} className="flex size-7 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_10%)]">
        <X size={14} weight="bold" aria-hidden="true" />
      </Link>
    </span>
  )
}

/** The active farming filters as removable chips (after any `children`), and Clear all when there are several. */
export function ActiveFilters({ filters, children }: { filters: AgriFilters; children?: ReactNode }) {
  const t = useT()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const active = activeKeys(filters)
  if (active.length === 0 && !children) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {active.map((key) => {
        const { [key]: _removed, ...rest } = filters
        return (
          <FilterChip key={key} to={filterPath(rest, pathname, params)} removeLabel={`Remove filter ${FILTER_NAMES[key].toLowerCase()} ${label(key, filters, t)}`}>
            <span className="sr-only">{t(FILTER_NAMES[key])}: </span>
            {label(key, filters, t)}
          </FilterChip>
        )
      })}
      {active.length > 1 && (
        <Link to={filterPath({}, pathname, params)} className="flex h-8 items-center px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {t('Clear all')}
        </Link>
      )}
    </div>
  )
}

