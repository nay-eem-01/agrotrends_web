import { Plus, Sparkle } from '@phosphor-icons/react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from 'cn'
import { useCategories } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { useQuestions } from '../../api/questions'
import { readQuestionFilters, type QuestionFilters } from '../../lib/agri'
import { useT } from '../../lib/i18n'
import { Button, ButtonLink } from '../../ui/Button'
import { Sprig } from '../../ui/Botanical'
import { ActiveFilters, FilterButton, FilterChip } from '../feed/AgriFilterBar'
import { TopicChips } from '../topics/TopicChips'
import { QuestionCard } from './QuestionRow'

/** The URL of this list with `changes` applied to its query; `undefined` removes a parameter. */
export function useListPath() {
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
 * `/questions`: the question feed: topics as chips, Newest | Unanswered and the farming filters (site-wide search is
 * the top bar's); a quiet sidebar points to the advisor and to asking well.
 */
export function QuestionsPage() {
  const t = useT()
  const [params] = useSearchParams()
  const filters = readQuestionFilters(params)
  const questions = useQuestions(filters)
  const list = questions.data?.pages.flatMap((page) => page.content) ?? []
  const filtered = Object.keys(filters).some((key) => key !== 'unanswered')

  return (
    <div className="mx-auto max-w-(--container-page) px-4 pb-16 sm:px-8">
      <title>{t('Questions – AgroTrends')}</title>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-8 sm:pt-10">
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-[2rem]">{t('Questions')}</h1>
          <p className="mt-1.5 text-muted-foreground">{t('Crops, fish, livestock or your studies: ask farmers, experts and students.')}</p>
        </div>
        <ButtonLink to="/questions/ask" className="shrink-0">
          <Plus size={18} weight="bold" aria-hidden="true" />
          {t('Ask a question')}
        </ButtonLink>
      </header>
      <div className="mt-4 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-8">
        <div className="min-w-0">
          <Toolbar filters={filters} />
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
              <ul className="border-t border-border">
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
        <aside className="hidden pt-5 sm:block">
          <div className="sticky top-24 flex flex-col gap-6">
            <AdvisorCard />
            <AskingWell />
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Topics as chips (five at a time), Newest | Unanswered, and the farming filters. */
function Toolbar({ filters }: { filters: QuestionFilters }) {
  const t = useT()
  const path = useListPath()
  const categories = useCategories().data ?? []
  const tabs = [
    { label: t('Newest'), to: path({ unanswered: undefined }), current: !filters.unanswered },
    { label: t('Unanswered'), to: path({ unanswered: 'true' }), current: Boolean(filters.unanswered) },
  ]
  const chip = (current: boolean) =>
    cn(
      'inline-flex min-h-9 max-w-full items-center rounded-full border px-3.5 py-1 text-sm wrap-anywhere transition-colors duration-150',
      current ? 'border-primary bg-secondary font-semibold text-primary' : 'border-border-strong text-foreground hover:border-primary/50 hover:bg-surface',
    )

  return (
    <div className="flex flex-col gap-3 py-4">
      {categories.length > 0 && (
        <TopicChips categories={categories} selected={filters.categoryId} renderTopic={(category) => (
          <Link to={path({ categoryId: String(category.id) })} aria-current={category.id === filters.categoryId ? 'true' : undefined} className={chip(category.id === filters.categoryId)}>
            {category.categoryName}
          </Link>
        )}>
          <li>
            <Link to={path({ categoryId: undefined })} aria-current={filters.categoryId == null ? 'true' : undefined} className={chip(filters.categoryId == null)}>
              {t('All topics')}
            </Link>
          </li>
        </TopicChips>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label={t('Sort questions')} className="flex gap-1 rounded-full bg-muted p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              to={tab.to}
              aria-current={tab.current ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center rounded-full px-4 text-sm transition-colors duration-150',
                tab.current ? 'bg-card font-semibold text-primary shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <FilterButton filters={filters} className="h-11 shrink-0" />
      </div>
      <ActiveFilters filters={filters}>
        {filters.tag && (
          <FilterChip to={path({ tag: undefined })} removeLabel={t('Remove tag {tag}', { tag: filters.tag })}>
            <span className="sr-only">{t('Tagged')} </span>#{filters.tag}
          </FilterChip>
        )}
      </ActiveFilters>
    </div>
  )
}

function ListSkeleton() {
  const t = useT()
  return (
    <ul className="border-t border-border" aria-busy="true">
      <li className="sr-only">
        <output>{t('Loading questions')}</output>
      </li>
      {[0, 1, 2].map((key) => (
        <li key={key} className="flex gap-5 border-b border-border py-5">
          <Skeleton className="h-20 w-16" />
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
    <Empty className="relative overflow-hidden rounded-xl border border-dashed border-border-strong">
      <Sprig className="pointer-events-none absolute -right-4 -bottom-6 h-36 opacity-40" />
      <EmptyHeader>
        <EmptyTitle>
          <h2 className="font-serif text-xl font-semibold">{title}</h2>
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

function AdvisorCard() {
  const t = useT()
  return (
    <section className="relative overflow-hidden rounded-xl bg-surface p-5">
      <Sprig className="pointer-events-none absolute -top-3 -right-3 h-24 opacity-30" />
      <h2 className="relative flex items-center gap-2 text-sm font-semibold">
        <Sparkle size={18} weight="fill" aria-hidden="true" className="text-primary" />
        {t('Ask the advisor')}
      </h2>
      <p className="relative mt-1.5 text-sm text-muted-foreground">{t('A private answer in seconds, written from what farmers here have shared, with sources.')}</p>
      <ButtonLink to="/advisor" variant="secondary" size="sm" className="relative mt-4">
        {t('Open the advisor')}
      </ButtonLink>
    </section>
  )
}

/** Plain guidance on asking, so a question gets useful answers (no data behind it, just advice). */
export function AskingWell({ className = 'border-t border-border pt-5' }: { className?: string }) {
  const t = useT()
  const tips = [t('Say what you are working with and where.'), t('Describe what you see, and since when.'), t('Add what you have already tried.'), t('A clear photo of the problem helps.')]
  return (
    <section className={className}>
      <h2 className="text-sm font-semibold">{t('Getting a good answer')}</h2>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-mustard" />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  )
}
