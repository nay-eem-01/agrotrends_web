import { useId, type InputHTMLAttributes } from 'react'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

/** A labelled input with a hint or an error under it (shadcn Field + Input). */
export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      <Message inputId={inputId} hint={hint} error={error} />
    </Field>
  )
}

/** The hint, or the error in its place; the input's aria-describedby points at whichever is shown. */
export function Message({ inputId, hint, error }: { inputId: string; hint?: string; error?: string }) {
  if (error)
    return (
      <FieldDescription id={`${inputId}-error`} className="text-destructive">
        {error}
      </FieldDescription>
    )
  return hint ? <FieldDescription id={`${inputId}-hint`}>{hint}</FieldDescription> : null
}
