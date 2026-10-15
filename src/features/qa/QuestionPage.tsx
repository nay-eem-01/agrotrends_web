import { useT } from '../../lib/i18n'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Button, ButtonLink } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { useMyVotes } from '../../api/votes'
import { Answers } from './Answers'
import { VoteControl } from './VoteControl'

export function QuestionPage() {
  const t = useT()
  const questionId = Number(useParams().questionId)
  const question = useQuestion(questionId)

  if (question.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label={t('Loading question')} />
      </div>
    )
  }
  if (question.isError) {
    if (question.error instanceof ApiError && question.error.isNotFound) return <NotFoundPage />
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-ink-muted sm:px-6">
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
  const agri = question.agri ?? {}
  const chips = [
    agri.crop && { name: t('Crop'), label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions') },
    agri.season && { name: t('Season'), label: t(SEASON_LABELS[agri.season]), to: filterPath({ season: agri.season }, '/questions') },
    agri.region && { name: t('Region'), label: agri.region, to: filterPath({ region: agri.region }, '/questions') },
    agri.soil && { name: t('Soil'), label: t(SOIL_LABELS[agri.soil]), to: filterPath({ soil: agri.soil }, '/questions') },
  ].filter((chip): chip is { name: string; label: string; to: string } => Boolean(chip))

  return (
    <article className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <title>{`${question.title} – AgroTrends`}</title>
      <p className="text-sm text-ink-muted">{question.category?.categoryName ?? t('Question')}</p>
      <h1 className="mt-1 text-2xl sm:text-3xl">{question.title}</h1>
      <div className="mt-5 flex items-center gap-3 text-sm">
        <Avatar name={question.authorName ?? '?'} size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{question.authorName}</p>
          <p className="text-ink-muted">{t('Asked {date}', { date: storyDate(question.createdAt) })}</p>
        </div>
        {own && <OwnerActions questionId={id} />}
      </div>
      <div className="mt-8 flex gap-2 sm:gap-4">
        <div className="-ml-2 sm:-ml-14">
          <VoteControl target="questions" id={id} score={question.score ?? 0} myVote={myVotes.data?.question} own={own} />
        </div>
        <div className="min-w-0 flex-1">
        <SafeHtml html={question.content} className="story-body whitespace-pre-line" />
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
        {(question.tags?.length ?? 0) > 0 && (
          <ul aria-label={t('Tags')} className="mt-6 flex flex-wrap gap-2">
            {question.tags!.map((tag) => (
              <li key={tag}>
                <Chip to={`/questions?tag=${encodeURIComponent(tag)}`}>{tag}</Chip>
              </li>
            ))}
          </ul>
        )}
        {chips.length > 0 && (
          <ul aria-label={t('Farming context')} className="mt-8 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.name}>
                <Chip to={chip.to}>
                  <span className="mr-1 text-ink-muted">{t(chip.name)}</span>
                  {chip.label}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
      <Answers questionId={id} />
    </article>
  )
}

function OwnerActions({ questionId }: { questionId: number }) {
  const t = useT()
  const [confirming, setConfirming] = useState(false)
  const remove = useQuestionWrite()
  const navigate = useNavigate()

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span>{t('Delete this question and its answers?')}</span>
        <Button
          variant="danger"
          size="sm"
          loading={remove.isPending}
          onClick={() => remove.mutate({ kind: 'delete', questionId }, { onSuccess: () => navigate('/questions', { replace: true }) })}
        >
          {t('Delete')}
        </Button>
        <Button variant="quiet" size="sm" onClick={() => setConfirming(false)}>
          {t('Keep it')}
        </Button>
        {remove.isError && (
          <span role="alert" className="text-danger">
            {errorMessage(remove.error)}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="flex gap-1">
      <ButtonLink to={`/questions/${questionId}/edit`} variant="quiet" size="sm">
        {t('Edit')}
      </ButtonLink>
      <Button variant="quiet" size="sm" onClick={() => setConfirming(true)}>
        {t('Delete')}
      </Button>
    </div>
  )
}
