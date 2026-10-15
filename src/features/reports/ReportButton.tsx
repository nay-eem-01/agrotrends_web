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

/** A quiet "Report" that opens the report dialog; visitors sign in first. After a report it reads "Reported". */
export function ReportButton({ targetType, targetId, own = false, what, className }: ReportButtonProps) {
  const t = useT()
  const { status } = useSession()
  const requireSignIn = useRequireSignIn()
  const [open, setOpen] = useState(false)
  const [reported, setReported] = useState(false)
  if (own && status === 'signed-in') return null

  return (
    <>
      <button
        type="button"
        disabled={reported}
        onClick={() => requireSignIn(() => setOpen(true))}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-[color,background-color,transform] duration-150 ease-(--ease-out) hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:cursor-default disabled:hover:bg-transparent',
          className,
        )}
      >
        <Flag size={16} weight={reported ? 'fill' : 'regular'} aria-hidden="true" />
        {reported ? t('Reported') : t('Report')}
      </button>
      {open && (
        <Suspense fallback={null}>
          <ReportDialog targetType={targetType} targetId={targetId} what={what} onClose={() => setOpen(false)} onReported={() => setReported(true)} />
        </Suspense>
      )}
    </>
  )
}
