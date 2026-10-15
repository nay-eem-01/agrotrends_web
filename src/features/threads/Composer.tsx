import { useEffect, useId, useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/errors'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { TextArea } from '../../ui/TextArea'

export interface ComposerProps {
  label: string
  submitLabel: string
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
export function Composer({ label, submitLabel, doneLabel, placeholder, initial = '', rows = 3, focusOnOpen, pending, error, onSubmit, onCancel, onDone }: ComposerProps) {
  const t = useT()
  const fieldId = useId()
  const [text, setText] = useState(initial)
  const [problem, setProblem] = useState<string>()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (focusOnOpen) document.getElementById(fieldId)?.focus()
  }, [focusOnOpen, fieldId])

  function submit(event: FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content) {
      setProblem(t('Write something first.'))
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
        onChange={(event) => {
          setText(event.target.value)
          setDone(false)
        }}
        error={problem}
      />
      {error != null && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
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
