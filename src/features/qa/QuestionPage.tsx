import { formatNumber, useT } from '../../lib/i18n'
import { useState } from 'react'
import { ArrowLeft, ChatCircleText, Sparkle } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useAiAnswer } from '../../api/aiAnswer'
import { useAnswers } from '../../api/answers'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Button, buttonClass } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { TagList } from '../../ui/TagList'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { useMyVotes } from '../../api/votes'
import { Answers } from './Answers'
import { PostMenu } from '../threads/PostMenu'
import { AiAnswerCard } from './AiAnswerCard'
import { AuthorLine } from './AuthorLine'
import { VoteControl } from './VoteControl'

export function QuestionPage() {
  const t = useT()
  const questionId = Number(useParams().questionId)
  const question = useQuestion(questionId)
  // The answers, the AI answer and the reader's votes need only the id, so they load beside the question instead of
  // after it; the views below read the same cache entries.
  const valid = Number.isFinite(questionId)
  const { status } = useSession()
  const askedAt = (useLocation().state as { askedAt?: number } | null)?.askedAt
  useAnswers(questionId, valid)
  useAiAnswer(questionId, askedAt, valid)
  useMyVotes(questionId, valid && status === 'signed-in')

  if (question.isPending) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Spinner label={t('Loading question')} />
      </div>
    )
  }
  if (question.isError) {
    if (question.error instanceof ApiError && question.error.isNotFound) return <NotFoundPage />
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-muted-foreground sm:px-6">
        {errorMessage(question.error)}
      </p>
    )
  }
  return <QuestionView question={question.data} />
}

