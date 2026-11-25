import { Image as ImageIcon, ListBullets, ListNumbers, Quotes, TextB, TextHThree, TextHTwo, TextItalic, LinkSimple } from '@phosphor-icons/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { errorMessage } from '../../api/errors'
import { useUploadImage } from '../../api/images'
import { IMAGE_TYPES, imageProblem } from '../../lib/images'
import { Button } from '../../ui/Button'
import { Message } from '../../ui/TextField'
import { ImageUploadProgress } from '../../ui/ImageUploadProgress'
import { cx } from '../../ui/cx'
import { useImageDrop } from '../../ui/useImageDrop'

interface StoryEditorProps {
  actions: ReactNode
  settings: ReactNode
  validationSummary: ReactNode
  fields: Record<'title' | 'body', { id: string; error?: string }>
  title: string
  html: string
  cover: string
  onTitleChange: (title: string) => void
  onHtmlChange: (html: string) => void
  onCoverChange: (cover: string) => void
}

/** Title and body, set the way the story will read once published. */
export function StoryEditor({ actions, settings, validationSummary, fields, title, html, cover, onTitleChange, onHtmlChange, onCoverChange }: StoryEditorProps) {
  const { id: bodyId, error: bodyError } = fields.body
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      Image.configure({ HTMLAttributes: { alt: '' } }),
    ],
    content: html,
    editorProps: {
      attributes: bodyAttributes(bodyId, bodyError),
    },
    onUpdate: ({ editor }) => onHtmlChange(editor.getHTML()),
    immediatelyRender: true,
  })

  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: bodyAttributes(bodyId, bodyError) } })
  }, [editor, bodyId, bodyError])

  const picker = useImagePicker((src) => editor?.chain().focus().setImage({ src }).run())
  const storyDrop = useImageDrop((file, event) => {
    const position = editor?.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
    picker.uploadFile(file, (src) => {
      if (!editor || editor.isDestroyed) return
      if (position === undefined) {
        editor.chain().focus().setImage({ src }).run()
      } else {
        editor.commands.insertContentAt(Math.min(position, editor.state.doc.content.size), { type: 'image', attrs: { src } })
      }
    })
  }, picker.setProblem, picker.uploading || !editor)

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:grid-rows-[auto_1fr] lg:gap-x-10">
      <div className="sticky top-[calc(4rem+1px)] z-10 flex min-w-0 flex-col gap-3 self-start border-b border-border bg-background py-3">
        {actions}
        {editor && <Toolbar editor={editor} picker={picker} />}
      </div>
      <div className="min-w-0">
        {validationSummary && <div className="pt-4">{validationSummary}</div>}
        <Cover cover={cover} onChange={onCoverChange} />
        <textarea
          id={fields.title.id}
          aria-label="Title"
          aria-invalid={Boolean(fields.title.error) || undefined}
          aria-describedby={fields.title.error ? `${fields.title.id}-error` : undefined}
          placeholder="Title"
          rows={1}
          value={title}
          maxLength={200}
          onChange={(event) => onTitleChange(event.target.value.replace(/\n/g, ' '))}
          onKeyDown={(event) => {
            // Enter moves on to the story instead of breaking the title.
            if (event.key === 'Enter') {
              event.preventDefault()
              editor?.commands.focus('start')
            }
          }}
          className="mt-8 w-full resize-none bg-transparent font-serif text-[2rem] leading-[1.15] font-semibold tracking-[-0.015em] text-foreground [field-sizing:content] placeholder:text-muted-foreground/60 focus:outline-none sm:text-3xl"
        />
        <Message inputId={fields.title.id} error={fields.title.error} />
        <EditorContent {...storyDrop.handlers} editor={editor} className={cx('mt-6 rounded-xl', storyDrop.active && 'outline-2 outline-primary')} />
        <Message inputId={bodyId} error={bodyError} />
      </div>
      <aside aria-label="Story settings" className="mt-8 min-w-0 space-y-6 border-t border-border pt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:border-0">
        {settings}
      </aside>
    </div>
  )
}

function bodyAttributes(id: string, error?: string): Record<string, string> {
  return {
    id,
    class: 'story-body min-h-[50vh] focus:outline-none',
    'aria-label': 'Story',
    role: 'textbox',
    'aria-multiline': 'true',
    ...(error ? { 'aria-invalid': 'true', 'aria-describedby': `${id}-error` } : {}),
  }
}

