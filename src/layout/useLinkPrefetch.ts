import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { aiAnswerQuery } from '../api/aiAnswer'
import { answersQuery } from '../api/answers'
import { storyQuery } from '../api/blogs'
import { questionQuery } from '../api/questions'
import { useSession } from '../features/auth/session'

const HOVER_MS = 80

/** Starts a question's or story's page code and data for a link path; false for any other path. */
export function prefetchPath(queryClient: QueryClient, path: string): boolean {
  const question = /^\/questions\/(\d+)$/.exec(path)
  if (question) {
    const id = Number(question[1])
    void import('../features/qa/QuestionPage')
    void queryClient.prefetchQuery(questionQuery(id))
    void queryClient.prefetchQuery(answersQuery(id))
    void queryClient.prefetchQuery(aiAnswerQuery(id))
    return true
  }
  const story = /^\/stories\/([^/]+)$/.exec(path)
  if (story) {
    void queryClient.prefetchQuery(storyQuery(decodeURIComponent(story[1])))
    return true
  }
  return false
}

/**
 * One listener for the whole app: a pointer resting on (80 ms), pressing, or keyboard focus reaching a link to a
 * question or story starts that page's data, so it is often ready when the click lands. Cached entries younger than
 * the query client's staleTime aren't fetched again. Hover is skipped when the reader asked to save data; a press is
 * followed by the visit anyway. Nothing runs while the session is restoring, so no anonymous copy gets cached.
 */
export function useLinkPrefetch() {
  const queryClient = useQueryClient()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'restoring') return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    let timer: ReturnType<typeof setTimeout> | undefined

    const pathOf = (target: EventTarget | null) => {
      const link = target instanceof Element ? target.closest('a[href]') : null
      return link instanceof HTMLAnchorElement && link.origin === window.location.origin ? link.pathname : null
    }
    const now = (event: Event) => {
      const path = pathOf(event.target)
      if (path) prefetchPath(queryClient, path)
    }
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || saveData) return
      clearTimeout(timer)
      const path = pathOf(event.target)
      if (path) timer = setTimeout(() => prefetchPath(queryClient, path), HOVER_MS)
    }
    const leave = () => clearTimeout(timer)

    document.addEventListener('pointerover', hover)
    document.addEventListener('pointerout', leave)
    document.addEventListener('pointerdown', now)
    document.addEventListener('focusin', now)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerover', hover)
      document.removeEventListener('pointerout', leave)
      document.removeEventListener('pointerdown', now)
      document.removeEventListener('focusin', now)
    }
  }, [queryClient, status])
}
