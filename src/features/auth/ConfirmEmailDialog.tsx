import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
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
          <DialogTitle className="font-serif text-xl font-bold">{t('Confirm your e-mail first')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('Open the link we sent to {email}. Until then you can read everything, but not post, vote or publish.', { email: user?.email ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center sm:justify-between">
          {user?.email && <ResendLink email={user.email} />}
          <Button variant="quiet" size="sm" onClick={() => onOpenChange(false)}>
            {t('Not now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
