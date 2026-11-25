import { Check, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import { useCategories, useFollowedCategories, useToggleCategoryFollow } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { useFollowedTags, useTags, useToggleTagFollow } from '../../api/topics'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { TopicsSkeleton } from '../../ui/LoadingSkeleton'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useSession } from '../auth/session'

const tagPath = (tag: string) => `/tags/${encodeURIComponent(tag)}`

const groups = [
  { name: 'Crops and gardens', topics: ['Rice', 'Wheat and maize', 'Pulses', 'Oilseeds', 'Vegetables', 'Fruits', 'Spices', 'Flowers and ornamentals', 'Jute and fibre crops', 'Tea and plantation crops', 'Mushrooms', 'Seeds and nurseries', 'Rooftop and home gardening'] },
  { name: 'Soil and water', topics: ['Soil health', 'Fertilizers and plant nutrition', 'Composting', 'Irrigation and water management', 'Climate-smart agriculture', 'Flood, drought and salinity', 'Organic farming'] },
  { name: 'Crop protection', topics: ['Plant diseases', 'Insect pests', 'Weed management', 'Integrated pest management'] },
  { name: 'Livestock and aquaculture', topics: ['Cattle and dairy', 'Goats and sheep', 'Poultry', 'Livestock health and nutrition', 'Freshwater fish farming', 'Shrimp and prawn farming', 'Fish health and pond management', 'Beekeeping'] },
  { name: 'Farm business and practice', topics: ['Agroforestry', 'Farm machinery', 'Harvest and storage', 'Food processing and safety', 'Agribusiness and markets', 'Farm finance and cooperatives', 'Agricultural education and careers', 'General agriculture'] },
] as const

const groupByTopic = new Map<string, (typeof groups)[number]['name']>(groups.flatMap(({ name, topics }) => topics.map((topic) => [topic.toLowerCase(), name] as const)))

type Topic = { key: string; name: string; to: string; following: boolean; disabled: boolean; toggle: () => void }

