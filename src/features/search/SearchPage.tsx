import { useT } from '../../lib/i18n'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSearch } from '../../api/blogs'
import { useTags } from '../../api/topics'
import { ButtonLink } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { StoryList } from '../feed/Feed'

/** `/search?q=`: matching topics, then matching stories. The field is here too, since phones hide the top bar's. */
export function SearchPage() {
  const t = useT()
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{q ? `${q} – Search – AgroTrends` : t('Search – AgroTrends')}</title>
      {/* Keyed by q so the field follows searches made from the top bar. */}
      <SearchField key={q} initial={q} />
      {q ? <Results q={q} /> : <Prompt />}
    </section>
  )
}

function SearchField({ initial }: { initial: string }) {
  const t = useT()
  const navigate = useNavigate()
  const [value, setValue] = useState(initial)

  function submit(event: FormEvent) {
    event.preventDefault()
    const q = value.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <search>
      <form onSubmit={submit}>
        <label className="flex h-12 items-center gap-3 rounded-full bg-field px-4 text-ink-muted focus-within:ring-2 focus-within:ring-paddy">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <span className="sr-only">{t('Search stories')}</span>
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('Search stories, crops, pests')}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </label>
      </form>
    </search>
  )
}

function Results({ q }: { q: string }) {
  const t = useT()
  const stories = useSearch(q)
  const topics = useTags(q.toLowerCase())
  const total = stories.data?.pages[0]?.totalElements

  return (
    <>
      <h1 className="mt-10 text-2xl">
        <span className="text-ink-muted">Results for </span>
        {q}
      </h1>
      {topics.data && topics.data.length > 0 && (
        <section aria-label={t('Matching topics')} className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {topics.data.slice(0, 8).map((tag) => (
              <li key={tag}>
                <Chip to={`/tags/${encodeURIComponent(tag)}`}>{tag}</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
      {total != null && total > 0 && (
        <p className="mt-6 text-sm text-ink-muted">
          {total} {total === 1 ? 'story' : 'stories'}
        </p>
      )}
      <div className="mt-2 border-t border-rule">
        <StoryList
          ready
          query={stories}
          empty={
            <div className="py-16 text-center">
              <h2 className="text-xl">No stories match “{q}”</h2>
              <p className="mt-2 text-ink-muted">{t('Try fewer or different words, or ask the community.')}</p>
              <ButtonLink to="/questions" variant="secondary" size="sm" className="mt-6">
                {t('Ask a question')}
              </ButtonLink>
            </div>
          }
        />
      </div>
    </>
  )
}

function Prompt() {
  const t = useT()
  const topics = useTags()
  return (
    <div className="mt-10">
      <h1 className="text-2xl">{t('Search AgroTrends')}</h1>
      <p className="mt-2 text-ink-muted">{t('Look for a crop, a pest, a practice or a place.')}</p>
      {topics.data && topics.data.length > 0 && (
        <section aria-label={t('Topics')} className="mt-8">
          <h2 className="font-sans text-base font-semibold">{t('Or browse a topic')}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topics.data.map((tag) => (
              <li key={tag}>
                <Chip to={`/tags/${encodeURIComponent(tag)}`}>{tag}</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
