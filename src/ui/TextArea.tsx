import { useId, type TextareaHTMLAttributes } from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Message } from './TextField'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

/** The multi-line sibling of TextField: same label, hint and error wiring. */
export function TextArea({ label, hint, error, id, className, rows = 4, ...rest }: TextAreaProps) {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="field-sizing-fixed resize-y"
        {...rest}
      />
      <Message inputId={inputId} hint={hint} error={error} />
    </Field>
  )
}