export function TopicsPage() {
  const t = useT()
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query.trim().toLowerCase())
  const tags = useTags(q)
  const catalog = useCategories()
  const { status } = useSession()
  const signedIn = status === 'signed-in'
  const followedTags = useFollowedTags(signedIn)
  const followedCategories = useFollowedCategories(signedIn)
  const categoryIds = new Set(followedCategories.data?.map(({ id }) => id))
  const tagNames = new Set(followedTags.data)
  const toggleCategory = useToggleCategoryFollow()
  const toggleTag = useToggleTagFollow()
  const requireSignIn = useRequireSignIn()

  const categories = (catalog.data ?? []).flatMap(({ id, categoryName: name }): Topic[] => {
    if (id == null || !name) return []
    const following = categoryIds.has(id)
    return [{
      key: `category-${id}`,
      name,
      to: `/questions?categoryId=${id}`,
      following,
      disabled: signedIn && (!followedCategories.isSuccess || toggleCategory.isPending),
      toggle: () => requireSignIn(() => toggleCategory.mutate({ categoryId: id, follow: !following })),
    }]
  })

  const tagTopic = (name: string): Topic => ({
    key: `tag-${name}`,
    name,
    to: tagPath(name),
    following: tagNames.has(name),
    disabled: signedIn && (!followedTags.isSuccess || toggleTag.isPending),
    toggle: () => requireSignIn(() => toggleTag.mutate({ tag: name, follow: !tagNames.has(name) })),
  })

  const followed = [...categories.filter(({ following }) => following), ...(followedTags.data ?? []).map(tagTopic)]
  const quickTopics = categories.filter(({ following }) => !following)
  const starters = quickTopics.filter(({ name }) => ['rice', 'soil health', 'insect pests'].includes(name.toLowerCase()))
  const grouped = new Map<string, Topic[]>([...groups.map(({ name }) => [name, []] as [string, Topic[]]), ['Other topics', []]])
  for (const category of categories) {
    const name = category.name.toLowerCase()
    if (name.includes(q)) grouped.get(groupByTopic.get(name) ?? 'Other topics')?.push(category)
  }
  const directory = Array.from(grouped).filter(([, topics]) => topics.length > 0)
  const searchTags = (tags.data ?? []).map(tagTopic)
  const followError = toggleCategory.error
  const catalogPending = catalog.isPending || tags.isPending
  const catalogError = (catalog.isError && (tags.isError || searchTags.length === 0)) || (tags.isError && directory.length === 0)

  return (
    <section className="mx-auto max-w-(--container-page) px-4 pt-6 pb-20 sm:px-8">
      <title>{t('Topics – AgroTrends')}</title>
      {(followed.length > 0 || quickTopics.length > 0) && (
        <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {followed.length > 0 && (
            <section aria-label={t('Topics you follow')} className="shrink-0">
              <ul className="flex gap-2">
                {followed.map((topic) => <TopicRow key={topic.key} topic={topic} pill />)}
              </ul>
            </section>
          )}
          <ul className="flex shrink-0 gap-2">
            {quickTopics.map((topic) => <TopicRow key={topic.key} topic={topic} pill />)}
          </ul>
        </div>
      )}

      <header className="border-b border-border pt-9 pb-10 text-center sm:pt-12 sm:pb-14">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-[2.75rem]">{t('Explore topics')}</h1>
        <label className="mx-auto mt-5 flex h-14 max-w-xl items-center gap-3 rounded-full bg-surface px-5 text-muted-foreground ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-primary">
          <MagnifyingGlass size={20} className="shrink-0" aria-hidden="true" />
          <span className="sr-only">{t('Find a topic')}</span>
          <input type="search" className="min-w-0 flex-1 bg-transparent text-foreground outline-none focus-visible:outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search all topics')} />
        </label>
        {!q && starters.length > 0 && (
          <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">{t('Start with')}</span>
            {starters.map(({ key, name, to }) => (
              <Link key={key} to={to} className="font-medium text-primary hover:underline">{name}</Link>
            ))}
          </div>
        )}
      </header>

      {followError && <p role="alert" className="mt-4 text-sm text-destructive">{errorMessage(followError)}</p>}
      {signedIn && (followedCategories.isError || followedTags.isError) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <p role="alert">{t('Could not load your followed topics.')}</p>
          <Button size="sm" variant="secondary" onClick={() => {
            if (followedCategories.isError) void followedCategories.refetch()
            if (followedTags.isError) void followedTags.refetch()
          }}>{t('Try again')}</Button>
        </div>
      )}
      {catalogPending ? (
        <TopicsSkeleton label={t('Loading topics')} className="py-10" />
      ) : catalogError ? (
        <p role="alert" className="py-8 text-muted-foreground">{t('Couldn\'t load topics. Try again in a moment.')}</p>
      ) : directory.length === 0 && searchTags.length === 0 ? (
        <p className="py-8 text-muted-foreground">{q ? t('No topics match “{query}”.', { query: q }) : t('No topics available yet.')}</p>
      ) : (
        <div className="grid gap-x-10 gap-y-10 pt-9 sm:grid-cols-2 xl:grid-cols-3">
          {directory.map(([name, topics]) => (
            <section key={name}>
              <h2 className="border-b border-border pb-3 font-sans text-lg font-semibold">{t(name)}</h2>
              <ul className="mt-2">
                {topics.map((topic) => <TopicRow key={topic.key} topic={topic} />)}
              </ul>
            </section>
          ))}
          {searchTags.length > 0 && (
            <section>
              <h2 className="border-b border-border pb-3 font-sans text-lg font-semibold">{t('Tags')}</h2>
              <ul aria-label={t('Topics')} className="mt-2">
                {searchTags.map((topic) => <TopicRow key={topic.key} topic={topic} />)}
              </ul>
            </section>
          )}
        </div>
      )}
    </section>
  )
}

function TopicRow({ topic, pill = false }: { topic: Topic; pill?: boolean }) {
  const t = useT()
  const Icon = topic.following ? Check : Plus
  return (
    <li className={cn('flex min-h-10 items-center gap-2 text-sm', pill && 'rounded-full border border-border pl-3', pill && topic.following && 'bg-surface')}>
      <Link to={topic.to} className={cn('min-w-0 flex-1 hover:text-primary hover:underline', pill && 'max-w-48 truncate')}>{topic.name}</Link>
      <button
        type="button"
        aria-label={topic.following ? t('Unfollow {name}', { name: topic.name }) : t('Follow {name}', { name: topic.name })}
        aria-pressed={topic.following}
        disabled={topic.disabled}
        onClick={topic.toggle}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-50',
          topic.following && 'text-primary',
        )}
      >
        <Icon size={16} aria-hidden="true" />
      </button>
    </li>
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
