import { Sparkle, X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useBlogAssist } from '../../api/ai'
import { useCategories } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { useTags } from '../../api/topics'
import type { Season, Soil } from '../../lib/agri'
import { Button } from '../../ui/Button'
import { FarmingFields, Select } from '../farming/FarmingFields'

/** The backend's limits (AppConstants.MAX_TAGS_PER_BLOG, MAX_TAG_LENGTH). */
export const MAX_TAGS = 5
const MAX_TAG_LENGTH = 40

export interface StoryDetails {
  categoryId?: number
  tags: string[]
  crop: string
  season?: Season
  region: string
  soil?: Soil
}

export type PublishAction = 'publish' | 'save' | 'unpublish'

interface PublishSheetProps {
  open: boolean
  /** new: Publish now / Save as draft; draft: Publish / Save details; published: Save details / Unpublish. */
  mode: 'new' | 'draft' | 'published'
  initial: StoryDetails
  /** The story, for AI suggestions. */
  draft: { title: string; content: string }
  busy: boolean
  error: string | null
  onSubmit: (details: StoryDetails, action: PublishAction) => void
  onClose: () => void
}

export function PublishSheet({ open, mode, initial, draft, busy, error, onSubmit, onClose }: PublishSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-paper p-0 text-ink backdrop:bg-ink/40 sm:m-auto sm:max-w-xl sm:rounded-2xl"
    >
      {open && <DetailsForm titleId={titleId} mode={mode} initial={initial} draft={draft} busy={busy} error={error} onSubmit={onSubmit} onClose={onClose} />}
    </dialog>
  )
}

function DetailsForm({ titleId, mode, initial, draft, busy, error, onSubmit, onClose }: Omit<PublishSheetProps, 'open'> & { titleId: string }) {
  const categories = useCategories()
  const [details, setDetails] = useState(initial)
  const [missingCategory, setMissingCategory] = useState(false)
  const [action, setAction] = useState<PublishAction>('publish')
  const set = (changes: Partial<StoryDetails>) => setDetails((d) => ({ ...d, ...changes }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // The button that submitted, read from the event: state set in the same click isn't applied yet.
    const action = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value as PublishAction
    setAction(action)
    if (details.categoryId == null && action !== 'unpublish') {
      setMissingCategory(true)
      return
    }
    onSubmit({ ...details, crop: details.crop.trim(), region: details.region.trim() }, action)
  }

  const primary = mode === 'published' ? { action: 'save' as const, label: 'Save details' } : { action: 'publish' as const, label: mode === 'new' ? 'Publish now' : 'Publish' }
  const secondary =
    mode === 'published' ? { action: 'unpublish' as const, label: 'Unpublish' } : { action: 'save' as const, label: mode === 'new' ? 'Save as draft' : 'Save details' }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6 p-6 sm:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-xl">
            {mode === 'published' ? 'Story details' : 'Ready to publish?'}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Readers find stories by topic and by the farming they describe.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-field">
          <X size={20} />
        </button>
      </header>

      <Select
        label="Category"
        value={details.categoryId == null ? '' : String(details.categoryId)}
        error={missingCategory && details.categoryId == null ? 'Choose a category.' : undefined}
        onChange={(value) => set({ categoryId: value ? Number(value) : undefined })}
        options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.categoryName ?? '' }))}
        placeholder={categories.isPending ? 'Loading…' : 'Choose a category'}
      />

      <TagInput tags={details.tags} onChange={(tags) => set({ tags })} />
      <AiHelp draft={draft} tags={details.tags} onAddTag={(tag) => details.tags.length < MAX_TAGS && set({ tags: [...details.tags, tag] })} />

      <FarmingFields value={details} onChange={set} />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" value={primary.action} loading={busy && action === primary.action} disabled={busy}>
          {primary.label}
        </Button>
        <Button
          type="submit"
          variant={secondary.action === 'unpublish' ? 'quiet' : 'secondary'}
          value={secondary.action}
          loading={busy && action === secondary.action}
          disabled={busy}
        >
          {secondary.label}
        </Button>
      </div>
    </form>
  )
}

/** Tags as chips: Enter or comma adds one; suggestions come from existing topics. */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState('')
  const q = text.trim().toLowerCase()
  const suggestions = useTags(q).data?.filter((tag) => !tags.includes(tag)).slice(0, 6) ?? []
  const full = tags.length >= MAX_TAGS
  const hintId = useId()
  const inputId = useId()

  function add(raw: string) {
    const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH)
    if (tag && !tags.includes(tag) && !full) onChange([...tags, tag])
    setText('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(text)
    } else if (event.key === 'Backspace' && !text && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        Topics
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rule px-2 py-1.5 focus-within:border-paddy">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex h-8 items-center gap-1 rounded-full bg-field pr-1 pl-3 text-sm">
            {tag}
            <button type="button" aria-label={`Remove topic ${tag}`} onClick={() => onChange(tags.filter((t) => t !== tag))} className="flex size-7 items-center justify-center rounded-full hover:bg-rule">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={text}
          disabled={full}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(text)}
          aria-describedby={hintId}
          placeholder={full ? '' : tags.length ? 'Add another' : 'rice, pest control…'}
          className="h-8 min-w-32 flex-1 bg-transparent px-1 text-base focus:outline-none"
        />
      </div>
      <p id={hintId} className="text-xs text-ink-muted">
        {full ? `That's the most a story can have (${MAX_TAGS}).` : `Up to ${MAX_TAGS}. Press Enter after each.`}
      </p>
      {q && !full && suggestions.length > 0 && (
        <ul aria-label="Suggested topics" className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <li key={tag}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(tag)} className="h-8 rounded-full border border-rule px-3 text-sm hover:bg-field">
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Gemini's summary and topic ideas for the draft, clearly marked as suggestions. */
function AiHelp({ draft, tags, onAddTag }: { draft: { title: string; content: string }; tags: string[]; onAddTag: (tag: string) => void }) {
  const assist = useBlogAssist()
  const [copied, setCopied] = useState(false)
  const ideas = assist.data?.suggestedTags?.filter((tag) => !tags.includes(tag)) ?? []

  return (
    <section aria-label="AI suggestions" className="rounded-lg border border-dashed border-rule p-4">
      {!assist.data ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" loading={assist.isPending} onClick={() => assist.mutate(draft)}>
            <Sparkle size={16} aria-hidden="true" />
            Suggest topics and a summary
          </Button>
          {assist.isError ? (
            <span role="alert" className="text-sm text-ink-muted">
              {errorMessage(assist.error)}
            </span>
          ) : (
            <span className="text-xs text-ink-muted">AI reads your draft; nothing is changed until you choose.</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Sparkle size={14} aria-hidden="true" />
            Suggested by AI. Check before you use it.
          </p>
          {assist.data.summary && (
            <div>
              <p className="font-serif text-base">{assist.data.summary}</p>
              <Button
                variant="quiet"
                size="sm"
                className="-ml-4"
                onClick={() => navigator.clipboard?.writeText(assist.data.summary ?? '').then(() => setCopied(true))}
              >
                {copied ? 'Summary copied' : 'Copy summary'}
              </Button>
            </div>
          )}
          {ideas.length > 0 && (
            <ul aria-label="Suggested by AI" className="flex flex-wrap gap-2">
              {ideas.map((tag) => (
                <li key={tag}>
                  <button type="button" disabled={tags.length >= MAX_TAGS} onClick={() => onAddTag(tag)} className="h-8 rounded-full border border-paddy/40 px-3 text-sm text-paddy hover:bg-field disabled:opacity-50">
                    + {tag}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
