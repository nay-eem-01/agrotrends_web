import { EnvelopeSimple } from '@phosphor-icons/react'
import { useSyncExternalStore } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useResendVerification } from '../../api/auth'
import { ApiError, errorMessage } from '../../api/errors'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { useSession } from './session'

/**
 * Writes need a confirmed e-mail. The backend refuses with a 403 whose message starts "Confirm your e-mail"; it has
 * no error codes, so this is the one place the app matches message text (docs/BACKEND_CATCHUP_PLAN.md, Errors).
 */
export function isConfirmEmailError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403 && /^confirm your e-mail/i.test(error.message)
}

let open = false
const listeners = new Set<() => void>()
function setOpen(value: boolean) {
  open = value
  listeners.forEach((listener) => listener())
}

/** Opens the confirm dialog; called for any refused write (see queryClient.ts). */
export function requestEmailConfirmation(): void {
  setOpen(true)
}

function useDialogOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
  )
}

/** "Send a new link" for the signed-in account; says so either way, as the backend never tells if it sent one. */
export function ResendLink({ email, variant = 'secondary' }: { email: string; variant?: 'secondary' | 'quiet' }) {
  const t = useT()
  const resend = useResendVerification()
  if (resend.isSuccess) {
    return <output className="text-sm text-muted-foreground">{t('If the address is registered, a new link is on its way.')}</output>
  }
  return (
    <span className="flex flex-wrap items-center gap-3">
      <Button variant={variant} size="sm" loading={resend.isPending} onClick={() => resend.mutate(email)}>
        {t('Send a new link')}
      </Button>
      {resend.isError && (
        <span role="alert" className="text-sm text-destructive">
          {errorMessage(resend.error)}
        </span>
      )}
    </span>
  )
}

/** A strip under the top bar while the signed-in account's e-mail is unconfirmed. */
export function EmailBanner() {
  const t = useT()
  const { user } = useSession()
  if (!user || user.emailVerified !== false) return null
  return (
    <section aria-label={t('Confirm your e-mail')} className="border-b border-border bg-mustard-soft">
      <div className="mx-auto flex max-w-(--container-page) flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm sm:px-6">
        <EnvelopeSimple size={18} aria-hidden="true" className="shrink-0" />
        <p className="min-w-0 flex-1">
          {t('Confirm your e-mail to ask, answer, vote and publish. We sent a link to {email}.', { email: user.email ?? '' })}
        </p>
        <ResendLink email={user.email ?? ''} variant="quiet" />
      </div>
    </section>
  )
}

/** Explains why a write was refused, with the resend button. */
export function ConfirmEmailDialog() {
  const t = useT()
  const isOpen = useDialogOpen()
  const { user } = useSession()
  return (
    <Dialog open={isOpen} onOpenChange={(value) => setOpen(value)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold">{t('Confirm your e-mail first')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('Open the link we sent to {email}. Until then you can read everything, but not post, vote or publish.', { email: user?.email ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center sm:justify-between">
          {user?.email && <ResendLink email={user.email} />}
          <Button variant="quiet" size="sm" onClick={() => setOpen(false)}>
            {t('Not now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
