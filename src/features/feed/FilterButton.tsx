import { useT } from '../../lib/i18n'
import { Faders } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { filterPath, SEASON_LABELS, SOIL_LABELS, type AgriFilters, type Season, type Soil } from '../../lib/agri'
import { Select } from '../farming/FarmingFields'
import { Button, buttonClass } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { activeKeys } from './AgriFilterBar'

/** "Filter", with the number of active farming filters; opens the crop, region, season and soil form. */
export function FilterButton({ filters, className }: { filters: AgriFilters; className?: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const count = activeKeys(filters).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={t('Filter by crop, season, region or soil')} className={buttonClass('secondary', 'sm', className)}>
        <Faders size={18} aria-hidden="true" />
        {t('Filter')}
        {count > 0 && (
          <span aria-hidden="true" className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(26rem,calc(100vw-2rem))] gap-3 p-5">
        <PopoverTitle className="font-sans text-base font-semibold">{t('Farming details')}</PopoverTitle>
        <FilterForm filters={filters} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

function FilterForm({ filters, onDone }: { filters: AgriFilters; onDone: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const [crop, setCrop] = useState(filters.crop ?? '')
  const [region, setRegion] = useState(filters.region ?? '')
  const [season, setSeason] = useState<Season | ''>(filters.season ?? '')
  const [soil, setSoil] = useState<Soil | ''>(filters.soil ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    navigate(filterPath({ season: season || undefined, crop: crop.trim() || undefined, region: region.trim() || undefined, soil: soil || undefined }, pathname, params))
    onDone()
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <TextField label={t('Crop')} placeholder="boro rice" value={crop} onChange={(e) => setCrop(e.target.value)} />
      <TextField label={t('Region')} placeholder="rangpur" value={region} onChange={(e) => setRegion(e.target.value)} />
      <Select
        label={t('Season')}
        value={season}
        onChange={(value) => setSeason(value as Season | '')}
        options={(Object.keys(SEASON_LABELS) as Season[]).map((value) => ({ value, label: t(SEASON_LABELS[value]) }))}
        placeholder={t('Any season')}
      />
      <Select
        label={t('Soil')}
        value={soil}
        onChange={(value) => setSoil(value as Soil | '')}
        options={(Object.keys(SOIL_LABELS) as Soil[]).map((value) => ({ value, label: t(SOIL_LABELS[value]) }))}
        placeholder={t('Any soil')}
      />
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="quiet" size="sm" onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button type="submit" size="sm">
          {t('Apply filters')}
        </Button>
      </div>
    </form>
  )
}
