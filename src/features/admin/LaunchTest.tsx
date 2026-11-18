import { CheckCircle } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLaunchMetrics, type LaunchWeek } from '../../api/admin'
import { errorMessage } from '../../api/errors'
import { formatNumber } from '../../lib/i18n'

/** PLAN.md's week-8 targets. Paying students are counted by hand, outside the app. */
const TARGETS = { activeMembers: 30, answeredShare: 0.8, checkedShare: 0.7, verifiedExperts: 10 }

const share = (part = 0, whole = 0) => (whole > 0 ? part / whole : null)
const percent = (value: number | null) => (value == null ? '–' : `${formatNumber(Math.round(value * 100))}%`)
const weekOf = (date?: string) => (date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')

/**
 * The launch test at the top of the admin overview: this week's four numbers against the plan's targets, then the last
 * eight weeks as a table, so the week-8 go / stop can be read here instead of from hand-run SQL.
 */
export function LaunchTest() {
  const metrics = useLaunchMetrics(8)
  if (metrics.isPending) {
    return (
      <div aria-busy="true" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <output className="sr-only">Loading the launch test</output>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }
  if (metrics.isError) {
    return (
      <p role="alert" className="mt-6 text-muted-foreground">
        {errorMessage(metrics.error)}
      </p>
    )
  }
  const weeks = metrics.data
  const now = weeks[0]
  if (!now) return <p className="mt-6 text-muted-foreground">No weeks to show yet.</p>

  const figures: { label: string; value: string; target: string; met: boolean; detail: string }[] = [
    {
      label: 'Weekly active askers or answerers',
      value: formatNumber(now.activeMembers ?? 0),
      target: `Target ${TARGETS.activeMembers}`,
      met: (now.activeMembers ?? 0) >= TARGETS.activeMembers,
      detail: `${formatNumber(now.activeAskers ?? 0)} asked, ${formatNumber(now.activeAnswerers ?? 0)} answered`,
    },
    {
      label: 'Questions with a human answer within 24 h',
      value: percent(share(now.humanAnsweredWithin24h, now.questions)),
      target: 'Target 80%',
      met: (share(now.humanAnsweredWithin24h, now.questions) ?? 0) >= TARGETS.answeredShare,
      detail: `${formatNumber(now.humanAnsweredWithin24h ?? 0)} of ${formatNumber(now.questions ?? 0)} questions`,
    },
    {
      label: 'AI answers checked by an expert within 48 h',
      value: percent(share(now.aiReviewedWithin48h, now.aiAnswers)),
      target: 'Target 70%',
      met: (share(now.aiReviewedWithin48h, now.aiAnswers) ?? 0) >= TARGETS.checkedShare,
      detail: `${formatNumber(now.aiReviewedWithin48h ?? 0)} of ${formatNumber(now.aiAnswers ?? 0)} AI answers`,
    },
    {
      label: 'Verified experts',
      value: formatNumber(now.verifiedExperts ?? 0),
      target: `Target ${TARGETS.verifiedExperts}`,
      met: (now.verifiedExperts ?? 0) >= TARGETS.verifiedExperts,
      detail: 'At the end of the week',
    },
  ]
  const staff = now.staffActivity

  return (
    <section aria-labelledby="admin-launch" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="admin-launch" className="text-sm font-semibold text-muted-foreground">
          Launch test
        </h2>
        <p className="text-sm text-muted-foreground">
          Week of {weekOf(now.weekStart)}
          {now.partial ? ', so far' : ''}. Paying students are counted outside the app.
        </p>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map((figure) => (
          <li key={figure.label} className="flex flex-col rounded-xl border border-border p-5">
            <span className="text-sm font-medium">{figure.label}</span>
            <span className="mt-2 text-3xl font-semibold tabular-nums">{figure.value}</span>
            <span className="mt-1 text-xs text-muted-foreground tabular-nums">{figure.detail}</span>
            {/* Met or not is said in words beside the icon, never by colour alone. */}
            <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs">
              {figure.met ? (
                <>
                  <CheckCircle size={14} weight="fill" aria-hidden="true" className="text-success" />
                  <span className="font-medium text-foreground">On target</span>
                  <span className="text-muted-foreground">({figure.target.toLowerCase()})</span>
                </>
              ) : (
                <span className="text-muted-foreground">{figure.target}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {staff && (staff.activeMembers ?? 0) > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Staff among them: {formatNumber(staff.activeMembers ?? 0)} active, {formatNumber(staff.questions ?? 0)} questions asked,{' '}
          {formatNumber(staff.humanAnsweredWithin24h ?? 0)} answered within 24 h.
        </p>
      )}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm tabular-nums">
          <caption className="sr-only">The last eight weeks, newest first</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">Week of</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Active</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Questions</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Human answer ≤ 24 h</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">AI checked ≤ 48 h</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Experts</th>
              <th scope="col" className="py-2 text-right font-medium">New members</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <Row key={week.weekStart} week={week} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Row({ week }: { week: LaunchWeek }) {
  return (
    <tr className="border-b border-border">
      <th scope="row" className="py-2.5 pr-4 text-left font-medium">
        {weekOf(week.weekStart)}
        {week.partial && <span className="ml-1.5 font-normal text-muted-foreground">so far</span>}
      </th>
      <td className="py-2.5 pr-4 text-right">{formatNumber(week.activeMembers ?? 0)}</td>
      <td className="py-2.5 pr-4 text-right">{formatNumber(week.questions ?? 0)}</td>
      <td className="py-2.5 pr-4 text-right">{percent(share(week.humanAnsweredWithin24h, week.questions))}</td>
      <td className="py-2.5 pr-4 text-right">{percent(share(week.aiReviewedWithin48h, week.aiAnswers))}</td>
      <td className="py-2.5 pr-4 text-right">{formatNumber(week.verifiedExperts ?? 0)}</td>
      <td className="py-2.5 text-right">{formatNumber(week.newMembers ?? 0)}</td>
    </tr>
  )
}
