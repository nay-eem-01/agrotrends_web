import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleSignIn } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { useT } from '../../lib/i18n'
import { FormError } from './AuthPage'
import { useSession } from './session'

/** Google Identity Services, loaded only when a client id is configured (`VITE_GOOGLE_CLIENT_ID`). */
interface GoogleIdentity {
  initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client'

function loadGoogle(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google.accounts.id)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('Google sign-in did not load')))
    script.onerror = () => reject(new Error('Google sign-in did not load'))
    document.head.append(script)
  })
}

/** "Continue with Google" under the sign-in and sign-up forms; nothing at all without a client id. */
export function GoogleSignIn({ next }: { next: string }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!clientId) return null
  return <GoogleButton clientId={clientId} next={next} />
}

function GoogleButton({ clientId, next }: { clientId: string; next: string }) {
  const t = useT()
  const slot = useRef<HTMLDivElement>(null)
  const session = useSession()
  const navigate = useNavigate()
  const google = useGoogleSignIn()
  const latest = useRef({ mutate: google.mutate, session, navigate, next })
  useEffect(() => {
    latest.current = { mutate: google.mutate, session, navigate, next }
  })

  useEffect(() => {
    let active = true
    loadGoogle()
      .then((identity) => {
        if (!active || !slot.current) return
        identity.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            const { mutate, session, navigate, next } = latest.current
            mutate(credential, {
              onSuccess: (tokens) => {
                session.signedIn(tokens)
                navigate(next, { replace: true })
              },
            })
          },
        })
        identity.renderButton(slot.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 320 })
      })
      .catch(() => {
        // No Google button (blocked or offline); e-mail sign-in still works.
      })
    return () => {
      active = false
    }
  }, [clientId])

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">{t('or')}</p>
      <div ref={slot} className="flex min-h-11 justify-center" />
      <FormError message={google.isError ? errorMessage(google.error) : null} />
    </div>
  )
}
