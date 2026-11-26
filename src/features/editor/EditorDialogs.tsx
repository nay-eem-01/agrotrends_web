import { useState, type FormEvent } from 'react'
import type { Editor } from '@tiptap/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'

function safeHref(value: string) {
  const text = value.trim()
  if (!text || /\s/.test(text)) return null
  if (text.startsWith('/')) return text.startsWith('//') ? null : text
  const href = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(href)
    if (url.protocol === 'mailto:' && url.pathname.includes('@')) return href
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname ? url.href : null
  } catch {
    return null
  }
}

export function EditorLinkDialog({ editor, close }: { editor: Editor; close: () => void }) {
  const t = useT()
  const original = editor.getAttributes('link').href as string | undefined
  const [value, setValue] = useState(original ?? '')
  const [error, setError] = useState<string>()
  return (
    <EditorFieldDialog
      title={t(original ? 'Edit link' : 'Add link')}
      label={t('Link address')}
      description={t('Enter a web or e-mail address.')}
      value={value}
      onChange={(next) => { setValue(next); setError(undefined) }}
      error={error}
      close={close}
      onRemove={original ? () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        close()
      } : undefined}
      onSave={() => {
        const href = safeHref(value)
        if (!href) return setError(t('Enter a valid web or e-mail address.'))
        const chain = editor.chain().focus().extendMarkRange('link')
        const { empty } = editor.state.selection
        if (empty && !original) {
          chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
        } else {
          chain.setLink({ href }).run()
        }
        close()
      }}
    />
  )
}

export function EditorImageDialog({ editor, close }: { editor: Editor; close: () => void }) {
  const t = useT()
  const [value, setValue] = useState(String(editor.getAttributes('image').alt ?? ''))
  return (
    <EditorFieldDialog
      title={t('Image description')}
      label={t('Alternative text')}
      description={t('Describe what the image shows. Leave it blank if the image is decorative.')}
      value={value}
      maxLength={250}
      onChange={setValue}
      close={close}
      onSave={() => {
        editor.chain().focus().updateAttributes('image', { alt: value.trim() }).run()
        close()
      }}
    />
  )
}

function EditorFieldDialog({ title, label, description, value, onChange, maxLength, error, close, onSave, onRemove }: {
  title: string
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  error?: string
  close: () => void
  onSave: () => void
  onRemove?: () => void
}) {
  const t = useT()
  function submit(event: FormEvent) {
    event.preventDefault()
    onSave()
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <form onSubmit={submit} className="grid gap-4">
          <TextField label={label} value={value} maxLength={maxLength} error={error} onChange={(event) => onChange(event.target.value)} />
          <div className="flex flex-wrap justify-end gap-2">
            {onRemove && <Button variant="quiet" onClick={onRemove}>{t('Remove link')}</Button>}
            <Button variant="quiet" onClick={close}>{t('Cancel')}</Button>
            <Button type="submit">{t('Save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
