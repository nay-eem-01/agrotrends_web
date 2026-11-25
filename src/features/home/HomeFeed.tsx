import { ChatCircleText, Sparkle } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { useMyAuthorProfile } from '../../api/authors'
import { useTopicStories } from '../../api/blogs'
import { errorMessage } from '../../api/errors'
import { useCategories, useFollowedCategories } from '../../api/categories'
import { useRecommendedExperts, type ExpertSummary } from '../../api/experts'
import { useFeed, useTrendingQuestions } from '../../api/feed'
import { useToggleAuthorFollow } from '../../api/follows'
import { useQuestions } from '../../api/questions'
import { useFollowedTags } from '../../api/topics'
import type { StorySummary } from '../../api/types'
import { storyDate } from '../../lib/dates'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { CoverFallback } from '../../ui/Botanical'
import { Button, ButtonLink } from '../../ui/Button'
import { FormError } from '../../ui/FormValidation'
import { RowsSkeleton } from '../../ui/LoadingSkeleton'
import { useSession } from '../auth/session'
import { QuestionCard } from '../qa/QuestionRow'
import { TopicChips } from '../topics/TopicChips'
import { FeedHighlight } from './FeedHighlight'

type Show = 'questions' | 'stories'

/**
 * `/` for signed-in readers: a composer, then Questions | Stories as two tabs above topic filters, with what's
 * trending and people to follow on the right. The app's sidebar lists people the reader already follows. One kind at a
 * time, never mixed. The tab, topic and sort live in the URL (`?show=stories&topic=2`, `?unanswered=true`), so a tab
 * can be linked and Back works. On smaller screens the feed includes one recommendation from the other tab.
 */
export function HomeFeed() {
  const t = useT()
  const [params] = useSearchParams()
  const show: Show = params.get('show') === 'stories' ? 'stories' : 'questions'
  const topic = Number(params.get('topic')) || undefined
  const unanswered = show === 'questions' && params.get('unanswered') === 'true'
  const categories = useCategories()
  const highlights = useHomeHighlights()
  // For you opens by default when the reader follows a category or tag.
  const followed = useFollowedTags(true)
  const followedCategories = useFollowedCategories(true)
  const hasFollows = Boolean(followed.data?.length || followedCategories.data?.length)
  const scope = params.get('scope')
  const forYou = show === 'questions' && !topic && (scope === 'following' || (scope !== 'all' && hasFollows))
  // Until the followed tags are known, the default view isn't either; nothing is read twice.
  const deciding = show === 'questions' && !topic && scope == null && !hasFollows && (followed.isPending || followedCategories.isPending)
  // The tab, topic and sort as one link; switching tabs keeps the topic and drops the questions-only sort.
  const to = (next: { show?: Show; topic?: number; unanswered?: boolean; scope?: 'following' | 'all' }) => {
    const query = new URLSearchParams()
    const tab = next.show ?? show
    const id = 'topic' in next ? next.topic : topic
    if (tab === 'stories') query.set('show', 'stories')
    if (id) query.set('topic', String(id))
    else if (tab === 'questions' && next.scope) query.set('scope', next.scope)
    else if (tab === 'questions' && !('topic' in next) && scope) query.set('scope', scope)
    if (tab === 'questions' && ('unanswered' in next ? next.unanswered : unanswered)) query.set('unanswered', 'true')
    const search = query.toString()
    return search ? `/?${search}` : '/'
  }
  const tabs = [
    { show: 'questions' as const, label: t('Questions') },
    { show: 'stories' as const, label: t('Stories') },
  ]

  return (
    <div className="mx-auto grid max-w-[84rem] gap-8 px-4 pt-3 pb-4 sm:px-8 sm:pt-6 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:gap-10">
      <title>{t('AgroTrends – farming questions, stories and advice')}</title>
      <h1 className="sr-only">{t('Home')}</h1>
      <section aria-label={t('Your feed')} className="min-w-0">
        <Composer />
        <nav aria-label={t('Show')} className="mt-1 flex gap-7 border-b border-border sm:mt-2">
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
        <div className="flex min-w-0 flex-col items-start gap-2 py-2.5 sm:gap-3 sm:py-4">
          <TopicChips scrollOnMobile categories={categories.data ?? []} selected={topic} renderTopic={(category) => (
            <TopicChip to={to({ topic: category.id })} current={topic === category.id}>{category.categoryName}</TopicChip>
          )}>
            {show === 'questions' && (
              <li><TopicChip to={to({ topic: undefined, scope: 'following' })} current={forYou}>{t('For you')}</TopicChip></li>
            )}
            <li><TopicChip to={to({ topic: undefined, scope: 'all' })} current={!topic && !forYou}>{t('All')}</TopicChip></li>
          </TopicChips>
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
        <MobileHighlight show={show} highlights={highlights} />
        {show === 'questions' ? <QuestionList topic={topic} unanswered={unanswered} following={forYou} waiting={deciding} /> : <StoryList topic={topic} />}
      </section>
      <Rail highlights={highlights} />
    </div>
  )
}

