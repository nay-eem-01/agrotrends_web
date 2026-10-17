import { ArrowRight, ChatCircleText, Plant, Sparkle } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { useFeed } from '../../api/feed'
import { useQuestions } from '../../api/questions'
import { seasonCalendar, SEASON_LABELS, type Season } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { Sprig } from '../../ui/Botanical'
import { ADVISOR_EXAMPLES } from '../ai/examples'
import { StoryCompact, StoryFeature } from '../feed/StoryTiles'
import { QuestionCard } from '../qa/QuestionRow'

/** Discover below the hero: questions that need an answer, what people are asking beside the advisor, and stories. */
export function DiscoverSections() {
  return (
    <>
      <NeedsAnswer />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <RecentQuestions />
        <AdvisorPanel />
      </div>
      <FromTheField />
    </>
  )
}

function SectionHeading({ id, title, link }: { id: string; title: string; link?: { to: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 id={id} className="font-serif text-[1.625rem] leading-tight font-medium sm:text-[1.875rem]">
        {title}
      </h2>
      {link && (
        <Link to={link.to} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
          {link.label}
          <ArrowRight size={14} weight="bold" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

/**
 * Questions nobody has answered yet, as a short row of cards with a direct way to answer: the most useful thing a
 * visitor who knows farming can do here. Steps aside when every question has an answer.
 */
function NeedsAnswer() {
  const t = useT()
  const open = useQuestions({ unanswered: true })
  const list = (open.data?.pages[0]?.content ?? []).slice(0, 3)
  if (open.isPending || list.length === 0) return null
  return (
    <section aria-labelledby="discover-unanswered">
      <SectionHeading id="discover-unanswered" title={t('Help a farmer today')} link={{ to: '/questions?unanswered=true', label: t('All unanswered') }} />
      <p className="mt-1.5 text-muted-foreground">{t('These questions have no answer yet. If you have grown it, your answer helps.')}</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((question) => (
          <li key={question.questionId} className="flex flex-col rounded-xl border border-border p-5 transition-colors duration-150 hover:border-border-strong">
            {question.category?.categoryName && <p className="text-xs font-semibold text-primary">{question.category.categoryName}</p>}
            <h3 className="mt-1.5 line-clamp-3 text-base leading-snug font-semibold">
              <Link to={`/questions/${question.questionId}`} className="decoration-primary/60 decoration-2 underline-offset-4 hover:text-primary hover:underline">
                {question.title}
              </Link>
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {question.authorName} · {storyDate(question.createdAt)}
            </p>
            <div className="mt-auto pt-4">
              <ButtonLink to={`/questions/${question.questionId}#your-answer`} variant="secondary" size="sm">
                <ChatCircleText size={16} aria-hidden="true" />
                {t('Answer')}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The topics as one compact row of quick filters into the question feed (the first eight, then all questions). */
function TopicFilters() {
  const t = useT()
  const categories = useCategories().data ?? []
  if (categories.length === 0) return null
  return (
    <nav aria-label={t('Topics')} className="mt-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 pb-1 sm:flex-wrap">
        {categories.slice(0, 8).map((topic) => (
          <li key={topic.id}>
            <Link
              to={`/questions?categoryId=${topic.id}`}
              className="inline-flex h-8 shrink-0 items-center rounded-full border border-border-strong px-3 text-sm whitespace-nowrap transition-colors duration-150 hover:border-primary/50 hover:bg-surface"
            >
              {topic.categoryName}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** The newest questions, compact; links to the full feed and the unanswered ones. */
function RecentQuestions() {
  const t = useT()
  const questions = useQuestions({})
  const list = (questions.data?.pages[0]?.content ?? []).slice(0, 6)

  return (
    <section aria-labelledby="discover-questions" className="min-w-0">
      <SectionHeading id="discover-questions" title={t('What farmers are asking')} link={{ to: '/questions', label: t('All questions') }} />
      <TopicFilters />
      {questions.isPending ? (
        <div className="mt-4 flex flex-col gap-4" aria-busy="true">
          <output className="sr-only">{t('Loading questions')}</output>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-16 w-full" />
          ))}
        </div>
      ) : questions.isError ? (
        <p role="alert" className="mt-6 text-muted-foreground">
          {errorMessage(questions.error)}
        </p>
      ) : list.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border-strong p-6">
          <p className="font-medium">{t('No questions yet')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('Ask the first one. Farmers and agronomists answer here.')}</p>
        </div>
      ) : (
        <>
          <ul className="mt-3 border-t border-border">
            {list.map((question) => (
              <QuestionCard key={question.questionId} question={question} compact />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** The advisor, with questions that fit the season to start from (they open the advisor with the question filled in). */
function AdvisorPanel() {
  const t = useT()
  const [today] = useState(() => new Date())
  const season = seasonCalendar(today).current as Exclude<Season, 'YEAR_ROUND'>
  return (
    <aside aria-labelledby="discover-advisor" className="relative self-start overflow-hidden rounded-2xl bg-surface p-6 sm:p-7">
      <Sprig className="pointer-events-none absolute -top-6 -right-6 h-40 opacity-25" />
      <span className="relative flex size-10 items-center justify-center rounded-full bg-background ring-1 ring-border">
        <Sparkle size={20} weight="fill" aria-hidden="true" className="text-primary" />
      </span>
      <h2 id="discover-advisor" className="relative mt-4 font-serif text-[1.625rem] leading-tight font-medium">
        {t('Ask the advisor')}
      </h2>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
        {t('A private answer in seconds, written from what farmers here have shared, with sources.')}
      </p>
      <p className="relative mt-5 text-xs font-semibold text-foreground">{t('For this {season} season', { season: t(SEASON_LABELS[season]) })}</p>
      <ul className="relative mt-2 flex flex-col gap-2">
        {ADVISOR_EXAMPLES[season].map((example) => (
          <li key={example}>
            <Link
              to={`/advisor?q=${encodeURIComponent(example)}`}
              className="flex min-h-11 items-center gap-2.5 rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-border transition-[box-shadow,color] duration-150 hover:text-primary hover:ring-primary/40"
            >
              <Plant size={16} aria-hidden="true" className="shrink-0 text-primary" />
              {example}
            </Link>
          </li>
        ))}
      </ul>
      <ButtonLink to="/advisor" className="relative mt-5 w-full">
        {t('Open the advisor')}
      </ButtonLink>
      <p className="relative mt-3 text-xs text-muted-foreground">{t('AI answers can be wrong. Check the sources before you act.')}</p>
    </aside>
  )
}

/** The latest stories: one feature and three beside it. Hidden when there are none. */
function FromTheField() {
  const t = useT()
  const latest = useFeed('latest')
  const stories = (latest.data?.pages[0]?.content ?? []).slice(0, 4)
  if (latest.isPending) {
    return (
      <div aria-busy="true" className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    )
  }
  if (stories.length === 0) return null
  return (
    <section aria-labelledby="discover-stories">
      <SectionHeading id="discover-stories" title={t('From the field')} link={{ to: '/stories', label: t('All stories') }} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <StoryFeature story={stories[0]} />
        {stories.length > 1 && (
          <div className="flex flex-col gap-6 lg:border-l lg:border-border lg:pl-10">
            {stories.slice(1).map((story) => (
              <StoryCompact key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
