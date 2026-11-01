import { ChatCircleText, Newspaper, SealCheck, Sparkle } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { useTopicStories } from '../../api/blogs'
import { useCategories } from '../../api/categories'
import { useExperts, type ExpertSummary } from '../../api/experts'
import { useFeed, useTrendingQuestions } from '../../api/feed'
import { useToggleAuthorFollow } from '../../api/follows'
import { useQuestions } from '../../api/questions'
import type { StorySummary } from '../../api/types'
import { storyDate } from '../../lib/dates'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { CoverFallback } from '../../ui/Botanical'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { QuestionCard } from '../qa/QuestionRow'

type Show = 'questions' | 'stories'

/**
 * `/` for signed-in readers: a composer, then Questions | Stories as two tabs over one row of topic chips, with what's
 * trending and experts to follow on the right (the sections and your topics are in the app's sidebar). One kind at a
 * time, never mixed. The tab, topic and sort live in the URL (`?show=stories&topic=2`, `?unanswered=true`), so a tab
 * can be linked and Back works. On phones the quick actions come first.
 */
export function HomeFeed() {
  const t = useT()
  const [params] = useSearchParams()
  const show: Show = params.get('show') === 'stories' ? 'stories' : 'questions'
  const topic = Number(params.get('topic')) || undefined
  const unanswered = show === 'questions' && params.get('unanswered') === 'true'
  const categories = useCategories()
  // The tab, topic and sort as one link; switching tabs keeps the topic and drops the questions-only sort.
  const to = (next: { show?: Show; topic?: number; unanswered?: boolean }) => {
    const query = new URLSearchParams()
    const tab = next.show ?? show
    const id = 'topic' in next ? next.topic : topic
    if (tab === 'stories') query.set('show', 'stories')
    if (id) query.set('topic', String(id))
    if (tab === 'questions' && ('unanswered' in next ? next.unanswered : unanswered)) query.set('unanswered', 'true')
    const search = query.toString()
    return search ? `/?${search}` : '/'
  }
  const tabs = [
    { show: 'questions' as const, label: t('Questions') },
    { show: 'stories' as const, label: t('Stories') },
  ]

  return (
    <div className="mx-auto grid max-w-[64rem] gap-8 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
      <title>{t('AgroTrends – farming questions, stories and advice')}</title>
      <h1 className="sr-only">{t('Home')}</h1>
      <section aria-label={t('Your feed')} className="min-w-0">
        <QuickStart />
        <Composer />
        <nav aria-label={t('Show')} className="mt-2 flex gap-7 border-b border-border">
          {tabs.map((tab) => (
            <Link
              key={tab.show}
              to={to({ show: tab.show })}
              aria-current={show === tab.show ? 'page' : undefined}
              className={cn(
                '-mb-px flex h-12 items-center border-b-2 text-base transition-colors duration-150',
                show === tab.show ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3 py-4">
          <nav aria-label={t('Topics')} className="-mx-4 flex min-w-0 flex-1 basis-full gap-2 overflow-x-auto px-4 pb-1 sm:basis-0 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <TopicChip to={to({ topic: undefined })} current={!topic}>
              {t('For you')}
            </TopicChip>
            {(categories.data ?? []).slice(0, 6).map((category) => (
              <TopicChip key={category.id} to={to({ topic: category.id })} current={topic === category.id}>
                {category.categoryName}
              </TopicChip>
            ))}
          </nav>
          {show === 'questions' && (
            <nav aria-label={t('Sort questions')} className="flex shrink-0 gap-1 rounded-full bg-muted p-1">
              {[
                { label: t('Newest'), current: !unanswered, link: to({ unanswered: false }) },
                { label: t('Unanswered'), current: unanswered, link: to({ unanswered: true }) },
              ].map((sort) => (
                <Link
                  key={sort.label}
                  to={sort.link}
                  aria-current={sort.current ? 'page' : undefined}
                  className={cn(
                    'flex h-8 items-center rounded-full px-3.5 text-sm transition-colors duration-150',
                    sort.current ? 'bg-card font-semibold text-foreground shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {sort.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {show === 'questions' ? <QuestionList topic={topic} unanswered={unanswered} /> : <StoryList topic={topic} />}
      </section>
      <Rail />
    </div>
  )
}

/** The Questions tab: newest (or unanswered) questions in the topic. */
function QuestionList({ topic, unanswered }: { topic?: number; unanswered: boolean }) {
  const t = useT()
  const questions = useQuestions({ ...(topic ? { categoryId: topic } : {}), ...(unanswered ? { unanswered: true } : {}) })
  const items = questions.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <FeedList
      loading={questions.isPending}
      empty={t('No questions here yet. Ask the first one in this topic.')}
      more={questions.hasNextPage}
      loadingMore={questions.isFetchingNextPage}
      onMore={() => void questions.fetchNextPage()}
    >
      {items.map((question) => (
        <QuestionCard key={question.questionId} question={question} />
      ))}
    </FeedList>
  )
}

/** The Stories tab: the newest stories in the topic. */
function StoryList({ topic }: { topic?: number }) {
  const t = useT()
  const stories = useTopicStories(topic)
  const items = stories.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <FeedList
      loading={stories.isPending}
      empty={t('No stories in this topic yet.')}
      more={stories.hasNextPage}
      loadingMore={stories.isFetchingNextPage}
      onMore={() => void stories.fetchNextPage()}
    >
      {items.map((story) => (
        <StoryItem key={story.id} story={story} />
      ))}
    </FeedList>
  )
}

function FeedList({ loading, empty, more, loadingMore, onMore, children }: { loading: boolean; empty: string; more: boolean; loadingMore: boolean; onMore: () => void; children: ReactNode[] }) {
  const t = useT()
  if (loading)
    return (
      <div className="py-12 text-muted-foreground">
        <Spinner label={t('Loading your feed')} />
      </div>
    )
  if (children.length === 0) return <p className="py-12 text-muted-foreground">{empty}</p>
  return (
    <>
      <ul className="border-t border-border">{children}</ul>
      {more && (
        <div className="flex justify-center py-6">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={onMore}>
            {t('Show more')}
          </Button>
        </div>
      )}
    </>
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
    <div className="mb-2 flex items-center gap-3 rounded-full bg-surface py-2 pr-2 pl-2">
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

/** One story on the Stories tab, in the same shape as a question row. */
function StoryItem({ story }: { story: StorySummary }) {
  const t = useT()
  const meta = [story.category?.categoryName, story.readingTimeMinutes ? t('{n} min read', { n: formatNumber(story.readingTimeMinutes) }) : null].filter(Boolean)
  return (
    <li className="group relative flex gap-4 border-b border-border py-5 sm:gap-6">
      <div className="min-w-0 flex-1">
        {meta.length > 0 && <p className="mb-1 text-xs text-muted-foreground">{meta.join(' · ')}</p>}
        <h2 className="font-serif text-lg leading-snug font-semibold text-pretty sm:text-xl">
          <Link
            to={`/stories/${story.slug}`}
            className="decoration-primary/60 decoration-2 underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 group-hover:text-primary group-hover:underline"
          >
            {story.title}
          </Link>
        </h2>
        {(story.subtitle || story.excerpt) && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{story.subtitle || story.excerpt}</p>}
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

/** Wide screens: trending questions and trending stories as two short lists, then experts to follow. */
function Rail() {
  const t = useT()
  const trending = useFeed('trending')
  const questions = useTrendingQuestions()
  const experts = useExperts()
  const top = (trending.data?.pages[0]?.content ?? []).slice(0, 4)
  const asked = questions.data?.content ?? []
  return (
    <aside aria-label={t('More to read')} className="hidden lg:block">
      <div className="sticky top-24 flex flex-col gap-8">
        {asked.length > 0 && (
          <RailList id="trending-questions" title={t('Trending questions')}>
            {asked.map((question) => (
              <RailItem key={question.questionId} to={`/questions/${question.questionId}`} meta={t(question.answerCount === 1 ? '{n} answer' : '{n} answers', { n: formatNumber(question.answerCount ?? 0) })}>
                {question.title}
              </RailItem>
            ))}
          </RailList>
        )}
        {top.length > 0 && (
          <RailList id="trending-stories" title={t('Trending stories')}>
            {top.map((story) => (
              <RailItem key={story.id} to={`/stories/${story.slug}`} meta={story.author?.name}>
                {story.title}
              </RailItem>
            ))}
          </RailList>
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
                  <RailFollow expert={expert} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  )
}

/** A quiet Follow for the rail (a full pill would crowd the name); hidden on your own row. */
function RailFollow({ expert }: { expert: ExpertSummary }) {
  const t = useT()
  const { status, user } = useSession()
  const toggle = useToggleAuthorFollow()
  const requireSignIn = useRequireSignIn()
  if (expert.authorId == null || (user?.id != null && user.id === expert.userId)) return null
  const following = status === 'signed-in' && Boolean(expert.followedByMe)
  return (
    <button
      type="button"
      aria-pressed={status === 'signed-in' ? following : undefined}
      aria-label={`${following ? t('Following') : t('Follow')} ${expert.name ?? ''}`}
      disabled={toggle.isPending}
      onClick={() => requireSignIn(() => toggle.mutate({ authorId: expert.authorId!, follow: !following }))}
      className={cn(
        'h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors duration-150 disabled:opacity-60',
        following ? 'text-muted-foreground hover:bg-surface hover:text-foreground' : 'bg-surface text-primary hover:bg-secondary',
      )}
    >
      {following ? t('Following') : t('Follow')}
    </button>
  )
}

function RailList({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-sans text-sm font-semibold">
        {title}
      </h2>
      <ol className="mt-3 flex flex-col gap-3 [counter-reset:rail]">{children}</ol>
    </section>
  )
}

/** A numbered rail entry: the title as a link, a quiet line under it. */
function RailItem({ to, meta, children }: { to: string; meta?: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] text-sm leading-snug [counter-increment:rail] before:text-muted-foreground before:tabular-nums before:content-[counter(rail)]">
      <span>
        <Link to={to} className="line-clamp-2 hover:text-primary hover:underline">
          {children}
        </Link>
        {meta && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
    </li>
  )
}
