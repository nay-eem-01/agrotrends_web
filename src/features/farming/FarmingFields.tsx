import { useId, useState } from 'react'
import { SEASON_LABELS, SOIL_LABELS, seasonCalendar, type Season, type Soil } from '../../lib/agri'
import { cx } from '../../ui/cx'
import { TextField } from '../../ui/TextField'

export interface Farming {
  crop: string
  season?: Season
  region: string
  soil?: Soil
}

/** Season (drawn as the season strip), crop, region and soil: the farming a story or question is about. */
export function FarmingFields({ value, onChange }: { value: Farming; onChange: (changes: Partial<Farming>) => void }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 font-sans text-base font-semibold">Farming details</legend>
      <SeasonPicker value={value.season} onChange={(season) => onChange({ season })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Crop"
          placeholder="boro rice"
          value={value.crop}
          onChange={(e) => onChange({ crop: e.target.value })}
        />
        <TextField
          label="Region"
          placeholder="rangpur"
          value={value.region}
          onChange={(e) => onChange({ region: e.target.value })}
        />
      </div>
      <Select
        label="Soil"
        value={value.soil ?? ''}
        onChange={(soil) => onChange({ soil: (soil || undefined) as Soil | undefined })}
        options={(Object.keys(SOIL_LABELS) as Soil[]).map((soil) => ({ value: soil, label: SOIL_LABELS[soil] }))}
        placeholder="Any soil"
      />
    </fieldset>
  )
}

/** The request form of farming details: blank fields are left out. */
export function toAgri(value: Farming) {
  return {
    crop: value.crop.trim() || undefined,
    season: value.season,
    region: value.region.trim() || undefined,
    soil: value.soil,
  }
}

export function Select({
  label,
  value,
  options,
  placeholder,
  error,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  placeholder: string
  error?: string
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-11 rounded-lg border bg-paper px-3 text-base focus:border-paddy focus:outline-none',
          error ? 'border-danger' : 'border-rule',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** The season strip again, as a choice: the three seasons sized by length, plus Year-round. */
function SeasonPicker({ value, onChange }: { value?: Season; onChange: (season?: Season) => void }) {
  const [today] = useState(() => new Date())
  const { segments, current } = seasonCalendar(today)
  const options: { season: Season; share: number }[] = [
    ...segments.map((s) => ({ season: s.season as Season, share: s.share })),
    { season: 'YEAR_ROUND', share: 0.22 },
  ]

  return (
    <div role="radiogroup" aria-label="Season" className="flex gap-2">
      {options.map(({ season, share }) => {
        const selected = value === season
        return (
          <label
            key={season}
            style={{ flexGrow: share, flexBasis: 0 }}
            className="group flex min-w-0 cursor-pointer flex-col gap-1.5 pt-1"
          >
            <input
              type="radio"
              name="season"
              value={season}
              checked={selected}
              // Choosing the selected season again clears it (a story needn't have one).
              onClick={() => selected && onChange(undefined)}
              onChange={() => onChange(season)}
              className="peer sr-only"
            />
            <span
              className={cx(
                'truncate text-sm',
                selected ? 'font-semibold text-ink' : 'text-ink-muted group-hover:text-ink',
              )}
            >
              {SEASON_LABELS[season]}
              {season === current && <span className="sr-only"> (now)</span>}
            </span>
            <span
              aria-hidden="true"
              className={cx(
                'h-2 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-paddy',
                selected
                  ? 'bg-paddy'
                  : season === 'YEAR_ROUND'
                    ? 'bg-[repeating-linear-gradient(90deg,var(--color-rule)_0_6px,transparent_6px_10px)]'
                    : 'bg-rule group-hover:bg-ink-muted/40',
              )}
            />
          </label>
        )
      })}
    </div>
  )
}
