import { Envelope } from '@phosphor-icons/react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDigestPreview } from '../../api/admin'
import { errorMessage } from '../../api/errors'
import { Button } from '../../ui/Button'

// Mail apps show the digest on white; it sets no page colour of its own, so the preview gives the frame's document
// the same canvas in either theme.
const MAIL_CANVAS = '<meta name="color-scheme" content="light"><style>html{background:#fff;color:#1c2b21}</style>'

/**
 * The Monday digest, previewed: your own as it would be mailed, in a dialog. The mail's HTML is shown in a sandboxed
 * frame with scripts off, never inserted into the page.
 */
export function DigestPreview() {
  const preview = useDigestPreview()
  const [open, setOpen] = useState(false)

  return (
    <section aria-labelledby="admin-digest" className="mt-10">
      <h2 id="admin-digest" className="text-sm font-semibold text-muted-foreground">
        Weekly digest
      </h2>
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          Mailed on Mondays at 8:00 (Dhaka) to members who chose it: unanswered questions in the topics they follow, and
          for experts, AI answers waiting for a check. Nobody with nothing to show gets one.
        </p>
        <Button
          variant="secondary"
          size="sm"
          loading={preview.isPending}
          className="shrink-0"
          onClick={() => preview.mutate(undefined, { onSuccess: () => setOpen(true) })}
        >
          <Envelope size={16} aria-hidden="true" />
          Preview your digest
        </Button>
      </div>
      {preview.isError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errorMessage(preview.error)}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your digest this week</DialogTitle>
            <DialogDescription>Not sent. This is what your own e-mail would hold today.</DialogDescription>
          </DialogHeader>
          <iframe title="Digest preview" sandbox="" srcDoc={MAIL_CANVAS + (preview.data ?? '')} className="h-[60vh] w-full rounded-lg border border-border" />
        </DialogContent>
      </Dialog>
    </section>
  )
}
