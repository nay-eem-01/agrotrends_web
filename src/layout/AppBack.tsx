import { createContext, useContext, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { matchPath, useLocation, useNavigate, useNavigationType } from 'react-router-dom'

const VisitedPages = createContext<RefObject<ReadonlyMap<number, string>> | null>(null)

function historyIndex(): number | undefined {
  const index = window.history.state?.idx
  return Number.isInteger(index) ? index : undefined
}

export function AppBackProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigation = useNavigationType()
  const visited = useRef(new Map<number, string>())
  const restored = useRef(false)
  useLayoutEffect(() => {
    const index = historyIndex()
    if (index == null) return
    try {
      if (!restored.current && index > 0) {
        const entries = JSON.parse(sessionStorage.getItem('agrotrends.navigation') ?? '[]')
        if (Array.isArray(entries)) {
          for (const entry of entries) {
            if (Array.isArray(entry) && Number.isInteger(entry[0]) && typeof entry[1] === 'string') {
              visited.current.set(entry[0], entry[1])
            }
          }
        }
      }
    } catch {
      // Current-tab history is still available if storage is blocked.
    }
    restored.current = true
    if (navigation === 'PUSH') {
      for (const previous of visited.current.keys()) {
        if (previous > index) visited.current.delete(previous)
      }
    }
    visited.current.set(index, location.pathname)
    try {
      sessionStorage.setItem('agrotrends.navigation', JSON.stringify([...visited.current]))
    } catch {
      // Current-tab history is still available if storage is blocked.
    }
  }, [location, navigation])
  return <VisitedPages.Provider value={visited}>{children}</VisitedPages.Provider>
}

export function useAppBack() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const visited = useContext(VisitedPages)

  return (fallback = backDestination(pathname), requiredPreviousPath?: string) => {
    const index = historyIndex() ?? 0
    for (let previous = index - 1; previous >= 0; previous -= 1) {
      const path = visited?.current.get(previous)
      if (path === pathname) continue
      if (path && (!requiredPreviousPath || path === requiredPreviousPath)) {
        navigate(previous - index)
        return
      }
      break
    }
    navigate(fallback, { replace: true })
  }
}

function backDestination(pathname: string) {
  const edit = matchPath('/questions/:questionId/edit', pathname)
  if (edit) return `/questions/${edit.params.questionId}`
  if (matchPath('/stories/:slug', pathname)) return '/stories'
  if (matchPath('/questions/:questionId', pathname)) return '/questions'
  if (pathname === '/advisor/history') return '/advisor'
  return '/'
}
