import { WarningCircle } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useT } from '../lib/i18n'

type FieldErrors<Field extends string> = Partial<Record<Field, string | undefined>>

function focusAndReveal(element: HTMLElement | null) {
  element?.focus({ preventScroll: true })
  element?.scrollIntoView?.({ block: 'center' })
}

/** Field errors stay with their controls. Failed submissions also focus a linked summary. */
export function useFormValidation<Field extends string>() {
  const t = useT()
  const id = useId()
  const summaryRef = useRef<HTMLDivElement>(null)
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (attempt > 0) focusAndReveal(summaryRef.current)
  }, [attempt])

  function reportErrors(found: FieldErrors<Field>) {
    setErrors(found)
    const invalid = Object.values(found).some(Boolean)
    if (invalid) setAttempt((current) => current + 1)
    return invalid
  }

  const fieldId = (field: Field) => `${id}-${field}`
  const fields = (Object.keys(errors) as Field[]).filter((field) => errors[field])
  const summary = fields.length > 0 && (
    <Alert
      ref={summaryRef}
      tabIndex={-1}
      aria-labelledby={`${id}-error-heading`}
      variant="destructive"
      className="border-destructive/40 bg-background focus:outline-2 focus:outline-offset-2 focus:outline-destructive"
    >
      <WarningCircle aria-hidden="true" />
      <AlertTitle id={`${id}-error-heading`}>{t('There is a problem')}</AlertTitle>
      <AlertDescription>
        <ul className="grid gap-2">
          {fields.map((field) => (
            <li key={field}>
              <a
                href={`#${fieldId(field)}`}
                className="font-medium underline underline-offset-2"
                onClick={(event) => {
                  const target = document.getElementById(fieldId(field))
                  if (!target) return
                  event.preventDefault()
                  focusAndReveal(target)
                }}
              >
                {errors[field]}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )

  return { errors, setErrors, reportErrors, fieldId, summary }
}

/** A server or network error shown beside the action that failed. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive" className="border-destructive/40 bg-background">
      <WarningCircle aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
