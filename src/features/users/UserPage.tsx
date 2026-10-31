import { CalendarBlank, Certificate, MapPin, PencilSimple, SealCheck, ShareNetwork } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { isAdmin } from '../../api/auth'
import { useAuthor, useAuthorStories } from '../../api/authors'
import { useMyDrafts } from '../../api/blogs'
import { errorMessage } from '../../api/errors'
import { useReadingList, useToggleAuthorFollow } from '../../api/follows'
import { useReputation, useUserQuestions } from '../../api/reputation'
import type { StorySummary } from '../../api/types'
import { useUserAnswers, useUserProfile } from '../../api/users'
import { storyDate } from '../../lib/dates'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { BanControls } from '../admin/BanControls'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { StoryCard } from '../feed/StoryCard'
import { BadgeMark } from '../qa/AuthorLine'
import { QuestionCard } from '../qa/QuestionRow'
import { ReportButton } from '../reports/ReportButton'

type Tab = 'overview' | 'stories' | 'questions' | 'answers' | 'drafts' | 'saved'

/**
 * `/users/:userId`, after a LinkedIn profile: a cover, the photo over its edge, the name in Lora, the headline, where
 * they are and who follows them, a row of numbers, then tabs. Overview has their credentials and the topics they answer
 * on beside their recent contributions; on your own profile, your drafts and your questions instead, and a nudge to
 * finish the profile. Headline, bio, photo and follow come from the author profile; the way from a user to it (and
 * location, credentials, answers) needs `docs/BACKEND_REQUESTS.md` §1 and §3, and the page falls back without them.
 */
