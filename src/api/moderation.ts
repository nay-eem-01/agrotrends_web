import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Page, Schemas } from './types'

export type Report = Schemas['ReportResponse']
export type ReportStatus = NonNullable<Report['status']>

export const moderationKeys = { reports: (status: ReportStatus) => ['admin', 'reports', status] as const }

/** Reports by status, oldest first (staff with CONTENT_MODERATE). */
export function useReports(status: ReportStatus) {
  return useQuery({
    queryKey: moderationKeys.reports(status),
    queryFn: ({ signal }) => api<Page<Report>>('/api/admin/reports', { params: { status, pageNo: 0, pageSize: 100 }, signal }),
    retry: false,
  })
}

export interface ReportGroup {
  key: string
  targetType: NonNullable<Report['targetType']>
  targetId: number
  reports: Report[]
  /** Set when the post is hidden now: the live page is 404 even for staff, so this is what was reported. */
  snapshot?: string
}

/** Open reports grouped by post: one decision covers every open report on it. Oldest group first. */
export function groupReports(reports: Report[]): ReportGroup[] {
  const groups = new Map<string, ReportGroup>()
  for (const report of reports) {
    if (report.targetType == null || report.targetId == null) continue
    const key = `${report.targetType}:${report.targetId}`
    const group = groups.get(key) ?? { key, targetType: report.targetType, targetId: report.targetId, reports: [] }
    group.reports.push(report)
    group.snapshot ??= report.snapshot ?? undefined
    groups.set(key, group)
  }
  return [...groups.values()]
}

export type ModerationAction =
  | { action: 'remove-content' | 'dismiss'; reportId: number }
  | { action: 'ban'; userId: number; reason: string }
  | { action: 'unban'; userId: number }

/** Remove, dismiss, ban or unban. Settled either way the queues reload: a 409 means another moderator acted first. */
export function useModerate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (m: ModerationAction) =>
      m.action === 'ban'
        ? api(`/api/admin/users/${m.userId}/ban`, { method: 'POST', body: { reason: m.reason } })
        : m.action === 'unban'
          ? api(`/api/admin/users/${m.userId}/ban`, { method: 'DELETE' })
          : api(`/api/admin/reports/${m.reportId}/${m.action}`, { method: 'POST' }),
    // Reports, users and stats all change with a ban or a removal.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}

/** Where a reported post lives: answers and comments are found through their question or story. */
export function useReportedPostLink(targetType: Report['targetType'], targetId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'post-link', targetType, targetId],
    enabled,
    retry: false,
    queryFn: async ({ signal }): Promise<string | null> => {
      switch (targetType) {
        case 'QUESTION':
        case 'AI_ANSWER':
          return `/questions/${targetId}`
        case 'BLOG':
          return `/s/${targetId}`
        case 'USER':
          return `/users/${targetId}`
        case 'ANSWER': {
          const answer = await api<Schemas['AnswerResponse']>(`/api/answers/id/${targetId}`, { signal })
          return answer.questionId != null ? `/questions/${answer.questionId}#answer-${targetId}` : null
        }
        case 'COMMENT': {
          const comment = await api<{ blogId?: number }>(`/api/comments/id/${targetId}`, { signal })
          return comment.blogId != null ? `/s/${comment.blogId}` : null
        }
        default:
          return null
      }
    },
  })
}
