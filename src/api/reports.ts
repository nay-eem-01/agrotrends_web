import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type ReportRequest = Schemas['CreateReportRequest']
export type ReportTarget = ReportRequest['targetType']
export type ReportReason = ReportRequest['reason']

/** The backend's limit on details. */
export const MAX_REPORT_DETAILS = 500

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'HARMFUL_ADVICE', label: 'Harmful advice', hint: 'Wrong or dangerous, e.g. a pesticide or medicine dose' },
  { value: 'SPAM', label: 'Spam', hint: 'Advertising or the same thing over and over' },
  { value: 'ABUSE', label: 'Abuse', hint: 'Insults, harassment or hate' },
  { value: 'FALSE_CREDENTIALS', label: 'False credentials', hint: 'Claims to be an expert they are not' },
  { value: 'OTHER', label: 'Something else', hint: 'Say what in the details' },
]

/** Report a post or profile. For the AI answer, `targetId` is the question's id. One report hides nothing on its own. */
export function useReport() {
  return useMutation({ mutationFn: (request: ReportRequest) => api<unknown>('/api/reports', { method: 'POST', body: request }) })
}
