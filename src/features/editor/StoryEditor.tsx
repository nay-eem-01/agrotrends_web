import { ListBullets, ListNumbers, Quotes, TextB, TextHThree, TextHTwo, TextItalic, LinkSimple } from '@phosphor-icons/react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { ReactNode } from 'react'
import { cx } from '../../ui/cx'

interface StoryEditorProps {
  title: string
  html: string
  onTitleChange: (title: string) => void
  onHtmlChange: (html: string) => void
}

/** Title and body, set the way the story will read once published. */
export function StoryEditor({ title, html, onTitleChange, onHtmlChange }: StoryEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
    ],
    content: html,
    editorProps: {
      attributes: { class: 'story-body min-h-[50vh] focus:outline-none', 'aria-label': 'Story', role: 'textbox', 'aria-multiline': 'true' },
    },
    onUpdate: ({ editor }) => onHtmlChange(editor.getHTML()),
    immediatelyRender: true,
  })

  return (
    <div>
      {editor && <Toolbar editor={editor} />}
      <textarea
        aria-label="Title"
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
        className="mt-8 w-full resize-none bg-transparent font-serif text-2xl font-bold tracking-[-0.01em] text-ink [field-sizing:content] placeholder:text-ink-muted/50 focus:outline-none sm:text-3xl"
      />
      <EditorContent editor={editor} className="mt-6" />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
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

  // shortcut: a native prompt for the URL; swap for an inline popover if authors find it clumsy.
  function toggleLink() {
    if (state.link) return void chain().unsetLink().run()
    const url = window.prompt('Link to (https://…)')?.trim()
    if (!url) return
    chain().setLink({ href: /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}` }).run()
  }

  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-16 z-10 -mx-2 flex flex-wrap gap-0.5 border-b border-rule bg-paper/95 px-1 py-1 backdrop-blur">
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
      className={cx('flex size-11 items-center justify-center rounded-lg', pressed ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-field hover:text-ink')}
    >
      {children}
    </button>
  )
}
