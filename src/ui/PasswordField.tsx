import { WarningCircle } from '@phosphor-icons/react'
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'
import { useT } from '../lib/i18n'
import { passwordStrength } from '../lib/password'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
  error?: string
  /** Something beside the label, such as "Forgot your password?". */
  aside?: ReactNode
  /** Show a four-step strength bar under the field (sign-up). */
  meter?: boolean
}

const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const

/** A password field with Show / Hide inside it, an optional link beside the label and an optional strength bar. */
export function PasswordField({ label, hint, error, aside, meter = false, id, className, value, ...rest }: PasswordFieldProps) {
  const t = useT()
  const generated = useId()
  const inputId = id ?? generated
  const [shown, setShown] = useState(false)
  const strength = meter ? passwordStrength(String(value ?? '')) : 0
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {aside}
      </div>
      <div className="relative">
        <Input id={inputId} type={shown ? 'text' : 'password'} value={value} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="pr-20" {...rest} />
        <button
          type="button"
          aria-pressed={shown}
          aria-controls={inputId}
          aria-label={shown ? t('Hide password') : t('Show password')}
          onClick={() => setShown((current) => !current)}
          className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          {shown ? t('Hide') : t('Show')}
        </button>
      </div>
      {meter && value ? (
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span key={step} className={cn('h-1 rounded-full', step <= strength ? (strength >= 4 ? 'bg-primary' : 'bg-mustard') : 'bg-border')} />
            ))}
          </div>
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {t(STRENGTH[strength])}
          </span>
        </div>
      ) : null}
      {error ? (
        <FieldDescription id={`${inputId}-error`} className="flex items-start gap-1.5 text-destructive">
          <WarningCircle size={16} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </FieldDescription>
      ) : hint ? (
        <FieldDescription id={`${inputId}-hint`}>{hint}</FieldDescription>
      ) : null}
    </Field>
  )
}
