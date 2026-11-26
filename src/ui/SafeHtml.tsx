import { useEffect, useMemo, useRef, useState } from 'react'
import { looksLikeHtml, sanitizeHtml } from '../lib/sanitize'
import { Dialog } from '@/components/ui/dialog'
import { useLang, translate } from '../lib/i18n'
import { ImageViewerContent } from './ImageViewer'
import { cx } from './cx'

interface SafeHtmlProps {
  html: string | null | undefined
  className?: string
  previewImages?: boolean
}

/**
 * The only place user HTML reaches the page: cleaned with DOMPurify first. Plain text (older stories) is shown as
 * paragraphs without being parsed as HTML at all.
 */
export function SafeHtml({ html, className, previewImages = false }: SafeHtmlProps) {
  const content = html ?? ''
  const clean = useMemo(() => (looksLikeHtml(content) ? sanitizeHtml(content) : null), [content])

  const markup = useMemo(() => ({ __html: clean ?? '' }), [clean])
  const lang = useLang()
  const body = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const [image, setImage] = useState<{ src: string; label: string; open: boolean }>()

  useEffect(() => {
    if (!previewImages || !body.current) return
    const bindings = Array.from(body.current.querySelectorAll('img[src]')).flatMap((photo, index) => {
      if (!(photo instanceof HTMLImageElement)) return []
      const link = photo.closest('a')
      if (link && (link.childElementCount !== 1 || link.textContent?.trim())) return []
      const control = link ?? photo
      const label = photo.alt.trim() || translate(lang, 'Open story image {n}', { n: index + 1 })
      const attributes = ['tabindex', 'role', 'aria-label'] as const
      const previous = attributes.map((key) => control.getAttribute(key))
      control.setAttribute('tabindex', '0')
      control.setAttribute('role', 'button')
      control.setAttribute('aria-label', label)
      control.classList.add('cursor-zoom-in')

      function open(event: Event) {
        if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        trigger.current = control
        const photo = control instanceof HTMLImageElement ? control : control.querySelector('img')
        if (photo?.src) setImage({ src: photo.src, label, open: true })
      }
      control.addEventListener('click', open)
      control.addEventListener('keydown', open)
      return [() => {
        control.removeEventListener('click', open)
        control.removeEventListener('keydown', open)
        control.classList.remove('cursor-zoom-in')
        attributes.forEach((key, position) => {
          if (previous[position] == null) control.removeAttribute(key)
          else control.setAttribute(key, previous[position])
        })
      }]
    })
    return () => bindings.forEach((unbind) => unbind())
  }, [previewImages, clean, lang])

  if (clean === null) {
    return (
      <div className={className}>
        {content
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
      </div>
    )
  }
  return (
    <>
      {/* oxlint-disable-next-line react/no-danger -- sanitised above (see CLAUDE.md) */}
      <div ref={body} className={cx(className)} dangerouslySetInnerHTML={markup} />
      {image && (
        <Dialog open={image.open} onOpenChange={(open) => setImage({ ...image, open })}>
          <ImageViewerContent src={image.src} label={image.label} finalFocus={trigger} />
        </Dialog>
      )}
    </>
  )
}
