import { CheckCircle, Sparkle, X } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from 'cn'
import { useCategories } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { useQuestions, type Question } from '../../api/questions'
import { filterPath, readQuestionFilters, SEASON_LABELS, SOIL_LABELS, type QuestionFilters } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { excerpt, htmlToText } from '../../lib/html'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { Button, ButtonLink } from '../../ui/Button'
import { AgriFilterBar } from '../feed/AgriFilterBar'

/** The URL of this list with `changes` applied to its query; `undefined` removes a parameter. */
function useListPath() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  return (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) next.delete(key)
      else next.set(key, value)
    }
    const query = next.toString()
    return query ? `${pathname}?${query}` : pathname
  }
}

/**
 * The question feed: Newest or Unanswered, filtered by topic, tag and farming context. It is the home page (`/`)
 * and `/questions`; on home it sits under the Questions | Stories tabs.
 */
export function QuestionsPage({ heading = true }: { heading?: boolean }) {
  const t = useT()
  const [params] = useSearchParams()
  const filters = readQuestionFilters(params)
  const questions = useQuestions(filters)
  const list = questions.data?.pages.flatMap((page) => page.content) ?? []
  const filtered = Object.keys(filters).some((key) => key !== 'unanswered')

  return (
    <div className="mx-auto max-w-(--container-page) px-4 pb-16 sm:px-6">
      <title>{t('Questions – AgroTrends')}</title>
      {heading && (
        <div className="flex items-end justify-between gap-4 pt-10">
          <div>
            <h1 className="text-2xl sm:text-3xl">{t('Questions')}</h1>
            <p className="mt-1 text-muted-foreground">{t('Ask the community about your crop, your soil, your season.')}</p>
          </div>
          <ButtonLink to="/questions/ask" size="sm" className="shrink-0">
            {t('Ask a question')}
          </ButtonLink>
        </div>
      )}
      <div className="lg:flex lg:gap-12">
        <div className="max-w-(--container-feed) min-w-0 flex-1">
          <Toolbar filters={filters} />
          <TagChip tag={filters.tag} />
          <AgriFilterBar filters={filters} />
          {questions.isPending ? (
            <ListSkeleton />
          ) : questions.isError ? (
            <p role="alert" className="py-16 text-muted-foreground">
              {errorMessage(questions.error)}
            </p>
          ) : list.length === 0 ? (
            <EmptyList filtered={filtered} unanswered={filters.unanswered} />
          ) : (
            <>
              <ul className="mt-4 flex flex-col gap-3">
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
          )}
        </div>
        <aside className="hidden w-80 shrink-0 pt-6 lg:block">
          <TopicRail active={filters.categoryId} />
          <AdvisorCard />
        </aside>
      </div>
    </div>
  )
}

/** Newest | Unanswered, and the topic picker. */
function Toolbar({ filters }: { filters: QuestionFilters }) {
  const t = useT()
  const path = useListPath()
  const navigate = useNavigate()
  const categories = useCategories()
  const tabs = [
    { label: t('Newest'), to: path({ unanswered: undefined }), current: !filters.unanswered },
    { label: t('Unanswered'), to: path({ unanswered: 'true' }), current: Boolean(filters.unanswered) },
  ]

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label={t('Sort questions')} className="flex gap-1 rounded-full bg-muted p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            aria-current={tab.current ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center rounded-full px-4 text-sm transition-colors duration-150',
              tab.current ? 'bg-card font-medium text-foreground shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="sr-only sm:not-sr-only">{t('Topic')}</span>
        <NativeSelect
          size="sm"
          value={filters.categoryId == null ? '' : String(filters.categoryId)}
          onChange={(event) => navigate(path({ categoryId: event.target.value || undefined }))}
          className="min-w-40"
        >
          <NativeSelectOption value="">{t('All topics')}</NativeSelectOption>
          {(categories.data ?? []).map((category) => (
            <NativeSelectOption key={category.id} value={String(category.id)}>
              {category.categoryName}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
    </div>
  )
}

function TagChip({ tag }: { tag?: string }) {
  const t = useT()
  const path = useListPath()
  if (!tag) return null
  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t('Tagged')}</span>
      <span className="inline-flex h-8 items-center gap-1 rounded-full bg-foreground pr-1 pl-3 text-background">
        {tag}
        <Link to={path({ tag: undefined })} aria-label={t('Remove tag {tag}', { tag })} className="flex size-7 items-center justify-center rounded-full hover:bg-background/20">
          <X size={14} aria-hidden="true" />
        </Link>
      </span>
    </div>
  )
}

/**
 * One question as a card: votes and answers on the left (the accepted state in mustard, the trust colour), then the
 * title, a short excerpt, topic, tags and farming chips. The title link covers the card; chips sit above it.
 */
