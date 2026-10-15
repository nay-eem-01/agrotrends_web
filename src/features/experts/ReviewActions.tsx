import { CheckCircle, Flag, PencilSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { errorMessage } from '../../api/errors'
import { MAX_CORRECTION, useReviewAiAnswer } from '../../api/review'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { Composer } from '../threads/Composer'

interface ReviewActionsProps {
  questionId: number
  /** Verified Expert in the topic: confirm and correct. */
  canConfirm: boolean
  /** Verified Expert or Top Contributor in the topic: flag. */
  canFlag: boolean
}

/** An expert's review of an unchecked AI answer: confirm it, post a corrected answer, or flag it (it is hidden). */
export function ReviewActions({ questionId, canConfirm, canFlag }: ReviewActionsProps) {
  const t = useT()
  const review = useReviewAiAnswer(questionId)
  const [mode, setMode] = useState<'idle' | 'correct' | 'flag'>('idle')

  if (review.isSuccess) {
    return <output className="mt-4 block text-sm text-primary">{t('Thanks. Your review is recorded.')}</output>
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-sm font-medium">{t('Review as an expert')}</p>
      {mode === 'correct' ? (
        <div className="mt-3">
          <Composer
            label={t('Your corrected answer')}
            placeholder={t('What is wrong, and what should the farmer do instead?')}
            submitLabel={t('Post correction')}
            doneLabel={t('Correction posted')}
            rows={5}
            focusOnOpen
            pending={review.isPending}
            error={review.isError ? review.error : null}
            onSubmit={(content) => review.mutate({ action: 'correct', content: content.slice(0, MAX_CORRECTION) })}
            onCancel={() => setMode('idle')}
          />
        </div>
      ) : mode === 'flag' ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>{t('Flag it as wrong or unsafe? It will be hidden from everyone.')}</span>
          <Button variant="danger" size="sm" loading={review.isPending} onClick={() => review.mutate({ action: 'flag' })}>
            {t('Flag')}
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('idle')}>
            {t('Cancel')}
          </Button>
        </div>
      ) : (
        <div className="mt-2 -ml-3 flex flex-wrap gap-1">
          {canConfirm && (
            <>
              <Button variant="quiet" size="sm" loading={review.isPending} onClick={() => review.mutate({ action: 'confirm' })}>
                <CheckCircle size={18} aria-hidden="true" />
                {t('Confirm')}
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setMode('correct')}>
                <PencilSimple size={18} aria-hidden="true" />
                {t('Correct')}
              </Button>
            </>
          )}
          {canFlag && (
            <Button variant="quiet" size="sm" onClick={() => setMode('flag')}>
              <Flag size={18} aria-hidden="true" />
              {t('Flag')}
            </Button>
          )}
        </div>
      )}
      {review.isError && mode !== 'correct' && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errorMessage(review.error)}
        </p>
      )}
    </div>
  )
}
