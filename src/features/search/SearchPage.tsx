import { useT } from '../../lib/i18n'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { cn } from 'cn'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSearch } from '../../api/blogs'
import { errorMessage } from '../../api/errors'
import { useQuestionSearch } from '../../api/questions'
import { useTags } from '../../api/topics'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { Chip } from '../../ui/Chip'
import { StoryList } from '../feed/Feed'
import { QuestionCard } from '../qa/QuestionRow'

/** `/search?q=`: matching tags, then matching questions or stories. The field is here too, since phones hide the top bar's. */
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
  const stories = useSearchParams()[0].get('type') === 'stories'
  const [value, setValue] = useState(initial)

  function submit(event: FormEvent) {
    event.preventDefault()
    const q = value.trim()
    // A new search stays on the tab the reader was on.
    navigate(q ? `/search?q=${encodeURIComponent(q)}${stories ? '&type=stories' : ''}` : '/search')
  }

  return (
    <search>
      <form onSubmit={submit}>
        <label className="flex h-12 items-center gap-3 rounded-lg border border-input bg-card px-4 text-muted-foreground transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/60 hover:border-foreground/60">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <span className="sr-only">{t('Search questions and stories')}</span>
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('Search questions, crops, pests')}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          />
        </label>
      </form>
    </search>
  )
}

/** Questions first (the product is Q&A-first), stories on the second tab; `?type=stories` picks it. */
function Results({ q }: { q: string }) {
  const t = useT()
  const [params] = useSearchParams()
  const type = params.get('type') === 'stories' ? 'stories' : 'questions'
  const topics = useTags(q.toLowerCase())
  const base = `/search?q=${encodeURIComponent(q)}`

  return (
    <>
      <h1 className="mt-10 text-2xl">
        <span className="text-muted-foreground">{t('Results for')} </span>
        {q}
      </h1>
      {topics.data && topics.data.length > 0 && (
        <section aria-label={t('Matching tags')} className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {topics.data.slice(0, 8).map((tag) => (
              <li key={tag}>
                <Chip to={`/tags/${encodeURIComponent(tag)}`}>{tag}</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav aria-label={t('Result types')} className="mt-6 flex gap-6 border-b border-border">
        {(
          [
            ['questions', t('Questions'), base],
            ['stories', t('Stories'), `${base}&type=stories`],
          ] as const
        ).map(([value, label, to]) => (
          <Link
            key={value}
            to={to}
            aria-current={type === value ? 'page' : undefined}
            className={cn('-mb-px flex h-12 items-center border-b-2 text-sm transition-colors duration-150', type === value ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {label}
          </Link>
        ))}
      </nav>
      {type === 'questions' ? <QuestionResults q={q} /> : <StoryResults q={q} />}
    </>
  )
}

function QuestionResults({ q }: { q: string }) {
  const t = useT()
  const questions = useQuestionSearch(q)
  const list = questions.data?.pages.flatMap((page) => page.content) ?? []
  if (questions.isPending) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Spinner label={t('Loading questions')} />
      </div>
    )
  }
  if (questions.isError) {
    return (
      <p role="alert" className="py-16 text-muted-foreground">
        {errorMessage(questions.error)}
      </p>
    )
  }
  if (list.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl">{t('No questions match “{q}”', { q })}</h2>
        <p className="mt-2 text-muted-foreground">{t('Use "quotes" for a phrase and -word to leave a word out. Or ask it yourself.')}</p>
        <ButtonLink to="/questions/ask" size="sm" className="mt-6">
          {t('Ask a question')}
        </ButtonLink>
      </div>
    )
  }
  return (
    <>
      <ul className="mt-2 border-t border-border">
        {list.map((question) => (
          <QuestionCard key={question.questionId} question={question} />
        ))}
      </ul>
      {questions.hasNextPage && (
        <div className="flex justify-center py-8">
          <Button variant="secondary" size="sm" loading={questions.isFetchingNextPage} onClick={() => void questions.fetchNextPage()}>
            {t('Show more questions')}
          </Button>
        </div>
      )}
    </>
  )
}

function StoryResults({ q }: { q: string }) {
  const t = useT()
  const stories = useSearch(q)
  return (
    <StoryList
      ready
      query={stories}
      empty={
        <div className="py-16 text-center">
          <h2 className="text-xl">{t('No stories match “{q}”', { q })}</h2>
          <p className="mt-2 text-muted-foreground">{t('Try fewer or different words, or ask the community.')}</p>
          <ButtonLink to="/questions/ask" variant="secondary" size="sm" className="mt-6">
            {t('Ask a question')}
          </ButtonLink>
        </div>
      }
    />
  )
}

function Prompt() {
  const t = useT()
  const topics = useTags()
  return (
    <div className="mt-10">
      <h1 className="text-2xl">{t('Search AgroTrends')}</h1>
      <p className="mt-2 text-muted-foreground">{t('Look for a crop, a pest, a practice or a place.')}</p>
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
