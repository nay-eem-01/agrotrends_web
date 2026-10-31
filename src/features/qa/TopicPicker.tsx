import { Check } from '@phosphor-icons/react'
import { useId } from 'react'
import { cn } from 'cn'
import type { Category } from '../../api/categories'
import { useT } from '../../lib/i18n'
import { SearchSelect } from '../../ui/SearchSelect'
import { Message } from '../../ui/TextField'

/** Topics shown as chips; past this many the rest are a search. */
const SHOWN = 8

interface TopicPickerProps {
  categories: Category[]
  loading: boolean
  value?: number
  error?: string
  onChange: (categoryId: number) => void
}

/**
 * The topic as one tap: native radios dressed as chips, so arrow keys move between them and a screen reader hears a
 * group of choices. A long list keeps its first few as chips and the rest behind a search.
 */
export function TopicPicker({ categories, loading, value, error, onChange }: TopicPickerProps) {
  const t = useT()
  const id = useId()
  const shown = categories.slice(0, SHOWN)
  const rest = categories.slice(SHOWN)
  // A topic chosen from the search still shows as a chip, so the choice is visible.
  const chosenFromRest = rest.find((c) => c.id === value)
  const chips = chosenFromRest ? [...shown, chosenFromRest] : shown

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error ? true : undefined} className="min-w-0">
      <legend className="text-sm font-medium">{t('Topic')}</legend>
      <p className="mt-1 text-sm text-muted-foreground">{t('Pick the one closest to your question.')}</p>
      {loading ? (
        <div className="mt-3 flex gap-2" aria-hidden="true">
          {[72, 96, 84, 64].map((w) => (
            <span key={w} style={{ width: w }} className="h-10 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((category) => {
            const checked = category.id === value
            return (
              <label
                key={category.id}
                className={cn(
                  'relative inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 ease-(--ease-out) select-none active:scale-[0.97] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
                  checked ? 'border-primary bg-secondary pl-3 text-primary' : 'border-border-strong text-foreground hover:border-primary/50 hover:bg-surface',
                  error && !checked && 'border-destructive/50',
                )}
              >
                <input
                  type="radio"
                  name={id}
                  value={category.id}
                  checked={checked}
                  onChange={() => category.id != null && onChange(category.id)}
                  className="sr-only"
                />
                {/* The tick says "chosen" without relying on colour. */}
                {checked && <Check size={16} weight="bold" aria-hidden="true" />}
                {category.categoryName}
              </label>
            )
          })}
          {rest.length > 0 && (
            <SearchSelect
              label={t('More topics')}
              hideLabel
              // Shaped like the chips beside it, with the dashed edge the tag suggestions use for "more to pick from".
              className="w-48 [&_[data-slot=input-group]]:h-10 [&_[data-slot=input-group]]:rounded-full [&_[data-slot=input-group]]:border-dashed [&_[data-slot=input-group]]:border-border-strong"
              value={chosenFromRest?.id != null ? String(chosenFromRest.id) : ''}
              onChange={(next) => next && onChange(Number(next))}
              options={rest.map((c) => ({ value: String(c.id), label: c.categoryName ?? '' }))}
              placeholder={t('More topics')}
            />
          )}
        </div>
      )}
      {error && (
        <div className="mt-2">
          <Message inputId={id} error={error} />
        </div>
      )}
    </fieldset>
  )
}
