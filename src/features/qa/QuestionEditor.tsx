import { ImageSquare, LinkSimple, ListBullets, ListNumbers, Quotes, TextB, TextItalic, X } from '@phosphor-icons/react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { cn } from 'cn'
import { errorMessage } from '../../api/errors'
import { useUploadImage } from '../../api/images'
import { useT } from '../../lib/i18n'
import { IMAGE_TYPES, imageProblem } from '../../lib/images'
import { Message } from '../../ui/TextField'
import { Spinner } from '../../ui/Spinner'
import { MAX_PHOTOS } from './PhotoPicker'

interface QuestionEditorProps {
  title: string
  html: string
  photos: string[]
  titleError?: string
  detailsError?: string
  onTitleChange: (title: string) => void
  onHtmlChange: (html: string) => void
  onPhotosChange: (photos: string[]) => void
}

/** The question in one box: a one-line title, then the details as rich text, with photos added from the toolbar. */
export function QuestionEditor({ title, html, photos, titleError, detailsError, onTitleChange, onHtmlChange, onPhotosChange }: QuestionEditorProps) {
  const t = useT()
  const titleId = useId()
  const detailsId = useId()
  const editor = useEditor({
    extensions: [
      // No headings: a question is a few paragraphs, and its title is the only heading.
      StarterKit.configure({ heading: false, codeBlock: false, horizontalRule: false, link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder: t('What have you seen, since when, and what have you tried?') }),
    ],
    content: html,
    editorProps: { attributes: attributes() },
    onUpdate: ({ editor }) => onHtmlChange(editor.getHTML()),
    immediatelyRender: true,
  })
  // The error is announced with the details; updated in place so the text, cursor and undo history stay.
  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: attributes() } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, detailsError])

  function attributes(): Record<string, string> {
    return {
      id: detailsId,
      class: 'post-body min-h-40 px-4 py-3 focus:outline-none sm:px-5',
      'aria-label': t('Details'),
      role: 'textbox',
      'aria-multiline': 'true',
      ...(detailsError ? { 'aria-invalid': 'true', 'aria-describedby': `${detailsId}-error` } : {}),
    }
  }

  return (
    <div className="rounded-2xl border border-input bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/60">
      <textarea
        id={titleId}
        aria-label={t('Your question')}
        aria-invalid={titleError ? true : undefined}
        aria-describedby={titleError ? `${titleId}-error` : undefined}
        placeholder={t('Why are my boro seedlings turning yellow?')}
        rows={1}
        maxLength={200}
        value={title}
        onChange={(event) => onTitleChange(event.target.value.replace(/\n/g, ' '))}
        onKeyDown={(event) => {
          // Enter moves on to the details instead of breaking the title.
          if (event.key === 'Enter') {
            event.preventDefault()
            editor?.commands.focus('start')
          }
        }}
        className="block w-full resize-none bg-transparent px-4 pt-4 pb-2 text-xl leading-snug font-semibold text-foreground [field-sizing:content] placeholder:font-normal placeholder:text-muted-foreground/70 focus:outline-none sm:px-5 sm:text-2xl"
      />
      {titleError && (
        <div className="px-4 pb-2 sm:px-5">
          <Message inputId={titleId} error={titleError} />
        </div>
      )}
      {editor && <Toolbar editor={editor} photos={photos} onPhotosChange={onPhotosChange} />}
      <EditorContent editor={editor} />
      {detailsError && (
        <div className="px-4 pb-3 sm:px-5">
          <Message inputId={detailsId} error={detailsError} />
        </div>
      )}
      {photos.length > 0 && (
        <ul aria-label={t('Photos')} className="flex flex-wrap gap-2.5 border-t border-border px-4 py-3 sm:px-5">
          {photos.map((url, index) => (
            <li key={url} className="relative">
              <img src={url} alt={t('Photo {n}', { n: index + 1 })} className="size-20 rounded-xl bg-muted object-cover ring-1 ring-border" />
              <button
                type="button"
                aria-label={t('Remove photo {n}', { n: index + 1 })}
                onClick={() => onPhotosChange(photos.filter((u) => u !== url))}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border transition-[background-color,transform] duration-150 ease-(--ease-out) after:absolute after:-inset-2 hover:bg-background active:scale-[0.94]"
              >
                <X size={12} weight="bold" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Toolbar({ editor, photos, onPhotosChange }: { editor: Editor; photos: string[]; onPhotosChange: (photos: string[]) => void }) {
  const t = useT()
  // Re-render on selection changes so the pressed states follow the cursor.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      link: e.isActive('link'),
      quote: e.isActive('blockquote'),
      bullets: e.isActive('bulletList'),
      numbers: e.isActive('orderedList'),
    }),
  })
  const chain = () => editor.chain().focus()
  const upload = useUploadImage()
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const full = photos.length >= MAX_PHOTOS
  const error = problem ?? (upload.isError ? errorMessage(upload.error) : null)

  // shortcut: a native prompt for the URL, as in the story editor; swap for a popover if askers find it clumsy.
  function toggleLink() {
    if (state.link) return void chain().unsetLink().run()
    const url = window.prompt(t('Link to (https://…)'))?.trim()
    if (!url) return
    chain().setLink({ href: /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}` }).run()
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const found = imageProblem(file)
    setProblem(found)
    if (!found) upload.mutate(file, { onSuccess: (url) => onPhotosChange([...photos, url]) })
  }

  return (
    <div role="toolbar" aria-label={t('Formatting')} className="flex flex-wrap items-center gap-0.5 border-y border-border px-2 py-1 sm:px-3">
      <Tool label={t('Bold')} pressed={state.bold} onClick={() => chain().toggleBold().run()}>
        <TextB size={20} />
      </Tool>
      <Tool label={t('Italic')} pressed={state.italic} onClick={() => chain().toggleItalic().run()}>
        <TextItalic size={20} />
      </Tool>
      <Tool label={t('Bulleted list')} pressed={state.bullets} onClick={() => chain().toggleBulletList().run()}>
        <ListBullets size={20} />
      </Tool>
      <Tool label={t('Numbered list')} pressed={state.numbers} onClick={() => chain().toggleOrderedList().run()}>
        <ListNumbers size={20} />
      </Tool>
      <Tool label={t('Quote')} pressed={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quotes size={20} />
      </Tool>
      <Tool label={t('Link')} pressed={state.link} onClick={toggleLink}>
        <LinkSimple size={20} />
      </Tool>
      <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
      <button
        type="button"
        disabled={full || upload.isPending}
        aria-busy={upload.isPending || undefined}
        title={full ? t("That's the most you can add ({n}).", { n: MAX_PHOTOS }) : undefined}
        onClick={() => input.current?.click()}
        className="flex h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {upload.isPending ? <Spinner size={18} label={t('Uploading image')} /> : <ImageSquare size={20} aria-hidden="true" />}
        {t('Add a photo')}
        <span className="text-xs font-normal">{t('{n} of {max}', { n: photos.length, max: MAX_PHOTOS })}</span>
      </button>
      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} onChange={choose} className="sr-only" tabIndex={-1} aria-label={t('Add a photo')} />
      {error && (
        <p role="alert" className="w-full px-2 pb-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Tool({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex size-11 items-center justify-center rounded-md transition-colors duration-150',
        pressed ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
