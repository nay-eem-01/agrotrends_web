import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { errorMessage } from '../../api/errors'
import { useModerate } from '../../api/moderation'
import { Button } from '../../ui/Button'
import { TextArea } from '../../ui/TextArea'

/** The backend's limit on a ban reason. */
const MAX_BAN_REASON = 500

/**
 * Ban (with a reason) or lift a ban, for staff. A ban signs the account out everywhere and closes the open reports
 * about it; it doesn't remove their posts. Admin accounts can't be banned (the backend says so). The backend has no
 * "is banned" read, so both actions are offered.
 */
export function BanControls({ userId, name }: { userId: number; name: string }) {
  const moderate = useModerate()
  const [banning, setBanning] = useState(false)
  const [reason, setReason] = useState('')
  const [missing, setMissing] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  function ban() {
    if (!reason.trim()) return setMissing(true)
    moderate.mutate(
      { action: 'ban', userId, reason: reason.trim() },
      {
        onSuccess: () => {
          setBanning(false)
          setDone(`${name} is banned and signed out everywhere.`)
        },
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="danger" size="sm" onClick={() => setBanning(true)}>
        Ban the account
      </Button>
      <Button variant="quiet" size="sm" loading={moderate.isPending && moderate.variables?.action === 'unban'} onClick={() => moderate.mutate({ action: 'unban', userId }, { onSuccess: () => setDone(`${name} can sign in again.`) })}>
        Lift a ban
      </Button>
      {done && <output className="text-sm text-primary">{done}</output>}
      {moderate.isError && !banning && (
        <p role="alert" className="w-full text-sm text-destructive">
          {errorMessage(moderate.error)}
        </p>
      )}
      <AlertDialog open={banning} onOpenChange={(open) => !open && setBanning(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They are signed out on every device at once, and their open reports are closed. Their posts stay: remove those through their reports. A ban
              can be lifted, but the ended sessions can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <TextArea
            label="Reason"
            hint="Shown to them when they try to sign in."
            rows={3}
            maxLength={MAX_BAN_REASON}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            error={missing && !reason.trim() ? 'Give a reason.' : undefined}
          />
          {moderate.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(moderate.error)}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="danger" size="sm" loading={moderate.isPending} onClick={ban}>
              Ban
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
