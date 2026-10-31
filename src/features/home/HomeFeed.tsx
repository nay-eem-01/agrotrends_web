import { ChatCircleText, Newspaper, SealCheck, Sparkle } from '@phosphor-icons/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { useTopicStories } from '../../api/blogs'
import { useCategories } from '../../api/categories'
import { useExperts } from '../../api/experts'
import { useFeed } from '../../api/feed'
import { useQuestions, type Question } from '../../api/questions'
import type { StorySummary } from '../../api/types'
import { storyDate } from '../../lib/dates'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { CoverFallback } from '../../ui/Botanical'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { QuestionCard } from '../qa/QuestionRow'

type Item = { kind: 'story'; at: string; story: StorySummary } | { kind: 'question'; at: string; question: Question }

/**
 * `/` for signed-in readers, after a Reddit home: topic chips, a composer and one feed of stories and questions, with
 * what's trending and experts to follow on the right (the sections and your topics are in the app's sidebar). On phones the
 * quick actions and this week's tasks come first. The feed merges stories and questions by date until the backend has
 * one home feed (docs/BACKEND_REQUESTS.md §6).
 */
export function HomeFeed() {
  const t = useT()
  const [params] = useSearchParams()
  const topic = Number(params.get('topic')) || undefined
  const categories = useCategories()
  const questions = useQuestions(topic ? { categoryId: topic } : {})
  const stories = useTopicStories(topic)
  const items = useMemo(() => {
    const merged: Item[] = [
      ...(stories.data?.pages.flatMap((page) => page.content) ?? []).map((story) => ({ kind: 'story' as const, at: story.publishedAt ?? story.createdAt ?? '', story })),
      ...(questions.data?.pages.flatMap((page) => page.content) ?? []).map((question) => ({ kind: 'question' as const, at: question.createdAt ?? '', question })),
    ]
    return merged.sort((a, b) => b.at.localeCompare(a.at))
  }, [stories.data, questions.data])
  const more = questions.hasNextPage || stories.hasNextPage
  const loading = questions.isPending || stories.isPending

  return (
    <div className="mx-auto grid max-w-[64rem] gap-8 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
      <title>{t('AgroTrends – farming questions, stories and advice')}</title>
      <h1 className="sr-only">{t('Home')}</h1>
      <section aria-label={t('Your feed')} className="min-w-0">
        <QuickStart />
        <nav aria-label={t('Topics')} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <TopicChip to="/" current={!topic}>
            {t('For you')}
          </TopicChip>
          {(categories.data ?? []).slice(0, 6).map((category) => (
            <TopicChip key={category.id} to={`/?topic=${category.id}`} current={topic === category.id}>
              {category.categoryName}
            </TopicChip>
          ))}
        </nav>
        <Composer />
        {loading ? (
          <div className="py-12 text-muted-foreground">
            <Spinner label={t('Loading your feed')} />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-muted-foreground">{t('Nothing here yet. Ask the first question in this topic.')}</p>
        ) : (
          <ul className="border-t border-border">
            {items.map((item) =>
              item.kind === 'story' ? <StoryItem key={`s${item.story.id}`} story={item.story} /> : <QuestionCard key={`q${item.question.questionId}`} question={item.question} />,
            )}
          </ul>
        )}
        {more && (
          <div className="flex justify-center py-6">
            <Button
              variant="secondary"
              size="sm"
              loading={questions.isFetchingNextPage || stories.isFetchingNextPage}
              onClick={() => {
                if (questions.hasNextPage) void questions.fetchNextPage()
                if (stories.hasNextPage) void stories.fetchNextPage()
              }}
            >
              {t('Show more')}
            </Button>
          </div>
        )}
      </section>
      <Rail />
    </div>
  )
}

function TopicChip({ to, current, children }: { to: string; current: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150',
        current ? 'bg-foreground text-background' : 'bg-surface text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </Link>
  )
}

/** "Ask the community, or ask the AI advisor": the two ways to start, as one pill. */
function Composer() {
  const t = useT()
  const { user } = useSession()
  return (
    <div className="my-4 flex items-center gap-3 rounded-full bg-surface py-2 pr-2 pl-2">
      <Avatar name={user?.name ?? '?'} size={32} />
      <Link to="/questions/ask" className="min-w-0 flex-1 truncate text-sm text-muted-foreground hover:text-foreground">
        {t('Ask the community, or ask the AI advisor…')}
      </Link>
      <Link to="/advisor" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-background px-3 text-sm font-semibold hover:border-subtle">
        <Sparkle size={16} aria-hidden="true" />
        {t('AI')}
      </Link>
    </div>
  )
}