function Toolbar({ editor, picker }: { editor: Editor; picker: ReturnType<typeof useImagePicker> }) {
  // Re-render on selection changes so the pressed states follow the cursor.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      link: e.isActive('link'),
      quote: e.isActive('blockquote'),
      bullets: e.isActive('bulletList'),
      numbers: e.isActive('orderedList'),
    }),
  })
  const chain = () => editor.chain().focus()
  const drop = useImageDrop((file) => picker.uploadFile(file), picker.setProblem, picker.uploading)

  // shortcut: a native prompt for the URL; swap for an inline popover if authors find it clumsy.
  function toggleLink() {
    if (state.link) return void chain().unsetLink().run()
    const url = window.prompt('Link to (https://…)')?.trim()
    if (!url) return
    chain().setLink({ href: /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}` }).run()
  }

  // One row that scrolls sideways on phones, as the question editor's does; it wraps once there's room.
  return (
    <div className="min-w-0">
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 overflow-x-auto rounded-2xl bg-muted p-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
        <Tool label="Heading" pressed={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <TextHTwo size={20} />
        </Tool>
        <Tool label="Subheading" pressed={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <TextHThree size={20} />
        </Tool>
        <Tool label="Bold" pressed={state.bold} onClick={() => chain().toggleBold().run()}>
          <TextB size={20} />
        </Tool>
        <Tool label="Italic" pressed={state.italic} onClick={() => chain().toggleItalic().run()}>
          <TextItalic size={20} />
        </Tool>
        <Tool label="Link" pressed={state.link} onClick={toggleLink}>
          <LinkSimple size={20} />
        </Tool>
        <div {...drop.handlers} className={cx('shrink-0 rounded-xl', drop.active && 'outline-2 outline-primary')}>
          <Tool label="Image" pressed={false} disabled={picker.uploading} onClick={picker.open}>
            <ImageIcon size={20} />
          </Tool>
        </div>
        {picker.input}
        <Tool label="Quote" pressed={state.quote} onClick={() => chain().toggleBlockquote().run()}>
          <Quotes size={20} />
        </Tool>
        <Tool label="Bulleted list" pressed={state.bullets} onClick={() => chain().toggleBulletList().run()}>
          <ListBullets size={20} />
        </Tool>
        <Tool label="Numbered list" pressed={state.numbers} onClick={() => chain().toggleOrderedList().run()}>
          <ListNumbers size={20} />
        </Tool>
      </div>
      {picker.uploading && <ImageUploadProgress progress={picker.progress} className="mt-2 max-w-56" />}
      {picker.error && (
        <p role="alert" className="mt-1 rounded-xl bg-background px-2 py-1 text-sm text-destructive">
          {picker.error}
        </p>
      )}
    </div>
  )
}

function Tool({ label, pressed, disabled, onClick, children }: { label: string; pressed: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cx(
        'flex size-11 shrink-0 items-center justify-center rounded-xl transition-[color,background-color] duration-150',
        pressed ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:bg-card hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** A hidden file input that checks the image, uploads it and hands back its URL. */
function useImagePicker(onUploaded: (url: string) => void) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadImage()
  const [problem, setProblem] = useState<string | null>(null)

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) uploadFile(file)
  }

  function uploadFile(file: File, onSuccess = onUploaded) {
    if (upload.isPending) return
    const found = imageProblem(file)
    setProblem(found)
    if (!found) upload.mutate(file, { onSuccess })
  }

  return {
    open: () => { if (!upload.isPending) input.current?.click() },
    uploadFile,
    setProblem,
    uploading: upload.isPending,
    progress: upload.progress,
    error: problem ?? (upload.isError ? errorMessage(upload.error) : null),
    input: <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={choose} />,
  }
}

/** The cover: a wide dashed tile until there is one, then shown as it will be on the story page, to change or remove. */
function Cover({ cover, onChange }: { cover: string; onChange: (cover: string) => void }) {
  const picker = useImagePicker(onChange)
  const drop = useImageDrop((file) => picker.uploadFile(file), picker.setProblem, picker.uploading)
  return (
    <div {...drop.handlers} className={cx('mt-6 rounded-xl', drop.active && 'outline-2 outline-primary')}>
      {cover ? (
        <>
          <img src={cover} alt="" className="mb-3 aspect-[21/9] max-h-80 w-full rounded-xl bg-muted object-cover" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" disabled={picker.uploading} onClick={picker.open}>
              Change cover
            </Button>
            <Button variant="quiet" size="sm" disabled={picker.uploading} onClick={() => onChange('')}>
              Remove cover
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={picker.open}
          disabled={picker.uploading}
          aria-busy={picker.uploading || undefined}
          aria-describedby="cover-hint"
          className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-surface text-sm font-medium text-muted-foreground transition-[color,border-color] duration-150 hover:border-primary hover:text-foreground disabled:opacity-60"
        >
          <ImageIcon size={22} aria-hidden="true" />
          Add a cover image
        </button>
      )}
      {picker.input}
      {picker.uploading && <ImageUploadProgress progress={picker.progress} className="mt-2 max-w-56" />}
      {picker.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {picker.error}
        </p>
      ) : (
        !cover && (
          <p id="cover-hint" className="mt-2 text-xs text-muted-foreground">
            Optional. Drop an image here or choose a file. JPEG, PNG or WebP, up to 5 MB.
          </p>
        )
      )}
    </div>
  )
}
