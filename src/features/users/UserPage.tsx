import { Trophy } from '@phosphor-icons/react'
import { useLocation, useParams } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useReputation, useUserQuestions } from '../../api/reputation'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { NotFoundPage } from '../errors/NotFoundPage'
import { useSession } from '../auth/session'
import { BadgeMark } from '../qa/AuthorLine'
import { ReportButton } from '../reports/ReportButton'
import { QuestionCard } from '../qa/QuestionsPage'

/**
 * `/users/:userId`: reputation by topic, with badges, and the questions they asked. The backend has no public user
 * read, so the name comes from the link that led here, or from their questions.
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

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{`${name} – AgroTrends`}</title>
      <div className="flex items-center gap-4">
        <Avatar name={name} size={64} />
        <div>
          <h1 className="text-2xl sm:text-3xl">{name}</h1>
          {reputation.data && (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Trophy size={18} aria-hidden="true" />
              {t('{n} reputation', { n: formatNumber(reputation.data.total ?? 0) })}
            </p>
          )}
        </div>
        <ReportButton targetType="USER" targetId={userId} own={user?.id === userId} what={t('this profile')} className="ml-auto self-start" />
      </div>

      <section aria-labelledby="by-topic" className="mt-10">
        <h2 id="by-topic" className="text-xl">
          {t('Reputation by topic')}
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
          <ul className="mt-4 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {reputation.data.topics!.map((topic) => (
              <li key={topic.categoryId} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-4 last:border-b-0">
                <span className="min-w-0 flex-1 font-medium">{topic.categoryName}</span>
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

      <section aria-labelledby="asked" className="mt-12">
        <h2 id="asked" className="text-xl">
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
            <ul className="mt-4 flex flex-col gap-3">
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
    </section>
  )
}
