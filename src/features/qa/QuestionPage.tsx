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
import { Thread } from '../threads/Thread'

export function QuestionPage() {
  const questionId = Number(useParams().questionId)
  const question = useQuestion(questionId)

  if (question.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label="Loading question" />
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
  const { user } = useSession()
  const own = user?.id != null && user.id === question.userId
  const id = question.questionId ?? 0
  const agri = question.agri ?? {}
  const chips = [
    agri.crop && { name: 'Crop', label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions') },
    agri.season && { name: 'Season', label: SEASON_LABELS[agri.season], to: filterPath({ season: agri.season }, '/questions') },
    agri.region && { name: 'Region', label: agri.region, to: filterPath({ region: agri.region }, '/questions') },
    agri.soil && { name: 'Soil', label: SOIL_LABELS[agri.soil], to: filterPath({ soil: agri.soil }, '/questions') },
  ].filter((chip): chip is { name: string; label: string; to: string } => Boolean(chip))

  return (
    <article className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <title>{`${question.title} – AgroTrends`}</title>
      <p className="text-sm text-ink-muted">Question</p>
      <h1 className="mt-1 text-2xl sm:text-3xl">{question.title}</h1>
      <div className="mt-5 flex items-center gap-3 text-sm">
        <Avatar name={question.authorName ?? '?'} size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{question.authorName}</p>
          <p className="text-ink-muted">Asked {storyDate(question.createdAt)}</p>
        </div>
        {own && <OwnerActions questionId={id} />}
      </div>
      <SafeHtml html={question.content} className="story-body mt-8" />
      {chips.length > 0 && (
        <ul aria-label="Farming context" className="mt-8 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.name}>
              <Chip to={chip.to}>
                <span className="mr-1 text-ink-muted">{chip.name}</span>
                {chip.label}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      <Thread kind="answers" parentId={id} />
    </article>
  )
}

function OwnerActions({ questionId }: { questionId: number }) {
  const [confirming, setConfirming] = useState(false)
  const remove = useQuestionWrite()
  const navigate = useNavigate()

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span>Delete this question and its answers?</span>
        <Button
          variant="danger"
          size="sm"
          loading={remove.isPending}
          onClick={() => remove.mutate({ kind: 'delete', questionId }, { onSuccess: () => navigate('/questions', { replace: true }) })}
        >
          Delete
        </Button>
        <Button variant="quiet" size="sm" onClick={() => setConfirming(false)}>
          Keep it
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
        Edit
      </ButtonLink>
      <Button variant="quiet" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    </div>
  )
}
