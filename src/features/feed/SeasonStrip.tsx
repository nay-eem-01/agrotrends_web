import { useT } from '../../lib/i18n'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { filterPath, readAgriFilters, seasonCalendar, SEASON_LABELS } from '../../lib/agri'
import { cx } from '../../ui/cx'

/**
 * The home page's one bold element: the farming year as three bands sized by their length, today's place marked in
 * mustard. Each band filters the feed by its season; choosing it again clears the filter.
 */
export function SeasonStrip() {
  const t = useT()
  // Read once per visit; the season changes four times a year, not while the page is open.
  const [today] = useState(() => new Date())
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const filters = readAgriFilters(params)
  const { segments, current, position } = seasonCalendar(today)
  // Today's place within the current band, 0-1.
  const before = segments.slice(0, segments.findIndex((s) => s.season === current)).reduce((sum, s) => sum + s.share, 0)
  const withinCurrent = (position - before) / (segments.find((s) => s.season === current)?.share ?? 1)

  return (
    <nav aria-label="Crop seasons" className="border-b border-rule">
      <div className="mx-auto max-w-(--container-page) px-4 sm:px-6">
        <ol className="flex">
          {segments.map((segment) => {
            const selected = filters.season === segment.season
            const isCurrent = segment.season === current
            const { season: _season, ...withoutSeason } = filters
            return (
              <li key={segment.season} style={{ flexGrow: segment.share, flexBasis: 0 }} className="min-w-0">
                <Link
                  to={filterPath(selected ? withoutSeason : { ...filters, season: segment.season }, pathname)}
                  aria-current={selected ? 'true' : undefined}
                  className="group flex flex-col gap-1.5 pt-3 pb-3 pr-2"
                >
                  <span className="flex items-baseline gap-2 truncate">
                    <span className={cx('text-sm font-semibold', isCurrent || selected ? 'text-ink' : 'text-ink-muted group-hover:text-ink')}>
                      {t(SEASON_LABELS[segment.season])}
                    </span>
                    {isCurrent && <span className="sr-only text-xs text-paddy sm:not-sr-only">{t('now')}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      'relative h-2 rounded-full transition-colors',
                      selected ? 'bg-ink' : isCurrent ? 'bg-paddy' : 'bg-rule group-hover:bg-ink-muted/40',
                    )}
                  >
                    {isCurrent && (
                      <span
                        data-testid="today-marker"
                        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-mustard"
                        style={{ left: `${Math.min(Math.max(withinCurrent, 0), 1) * 100}%` }}
                      />
                    )}
                  </span>
                  <span className="hidden truncate text-xs text-ink-muted sm:block">{t(segment.months)}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
