import { useT } from '../../lib/i18n'
import { useId } from 'react'
import { Select as SelectRoot, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { SEASON_LABELS, SOIL_LABELS, type Season, type Soil } from '../../lib/agri'
import { Message, TextField } from '../../ui/TextField'

export interface Farming {
  crop: string
  season?: Season
  region: string
  soil?: Soil
}

/** Season, crop, region and soil: the farming a story or question is about. */
export function FarmingFields({ value, onChange, hideLegend = false }: { value: Farming; onChange: (changes: Partial<Farming>) => void; hideLegend?: boolean }) {
  const t = useT()
  return (
    <fieldset className="flex flex-col gap-4">
      {/* Hidden when a visible heading (a <summary>) already says it; it still names the group. */}
      <legend className={hideLegend ? 'sr-only' : 'mb-2 font-sans text-base font-semibold'}>{t('Farming details')}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('Crop')}
          placeholder="boro rice"
          value={value.crop}
          onChange={(e) => onChange({ crop: e.target.value })}
        />
        <TextField
          label={t('Region')}
          placeholder="rangpur"
          value={value.region}
          onChange={(e) => onChange({ region: e.target.value })}
        />
        <Select
          label={t('Season')}
          value={value.season ?? ''}
          onChange={(season) => onChange({ season: (season || undefined) as Season | undefined })}
          options={(Object.keys(SEASON_LABELS) as Season[]).map((season) => ({ value: season, label: t(SEASON_LABELS[season]) }))}
          placeholder={t('Any season')}
        />
        <Select
          label={t('Soil')}
          value={value.soil ?? ''}
          onChange={(soil) => onChange({ soil: (soil || undefined) as Soil | undefined })}
          options={(Object.keys(SOIL_LABELS) as Soil[]).map((soil) => ({ value: soil, label: t(SOIL_LABELS[soil]) }))}
          placeholder={t('Any soil')}
        />
      </div>
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

/**
 * A short, fixed list (season, soil) as the shadcn Select: a labelled button that opens a listbox, keyboard-operable,
 * with the "any" choice first so a value can be cleared. '' means none.
 */
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
  const items = Object.fromEntries(options.map((option) => [option.value, option.label]))
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <SelectRoot value={value || null} items={items} onValueChange={(next: string | null) => onChange(next ?? '')}>
        <SelectTrigger id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectItem value={null}>{placeholder}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectRoot>
      <Message inputId={id} error={error} />
    </Field>
  )
}
