import { useMemo } from 'react'
import { looksLikeHtml, sanitizeHtml } from '../lib/sanitize'
import { cx } from './cx'

interface SafeHtmlProps {
  html: string | null | undefined
  className?: string
}

/**
 * The only place user HTML reaches the page: cleaned with DOMPurify first. Plain text (older stories) is shown as
 * paragraphs without being parsed as HTML at all.
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const content = html ?? ''
  const clean = useMemo(() => (looksLikeHtml(content) ? sanitizeHtml(content) : null), [content])

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
  // oxlint-disable-next-line react/no-danger -- sanitised above; this is the one allowed use (see CLAUDE.md)
  return <div className={cx(className)} dangerouslySetInnerHTML={{ __html: clean }} />
}