export function QuestionCard({ question }: { question: Question }) {
  const t = useT()
  const agri = question.agri ?? {}
  const answers = question.answerCount ?? 0
  const accepted = question.acceptedAnswerId != null
  const score = question.score ?? 0
  const preview = excerpt(htmlToText(question.content), 160)
  const chips = [
    agri.crop && { label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions') },
    agri.season && { label: t(SEASON_LABELS[agri.season]), to: filterPath({ season: agri.season }, '/questions') },
    agri.region && { label: agri.region, to: filterPath({ region: agri.region }, '/questions') },
    agri.soil && { label: t(SOIL_LABELS[agri.soil]), to: filterPath({ soil: agri.soil }, '/questions') },
  ].filter((chip): chip is { label: string; to: string } => Boolean(chip))

  return (
    <li className="group relative flex gap-4 rounded-2xl bg-card p-4 ring-1 ring-border transition-shadow duration-200 hover:ring-primary/40 sm:gap-5 sm:p-5">
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 pt-0.5 text-center sm:w-16">
        <p className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tabular-nums">{formatNumber(score)}</span>
          <span className="text-xs text-muted-foreground">{score === 1 || score === -1 ? t('vote') : t('votes')}</span>
        </p>
        <p
          className={cn(
            'flex w-full flex-col rounded-lg px-1 py-1 leading-tight',
            accepted ? 'bg-mustard-soft text-foreground' : answers > 0 ? 'ring-1 ring-primary/40 text-primary' : 'text-muted-foreground',
          )}
        >
          <span className="inline-flex items-center justify-center gap-1 text-base font-semibold tabular-nums">
            {accepted && <CheckCircle size={14} weight="fill" className="text-mustard" aria-hidden="true" />}
            {formatNumber(answers)}
          </span>
          <span className="text-xs">{answers === 1 ? t('answer') : t('answers')}</span>
          {accepted && <span className="sr-only">{t('An answer was accepted')}</span>}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        {question.category?.categoryName && (
          <Badge variant="secondary" className="relative z-10 mb-2" render={<Link to={`/questions?categoryId=${question.category.id}`} />}>
            {question.category.categoryName}
          </Badge>
        )}
        <h2 className="font-serif text-lg leading-snug font-bold sm:text-xl">
          <Link to={`/questions/${question.questionId}`} className="after:absolute after:inset-0 after:rounded-2xl group-hover:underline">
            {question.title}
          </Link>
        </h2>
        {preview && <p className="mt-1 line-clamp-2 text-muted-foreground">{preview}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={question.authorName ?? '?'} size={20} />
            {question.authorName} · {storyDate(question.createdAt)}
          </span>
          {(question.tags ?? []).map((tag) => (
            <Link key={tag} to={`/questions?tag=${encodeURIComponent(tag)}`} className="relative z-10 rounded-full bg-muted px-2 py-0.5 text-foreground hover:bg-accent">
              #{tag}
            </Link>
          ))}
          {chips.map((chip) => (
            <Link key={chip.to} to={chip.to} className="relative z-10 rounded-full px-2 py-0.5 text-foreground ring-1 ring-border hover:bg-muted">
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </li>
  )
}

function ListSkeleton() {
  const t = useT()
  return (
    <ul className="mt-4 flex flex-col gap-3" aria-busy="true">
      <li className="sr-only">
        <output>{t('Loading questions')}</output>
      </li>
      {[0, 1, 2].map((key) => (
        <li key={key} className="flex gap-5 rounded-2xl bg-card p-5 ring-1 ring-border">
          <Skeleton className="h-20 w-16 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyList({ filtered, unanswered }: { filtered: boolean; unanswered?: boolean }) {
  const t = useT()
  const title = filtered ? t('No questions match these filters') : unanswered ? t('Every question has an answer') : t('No questions yet')
  return (
    <Empty className="mt-4 rounded-2xl bg-card ring-1 ring-border">
      <EmptyHeader>
        <EmptyTitle>
          <h2 className="font-serif text-xl font-bold">{title}</h2>
        </EmptyTitle>
        <EmptyDescription>{t('Ask the first one. Farmers and agronomists answer here.')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ButtonLink to="/questions/ask" size="sm">
          {t('Ask a question')}
        </ButtonLink>
      </EmptyContent>
    </Empty>
  )
}

/** Topics (the backend's categories) to browse by. */
function TopicRail({ active }: { active?: number }) {
  const t = useT()
  const path = useListPath()
  const categories = useCategories()
  if (!categories.data?.length) return null
  return (
    <section aria-labelledby="topic-rail" className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h2 id="topic-rail" className="font-sans text-base font-semibold">
        {t('Browse by topic')}
      </h2>
      <ul className="mt-3 flex flex-col">
        {categories.data.map((category) => (
          <li key={category.id}>
            <Link
              to={path({ categoryId: category.id === active ? undefined : String(category.id) })}
              aria-current={category.id === active ? 'true' : undefined}
              className={cn(
                '-mx-2 flex h-10 items-center rounded-lg px-2 text-sm transition-colors duration-150',
                category.id === active ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {category.categoryName}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AdvisorCard() {
  const t = useT()
  return (
    <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
        <Sparkle size={18} aria-hidden="true" className="text-primary" />
        {t('Ask the advisor')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('A private answer in seconds, written from what farmers here have shared, with sources.')}</p>
      <ButtonLink to="/advisor" variant="secondary" size="sm" className="mt-4">
        {t('Open the advisor')}
      </ButtonLink>
    </section>
  )
}
