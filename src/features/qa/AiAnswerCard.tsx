import { SealCheck, Sparkle, Warning } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useEffect, useState } from 'react'
import { AI_POLL_FOR_MS, useAiAnswer, type AiAnswer } from '../../api/aiAnswer'
import { storyDate } from '../../lib/dates'
import { useT } from '../../lib/i18n'
import { Sources } from '../ai/Sources'
import { ReviewActions } from '../experts/ReviewActions'
import { ReportButton } from '../reports/ReportButton'
import { useMyBadges } from '../experts/useMyBadges'

/**
 * The AI answer, as its own card above the people's answers and never mixed with them: labelled with its review state
 * (unchecked, confirmed or corrected by a named expert), always with the disclaimer. Nothing at all while there is none.
 */
export function AiAnswerCard({ questionId, topicId, askedAt }: { questionId: number; topicId?: number; askedAt?: number }) {
  const t = useT()
  const ai = useAiAnswer(questionId, askedAt)
  // Just asked: say an answer is coming while the hook polls; after a minute, stop saying so.
  const [waiting, setWaiting] = useState(askedAt != null)
  useEffect(() => {
    if (askedAt == null) return
    const timer = setTimeout(() => setWaiting(false), Math.max(0, askedAt + AI_POLL_FOR_MS - Date.now()))
    return () => clearTimeout(timer)
  }, [askedAt])

  if (ai.data == null) {
    return waiting && !ai.isError ? (
      <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkle size={16} className="animate-pulse text-primary" aria-hidden="true" />
        <output>{t('An AI answer is being written. Experts in this topic will check it.')}</output>
      </p>
    ) : null
  }
  return <Card answer={ai.data} topicId={topicId} />
}

function Card({ answer, topicId }: { answer: AiAnswer; topicId?: number }) {
  const t = useT()
  const { inTopic } = useMyBadges(topicId)
  const expert = inTopic.includes('VERIFIED_EXPERT')
  const canFlag = expert || inTopic.includes('TOP_CONTRIBUTOR')
  const confirmed = answer.status === 'CONFIRMED'
  const corrected = answer.status === 'CORRECTED'

  return (
    <section
      aria-labelledby="ai-answer"
      className={cn('mt-6 rounded-xl border p-5 sm:p-6', confirmed ? 'border-mustard bg-card ring-1 ring-mustard/40' : 'border-dashed border-input bg-card/70')}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="ai-answer" className="flex scroll-mt-24 items-center gap-2 font-sans text-base font-semibold">
          <Sparkle size={18} weight="fill" className="text-primary" aria-hidden="true" />
          {t('AI answer')}
        </h2>
        <StatusLabel answer={answer} />
        {answer.questionId != null && <ReportButton targetType="AI_ANSWER" targetId={answer.questionId} what={t('this AI answer')} className="ml-auto" />}
      </header>
      <p className="mt-3 text-base leading-relaxed whitespace-pre-line">{answer.answer}</p>
      {corrected && answer.correctionAnswerId != null && (
        <a href={`#answer-${answer.correctionAnswerId}`} className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t("Read the expert's corrected answer")}
        </a>
      )}
      <Sources sources={answer.sources} />
      {answer.disclaimer && (
        <p className="mt-4 flex gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Warning size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {answer.disclaimer}
        </p>
      )}
      {answer.status === 'UNCHECKED' && canFlag && answer.questionId != null && (
        <ReviewActions questionId={answer.questionId} canConfirm={expert} canFlag={canFlag} />
      )}
    </section>
  )
}

function StatusLabel({ answer }: { answer: AiAnswer }) {
  const t = useT()
  if (answer.status === 'CONFIRMED' || answer.status === 'CORRECTED') {
    const text = answer.status === 'CONFIRMED' ? t('Confirmed by {name}', { name: answer.reviewerName ?? '' }) : t('Corrected by {name}', { name: answer.reviewerName ?? '' })
    return (
      <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-sm', answer.status === 'CONFIRMED' ? 'bg-mustard-soft' : 'bg-secondary')}>
        <SealCheck size={16} weight="fill" className={answer.status === 'CONFIRMED' ? 'text-mustard-ink' : 'text-primary'} aria-hidden="true" />
        {text}
        {answer.reviewedAt && <span className="text-muted-foreground">· {storyDate(answer.reviewedAt)}</span>}
      </span>
    )
  }
  return <span className="text-sm text-muted-foreground">{t('Not yet checked by an expert')}</span>
}
