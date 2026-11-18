import type { ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useT } from '../lib/i18n'
import { cx } from './cx'

/**
 * Wraps a picture (a profile photo, a cover) in a button that opens it full size in a dialog. `label` names both the
 * button and the dialog, e.g. "Nasrin's profile photo". Esc, the close button or a click outside closes it.
 */
export function ImageViewer({ src, label, className, children }: { src: string; label: string; className?: string; children: ReactNode }) {
  const t = useT()
  return (
    <Dialog>
      <DialogTrigger aria-label={label} className={cx('cursor-zoom-in', className)}>
        {children}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="w-fit max-w-none bg-transparent p-0 ring-0 sm:max-w-none">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {/* Sized against the screen, not the dialog: the dialog takes its width from the picture. */}
        <img src={src} alt={label} className="max-h-[85vh] w-auto max-w-[calc(100vw-2rem)] rounded-xl object-contain sm:max-w-[min(64rem,calc(100vw-4rem))]" />
        {/* On the photo itself, so it needs its own backdrop to stay visible on any picture. */}
        <DialogClose className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-transform duration-150 ease-(--ease-out) hover:bg-background active:scale-[0.97]">
          <X size={18} weight="bold" aria-hidden />
          <span className="sr-only">{t('Close')}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
