import {
  ArrowRight,
  Bug,
  Carrot,
  CloudSun,
  Cow,
  Drop,
  Egg,
  Fish,
  Flask,
  Grains,
  Leaf,
  Plant,
  Sparkle,
  Storefront,
  Tractor,
  Tree,
  type Icon,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { useFeed } from '../../api/feed'
import { useQuestions } from '../../api/questions'
import { seasonCalendar, SEASON_LABELS, type Season } from '../../lib/agri'
import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { Sprig } from '../../ui/Botanical'
import { ADVISOR_EXAMPLES } from '../ai/examples'
import { StoryCompact, StoryFeature } from '../feed/StoryTiles'
import { QuestionCard } from '../qa/QuestionRow'

/** Discover below the hero: topics, what people are asking beside the advisor, and stories from the field. */
export function DiscoverSections() {
  return (
    <>
      <Topics />
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

/** An icon for a topic from words in its name (English or Bengali names fall back to a leaf). */
const TOPIC_ICONS: [RegExp, Icon][] = [
  [/fish|aqua/i, Fish],
  [/livestock|cattle|cow|dairy|goat/i, Cow],
  [/poultry|egg|chicken|duck/i, Egg],
  [/pest|disease|insect|bug/i, Bug],
  [/soil|fertili[sz]er|compost|nutrient/i, Flask],
  [/water|irrigat/i, Drop],
  [/weather|climate|season/i, CloudSun],
  [/rice|paddy|grain|wheat|maize|cereal/i, Grains],
  [/vegetable|potato|tomato|onion/i, Carrot],
  [/fruit|tree|orchard|mango/i, Tree],
  [/machine|tool|tech|tractor/i, Tractor],
  [/market|price|policy|business/i, Storefront],
  [/seed|crop|plant/i, Plant],
]

export function TopicIcon({ name, size = 20 }: { name?: string; size?: number }) {
  const Match = TOPIC_ICONS.find(([pattern]) => pattern.test(name ?? ''))?.[1] ?? Leaf
  return <Match size={size} aria-hidden="true" className="shrink-0 text-primary" />
}

/** Every topic as a tile leading to its questions. Hidden until topics exist. */
function Topics() {
  const t = useT()
  const categories = useCategories().data ?? []
  if (categories.length === 0) return null
  return (
    <section aria-labelledby="discover-topics">
      <SectionHeading id="discover-topics" title={t('Browse by topic')} link={{ to: '/questions', label: t('All questions') }} />
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.slice(0, 12).map((topic) => (
          <li key={topic.id}>
            <Link
              to={`/questions?categoryId=${topic.id}`}
              className="flex h-full min-h-20 flex-col justify-between gap-3 rounded-xl border border-border p-4 transition-[border-color,background-color] duration-150 hover:border-primary/40 hover:bg-surface"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary">
                <TopicIcon name={topic.categoryName} />
              </span>
              <span className="text-sm leading-snug font-medium">{topic.categoryName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
          <Link to="/questions?unanswered=true" className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">
            {t('Answer an unanswered question')}
          </Link>
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