/** The Questions tab: newest (or unanswered) questions in the topic, or in the tags you follow (For you). */
function QuestionList({ topic, unanswered, following, waiting }: { topic?: number; unanswered: boolean; following: boolean; waiting: boolean }) {
  const t = useT()
  const questions = useQuestions({ ...(topic ? { categoryId: topic } : {}), ...(unanswered ? { unanswered: true } : {}), ...(following ? { following: true } : {}) }, !waiting)
  const items = questions.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <FeedList
      kind="question"
      loading={waiting || questions.isPending}
      error={questions.isError ? errorMessage(questions.error) : undefined}
      onRetry={() => void questions.refetch()}
      empty={
        following
          ? t('Nothing yet in the topics you follow. Follow more topics, or see all questions.')
          : topic
            ? t('No questions in this topic yet. Ask the first one.')
            : t('No questions yet. Ask the first one.')
      }
      action={
        following ? (
          <ButtonLink to="/topics" variant="secondary">
            {t('Follow topics')}
          </ButtonLink>
        ) : (
          <ButtonLink to="/questions/ask">
            <ChatCircleText size={18} aria-hidden="true" />
            {t('Ask a question')}
          </ButtonLink>
        )
      }
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
      kind="story"
      loading={stories.isPending}
      error={stories.isError ? errorMessage(stories.error) : undefined}
      onRetry={() => void stories.refetch()}
      empty={topic ? t('No stories in this topic yet.') : t('No stories yet.')}
      action={
        <ButtonLink to="/write" variant="secondary">
          {t('Write a story')}
        </ButtonLink>
      }
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

function FeedList({
  kind,
  loading,
  error,
  onRetry,
  empty,
  action,
  more,
  loadingMore,
  onMore,
  children,
}: {
  kind: 'question' | 'story'
  loading: boolean
  error?: string
  onRetry: () => void
  empty: string
  action: ReactNode
  more: boolean
  loadingMore: boolean
  onMore: () => void
  children: ReactNode[]
}) {
  const t = useT()
  if (loading)
    return <RowsSkeleton label={t('Loading your feed')} kind={kind} />
  if (error && children.length === 0)
    return (
      <div className="space-y-3 py-4">
        <FormError message={error} />
        <Button variant="secondary" size="sm" onClick={onRetry}>{t('Try again')}</Button>
      </div>
    )
  // An empty list says so and offers the one action that fills it.
  if (children.length === 0)
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-muted-foreground">{empty}</p>
        {action}
      </div>
    )
  return (
    <>
      <ul className="border-t border-border">{children}</ul>
      {error && <FormError message={error} />}
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
        'inline-flex min-h-9 max-w-full items-center rounded-full px-4 py-1 text-sm font-medium wrap-anywhere transition-colors duration-150',
        current ? 'bg-foreground text-background' : 'bg-surface text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </Link>
  )
}

