import { useT } from '../../lib/i18n'
import { useState } from 'react'
import { ArrowLeft, ChatCircleText } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { ApiError, errorMessage } from '../../api/errors'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Button, ButtonLink, buttonClass } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { useMyVotes } from '../../api/votes'
import { Answers } from './Answers'
import { ReportButton } from '../reports/ReportButton'
import { AiAnswerCard } from './AiAnswerCard'
import { AuthorLine } from './AuthorLine'
import { VoteControl } from './VoteControl'

export function QuestionPage() {
  const t = useT()
  const questionId = Number(useParams().questionId)
  const question = useQuestion(questionId)

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
  const agri = question.agri ?? {}
  const chips = [
    agri.crop && { name: t('Crop'), label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions') },
    agri.season && { name: t('Season'), label: t(SEASON_LABELS[agri.season]), to: filterPath({ season: agri.season }, '/questions') },
    agri.region && { name: t('Region'), label: agri.region, to: filterPath({ region: agri.region }, '/questions') },
    agri.soil && { name: t('Soil'), label: t(SOIL_LABELS[agri.soil]), to: filterPath({ soil: agri.soil }, '/questions') },
  ].filter((chip): chip is { name: string; label: string; to: string } => Boolean(chip))

  return (
    <article className="mx-auto max-w-(--container-feed) px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
      <title>{`${question.title} – AgroTrends`}</title>
      <Link to="/questions" className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('Back to questions')}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {question.category?.categoryName ? (
          <Badge variant="secondary" render={<Link to={`/questions?categoryId=${question.category.id}`} />}>
            {question.category.categoryName}
          </Badge>
        ) : (
          <p className="text-sm text-muted-foreground">{t('Question')}</p>
        )}
        {(question.answerCount ?? 0) === 0 && <span className="text-xs font-medium text-muted-foreground">{t('Unanswered')}</span>}
      </div>
      <h1 className="mt-3 text-2xl leading-tight text-balance sm:text-[2rem]">{question.title}</h1>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-border pb-5 text-sm">
        <div className="min-w-0 flex-1">
          <AuthorLine
            userId={question.userId}
            name={question.authorName}
            reputation={question.authorReputation}
            badges={question.authorBadges}
            meta={t('Asked {date}', { date: storyDate(question.createdAt) })}
          />
        </div>
        {own ? <OwnerActions questionId={id} /> : <ReportButton targetType="QUESTION" targetId={id} what={t('this question')} />}
      </div>
      <div className="mt-6">
        <div className="min-w-0">
        {/* A question is a request for help: interface type, not the story's reading serif. */}
        <SafeHtml html={question.content} className="text-base leading-relaxed whitespace-pre-line sm:text-lg [&>*+*]:mt-4" />
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
          <ul aria-label={t('Tags')} className="mt-8 flex flex-wrap gap-2">
            {question.tags!.map((tag) => (
              <li key={tag}>
                <Chip to={`/questions?tag=${encodeURIComponent(tag)}`}>{tag}</Chip>
              </li>
            ))}
          </ul>
        )}
        {chips.length > 0 && (
          <ul aria-label={t('Farming context')} className="mt-3 flex flex-wrap gap-2">
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
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-border py-3">
        <VoteControl target="questions" id={id} score={question.score ?? 0} myVote={myVotes.data?.question} own={own} orientation="horizontal" />
        <a href="#your-answer" className={buttonClass('secondary', 'md')}>
          <ChatCircleText size={18} aria-hidden="true" />
          {t('Answer')}
        </a>
      </div>
      <AiAnswerCard questionId={id} topicId={question.category?.id} askedAt={askedAt} />
      <Answers questionId={id} askerId={question.userId} />
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
          <span role="alert" className="text-destructive">
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
