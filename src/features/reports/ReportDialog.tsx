import { useState, type FormEvent } from 'react'
import { cn } from 'cn'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError, errorMessage } from '../../api/errors'
import { MAX_REPORT_DETAILS, REPORT_REASONS, useReport, type ReportReason, type ReportTarget } from '../../api/reports'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { TextArea } from '../../ui/TextArea'

interface ReportDialogProps {
  targetType: ReportTarget
  targetId: number
  what: string
  onClose: () => void
  onReported: () => void
}

/**
 * Why it is being reported (and optional details). The reporter never learns whether the post got hidden. A second
 * report of the same thing (409) counts as reported; the submit button is disabled while sending, as a double tap
 * races on the backend.
 */
export function ReportDialog({ targetType, targetId, what, onClose, onReported }: ReportDialogProps) {
  const t = useT()
  const report = useReport()
  const [reason, setReason] = useState<ReportReason>()
  const [details, setDetails] = useState('')
  const [missing, setMissing] = useState(false)
  const [done, setDone] = useState<'sent' | 'already' | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!reason) return setMissing(true)
    report.mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          setDone('sent')
          onReported()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setDone('already')
            onReported()
          }
        },
      },
    )
  }

  const failed = report.isError && !(report.error instanceof ApiError && report.error.status === 409)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold">{t('Report {what}', { what })}</DialogTitle>
          <DialogDescription>{t('Moderators look at every report. Several reports from different people hide a post until they decide.')}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col gap-4">
            <output className="text-base">{done === 'sent' ? t('Thanks, moderators will look at it.') : t('You have already reported this.')}</output>
            <Button variant="secondary" size="sm" className="self-start" onClick={onClose}>
              {t('Done')}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <fieldset aria-describedby={missing && !reason ? 'reason-error' : undefined}>
              <legend className="text-sm font-medium">{t('What is wrong?')}</legend>
              <div className="mt-2 flex flex-col gap-2">
                {REPORT_REASONS.map((option) => (
                  // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text comes from option.label
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 ring-1 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-ring',
                      reason === option.value ? 'bg-accent ring-primary' : 'ring-border hover:bg-muted',
                    )}
                  >
                    <input type="radio" name="reason" value={option.value} checked={reason === option.value} onChange={() => setReason(option.value)} className="mt-1 size-4 accent-(--primary)" />
                    <span>
                      <span className="block text-sm font-medium">{t(option.label)}</span>
                      <span className="block text-xs text-muted-foreground">{t(option.hint)}</span>
                    </span>
                  </label>
                ))}
              </div>
              {missing && !reason && (
                <p id="reason-error" className="mt-2 text-sm text-destructive">
                  {t('Choose what is wrong.')}
                </p>
              )}
            </fieldset>
            <TextArea label={t('Details (optional)')} rows={3} maxLength={MAX_REPORT_DETAILS} value={details} onChange={(event) => setDetails(event.target.value)} />
            {failed && (
              <p role="alert" className="text-sm text-destructive">
                {report.error instanceof ApiError && report.error.isNotFound ? t('This post is gone.') : errorMessage(report.error)}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit" size="sm" loading={report.isPending}>
                {t('Send report')}
              </Button>
              <Button variant="quiet" size="sm" onClick={onClose}>
                {t('Cancel')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
