import { ArrowRight, Flag, SealCheck, Sparkle, type Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from 'cn'
import { useAdminStats, type AdminStats } from '../../api/admin'
import { errorMessage } from '../../api/errors'
import { formatNumber } from '../../lib/i18n'
import { AdminPage } from './AdminPage'

/** Work waiting for staff: each count leads to the queue where it is handled. */
const QUEUES: { key: keyof AdminStats; label: string; to?: string; icon: Icon; hint: string }[] = [
  { key: 'openReports', label: 'Open reports', to: '/admin/reports', icon: Flag, hint: 'Posts and people reported by members' },
  { key: 'pendingExpertApplications', label: 'Expert applications', to: '/admin/experts', icon: SealCheck, hint: 'Waiting for a decision' },
  { key: 'uncheckedAiAnswers', label: 'Unchecked AI answers', icon: Sparkle, hint: 'On visible questions; experts check them in their review queue' },
]

/** The size of the community, plain counts (the backend counts live, no cache). */
const TOTALS: { key: keyof AdminStats; label: string; to?: string; recent?: keyof AdminStats }[] = [
  { key: 'users', label: 'Members', to: '/admin/users', recent: 'newUsers' },
  { key: 'bannedUsers', label: 'Banned', to: '/admin/users?banned=true' },
  { key: 'questions', label: 'Questions', to: '/questions', recent: 'newQuestions' },
  { key: 'answers', label: 'Answers' },
  { key: 'publishedStories', label: 'Published stories', to: '/stories' },
]

/** `/admin`: what needs attention first, then the counts. */
export function AdminOverviewPage() {
  const stats = useAdminStats()
  return (
    <AdminPage title="Overview">
      {stats.isPending ? (
        <div aria-busy="true" className="mt-6 grid gap-3 sm:grid-cols-3">
          <output className="sr-only">Loading</output>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats.isError ? (
        <p role="alert" className="mt-6 text-muted-foreground">
          {errorMessage(stats.error)}
        </p>
      ) : (
        <>
          <section aria-labelledby="admin-queues" className="mt-6">
            <h2 id="admin-queues" className="text-sm font-semibold text-muted-foreground">
              Needs attention
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {QUEUES.map(({ key, label, to, icon: Icon, hint }) => {
                const count = stats.data[key] as number | undefined
                const waiting = (count ?? 0) > 0
                const body = (
                  <>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('flex size-9 items-center justify-center rounded-full', waiting ? 'bg-mustard-soft' : 'bg-secondary')}>
                        <Icon size={18} weight={waiting ? 'fill' : 'regular'} aria-hidden="true" className={waiting ? 'text-foreground' : 'text-primary'} />
                      </span>
                      {to && <ArrowRight size={16} aria-hidden="true" className="text-muted-foreground" />}
                    </span>
                    <span className="mt-3 block text-3xl font-semibold tabular-nums">{formatNumber(count ?? 0)}</span>
                    <span className="mt-0.5 block text-sm font-medium">{label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
                  </>
                )
                const box = cn('block h-full rounded-xl border p-5 transition-colors duration-150', waiting ? 'border-mustard/50' : 'border-border')
                return (
                  <li key={key}>
                    {to ? (
                      <Link to={to} className={cn(box, 'hover:border-border-strong hover:bg-surface')}>
                        {body}
                      </Link>
                    ) : (
                      <div className={box}>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
          <section aria-labelledby="admin-totals" className="mt-10">
            <h2 id="admin-totals" className="text-sm font-semibold text-muted-foreground">
              Community
            </h2>
            <dl className="mt-3 grid grid-cols-2 border-t border-border sm:grid-cols-3 lg:grid-cols-5">
              {TOTALS.map(({ key, label, to, recent }) => (
                <div key={key} className="border-b border-border py-4 pr-4">
                  <dt className="text-sm text-muted-foreground">{to ? <Link to={to} className="underline-offset-4 hover:text-foreground hover:underline">{label}</Link> : label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatNumber((stats.data[key] as number | undefined) ?? 0)}</dd>
                  {recent && <dd className="text-xs text-muted-foreground">+{formatNumber((stats.data[recent] as number | undefined) ?? 0)} this week</dd>}
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </AdminPage>
  )
}
