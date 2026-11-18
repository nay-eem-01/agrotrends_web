import { Flag } from '@phosphor-icons/react'
import { lazy, Suspense, useState } from 'react'
import { cn } from 'cn'
import type { ReportTarget } from '../../api/reports'
import { useT } from '../../lib/i18n'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

const ReportDialog = lazy(() => import('./ReportDialog').then((m) => ({ default: m.ReportDialog })))

interface ReportButtonProps {
  targetType: ReportTarget
  targetId: number
  /** Your own post: no button (the backend refuses reports on it). */
  own?: boolean
  /** What is being reported, for the dialog's title ("this answer"). */
  what: string
  className?: string
}

/**
 * The report flow without its button, for a menu item: `start` opens the dialog (visitors sign in first), `reported`
 * turns true once a report is sent, and `dialog` must be rendered somewhere.
 */
export function useReportFlow({ targetType, targetId, what }: { targetType: ReportTarget; targetId: number; what: string }) {
  const requireSignIn = useRequireSignIn()
  const [open, setOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const dialog = open ? (
    <Suspense fallback={null}>
      <ReportDialog targetType={targetType} targetId={targetId} what={what} onClose={() => setOpen(false)} onReported={() => setReported(true)} />
    </Suspense>
  ) : null
  return { reported, start: () => requireSignIn(() => setOpen(true)), dialog }
}

/** A quiet "Report" that opens the report dialog; visitors sign in first. After a report it reads "Reported". */
export function ReportButton({ targetType, targetId, own = false, what, className }: ReportButtonProps) {
  const t = useT()
  const { status } = useSession()
  const flow = useReportFlow({ targetType, targetId, what })
  if (own && status === 'signed-in') return null

  return (
    <>
      <button
        type="button"
        disabled={flow.reported}
        onClick={flow.start}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-[color,background-color,transform] duration-150 ease-(--ease-out) hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:cursor-default disabled:hover:bg-transparent',
          className,
        )}
      >
        <Flag size={16} weight={flow.reported ? 'fill' : 'regular'} aria-hidden="true" />
        {flow.reported ? t('Reported') : t('Report')}
      </button>
      {flow.dialog}
    </>
  )
}