/** Phones: a greeting and the four ways in. */
function QuickStart() {
  const t = useT()
  const { user } = useSession()
  const [hour] = useState(() => new Date().getHours())
  const name = (user?.name ?? '').split(' ')[0]
  const greeting = hour < 12 ? t('Good morning, {name}', { name }) : hour < 17 ? t('Good afternoon, {name}', { name }) : t('Good evening, {name}', { name })
  const actions = [
    { to: '/questions/ask', label: t('Ask a question'), icon: ChatCircleText, main: true },
    { to: '/advisor', label: t('AI advice'), icon: Sparkle },
    { to: '/stories', label: t('Read stories'), icon: Newspaper },
    { to: '/questions?unanswered=true', label: t('Help answer'), icon: SealCheck },
  ]
  return (
    <div className="mb-6 flex flex-col gap-4 md:hidden">
      <p className="font-serif text-2xl font-semibold">{greeting}</p>
      <nav aria-label={t('Quick actions')} className="grid grid-cols-2 gap-2.5">
        {actions.map(({ to, label, icon: Icon, main }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col gap-2 rounded-xl border p-3.5 text-sm font-semibold transition-colors duration-150',
              main ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-surface',
            )}
          >
            <Icon size={22} aria-hidden="true" className={main ? undefined : 'text-primary'} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

/** One story in the feed, in the same shape as a question row. */
function StoryItem({ story }: { story: StorySummary }) {
  const t = useT()
  const meta = [story.category?.categoryName, story.readingTimeMinutes ? t('{n} min read', { n: formatNumber(story.readingTimeMinutes) }) : null].filter(Boolean)
  return (
    <li className="group relative flex gap-4 border-b border-border py-5 sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{t('Story')}</span>
          {meta.length > 0 && <span>{meta.join(' · ')}</span>}
        </p>
        <h2 className="mt-1 font-serif text-lg leading-snug font-semibold text-pretty sm:text-xl">
          <Link
            to={`/stories/${story.slug}`}
            className="decoration-primary/60 decoration-2 underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 group-hover:text-primary group-hover:underline"
          >
            {story.title}
          </Link>
        </h2>
        {story.excerpt && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{story.excerpt}</p>}
        {story.author?.name && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar name={story.author.name} size={20} />
            <span className="font-medium text-foreground">{story.author.name}</span>
            <span>· {storyDate(story.publishedAt)}</span>
          </p>
        )}
      </div>
      {story.imageUrl ? (
        <img src={story.imageUrl} alt="" loading="lazy" decoding="async" className="size-20 shrink-0 rounded-xl bg-muted object-cover sm:h-24 sm:w-32" />
      ) : (
        <CoverFallback className="size-20 shrink-0 rounded-xl sm:h-24 sm:w-32" />
      )}
    </li>
  )
}

/** Wide screens: trending stories, then experts to follow (hidden until the backend lists experts, §4). */
function Rail() {
  const t = useT()
  const trending = useFeed('trending')
  const experts = useExperts()
  const top = (trending.data?.pages[0]?.content ?? []).slice(0, 4)
  return (
    <aside aria-label={t('More to read')} className="hidden lg:block">
      <div className="sticky top-24 flex flex-col gap-8">
        {top.length > 0 && (
          <section aria-labelledby="trending">
            <h2 id="trending" className="font-sans text-sm font-semibold">
              {t('Trending now')}
            </h2>
            <ol className="mt-3 flex flex-col gap-3">
              {top.map((story, index) => (
                <li key={story.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] text-sm leading-snug">
                  <span aria-hidden="true" className="text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <Link to={`/stories/${story.slug}`} className="hover:text-primary hover:underline">
                    {story.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
        {(experts.data?.content?.length ?? 0) > 0 && (
          <section aria-labelledby="experts-to-follow">
            <h2 id="experts-to-follow" className="font-sans text-sm font-semibold">
              {t('Experts to follow')}
            </h2>
            <ul className="mt-3 flex flex-col gap-3.5">
              {experts.data!.content.map((expert) => (
                <li key={expert.userId} className="flex items-center gap-2.5 text-sm">
                  <Avatar name={expert.name ?? ''} src={expert.avatarUrl ?? undefined} size={32} />
                  <Link to={`/users/${expert.userId}`} state={{ name: expert.name }} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold hover:underline">{expert.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{[expert.expertField, expert.institution].filter(Boolean).join(' · ')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  )
}
