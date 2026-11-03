import { LinkSimple, ListBullets, ListNumbers, Quotes, TextB, TextItalic } from '@phosphor-icons/react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useId, type ReactNode } from 'react'
import { cn } from 'cn'
import { useT } from '../../lib/i18n'
import { Message } from '../../ui/TextField'

interface QuestionEditorProps {
  title: string
  html: string
  titleError?: string
  detailsError?: string
  onTitleChange: (title: string) => void
  onHtmlChange: (html: string) => void
}

/**
 * The question as a page, not a box: a one-line title, a soft toolbar that stays in reach while writing, and the
 * details as rich text. Photos are their own labelled field under it (PhotoPicker), so phones don't hide them in an icon.
 */
export function QuestionEditor({ title, html, titleError, detailsError, onTitleChange, onHtmlChange }: QuestionEditorProps) {
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
      class: 'post-body min-h-32 py-4 focus:outline-none',
      'aria-label': t('Details'),
      role: 'textbox',
      'aria-multiline': 'true',
      ...(detailsError ? { 'aria-invalid': 'true', 'aria-describedby': `${detailsId}-error` } : {}),
    }
  }

  return (
    <div>
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
        className="block w-full resize-none bg-transparent pb-3 font-serif text-2xl leading-tight font-semibold tracking-[-0.015em] text-foreground [field-sizing:content] placeholder:text-muted-foreground/55 focus:outline-none sm:text-[1.75rem]"
      />
      {titleError && (
        <div className="pb-3">
          <Message inputId={titleId} error={titleError} />
        </div>
      )}
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      {detailsError && (
        <div className="pb-3">
          <Message inputId={detailsId} error={detailsError} />
        </div>
      )}
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
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
  // shortcut: a native prompt for the URL, as in the story editor; swap for a popover if askers find it clumsy.
  function toggleLink() {
    if (state.link) return void chain().unsetLink().run()
    const url = window.prompt(t('Link to (https://…)'))?.trim()
    if (!url) return
    chain().setLink({ href: /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}` }).run()
  }

  return (
    <div role="toolbar" aria-label={t('Formatting')} className="sticky top-16 z-10 flex items-center gap-0.5 overflow-x-auto rounded-2xl bg-muted/80 p-1 backdrop-blur-sm [scrollbar-width:none]">
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
        'flex size-11 shrink-0 items-center justify-center rounded-xl transition-[color,background-color,transform] duration-150 ease-(--ease-out) active:scale-[0.97]',
        pressed ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:bg-card hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
