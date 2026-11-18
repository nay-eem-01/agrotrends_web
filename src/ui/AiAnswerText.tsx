import { marked } from 'marked'
import { useMemo } from 'react'
import { cn } from 'cn'
import { withCitations } from '../lib/html'
import { SafeHtml } from './SafeHtml'

/** AI answers may contain Markdown or older HTML. Both pass through the same HTML sanitizer. */
export function AiAnswerText({ text, sources = 0, className }: {
  text?: string | null
  sources?: number
  className?: string
}) {
  const html = useMemo(() => marked.parse(withCitations(text, sources), { async: false, breaks: true }), [text, sources])
  return (
    <SafeHtml html={html} className={cn(
      'min-w-0 break-words [&>p+p]:mt-3 [&_blockquote]:border-s-2 [&_blockquote]:ps-3 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_pre]:overflow-x-auto [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6 [&_sup]:ml-0.5 [&_sup]:rounded-md [&_sup]:bg-surface [&_sup]:px-1.5 [&_sup]:font-bold [&_sup]:text-primary',
      className,
    )} />
  )
}