/** The two ways to ask, named by who sees them: a public question, or the AI advisor in private. */
function Composer() {
  const t = useT()
  const { user } = useSession()
  const photo = useMyAuthorProfile(user != null).data?.profileImageUrl
  return (
    <div className="mb-2 flex items-center gap-3 rounded-full bg-surface py-2 pr-2 pl-2">
      <Avatar name={user?.name ?? '?'} src={photo} size={32} />
      <Link to="/questions/ask" className="flex min-h-9 min-w-0 flex-1 items-center text-sm text-muted-foreground hover:text-foreground">
        {t('Ask a question')}
      </Link>
      <Link to="/advisor" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-background px-3 text-sm font-semibold hover:border-subtle">
        <Sparkle size={16} aria-hidden="true" />
        {t('Private AI')}
      </Link>
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
            <Avatar name={story.author.name} src={story.author.profileImageUrl} size={20} />
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

function useHomeHighlights() {
  const trending = useFeed('trending')
  const questions = useTrendingQuestions()
  const top = (trending.data?.pages[0]?.content ?? []).slice(0, 4)
  const asked = questions.data?.content ?? []
  // Fall back to unanswered questions and recent stories when there is nothing trending.
  const waiting = useQuestions({ unanswered: true }, !questions.isPending && asked.length === 0)
  const latest = useFeed('latest', !trending.isPending && top.length === 0)
  const open = (waiting.data?.pages[0]?.content ?? []).slice(0, 4)
  const fresh = (latest.data?.pages[0]?.content ?? []).slice(0, 4)
  return { top, asked, open, fresh }
}

function MobileHighlight({ show, highlights: { top, asked, open, fresh } }: { show: Show; highlights: ReturnType<typeof useHomeHighlights> }) {
  const t = useT()
  const story = top[0] ?? fresh[0]
  const question = asked[0] ?? open[0]
  const highlight = show === 'questions'
    ? story?.title && story.slug && <FeedHighlight label={t(top.length ? 'Top story' : 'Latest story')} title={story.title} to={`/stories/${story.slug}`} image={story.imageUrl} />
    : question?.title && question.questionId && <FeedHighlight label={t(asked.length ? 'Trending question' : 'Waiting for an answer')} title={question.title} to={`/questions/${question.questionId}`} />

  if (!highlight) return null
  return <section aria-label={t('Recommended reading')} className="mb-3 xl:hidden">{highlight}</section>
}

/** The advisor, trending questions and stories, and experts to follow. */
function Rail({ highlights: { top, asked, open, fresh } }: { highlights: ReturnType<typeof useHomeHighlights> }) {
  const t = useT()
  const experts = useRecommendedExperts()
  return (
    <aside aria-label={t('More to read')} className="min-w-0">
      <div className="flex flex-col gap-8 xl:sticky xl:top-24">
        <section aria-labelledby="ask-advisor" className="hidden flex-col gap-2 rounded-xl bg-surface p-4 sm:flex">
          <h2 id="ask-advisor" className="flex items-center gap-1.5 font-sans text-sm font-semibold">
            <Sparkle size={16} aria-hidden="true" className="text-primary" />
            {t('Ask the AI advisor')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('Answers come with the stories they draw on.')}</p>
          <Link to="/advisor" className="mt-1 inline-flex h-9 items-center self-start rounded-full border border-border-strong bg-background px-3.5 text-sm font-semibold hover:border-subtle">
            {t('Open the advisor')}
          </Link>
        </section>
        {asked.length > 0 ? (
          <RailList id="trending-questions" title={t('Trending questions')}>
            {asked.map((question) => (
              <RailItem key={question.questionId} to={`/questions/${question.questionId}`} meta={t(question.answerCount === 1 ? '{n} answer' : '{n} answers', { n: formatNumber(question.answerCount ?? 0) })}>
                {question.title}
              </RailItem>
            ))}
          </RailList>
        ) : (
          open.length > 0 && (
            <RailList id="waiting-questions" title={t('Waiting for an answer')}>
              {open.map((question) => (
                <RailItem key={question.questionId} to={`/questions/${question.questionId}`} meta={question.category?.categoryName}>
                  {question.title}
                </RailItem>
              ))}
            </RailList>
          )
        )}
        {top.length > 0 ? (
          <RailList id="trending-stories" title={t('Top stories')}>
            {top.map((story) => (
              <RailItem key={story.id} to={`/stories/${story.slug}`} meta={story.author?.name}>
                {story.title}
              </RailItem>
            ))}
          </RailList>
        ) : (
          fresh.length > 0 && (
            <RailList id="new-stories" title={t('New stories')}>
              {fresh.map((story) => (
                <RailItem key={story.id} to={`/stories/${story.slug}`} meta={story.author?.name}>
                  {story.title}
                </RailItem>
              ))}
            </RailList>
          )
        )}
        <section aria-labelledby="who-to-follow">
          <h2 id="who-to-follow" className="font-sans text-sm font-semibold">{t('Who to follow')}</h2>
          {experts.isPending ? (
            <RowsSkeleton kind="avatar" count={2} className="mt-3" />
          ) : experts.isError ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <p role="alert">{t('Could not load recommendations.')}</p>
              <Button variant="secondary" size="sm" onClick={() => void experts.refetch()}>{t('Try again')}</Button>
            </div>
          ) : experts.data.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t('No expert recommendations for your topics yet.')}{' '}
              <Link to="/topics" className="text-primary underline-offset-4 hover:underline">{t('Explore topics')}</Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {experts.data.map((expert) => (
                <li key={expert.userId} className="flex items-start gap-2.5 text-sm">
                  <Avatar name={expert.name ?? ''} src={expert.avatarUrl} size={32} className="shrink-0" />
                  <Link to={`/users/${expert.userId}`} state={{ name: expert.name }} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold hover:underline">{expert.name}</span>
                    <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{[expert.expertField, expert.institution].filter(Boolean).join(' · ')}</span>
                  </Link>
                  <RailFollow expert={expert} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  )
}

function RailFollow({ expert }: { expert: ExpertSummary }) {
  const t = useT()
  const toggle = useToggleAuthorFollow()
  if (expert.authorId == null) return null
  const authorId = expert.authorId
  const following = toggle.isPending || toggle.isSuccess
  return (
    <Button
      variant="secondary"
      size="sm"
      aria-label={following ? t('Following {name}', { name: expert.name ?? '' }) : t('Follow {name}', { name: expert.name ?? '' })}
      aria-pressed={following}
      disabled={following}
      onClick={() => toggle.mutate({ authorId, follow: true })}
    >
      {following ? t('Following') : t('Follow')}
    </Button>
  )
}

function RailList({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="hidden sm:block">
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
