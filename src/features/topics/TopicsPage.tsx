import { useT } from '../../lib/i18n'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFollowedTags, useTags } from '../../api/topics'
import { Chip } from '../../ui/Chip'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { useSession } from '../auth/session'

const tagPath = (tag: string) => `/tags/${encodeURIComponent(tag)}`

/** Every topic, searchable, with the reader's followed ones first. */
export function TopicsPage() {
  const t = useT()
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query.trim().toLowerCase())
  const tags = useTags(q)
  const { status } = useSession()
  const followed = useFollowedTags(status === 'signed-in').data ?? []

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{t('Topics – AgroTrends')}</title>
      <h1 className="text-2xl sm:text-3xl">{t('Topics')}</h1>
      <p className="mt-2 text-ink-muted">{t('Crops, pests, soils and practices people write about. Follow a topic to see its stories in For you.')}</p>

      {followed.length > 0 && (
        <section aria-label={t('Topics you follow')} className="mt-8">
          <h2 className="text-lg">{t('You follow')}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {followed.map((tag) => (
              <li key={tag}>
                <Chip to={tagPath(tag)} selected>
                  {tag}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <TextField label={t('Find a topic')} type="search" placeholder="rice, aphids, soil health" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {tags.isPending ? (
        <div className="py-8 text-ink-muted">
          <Spinner label={t('Loading topics')} />
        </div>
      ) : tags.isError ? (
        <p role="alert" className="py-8 text-ink-muted">
          {t('Couldn\'t load topics. Try again in a moment.')}
        </p>
      ) : tags.data.length === 0 ? (
        <p className="py-8 text-ink-muted">No topics start with “{q}”.</p>
      ) : (
        <ul aria-label={t('Topics')} className="mt-5 flex flex-wrap gap-2">
          {tags.data.map((tag) => (
            <li key={tag}>
              <Chip to={tagPath(tag)}>{tag}</Chip>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** The home page's right rail: a few topics to follow. */
export function TopicsRail() {
  const t = useT()
  const tags = useTags()
  if (!tags.data?.length) return null
  return (
    <section aria-labelledby="rail-topics" className="sticky top-24">
      <h2 id="rail-topics" className="font-sans text-base font-semibold">
        {t('Topics to follow')}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {tags.data.slice(0, 12).map((tag) => (
          <li key={tag}>
            <Chip to={tagPath(tag)}>{tag}</Chip>
          </li>
        ))}
      </ul>
      <Link to="/topics" className="mt-4 inline-block text-sm text-paddy underline-offset-4 hover:underline">
        {t('See all topics')}
      </Link>
    </section>
  )
}
