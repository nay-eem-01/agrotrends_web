import { PencilSimple, SealCheck } from '@phosphor-icons/react'
import { useLocation, useParams } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useReputation, useUserQuestions } from '../../api/reputation'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { NotFoundPage } from '../errors/NotFoundPage'
import { isAdmin } from '../../api/auth'
import { BanControls } from '../admin/BanControls'
import { useSession } from '../auth/session'
import { BadgeMark } from '../qa/AuthorLine'
import { ReportButton } from '../reports/ReportButton'
import { QuestionCard } from '../qa/QuestionRow'

/**
 * `/users/:userId`: a profile after LinkedIn's: a cover wash, the name in Lora, the expert headline, a row of numbers,
 * then the topics they answer on (reputation and badges) beside the questions they asked. The backend has no public
 * user read, so the name comes from the link that led here, or from their questions.
 */
export function UserPage() {
  const t = useT()
  const userId = Number(useParams().userId)
  const fromLink = (useLocation().state as { name?: string } | null)?.name
  const { user } = useSession()
  const reputation = useReputation(userId)
  const questions = useUserQuestions(userId)
  const list = questions.data?.pages.flatMap((page) => page.content) ?? []
  const name = fromLink ?? list[0]?.authorName ?? t('Member')

  if (!Number.isInteger(userId) || userId <= 0) return <NotFoundPage />

  const own = user?.id === userId
  const topics = reputation.data?.topics ?? []
  const expertIn = topics.filter((topic) => topic.badges?.includes('VERIFIED_EXPERT'))
  const field = expertIn.find((topic) => topic.expertField)?.expertField
  const stats = [
    { label: t('Reputation'), value: reputation.data ? formatNumber(reputation.data.total ?? 0) : '–' },
    { label: t('Accepted answers'), value: reputation.data ? formatNumber(topics.reduce((sum, topic) => sum + (topic.acceptedAnswers ?? 0), 0)) : '–' },
    { label: t('Questions'), value: questions.data ? formatNumber(questions.data.pages[0]?.totalElements ?? list.length) : '–' },
    { label: t('Topics'), value: reputation.data ? formatNumber(topics.length) : '–' },
  ]

  return (
    <section className="mx-auto max-w-[68rem] px-4 pt-6 pb-20 sm:px-8">
      <title>{`${name} – AgroTrends`}</title>
      {/* The cover is a quiet wash with a mustard sun: decoration until members can add their own. */}
      <div aria-hidden="true" className="relative h-28 overflow-hidden rounded-2xl bg-surface sm:h-36">
        <span className="absolute -top-16 right-10 size-48 rounded-full bg-mustard-soft" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 sm:px-6">
        <Avatar name={name} size={88} className="relative -mt-11 ring-4 ring-background" />
        <div className="flex items-center gap-2">
          {own ? (
            <ButtonLink to="/settings" variant="secondary" size="sm">
              <PencilSimple size={16} aria-hidden="true" />
              {t('Edit profile')}
            </ButtonLink>
          ) : (
            <ReportButton targetType="USER" targetId={userId} own={false} what={t('this profile')} />
          )}
        </div>
      </div>
      <div className="mt-3 px-1 sm:px-6">
        <h1 className="font-serif text-[1.75rem] leading-tight font-semibold sm:text-[2rem]">{name}</h1>
        {(field || expertIn.length > 0) && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
            {field && <span className="text-foreground">{field}</span>}
            {expertIn.length > 0 && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-mustard-soft px-2.5 text-xs font-semibold text-mustard-ink">
                <SealCheck size={14} weight="fill" aria-hidden="true" />
                {t('Verified expert in {topics}', { topics: expertIn.map((topic) => topic.categoryName).join(', ') })}
              </span>
            )}
          </p>
        )}
        <dl className="mt-6 grid grid-cols-2 border-y border-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse py-4">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
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

      <div className="mt-10 grid gap-12 px-1 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
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
          ) : (reputation.data.topics ?? []).length === 0 ? (
            <p className="mt-3 text-muted-foreground">{t('No reputation yet. Points come from upvotes and accepted answers.')}</p>
          ) : (
            <ul className="mt-3 overflow-hidden rounded-xl border border-border">
              {reputation.data.topics!.map((topic) => (
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
          <p className="mt-3 text-xs text-muted-foreground">
            {t('Points: a question upvoted +5, an answer upvoted +10, downvoted −2, an accepted answer +15 (and +2 to the asker).')}
          </p>
        </section>

        <section aria-labelledby="asked">
          <h2 id="asked" className="text-lg">
            {t('Questions asked')}
          </h2>
          {questions.isPending ? (
            <Spinner label={t('Loading questions')} />
          ) : questions.isError ? (
            <p role="alert" className="mt-3 text-muted-foreground">
              {errorMessage(questions.error)}
            </p>
          ) : list.length === 0 ? (
            <p className="mt-3 text-muted-foreground">{t('No questions yet.')}</p>
          ) : (
            <>
              <ul className="mt-2 border-t border-border">
                {list.map((question) => (
                  <QuestionCard key={question.questionId} question={question} />
                ))}
              </ul>
              {questions.hasNextPage && (
                <div className="flex justify-center py-6">
                  <Button variant="secondary" size="sm" loading={questions.isFetchingNextPage} onClick={() => void questions.fetchNextPage()}>
                    {t('Show more questions')}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  )
}
