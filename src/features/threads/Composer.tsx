import { useEffect, useId, useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/errors'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { FormError } from '../../ui/FormValidation'
import { TextArea } from '../../ui/TextArea'

export interface ComposerProps {
  label: string
  submitLabel: string
  pendingLabel: string
  doneLabel: string
  placeholder?: string
  initial?: string
  rows?: number
  /** Move focus into the field when it appears (it was opened by Reply or Edit). */
  focusOnOpen?: boolean
  pending: boolean
  error: unknown
  /** Send `content`; call `done` once it is saved. */
  onSubmit: (content: string, done: () => void) => void
  onCancel?: () => void
  onDone?: () => void
}

/** A text box and its submit button, shared by story responses and question answers (posting, replying, editing). */
export function Composer({ label, submitLabel, pendingLabel, doneLabel, placeholder, initial = '', rows = 3, focusOnOpen, pending, error, onSubmit, onCancel, onDone }: ComposerProps) {
  const t = useT()
  const fieldId = useId()
  const [text, setText] = useState(initial)
  const [problem, setProblem] = useState<string>()
  const [done, setDone] = useState(false)
  const [invalidAttempt, setInvalidAttempt] = useState(0)

  useEffect(() => {
    if (invalidAttempt > 0) document.getElementById(fieldId)?.focus()
  }, [invalidAttempt, fieldId])

  useEffect(() => {
    if (!focusOnOpen) return
    const field = document.getElementById(fieldId)
    field?.focus()
    // After any prefilled text (a reply's "@name "), so typing carries on from it.
    if (field instanceof HTMLTextAreaElement) field.setSelectionRange(field.value.length, field.value.length)
  }, [focusOnOpen, fieldId])

  function submit(event: FormEvent) {
    event.preventDefault()
    // A second Ctrl+Enter while the first is still sending would post twice.
    if (pending) return
    const content = text.trim()
    if (!content) {
      setProblem(t('Write something first.'))
      setInvalidAttempt((current) => current + 1)
      return
    }
    setProblem(undefined)
    onSubmit(content, () => {
      setText('')
      setDone(true)
      onDone?.()
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextArea
        id={fieldId}
        label={label}
        rows={rows}
        placeholder={placeholder}
        value={text}
        readOnly={pending}
        onChange={(event) => {
          setText(event.target.value)
          if (event.target.value.trim()) setProblem(undefined)
          setDone(false)
        }}
        error={problem}
        onKeyDown={(event) => {
          // Ctrl+Enter (⌘+Enter on a Mac) sends; Enter alone is a new line.
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
      />
      <FormError message={error != null && !problem ? errorMessage(error) : null} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending} pendingLabel={pendingLabel}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="quiet" size="sm" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        )}
        {done && !onDone && <output className="text-sm text-primary">{doneLabel}</output>}
      </div>
    </form>
  )
}