export function UserPage() {
  const t = useT()
  const userId = Number(useParams().userId)
  const [params, setParams] = useSearchParams()
  const fromLink = (useLocation().state as { name?: string } | null)?.name
  const { user } = useSession()
  const own = user?.id === userId
  const profile = useUserProfile(userId)
  const authorId = (own ? user?.authorId : profile.data?.authorId) ?? undefined
  const author = useAuthor(authorId ?? NaN, authorId != null)
  const reputation = useReputation(userId)
  const questions = useUserQuestions(userId)
  const answers = useUserAnswers(userId)
  const list = questions.data?.pages.flatMap((page) => page.content) ?? []
  // Only a real page of answers opens the tab (an older backend answers 404, or nothing at all).
  const answerPages = answers.data?.pages?.filter((page) => Array.isArray(page?.content)) ?? []
  const name = profile.data?.name ?? author.data?.name ?? fromLink ?? (own ? user?.name : undefined) ?? list[0]?.authorName ?? t('Member')

  if (!Number.isInteger(userId) || userId <= 0) return <NotFoundPage />

  const topics = reputation.data?.topics ?? []
  const expertIn = topics.filter((topic) => topic.badges?.includes('VERIFIED_EXPERT'))
  const field = expertIn.find((topic) => topic.expertField)?.expertField
  const a = author.data
  const headline = [a?.designation || a?.occupation, a?.workPlaceOrInstitution].filter(Boolean).join(' · ') || field
  const p = profile.data
  const stats = p
    ? [
        { label: t('Reputation'), value: reputation.data?.total },
        { label: t('Answers'), value: p.answerCount },
        { label: t('Accepted'), value: p.acceptedAnswerCount },
        { label: t('Stories'), value: p.storyCount },
      ]
    : [
        { label: t('Reputation'), value: reputation.data?.total },
        { label: t('Accepted answers'), value: reputation.data ? topics.reduce((sum, topic) => sum + (topic.acceptedAnswers ?? 0), 0) : undefined },
        { label: t('Questions'), value: questions.data ? (questions.data.pages[0]?.totalElements ?? list.length) : undefined },
        { label: t('Topics'), value: reputation.data ? topics.length : undefined },
      ]
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: t('Overview') },
    ...(authorId != null ? [{ id: 'stories' as const, label: t('Stories'), count: a?.publishedPostCount }] : []),
    { id: 'questions', label: t('Questions'), count: questions.data?.pages[0]?.totalElements },
    ...(answerPages.length > 0 ? [{ id: 'answers' as const, label: t('Answers'), count: answerPages[0].totalElements }] : []),
    ...(own ? [{ id: 'drafts' as const, label: t('Drafts') }, { id: 'saved' as const, label: t('Saved') }] : []),
  ]
  const asked = params.get('tab') as Tab | null
  const tab: Tab = tabs.some((item) => item.id === asked) ? asked! : 'overview'

  return (
    <section className="mx-auto max-w-[68rem] px-4 pt-6 pb-20 sm:px-8">
      <title>{`${name} – AgroTrends`}</title>
      <div aria-hidden="true" className="relative h-28 overflow-hidden rounded-2xl bg-surface sm:h-36">
        {p?.coverUrl ? (
          <img src={p.coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="absolute -top-16 right-10 size-48 rounded-full bg-mustard-soft" />
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 sm:px-6">
        <Avatar name={name} src={a?.profileImageUrl || undefined} size={88} className="relative -mt-11 ring-4 ring-background" />
        <div className="flex items-center gap-2">
          {own ? (
            <>
              <ShareButton />
              <ButtonLink to="/settings" variant="secondary" size="sm">
                <PencilSimple size={16} aria-hidden="true" />
                {t('Edit profile')}
              </ButtonLink>
            </>
          ) : (
            <>
              <ReportButton targetType="USER" targetId={userId} own={false} what={t('this profile')} />
              {authorId != null && a && <FollowButton authorId={authorId} following={Boolean(a.followedByMe)} name={name} />}
            </>
          )}
        </div>
      </div>
      <div className="mt-3 px-1 sm:px-6">
        <h1 className="font-serif text-[1.75rem] leading-tight font-semibold sm:text-[2rem]">{name}</h1>
        {headline && <p className="mt-1 text-foreground">{headline}</p>}
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {p?.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={16} aria-hidden="true" />
              {p.location}
            </span>
          )}
          {expertIn.length > 0 && (
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-mustard-soft px-2.5 text-xs font-semibold text-mustard-ink">
              <SealCheck size={14} weight="fill" aria-hidden="true" />
              {t('Verified expert in {topics}', { topics: expertIn.map((topic) => topic.categoryName).join(', ') })}
            </span>
          )}
          {a?.followerCount != null && <span>{t('{n} followers', { n: formatNumber(a.followerCount) })}</span>}
          {p?.joinedAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarBlank size={16} aria-hidden="true" />
              {t('Joined {date}', { date: storyDate(p.joinedAt) })}
            </span>
          )}
        </p>
        {own && a && <ProfileNudge filled={[a.designation || a.occupation, a.workPlaceOrInstitution, a.bio, a.profileImageUrl, a.specialities?.length]} />}
        <dl className="mt-6 grid grid-cols-2 border-y border-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse py-4">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{stat.value != null ? formatNumber(stat.value) : '–'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {isAdmin(user) && !own && (
        <section aria-label="Staff" className="mt-6 rounded-xl border border-dashed border-input p-4">
          <p className="mb-3 text-sm text-muted-foreground">Staff</p>
          <BanControls userId={userId} name={name} />
        </section>
      )}

      <nav aria-label={t('Profile sections')} className="mt-6 flex gap-6 overflow-x-auto border-b border-border px-1 [scrollbar-width:none] sm:px-6">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setParams(item.id === 'overview' ? {} : { tab: item.id }, { replace: true })}
            className={cn(
              '-mb-px flex h-12 items-center gap-1.5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-150',
              tab === item.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count != null && <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(item.count)}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-8 px-1 sm:px-6">
        {tab === 'overview' && (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="flex flex-col gap-10">
              {a?.bio && (
                <section aria-labelledby="about">
                  <h2 id="about" className="text-lg">
                    {t('About')}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-muted-foreground">{a.bio}</p>
                </section>
              )}
              <Credentials credentials={p?.credentials} expertIn={expertIn} />
              <section aria-labelledby="by-topic">
                <h2 id="by-topic" className="text-lg">
                  {t('Answers questions on')}
                </h2>
                {reputation.isPending ? (
                  <Spinner label={t('Loading')} />
                ) : reputation.isError ? (
                  <p role="alert" className="mt-3 text-muted-foreground">
                    {errorMessage(reputation.error)}
                  </p>
                ) : topics.length === 0 ? (
                  <p className="mt-3 text-muted-foreground">{t('No reputation yet. Points come from upvotes and accepted answers.')}</p>
                ) : (
                  <ul className="mt-3 overflow-hidden rounded-xl border border-border">
                    {topics.map((topic) => (
                      <li key={topic.categoryId} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-4 last:border-b-0">
                        <span className="mr-auto font-medium">{topic.categoryName}</span>
                        {(topic.badges ?? []).map((badge) => (
                          <BadgeMark key={badge} badge={badge} field={badge === 'VERIFIED_EXPERT' ? topic.expertField : null} />
                        ))}
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {t('{n} points', { n: formatNumber(topic.points ?? 0) })} · {t('{n} accepted', { n: formatNumber(topic.acceptedAnswers ?? 0) })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {(a?.specialities?.length ?? 0) > 0 && (
                  <ul aria-label={t('Specialities')} className="mt-3 flex flex-wrap gap-2">
                    {a!.specialities!.map((speciality) => (
                      <li key={speciality} className="rounded-full bg-surface px-3 py-1.5 text-sm">
                        {speciality}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('Points: a question upvoted +5, an answer upvoted +10, downvoted −2, an accepted answer +15 (and +2 to the asker).')}
                </p>
              </section>
            </div>
            {own ? <YourWork questions={list} loading={questions.isPending} /> : <RecentContributions questions={list} answers={answerPages[0]?.content ?? []} authorId={authorId} />}
          </div>
        )}
        {tab === 'stories' && authorId != null && <AuthorStories authorId={authorId} />}
        {tab === 'questions' && (
          <Listing loading={questions.isPending} error={questions.error} empty={t('No questions yet.')} count={list.length}>
            <ul className="border-t border-border">
              {list.map((question) => (
                <QuestionCard key={question.questionId} question={question} />
              ))}
            </ul>
            {questions.hasNextPage && <More loading={questions.isFetchingNextPage} onClick={() => void questions.fetchNextPage()} />}
          </Listing>
        )}
        {tab === 'answers' && answerPages.length > 0 && (
          <Listing loading={false} error={null} empty={t('No answers yet.')} count={answerPages[0].content.length}>
            <ul className="border-t border-border">
              {answerPages.flatMap((page) => page.content).map((answer) => (
                <li key={answer.answerId} className="border-b border-border py-4">
                  <Link to={`/questions/${answer.questionId}#answer-${answer.answerId}`} className="font-semibold hover:underline">
                    {answer.questionTitle ?? t('An answer')}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('{n} votes', { n: formatNumber(answer.score ?? 0) })}
                    {answer.accepted && ` · ${t('Accepted')}`} · {storyDate(answer.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            {answers.hasNextPage && <More loading={answers.isFetchingNextPage} onClick={() => void answers.fetchNextPage()} />}
          </Listing>
        )}
        {tab === 'drafts' && own && <Drafts />}
        {tab === 'saved' && own && <Saved />}
      </div>
    </section>
  )
}

function ShareButton() {
  const t = useT()
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true))
      }}
    >
      <ShareNetwork size={16} aria-hidden="true" />
      {copied ? t('Link copied') : t('Share')}
    </Button>
  )
}

function FollowButton({ authorId, following, name }: { authorId: number; following: boolean; name: string }) {
  const t = useT()
  const toggle = useToggleAuthorFollow()
  const requireSignIn = useRequireSignIn()
  return (
    <Button
      size="sm"
      variant={following ? 'secondary' : 'primary'}
      aria-pressed={following}
      aria-label={following ? t('Unfollow {name}', { name }) : t('Follow {name}', { name })}
      onClick={() => requireSignIn(() => toggle.mutate({ authorId, follow: !following }))}
    >
      {following ? t('Following') : t('Follow')}
    </Button>
  )
}

/** How much of your public profile is filled in, and where to finish it. */
function ProfileNudge({ filled }: { filled: unknown[] }) {
  const t = useT()
  const done = Math.round((filled.filter(Boolean).length / filled.length) * 100)
  if (done === 100) return null
  return (
    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl bg-surface p-4">
      <div>
        <p className="text-sm font-semibold">{t('Your profile is {n}% done', { n: done })}</p>
        <p className="text-sm text-muted-foreground">{t('Add your work, a photo and what you know about, so people know who is answering.')}</p>
        <progress
          value={done}
          max={100}
          aria-label={t('Profile done')}
          className="mt-2.5 block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-background [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-background [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
        />
      </div>
      <ButtonLink to="/settings" size="sm">
        {t('Finish profile')}
      </ButtonLink>
    </div>
  )
}

/** Credentials from the profile (§1), or the topics they are a verified expert in until it exists. */
function Credentials({ credentials, expertIn }: { credentials?: { title: string; institution?: string | null; year?: number | null }[]; expertIn: { categoryId?: number; categoryName?: string; expertField?: string | null }[] }) {
  const t = useT()
  const items = credentials?.length
    ? credentials.map((credential, index) => ({ key: String(index), title: credential.title, text: [credential.institution, credential.year].filter(Boolean).join(' · ') }))
    : expertIn.map((topic) => ({ key: String(topic.categoryId), title: topic.expertField || t('Verified expert'), text: t('Verified expert in {topics}', { topics: topic.categoryName ?? '' }) }))
  if (items.length === 0) return null
  return (
    <section aria-labelledby="credentials">
      <h2 id="credentials" className="text-lg">
        {t('Credentials')}
      </h2>
      <ul className="mt-3 flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 text-sm">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
              <Certificate size={18} />
            </span>
            <span>
              <span className="block font-semibold">{item.title}</span>
              <span className="text-muted-foreground">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Others' profiles: their latest questions, answers and stories as one short list. */
function RecentContributions({ questions, answers, authorId }: { questions: { questionId?: number; title?: string; createdAt?: string; answerCount?: number }[]; answers: { answerId?: number; questionId?: number; questionTitle?: string; createdAt?: string; score?: number; accepted?: boolean }[]; authorId?: number }) {
  const t = useT()
  const stories = useAuthorStories(authorId ?? NaN)
  const items = [
    ...questions.map((question) => ({ key: `q${question.questionId}`, at: question.createdAt ?? '', kind: t('Question'), title: question.title ?? '', to: `/questions/${question.questionId}` })),
    ...answers.map((answer) => ({ key: `a${answer.answerId}`, at: answer.createdAt ?? '', kind: answer.accepted ? t('Accepted answer') : t('Answer'), title: answer.questionTitle ?? '', to: `/questions/${answer.questionId}#answer-${answer.answerId}` })),
    ...(authorId != null ? (stories.data?.pages[0]?.content ?? []) : []).map((story) => ({ key: `s${story.id}`, at: story.publishedAt ?? '', kind: t('Story'), title: story.title ?? '', to: `/stories/${story.slug}` })),
  ]
    .sort((x, y) => y.at.localeCompare(x.at))
    .slice(0, 6)
  return (
    <section aria-labelledby="recent">
      <h2 id="recent" className="text-lg">
        {t('Recent contributions')}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{t('Nothing yet.')}</p>
      ) : (
        <ul className="mt-2">
          {items.map((item) => (
            <li key={item.key} className="border-b border-border py-3">
              <p className="text-xs text-muted-foreground">
                {item.kind} · {storyDate(item.at)}
              </p>
              <Link to={item.to} className="font-semibold hover:underline">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Your own profile: drafts to continue and your questions with where they stand. */
function YourWork({ questions, loading }: { questions: { questionId?: number; title?: string; createdAt?: string; answerCount?: number; acceptedAnswerId?: number | null; category?: { categoryName?: string } | null }[]; loading: boolean }) {
  const t = useT()
  const drafts = useMyDrafts()
  const draftList = drafts.data?.pages[0]?.content.slice(0, 3) ?? []
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="your-drafts">
        <h2 id="your-drafts" className="text-lg">
          {t('Drafts')}
        </h2>
        {draftList.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{drafts.isPending ? t('Loading') : t('No drafts. Start a story when you have something to share.')}</p>
        ) : (
          <ul className="mt-1">
            {draftList.map((draft) => (
              <DraftRow key={draft.id} draft={draft} />
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="your-questions">
        <h2 id="your-questions" className="text-lg">
          {t('Your questions')}
        </h2>
        {loading ? (
          <Spinner label={t('Loading questions')} />
        ) : questions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('No questions yet.')}</p>
        ) : (
          <ul className="mt-1">
            {questions.slice(0, 4).map((question) => {
              const answered = (question.answerCount ?? 0) > 0
              return (
                <li key={question.questionId} className="flex items-center gap-3 border-b border-border py-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/questions/${question.questionId}`} className="font-semibold hover:underline">
                      {question.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[question.category?.categoryName, t(question.answerCount === 1 ? '{n} answer' : '{n} answers', { n: formatNumber(question.answerCount ?? 0) }), storyDate(question.createdAt)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', answered ? 'bg-mustard-soft text-mustard-ink' : 'bg-surface text-muted-foreground')}>
                    {question.acceptedAnswerId != null ? t('Accepted') : answered ? t('Answered') : t('Waiting')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function DraftRow({ draft }: { draft: StorySummary }) {
  const t = useT()
  return (
    <li className="flex items-center gap-3 border-b border-border py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{draft.title || t('Untitled draft')}</p>
        <p className="text-xs text-muted-foreground">{t('Edited {date}', { date: storyDate(draft.updatedAt ?? draft.createdAt) })}</p>
      </div>
      <ButtonLink to={`/write/${draft.id}`} variant="secondary" size="sm">
        {t('Continue')}
      </ButtonLink>
    </li>
  )
}

function AuthorStories({ authorId }: { authorId: number }) {
  const t = useT()
  const stories = useAuthorStories(authorId)
  const list = stories.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <Listing loading={stories.isPending} error={stories.error} empty={t('No stories yet.')} count={list.length}>
      {list.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
      {stories.hasNextPage && <More loading={stories.isFetchingNextPage} onClick={() => void stories.fetchNextPage()} />}
    </Listing>
  )
}

function Drafts() {
  const t = useT()
  const drafts = useMyDrafts()
  const list = drafts.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <Listing loading={drafts.isPending} error={drafts.error} empty={t('No drafts. Start a story when you have something to share.')} count={list.length}>
      <ul>
        {list.map((draft) => (
          <DraftRow key={draft.id} draft={draft} />
        ))}
      </ul>
      {drafts.hasNextPage && <More loading={drafts.isFetchingNextPage} onClick={() => void drafts.fetchNextPage()} />}
    </Listing>
  )
}

function Saved() {
  const t = useT()
  const saved = useReadingList()
  const list = saved.data?.pages.flatMap((page) => page.content) ?? []
  return (
    <Listing loading={saved.isPending} error={saved.error} empty={t('Nothing saved yet. Save a story to read it later.')} count={list.length}>
      {list.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
      {saved.hasNextPage && <More loading={saved.isFetchingNextPage} onClick={() => void saved.fetchNextPage()} />}
    </Listing>
  )
}

function Listing({ loading, error, empty, count, children }: { loading: boolean; error: unknown; empty: string; count: number; children: ReactNode }) {
  const t = useT()
  if (loading) return <Spinner label={t('Loading')} />
  if (error)
    return (
      <p role="alert" className="text-muted-foreground">
        {errorMessage(error)}
      </p>
    )
  if (count === 0) return <p className="text-muted-foreground">{empty}</p>
  return <>{children}</>
}

function More({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const t = useT()
  return (
    <div className="flex justify-center py-6">
      <Button variant="secondary" size="sm" loading={loading} onClick={onClick}>
        {t('Show more')}
      </Button>
    </div>
  )
}
