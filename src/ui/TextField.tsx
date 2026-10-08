import { useId, type InputHTMLAttributes } from 'react'
import { cx } from './cx'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'h-11 rounded-lg border bg-paper px-3 text-base text-ink placeholder:text-ink-muted/70',
          'focus:border-paddy focus:outline-none focus-visible:outline-none',
          error ? 'border-danger' : 'border-rule',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
