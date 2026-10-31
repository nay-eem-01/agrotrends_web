import { ChatCircleText, Newspaper } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { Schemas } from '../../api/types'
import { useT } from '../../lib/i18n'

type Source = Schemas['AiSourceResponse']

/** Where a source leads: a story by id (which redirects to its slug), or the question a community answer is on. */
export function sourceLink(source: Source): string | null {
  if (source.type === 'answer') return source.questionId != null ? `/questions/${source.questionId}` : null
  return source.blogId != null ? `/s/${source.blogId}` : null
}

/**
 * What an AI answer drew on, as links, so readers can check where the advice came from: platform stories and
 * community answers. A list under the AI answer card and in the history; in the advisor, numbered cards above the
 * answer, so the evidence reads first.
 */
export function Sources({ sources, layout = 'list' }: { sources?: Source[]; layout?: 'list' | 'cards' }) {
  const t = useT()
  const links = (sources ?? []).flatMap((source) => {
    const to = sourceLink(source)
    return to ? [{ source, to }] : []
  })
  if (!links.length) return null
  if (layout === 'cards') {
    return (
      <section aria-label={t('Sources')}>
        <h3 className="font-sans text-sm font-semibold">{t('Sources')}</h3>
        <ol className="mt-2 grid gap-2 sm:grid-cols-3">
          {links.map(({ source, to }, index) => (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                className="flex h-full flex-col gap-1.5 rounded-xl bg-surface p-3 text-sm transition-colors duration-150 hover:bg-secondary"
              >
                <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-md bg-background text-xs font-bold text-primary tabular-nums">
                  {index + 1}
                </span>
                <span className="line-clamp-2 font-semibold">{source.title}</span>
                <span className="sr-only">, </span>
                <span className="mt-auto text-xs text-muted-foreground">{source.type === 'answer' ? t('Community answer') : t('Story')}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )
  }
  return (
    <section aria-label={t('Sources')} className="mt-4">
      <h3 className="font-sans text-sm font-semibold">{t('Sources')}</h3>
      <ol className="mt-2 flex flex-col gap-2">
        {links.map(({ source, to }) => {
          const answer = source.type === 'answer'
          const Icon = answer ? ChatCircleText : Newspaper
          return (
            <li key={to} className="flex gap-2 text-sm">
              <Icon size={18} className="mt-px shrink-0 text-muted-foreground" aria-hidden="true" />
              <Link to={to} className="text-primary underline-offset-4 hover:underline">
                {answer ? t('Community answer to: {title}', { title: source.title ?? '' }) : source.title}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
