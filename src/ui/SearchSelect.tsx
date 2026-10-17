import { useId, type RefObject } from 'react'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Field, FieldLabel } from '@/components/ui/field'
import { useT } from '../lib/i18n'
import { Message } from './TextField'

export interface Option {
  value: string
  label: string
}

interface SearchSelectProps {
  label: string
  /** The chosen option's value, or '' for none. */
  value: string
  options: Option[]
  placeholder: string
  hint?: string
  error?: string
  disabled?: boolean
  /** Hide the label visually (it stays the field's accessible name), for compact toolbars. */
  hideLabel?: boolean
  className?: string
  /** Inside a native modal <dialog>, the list must open in the dialog (the rest of the page is inert). */
  container?: RefObject<HTMLElement | null>
  onChange: (value: string) => void
}

/**
 * A labelled select you can type into to filter, for lists too long to scan (topics). Short fixed lists keep the
 * native select. Clearing the field chooses nothing ('').
 */
export function SearchSelect({ label, value, options, placeholder, hint, error, disabled, hideLabel, className, container, onChange }: SearchSelectProps) {
  const t = useT()
  const id = useId()
  const selected = options.find((option) => option.value === value) ?? null
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <Field data-invalid={error ? true : undefined} data-disabled={disabled || undefined} className={className}>
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>
      <Combobox
        items={options}
        value={selected}
        onValueChange={(option: Option | null) => onChange(option?.value ?? '')}
        itemToStringLabel={(option: Option) => option.label}
        isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          showClear={selected != null}
          triggerLabel={t('Show options')}
          clearLabel={t('Clear {label}', { label })}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="w-full"
        />
        {/* Fixed positioning escapes the dialog's scroll clipping. */}
        <ComboboxContent container={container} positionMethod={container ? 'fixed' : undefined}>
          <ComboboxEmpty>{t('Nothing matches')}</ComboboxEmpty>
          <ComboboxList>
            {(option: Option) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Message inputId={id} hint={hint} error={error} />
    </Field>
  )
}