function QuestionView({ question }: { question: Question }) {
  const t = useT()
  const { user } = useSession()
  const { status } = useSession()
  const own = user?.id != null && user.id === question.userId
  const id = question.questionId ?? 0
  const myVotes = useMyVotes(id, status === 'signed-in')
  const askedAt = (useLocation().state as { askedAt?: number } | null)?.askedAt
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const agri = question.agri ?? {}
  const chips = [
    agri.crop && { name: t('Crop'), label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions') },
    agri.season && { name: t('Season'), label: t(SEASON_LABELS[agri.season]), to: filterPath({ season: agri.season }, '/questions') },
    agri.region && { name: t('Region'), label: agri.region, to: filterPath({ region: agri.region }, '/questions') },
    agri.soil && { name: t('Soil'), label: t(SOIL_LABELS[agri.soil]), to: filterPath({ soil: agri.soil }, '/questions') },
  ].filter((chip): chip is { name: string; label: string; to: string } => Boolean(chip))

  // Views arrive once the backend counts them (docs/BACKEND_REQUESTS.md §7); until then the row is left out.
  const views = (question as Question & { viewCount?: number }).viewCount

  return (
    <article className="mx-auto max-w-[65rem] px-4 pt-6 pb-20 sm:px-8 sm:pt-8">
      <title>{`${question.title} – AgroTrends`}</title>
      <Link to="/questions" className="-ml-1 inline-flex h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('Back to questions')}
      </Link>
      {/* After Stack Overflow: the question and its answers in the main column, its numbers and Answer in a side panel. */}
      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start lg:gap-x-10">
        <div className="min-w-0">
          <section aria-label={t('Question')}>
            <div className="flex items-start gap-3">
              <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground">
                {question.category?.categoryName && (
                  <Link to={`/questions?categoryId=${question.category.id}`} className="text-primary hover:underline">
                    {question.category.categoryName}
                  </Link>
                )}
                {(question.answerCount ?? 0) === 0 && (
                  <span className="inline-flex h-6 items-center rounded-full border border-dashed border-mustard px-2.5 font-medium text-foreground">{t('Unanswered')}</span>
                )}
              </p>
              <PostMenu
                own={own}
                what={t('this question')}
                report={{ targetType: 'QUESTION', targetId: id }}
                editHref={`/questions/${id}/edit`}
                onDelete={() => setConfirmingDelete(true)}
              />
            </div>
            <h1 className="mt-2 font-serif text-[1.625rem] leading-tight font-semibold tracking-[-0.015em] text-balance sm:text-[2rem]">{question.title}</h1>
            {(question.tags?.length ?? 0) > 0 && (
              <TagList
                size="md"
                label={t('Tags')}
                className="mt-3"
                items={question.tags!.map((tag) => ({ label: tag, to: `/questions?tag=${encodeURIComponent(tag)}` }))}
              />
            )}
            {own && confirmingDelete && <DeleteQuestion questionId={id} onCancel={() => setConfirmingDelete(false)} />}
            <div className="mt-6 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4">
              {/* The question's own vote, beside its text; named so it isn't mistaken for the answers' votes. */}
              <fieldset aria-label={t('Rate this question')} className="flex flex-col items-center">
                {!own && <span className="sr-only">{t('Useful question?')}</span>}
                <VoteControl target="questions" id={id} score={question.score ?? 0} myVote={myVotes.data?.question} own={own} />
              </fieldset>
              <div className="min-w-0">
                {/* A question is a request for help: interface type, not the story's reading serif. */}
                <SafeHtml html={question.content} className="post-body whitespace-pre-line" />
                {(question.imageUrls?.length ?? 0) > 0 && (
                  <ul aria-label={t('Photos')} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {question.imageUrls!.map((url, index) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-border">
                          <img src={url} alt={t('Photo {n} of the question', { n: index + 1 })} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-200 ease-(--ease-out) hover:scale-[1.02]" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {chips.length > 0 && (
                  <ul aria-label={t('Farming context')} className="mt-4 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <li key={chip.name}>
                        <Chip to={chip.to}>
                          <span className="mr-1 text-muted-foreground">{t(chip.name)}</span>
                          {chip.label}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <AuthorLine
                    userId={question.userId}
                    name={question.authorName}
                    reputation={question.authorReputation}
                    badges={question.authorBadges}
                    meta={t('Asked {date}', { date: storyDate(question.createdAt) })}
                  />
                  <a href="#your-answer" className={buttonClass('primary', 'sm', 'lg:hidden')}>
                    <ChatCircleText size={16} aria-hidden="true" />
                    {t('Write an answer')}
                  </a>
                </div>
              </div>
            </div>
          </section>
          <AiAnswerCard questionId={id} topicId={question.category?.id} askedAt={askedAt} />
          <Answers questionId={id} askerId={question.userId} />
        </div>
        <aside aria-label={t('About this question')} className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5 lg:pt-2 lg:text-sm">
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
            <dt className="text-muted-foreground">{t('Answers')}</dt>
            <dd className="font-semibold tabular-nums">{formatNumber(question.answerCount ?? 0)}</dd>
            {views != null && (
              <>
                <dt className="text-muted-foreground">{t('Views')}</dt>
                <dd className="font-semibold tabular-nums">{formatNumber(views)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">{t('Asked')}</dt>
            <dd className="font-semibold">{storyDate(question.createdAt)}</dd>
          </dl>
          <div className="border-t border-border pt-5">
            <p className="flex items-center gap-1.5 font-semibold">
              <Sparkle size={16} weight="fill" className="text-primary" aria-hidden="true" />
              {t('AI advisor')}
            </p>
            <p className="mt-1 text-muted-foreground">{t('An answer written from AgroTrends stories, before people reply.')}</p>
            <a href="#ai-answer" className="mt-2 inline-block font-semibold text-primary hover:underline">
              {t('Read the AI answer')} →
            </a>
          </div>
          <a href="#your-answer" className={buttonClass('primary', 'md', 'w-full')}>
            <ChatCircleText size={18} aria-hidden="true" />
            {t('Write an answer')}
          </a>
        </aside>
      </div>
    </article>
  )
}

/** Deleting the question asks first; the answers go with it. */
function DeleteQuestion({ questionId, onCancel }: { questionId: number; onCancel: () => void }) {
  const t = useT()
  const remove = useQuestionWrite()
  const navigate = useNavigate()
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/25 bg-destructive-soft px-4 py-3 text-sm">
      <span className="mr-auto">{t('Delete this question and its answers?')}</span>
      <Button
        variant="danger"
        size="sm"
        loading={remove.isPending}
        onClick={() => remove.mutate({ kind: 'delete', questionId }, { onSuccess: () => navigate('/questions', { replace: true }) })}
      >
        {t('Delete')}
      </Button>
      <Button variant="quiet" size="sm" onClick={onCancel}>
        {t('Keep it')}
      </Button>
      {remove.isError && (
        <span role="alert" className="w-full text-destructive">
          {errorMessage(remove.error)}
        </span>
      )}
    </div>
  )
}
