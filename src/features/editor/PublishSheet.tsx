import { Sparkle, X } from '@phosphor-icons/react'
import { useId, useState, type FormEvent } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useBlogAssist } from '../../api/ai'
import { useCategories } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import type { Season, Soil } from '../../lib/agri'
import { Button } from '../../ui/Button'
import { SearchSelect } from '../../ui/SearchSelect'
import { TextField } from '../../ui/TextField'
import { FarmingFields } from '../farming/FarmingFields'
import { MAX_TAGS, TagInput } from '../topics/TagInput'


/** The backend's limit on a subtitle. */
export const MAX_SUBTITLE = 200

export interface StoryDetails {
  /** One line under the title, shown in lists; blank for none. */
  subtitle: string
  /** Whether the AI advisor may cite the story (and show it as related); on unless the author turns it off. */
  aiCitable: boolean
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
  // A shadcn Dialog (Base UI), so the topic and season menus inside it open above it and stay usable.
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="block max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {open && <DetailsForm mode={mode} initial={initial} draft={draft} busy={busy} error={error} onSubmit={onSubmit} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function DetailsForm({ mode, initial, draft, busy, error, onSubmit, onClose }: Omit<PublishSheetProps, 'open'>) {
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
          <DialogTitle className="font-serif text-2xl leading-tight font-medium">
            {mode === 'published' ? 'Story details' : 'Ready to publish?'}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">Readers find stories by topic and by the farming they describe.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
          <X size={20} />
        </button>
      </header>

      <SubtitleField value={details.subtitle} onChange={(subtitle) => set({ subtitle })} />

      <SearchSelect
        label="Topic"
        disabled={categories.isPending}
        value={details.categoryId == null ? '' : String(details.categoryId)}
        error={missingCategory && details.categoryId == null ? 'Choose a topic.' : undefined}
        onChange={(value) => set({ categoryId: value ? Number(value) : undefined })}
        options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.categoryName ?? '' }))}
        placeholder={categories.isPending ? 'Loading…' : 'Choose a topic'}
      />

      <TagInput tags={details.tags} onChange={(tags) => set({ tags })} />
      <AiHelp
        draft={draft}
        tags={details.tags}
        onAddTag={(tag) => details.tags.length < MAX_TAGS && set({ tags: [...details.tags, tag] })}
        onUseSubtitle={(subtitle) => set({ subtitle: subtitle.slice(0, MAX_SUBTITLE) })}
      />

      <FarmingFields value={details} onChange={set} />

      <AiCitableField checked={details.aiCitable} onChange={(aiCitable) => set({ aiCitable })} />

      {error && (
        <p role="alert" className="text-sm text-destructive">
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

/** The subtitle: one line under the title, in the story's lists and its page. */
export function SubtitleField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label="Subtitle (optional)"
      hint="One line under the title. Readers see it in lists."
      value={value}
      maxLength={MAX_SUBTITLE}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

/** Whether the AI advisor may cite the story; on by default. */
export function AiCitableField({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-hint`} className="mt-0.5" checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium">
          Let the AI advisor cite this story
        </label>
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          Its answers link to the stories they use. Off keeps this one out of answers and related stories.
        </p>
      </div>
    </div>
  )
}

/** Gemini's summary and topic ideas for the draft, clearly marked as suggestions. */
function AiHelp({ draft, tags, onAddTag, onUseSubtitle }: { draft: { title: string; content: string }; tags: string[]; onAddTag: (tag: string) => void; onUseSubtitle: (subtitle: string) => void }) {
  const assist = useBlogAssist()
  const [copied, setCopied] = useState(false)
  const ideas = assist.data?.suggestedTags?.filter((tag) => !tags.includes(tag)) ?? []

  return (
    <section aria-label="AI suggestions" className="rounded-lg border border-dashed border-border-strong p-4">
      {!assist.data ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" loading={assist.isPending} onClick={() => assist.mutate(draft)}>
            <Sparkle size={16} aria-hidden="true" />
            Suggest topics and a summary
          </Button>
          {assist.isError ? (
            <span role="alert" className="text-sm text-muted-foreground">
              {errorMessage(assist.error)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">AI reads your draft; nothing is changed until you choose.</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkle size={14} aria-hidden="true" />
            Suggested by AI. Check before you use it.
          </p>
          {assist.data.summary && (
            <div>
              <p className="font-serif text-base">{assist.data.summary}</p>
              <div className="-ml-4 flex flex-wrap">
                <Button variant="quiet" size="sm" onClick={() => onUseSubtitle(assist.data.summary ?? '')}>
                  Use as subtitle
                </Button>
                <Button variant="quiet" size="sm" onClick={() => navigator.clipboard?.writeText(assist.data.summary ?? '').then(() => setCopied(true))}>
                  {copied ? 'Summary copied' : 'Copy summary'}
                </Button>
              </div>
            </div>
          )}
          {ideas.length > 0 && (
            <ul aria-label="Suggested by AI" className="flex flex-wrap gap-2">
              {ideas.map((tag) => (
                <li key={tag}>
                  <button type="button" disabled={tags.length >= MAX_TAGS} onClick={() => onAddTag(tag)} className="h-8 rounded-full border border-primary/40 px-3 text-sm text-primary transition-colors duration-150 hover:bg-secondary disabled:opacity-50">
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
