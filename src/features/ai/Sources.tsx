import { useT } from '../../lib/i18n'
import { Link } from 'react-router-dom'
import type { Schemas } from '../../api/types'

/** The platform stories an AI answer drew on, as links: readers can check where the advice came from. */
export function Sources({ sources }: { sources?: Schemas['AiSourceResponse'][] }) {
  const t = useT()
  if (!sources?.length) return null
  return (
    <section aria-label={t('Sources')} className="mt-4">
      <h3 className="font-sans text-sm font-semibold">{t('From these stories')}</h3>
      <ol className="mt-2 flex flex-col gap-1.5">
        {sources.map((source, index) => (
          <li key={source.blogId} className="flex gap-2 text-sm">
            <span className="text-ink-muted">{index + 1}.</span>
            <Link to={`/s/${source.blogId}`} className="text-paddy underline-offset-4 hover:underline">
              {source.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
