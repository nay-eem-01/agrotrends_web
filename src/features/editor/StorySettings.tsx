import { Sparkle } from '@phosphor-icons/react'
import { useId, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useBlogAssist } from '../../api/ai'
import type { useCategories } from '../../api/categories'
import type { StoryDraftSettings } from '../../lib/draft'
import { useT } from '../../lib/i18n'
import { includeSelectedTopic, TopicCatalogStatus } from '../topics/TopicCatalogStatus'
import { errorMessage } from '../../api/errors'
import { Button } from '../../ui/Button'
import { SearchSelect } from '../../ui/SearchSelect'
import { TextField } from '../../ui/TextField'
import { MAX_TAGS, TagInput } from '../topics/TagInput'

const MAX_SUBTITLE = 200

export type StoryDetails = StoryDraftSettings

export function StorySettings({
  details,
  onChange,
  draft,
  topicId,
  topicError,
  categories,
}: {
  details: StoryDetails
  onChange: (changes: Partial<StoryDetails>) => void
  draft: { title: string; content: string }
  topicId: string
  topicError?: string
  categories: ReturnType<typeof useCategories>
}) {
  const t = useT()
  const options = includeSelectedTopic(categories, details.categoryId == null ? undefined : {
    id: details.categoryId, categoryName: details.categoryName || t('Selected topic'),
  })

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-sm font-semibold">{t("Story settings")}</h2>
      <SearchSelect
        id={topicId}
        label={t("Topic")}
        disabled={categories.isPending && options.length === 0}
        value={details.categoryId == null ? '' : String(details.categoryId)}
        error={topicError}
        onChange={(value) => onChange({ categoryId: value ? Number(value) : undefined, categoryName: options.find((option) => String(option.id) === value)?.categoryName })}
        options={options.map((category) => ({ value: String(category.id), label: category.categoryName ?? '' }))}
        placeholder={t(categories.isPending ? 'Loading…' : 'Choose a topic')}
      />
      <TopicCatalogStatus catalog={categories} />
      <TagInput tags={details.tags} onChange={(tags) => onChange({ tags })} />
      <SubtitleField value={details.subtitle} onChange={(subtitle) => onChange({ subtitle })} />
      <AiCitableField checked={details.aiCitable} onChange={(aiCitable) => onChange({ aiCitable })} />
      <AiHelp
        draft={draft}
        tags={details.tags}
        onAddTag={(tag) => details.tags.length < MAX_TAGS && onChange({ tags: [...details.tags, tag] })}
        onUseSubtitle={(subtitle) => onChange({ subtitle: subtitle.slice(0, MAX_SUBTITLE) })}
      />
    </div>
  )
}

/** The subtitle: one line under the title, in the story's lists and its page. */
function SubtitleField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT()
  return (
    <TextField
      label={t("Subtitle (optional)")}
      hint={t("One line under the title. Readers see it in lists.")}
      value={value}
      maxLength={MAX_SUBTITLE}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

/** Whether the AI advisor may cite the story; on by default. */
function AiCitableField({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const t = useT()
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-hint`} className="mt-0.5" checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium">
          {t("Let the AI advisor cite this story")}
        </label>
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {t("Its answers link to the stories they use. Off keeps this one out of answers and related stories.")}
        </p>
      </div>
    </div>
  )
}

/** Gemini's summary and topic ideas for the draft, clearly marked as suggestions. */
function AiHelp({ draft, tags, onAddTag, onUseSubtitle }: { draft: { title: string; content: string }; tags: string[]; onAddTag: (tag: string) => void; onUseSubtitle: (subtitle: string) => void }) {
  const t = useT()
  const assist = useBlogAssist()
  const [copied, setCopied] = useState(false)
  const ideas = assist.data?.suggestedTags?.filter((tag) => !tags.includes(tag)) ?? []

  return (
    <section aria-label={t("AI suggestions")} className="rounded-lg border border-dashed border-border-strong p-4">
      {!assist.data ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" loading={assist.isPending} pendingLabel={t("Generating suggestions…")} onClick={() => assist.mutate(draft)}>
            <Sparkle size={16} aria-hidden="true" />
            {t("Suggest topics and a summary")}
          </Button>
          {assist.isError ? (
            <span role="alert" className="text-sm text-muted-foreground">
              {errorMessage(assist.error)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("AI reads your draft; nothing is changed until you choose.")}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkle size={14} aria-hidden="true" />
            {t("Suggested by AI. Check before you use it.")}
          </p>
          {assist.data.summary && (
            <div>
              <p className="font-serif text-base">{assist.data.summary}</p>
              <div className="-ml-4 flex flex-wrap">
                <Button variant="quiet" size="sm" onClick={() => onUseSubtitle(assist.data.summary ?? '')}>
                  {t("Use as subtitle")}
                </Button>
                <Button variant="quiet" size="sm" onClick={() => navigator.clipboard?.writeText(assist.data.summary ?? '').then(() => setCopied(true))}>
                  {t(copied ? 'Summary copied' : 'Copy summary')}
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
