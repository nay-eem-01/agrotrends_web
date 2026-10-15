import { EyeSlash } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { errorMessage } from '../../api/errors'
import { groupReports, useModerate, useReportedPostLink, useReports, type Report, type ReportGroup, type ReportStatus } from '../../api/moderation'
import { REPORT_REASONS } from '../../api/reports'
import { storyDate } from '../../lib/dates'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { AdminPage } from './AdminPage'
import { BanControls } from './BanControls'

const TABS: { status: ReportStatus; label: string }[] = [
  { status: 'OPEN', label: 'Open' },
  { status: 'ACTIONED', label: 'Removed' },
  { status: 'DISMISSED', label: 'Dismissed' },
]

const TARGET_LABELS: Record<ReportGroup['targetType'], string> = {
  BLOG: 'Story',
  QUESTION: 'Question',
  ANSWER: 'Answer',
  AI_ANSWER: 'AI answer',
  COMMENT: 'Response',
  USER: 'Profile',
}

const reasonLabel = (reason?: Report['reason']) => REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason ?? ''

/** `/admin/reports`: open reports grouped by post, to remove the post or dismiss the reports; and the closed ones. */
export function AdminReportsPage() {
  const [params] = useSearchParams()
  const status = TABS.find((tab) => tab.status === params.get('status'))?.status ?? 'OPEN'
  const reports = useReports(status)
  const list = reports.data?.content ?? []

  return (
    <AdminPage title="Reports">
      <nav aria-label="Report status" className="mt-6 flex w-fit gap-1 rounded-full bg-muted p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            to={tab.status === 'OPEN' ? '/admin/reports' : `/admin/reports?status=${tab.status}`}
            aria-current={tab.status === status ? 'page' : undefined}
            className={cn('flex h-9 items-center rounded-full px-4 text-sm', tab.status === status ? 'bg-card font-medium shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground')}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {reports.isPending ? (
        <div className="py-12">
          <Spinner label="Loading reports" />
        </div>
      ) : reports.isError ? (
        <p role="alert" className="py-12 text-muted-foreground">
          {errorMessage(reports.error)}
        </p>
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{status === 'OPEN' ? 'No open reports.' : 'None yet.'}</p>
      ) : status === 'OPEN' ? (
        <ul className="mt-6 flex flex-col gap-4">
          {groupReports(list).map((group) => (
            <li key={group.key}>
              <OpenGroup group={group} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {list.map((report) => (
            <li key={report.id} className="flex flex-wrap gap-x-3 gap-y-1 border-b border-border px-5 py-3 text-sm last:border-b-0">
              <span className="font-medium">
                {TARGET_LABELS[report.targetType ?? 'QUESTION']} #{report.targetId}
              </span>
              <span>{reasonLabel(report.reason)}</span>
              <span className="text-muted-foreground">
                by {report.reporterName} · {storyDate(report.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  )
}

/** Every open report on one post, what it says (the snapshot if it is hidden), and one decision for all of them. */
function OpenGroup({ group }: { group: ReportGroup }) {
  const hidden = group.snapshot != null
  const link = useReportedPostLink(group.targetType, group.targetId, !hidden)
  const moderate = useModerate()
  const [confirm, setConfirm] = useState<'remove-content' | 'dismiss' | null>(null)
  const reportId = group.reports[0]?.id ?? 0
  const counts = Object.entries(
    group.reports.reduce<Record<string, number>>((acc, r) => ({ ...acc, [reasonLabel(r.reason)]: (acc[reasonLabel(r.reason)] ?? 0) + 1 }), {}),
  )
  const isUser = group.targetType === 'USER'
  const isAi = group.targetType === 'AI_ANSWER'

  return (
    <article aria-label={`${TARGET_LABELS[group.targetType]} ${group.targetId}`} className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="font-sans text-base font-semibold">
          {TARGET_LABELS[group.targetType]} #{group.targetId}
        </h2>
        {hidden && (
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-destructive/10 px-2 text-xs font-medium text-destructive">
            <EyeSlash size={14} aria-hidden="true" />
            Hidden
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {group.reports.length} {group.reports.length === 1 ? 'report' : 'reports'}: {counts.map(([label, n]) => (n > 1 ? `${label} ×${n}` : label)).join(', ')}
        </span>
      </header>
      {hidden ? (
        <blockquote className="mt-3 rounded-xl bg-muted p-3 text-sm whitespace-pre-line">
          <span className="mb-1 block text-xs text-muted-foreground">What was reported (the post is hidden, so this is a copy):</span>
          {group.snapshot}
        </blockquote>
      ) : link.data ? (
        <Link to={link.data} target="_blank" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Open the post
        </Link>
      ) : link.isError ? (
        <p className="mt-2 text-sm text-muted-foreground">The post can't be opened: it may be gone.</p>
      ) : null}
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {group.reports.map((report) => (
          <li key={report.id}>
            <span className="font-medium">{report.reporterName}</span> · {reasonLabel(report.reason)} · <span className="text-muted-foreground">{storyDate(report.createdAt)}</span>
            {report.details && <span className="block text-muted-foreground">“{report.details}”</span>}
          </li>
        ))}
      </ul>
      {moderate.isError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {errorMessage(moderate.error)}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
        {!isUser && (
          <Button variant="danger" size="sm" disabled={moderate.isPending} onClick={() => setConfirm('remove-content')}>
            {isAi ? 'Hide the AI answer' : 'Remove the post'}
          </Button>
        )}
        <Button variant="secondary" size="sm" disabled={moderate.isPending} onClick={() => setConfirm('dismiss')}>
          Dismiss
        </Button>
        {isUser && <BanControls userId={group.targetId} name={`Profile #${group.targetId}`} />}
      </div>
      <Confirm
        open={confirm === 'remove-content'}
        title={isAi ? 'Hide this AI answer?' : 'Remove this post for good?'}
        action={isAi ? 'Hide it' : 'Remove it'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => moderate.mutate({ action: 'remove-content', reportId }, { onSettled: () => setConfirm(null) })}
      >
        {isAi
          ? 'It disappears from the question, and every open report on it is closed.'
          : 'It is deleted with the reputation it earned and its place in the AI index, and every open report on it is closed. This cannot be undone.'}
      </Confirm>
      <Confirm
        open={confirm === 'dismiss'}
        title="Dismiss these reports?"
        action="Dismiss"
        onCancel={() => setConfirm(null)}
        onConfirm={() => moderate.mutate({ action: 'dismiss', reportId }, { onSettled: () => setConfirm(null) })}
      >
        Every open report on it is closed{hidden ? ', and the post is visible again (its author is told)' : ''}.
      </Confirm>
    </article>
  )
}

function Confirm({ open, title, action, children, onCancel, onConfirm }: { open: boolean; title: string; action: string; children: ReactNode; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{action}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
