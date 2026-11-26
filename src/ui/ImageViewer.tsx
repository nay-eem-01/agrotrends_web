import { useState, type ReactNode, type RefObject } from 'react'
import { X } from '@phosphor-icons/react'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useT } from '../lib/i18n'
import { cx } from './cx'

/**
 * Wraps a picture (a profile photo, a cover) in a button that opens it full size in a dialog. `label` names both the
 * button and the dialog, e.g. "Nasrin's profile photo". Esc, the close button or a click outside closes it.
 */
export function ImageViewer({ src, label, className, children }: { src: string; label: string; className?: string; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger aria-label={label} className={cx('cursor-zoom-in', className)}>
        {children}
      </DialogTrigger>
      <ImageViewerContent src={src} label={label} />
    </Dialog>
  )
}

export function ImageViewerContent({ src, label, finalFocus }: { src: string; label: string; finalFocus?: RefObject<HTMLElement | null> }) {
  const t = useT()
  const [unavailable, setUnavailable] = useState<string>()
  return (
    <DialogContent finalFocus={finalFocus} showCloseButton={false} className="min-h-16 w-[calc(100vw-2rem)] max-w-none place-items-center bg-transparent p-0 ring-0 sm:w-[min(64rem,calc(100vw-4rem))] sm:max-w-none">
      <DialogTitle className="sr-only">{label}</DialogTitle>
      {unavailable === src ? (
        <p role="alert" className="rounded-xl bg-background px-5 py-4 pr-16 text-sm">{t('Could not open this image.')}</p>
      ) : (
        <img src={src} alt={label} onError={() => setUnavailable(src)} className="max-h-[85dvh] w-auto max-w-full rounded-xl object-contain" />
      )}
      {/* On the photo itself, so it needs its own backdrop to stay visible on any picture. */}
      <DialogClose className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-transform duration-150 ease-(--ease-out) hover:bg-background active:scale-[0.97]">
        <X size={18} weight="bold" aria-hidden />
        <span className="sr-only">{t('Close')}</span>
      </DialogClose>
    </DialogContent>
  )
}
