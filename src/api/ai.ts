import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type BlogAssist = Schemas['BlogAssistResponse']

/** A short summary and suggested topics for a draft (Gemini, authors only). 503 while the AI is down. */
export function useBlogAssist() {
  return useMutation({
    mutationFn: (draft: Schemas['BlogAssistRequest']) => api<BlogAssist>('/api/ai/blog-assist', { method: 'POST', body: draft }),
  })
}
