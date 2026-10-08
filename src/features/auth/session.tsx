import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signOut as signOutRequest } from '../../api/auth'
import { clearSession, hasStoredSession, restoreSession, setSessionLostHandler, startSession } from '../../api/client'
import type { UserResponse, WebTokenResponse } from '../../api/types'

type Status = 'restoring' | 'anonymous' | 'signed-in'

interface Session {
  status: Status
  user: UserResponse | null
  /** Store the tokens from sign-in and mark the reader as signed in. */
  signedIn: (tokens: WebTokenResponse) => void
  signOut: () => Promise<void>
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
      setUser(tokens.user ?? null)
      setStatus('signed-in')
      queryClient.clear()
    },
    [queryClient],
  )

  const signOut = useCallback(async () => {
    try {
      await signOutRequest()
    } catch {
      // Signed out here either way; the server-side session expires on its own.
    }
    clearSession()
    becomeAnonymous()
  }, [becomeAnonymous])

  const value = useMemo(() => ({ status, user, signedIn, signOut }), [status, user, signedIn, signOut])
  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
