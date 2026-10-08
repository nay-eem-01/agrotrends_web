import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signOut as signOutRequest } from '../../api/auth'
import { clearSession, hasStoredSession, restoreSession, setSessionLostHandler, startSession } from '../../api/client'
import type { UserResponse, WebTokenResponse } from '../../api/types'

type Status = 'restoring' | 'anonymous' | 'signed-in'

interface Session {
  status: Status
  user: UserResponse | null
  /** Why the last session ended, for sign-in to show (e.g. after a password change); null otherwise. */
  endNotice: string | null
  /** Store the tokens from sign-in and mark the reader as signed in. */
  signedIn: (tokens: WebTokenResponse) => void
  /**
   * Ends the session. `remote: false` skips the server call when the backend has already revoked it; `notice` is
   * shown on sign-in (RequireAuth carries it there).
   */
  signOut: (options?: { remote?: boolean; notice?: string }) => Promise<void>
  /** Reflect an edit of the signed-in account without a round trip. */
  updateUser: (changes: Partial<UserResponse>) => void
}

const SessionContext = createContext<Session | null>(null)

/**
 * Holds who is signed in. On start a stored refresh token is turned back into a session; until that settles the
 * status is `restoring`, so guarded screens wait instead of bouncing a signed-in reader to sign-in.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>(() => (hasStoredSession() ? 'restoring' : 'anonymous'))
  const [user, setUser] = useState<UserResponse | null>(null)
  const [endNotice, setEndNotice] = useState<string | null>(null)

  const becomeAnonymous = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
    // Cached reads were made as the old reader ("followed by me", drafts); drop them.
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setSessionLostHandler(becomeAnonymous)
    return () => setSessionLostHandler(() => {})
  }, [becomeAnonymous])

  useEffect(() => {
    if (!hasStoredSession()) return
    let active = true
    restoreSession().then((tokens) => {
      if (!active) return
      if (tokens?.user) {
        setUser(tokens.user)
        setStatus('signed-in')
      } else {
        setStatus('anonymous')
      }
    })
    return () => {
      active = false
    }
  }, [])

  const signedIn = useCallback(
    (tokens: WebTokenResponse) => {
      startSession(tokens)
      setEndNotice(null)
      setUser(tokens.user ?? null)
      setStatus('signed-in')
      queryClient.clear()
    },
    [queryClient],
  )

  const signOut = useCallback(async ({ remote = true, notice }: { remote?: boolean; notice?: string } = {}) => {
    if (remote) {
      try {
        await signOutRequest()
      } catch {
        // Signed out here either way; the server-side session expires on its own.
      }
    }
    clearSession()
    setEndNotice(notice ?? null)
    becomeAnonymous()
  }, [becomeAnonymous])

  const updateUser = useCallback((changes: Partial<UserResponse>) => {
    setUser((current) => (current ? { ...current, ...changes } : current))
  }, [])

  const value = useMemo(
    () => ({ status, user, endNotice, signedIn, signOut, updateUser }),
    [status, user, endNotice, signedIn, signOut, updateUser],
  )
  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
