import { Plus, X } from '@phosphor-icons/react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTags } from '../../api/topics'
import { useT } from '../../lib/i18n'

/** The backend's limits for stories and questions (AppConstants.MAX_TAGS_PER_BLOG, MAX_TAG_LENGTH). */
export const MAX_TAGS = 5
const MAX_TAG_LENGTH = 40

/**
 * Tags as chips: Enter or comma adds one; suggestions come from existing topics. With `popular`, the most used tags
 * are offered before anything is typed, so a tag can be one tap.
 */
export function TagInput({ tags, onChange, popular = false }: { tags: string[]; onChange: (tags: string[]) => void; popular?: boolean }) {
  const t = useT()
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
        {t('Tags')} {popular && <span className="font-normal text-muted-foreground">{t('(optional)')}</span>}
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-input bg-card px-2 py-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/60 hover:border-subtle">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-sm text-secondary-foreground">
            {tag}
            <button type="button" aria-label={t('Remove tag {tag}', { tag })} onClick={() => onChange(tags.filter((t) => t !== tag))} className="flex size-7 items-center justify-center rounded-full hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_10%)]">
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
          placeholder={full ? '' : tags.length ? t('Add another') : popular ? t('tilapia, rice blast, cattle feed…') : t('rice, pest control…')}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-base placeholder:text-muted-foreground/80 focus:outline-none"
        />
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        {full ? t("That's the most you can add ({n}).", { n: MAX_TAGS }) : t('Up to {n}. Press Enter after each.', { n: MAX_TAGS })}
      </p>
      {(q || popular) && !full && suggestions.length > 0 && (
        <ul aria-label={q ? t('Suggested tags') : t('Popular tags')} className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                aria-label={t('Add tag {tag}', { tag })}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(tag)}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-border-strong pr-3 pl-2 text-sm text-muted-foreground transition-[color,background-color,border-color,transform] duration-150 ease-(--ease-out) hover:border-primary/50 hover:bg-surface hover:text-foreground active:scale-[0.97]"
              >
                <Plus size={14} aria-hidden="true" />
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
