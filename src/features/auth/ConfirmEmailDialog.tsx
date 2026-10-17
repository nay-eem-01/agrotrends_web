import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useT } from '../../lib/i18n'
import { Button, ButtonLink } from '../../ui/Button'
import { ResendLink } from './confirmEmail'
import { useSession } from './session'

/** Explains why a write was refused, with the resend button. */
export function ConfirmEmailDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  const { user } = useSession()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">{user?.email ? t('Confirm your e-mail first') : t('Confirm your phone number first')}</DialogTitle>
          <DialogDescription className="text-base">
            {user?.email
              ? t('Open the link we sent to {email}. Until then you can read everything, but not post, vote or publish.', { email: user.email })
              : t('Enter the code we texted to {phone}. Until then you can read everything, but not post, vote or publish.', { phone: user?.mobileNumber ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center sm:justify-between">
          <span className="flex flex-wrap items-center gap-3">
            {user?.email && <ResendLink email={user.email} />}
            {user?.mobileNumber && (
              <ButtonLink to="/verify-phone" variant={user.email ? 'quiet' : 'secondary'} size="sm" onClick={() => onOpenChange(false)}>
                {t('Enter the SMS code')}
              </ButtonLink>
            )}
          </span>
          <Button variant="quiet" size="sm" onClick={() => onOpenChange(false)}>
            {t('Not now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
