import { useT } from '../../lib/i18n'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategories, useFollowedCategories, useToggleCategoryFollow } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { Button } from '../../ui/Button'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useFollowedTags, useTags } from '../../api/topics'
import { Chip } from '../../ui/Chip'
import { TopicsSkeleton } from '../../ui/LoadingSkeleton'
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
  const signedIn = status === 'signed-in'
  const catalog = useCategories()
  const categories = (catalog.data ?? []).filter((category) => category.categoryName?.toLowerCase().includes(q))
  const followed = useFollowedTags(signedIn).data ?? []
  const followedCategories = useFollowedCategories(signedIn)
  const categoryIds = new Set(followedCategories.data?.map((category) => category.id))
  const toggleCategory = useToggleCategoryFollow()
  const requireSignIn = useRequireSignIn()

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{t('Topics – AgroTrends')}</title>
      <h1 className="text-2xl sm:text-3xl">{t('Topics')}</h1>
      <p className="mt-2 text-ink-muted">{t('Crops, pests, soils and practices people write about. Follow a topic to see its stories in For you.')}</p>

      {(followed.length > 0 || categoryIds.size > 0) && (
        <section aria-label={t('Topics you follow')} className="mt-8">
          <h2 className="text-lg">{t('You follow')}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {followedCategories.data?.map((category) => (
              <li key={category.id}>
                <Chip to={`/questions?categoryId=${category.id}`} selected>{category.categoryName}</Chip>
              </li>
            ))}
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
      {categories.length > 0 && (
        <ul aria-label={t('Categories')} className="mt-5 divide-y divide-border">
          {categories.map(({ id, categoryName: name }) => {
            if (id == null || !name) return null
            const following = categoryIds.has(id)
            return (
              <li key={id} className="flex items-center justify-between gap-3 py-2">
                <Link className="min-w-0 text-sm font-medium hover:underline" to={`/questions?categoryId=${id}`}>{name}</Link>
                <Button
                  size="sm"
                  variant={following ? 'secondary' : 'primary'}
                  aria-label={following ? t('Unfollow {name}', { name }) : t('Follow {name}', { name })}
                  aria-pressed={signedIn ? following : undefined}
                  disabled={signedIn && (!followedCategories.isSuccess || toggleCategory.isPending)}
                  onClick={() => requireSignIn(() => toggleCategory.mutate({ categoryId: id, follow: !following }))}
                >
                  {following ? t('Following') : t('Follow')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      {toggleCategory.isError && <p role="alert" className="mt-3 text-destructive">{errorMessage(toggleCategory.error)}</p>}
      {followedCategories.isError && catalog.isSuccess && (
        <div role="alert" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          {errorMessage(followedCategories.error)}
          <Button size="sm" variant="secondary" onClick={() => void followedCategories.refetch()}>{t('Try again')}</Button>
        </div>
      )}
      {tags.isPending || catalog.isPending ? (
        <TopicsSkeleton label={t('Loading topics')} className="py-8" />
      ) : (tags.isError && catalog.isError) || (catalog.isError && !tags.data?.length) || (tags.isError && categories.length === 0) ? (
        <p role="alert" className="py-8 text-ink-muted">
          {t('Couldn\'t load topics. Try again in a moment.')}
        </p>
      ) : !tags.data?.length ? (
        categories.length === 0 && <p className="py-8 text-ink-muted">{q ? t('No topics match “{query}”.', { query: q }) : t('No topics available yet.')}</p>
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
  const categories = useCategories()
  if (!tags.data?.length && !categories.data?.length) return null
  if (!tags.data?.length) {
    return (
      <section aria-labelledby="rail-topics" className="sticky top-24">
        <h2 id="rail-topics" className="font-sans text-sm font-semibold">{t('Topics')}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.data?.slice(0, 5).map((category) => (
            <li key={category.id}><Chip to={`/questions?categoryId=${category.id}`}>{category.categoryName}</Chip></li>
          ))}
        </ul>
        <Link to="/topics" className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">{t('Follow topics')}</Link>
      </section>
    )
  }
  return (
    <section aria-labelledby="rail-topics" className="sticky top-24">
      <h2 id="rail-topics" className="font-sans text-sm font-semibold">
        {t('Tags to follow')}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {tags.data.slice(0, 12).map((tag) => (
          <li key={tag}>
            <Chip to={tagPath(tag)}>{tag}</Chip>
          </li>
        ))}
      </ul>
      <Link to="/topics" className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
        {t('See all tags')}
      </Link>
    </section>
  )
}
