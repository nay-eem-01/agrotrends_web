import { useT, formatNumber } from '../../lib/i18n'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStory } from '../../api/blogs'
import { ApiError, errorMessage } from '../../api/errors'
import type { BlogResponse } from '../../api/types'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { ButtonLink } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { BookmarkButton } from '../reactions/BookmarkButton'
import { ClapButton } from '../reactions/ClapButton'
import { WrittenBy } from '../authors/AuthorPage'
import { NotFoundPage } from '../errors/NotFoundPage'
import { Thread } from '../threads/Thread'
import { RelatedStories } from './RelatedStories'

export function StoryPage() {
  const t = useT()
  const { slug = '' } = useParams()
  const { status } = useSession()
  // Wait for a restoring session: an author opening their own draft needs the token on the first read.
  const story = useStory(slug, status !== 'restoring')

  if (status === 'restoring' || story.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label={t('Loading story')} />
      </div>
    )
  }
  if (story.isError) {
    if (story.error instanceof ApiError && story.error.isNotFound) return <NotFoundPage />
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-ink-muted sm:px-6">
        {errorMessage(story.error)}
      </p>
    )
  }
  return <Story story={story.data} />
}

function Story({ story }: { story: BlogResponse }) {
  const t = useT()
  const author = story.author
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const { user } = useSession()
  const own = user?.authorId != null && user.authorId === author?.authorId
  const meta = [story.readingTimeMinutes ? t('{n} min read', { n: formatNumber(story.readingTimeMinutes) }) : null, storyDate(story.publishedAt)].filter(Boolean)

  return (
    <article className="pb-20">
      <title>{`${story.title} – AgroTrends`}</title>
      <header className="mx-auto max-w-(--container-feed) px-4 pt-10 sm:px-6 sm:pt-14">
        {notice && <output className="mb-4 block w-fit rounded-full bg-paddy px-3 py-1 text-sm text-paper">{notice}</output>}
        {story.status === 'DRAFT' && (
          <p className="mb-4 inline-block rounded-full bg-field px-3 py-1 text-sm text-ink">{t('Draft — only you can see this')}</p>
        )}
        <h1 className="text-2xl sm:text-3xl">{story.title}</h1>
        {author?.name && (
          <div className="mt-8 flex items-center gap-3">
            <Avatar name={author.name} size={44} />
            <div className="min-w-0 text-sm">
              <Link to={`/authors/${author.authorId}`} className="font-medium text-ink hover:underline">
                {author.name}
              </Link>
              <p className="text-ink-muted">
                {meta.join(' · ')}
                {story.category?.categoryName && (
                  <>
                    {' · '}in {story.category.categoryName}
                  </>
                )}
              </p>
            </div>
            {own && (
              <ButtonLink to={`/write/${story.id}`} variant="secondary" size="sm" className="ml-auto">
                {t('Edit story')}
              </ButtonLink>
            )}
          </div>
        )}
        <StoryActions story={story} />
      </header>

      {story.imageUrl && (
        <figure className="mx-auto mt-10 max-w-[1000px] sm:px-6">
          <img src={story.imageUrl} alt="" fetchPriority="high" decoding="async" className="w-full sm:rounded" />
        </figure>
      )}

      <div className="mx-auto mt-10 max-w-(--container-feed) px-4 sm:px-6">
        <SafeHtml html={story.content} className="story-body" />
        <StoryFooter story={story} />
        <StoryActions story={story} />
        {author?.authorId != null && <WrittenBy authorId={author.authorId} fallbackName={author.name ?? ''} />}
        {story.id != null && story.status === 'PUBLISHED' && <RelatedStories blogId={story.id} />}
        {story.id != null && story.status === 'PUBLISHED' && <Thread kind="comments" parentId={story.id} />}
      </div>
    </article>
  )
}

function StoryActions({ story }: { story: BlogResponse }) {
  return (
    <div className="mt-6 flex items-center justify-between border-y border-rule py-1">
      <ClapButton story={story} />
      <BookmarkButton story={story} />
    </div>
  )
}

function StoryFooter({ story }: { story: BlogResponse }) {
  const t = useT()
  const agri = story.agri ?? {}
  const farming = [
    agri.crop && { label: agri.crop, to: filterPath({ crop: agri.crop }), name: t('Crop') },
    agri.season && { label: t(SEASON_LABELS[agri.season]), to: filterPath({ season: agri.season }), name: t('Season') },
    agri.region && { label: agri.region, to: filterPath({ region: agri.region }), name: t('Region') },
    agri.soil && { label: t(SOIL_LABELS[agri.soil]), to: filterPath({ soil: agri.soil }), name: t('Soil') },
  ].filter((item): item is { label: string; to: string; name: string } => Boolean(item))
  const tags = story.tags ?? []

  if (farming.length === 0 && tags.length === 0) return null
  return (
    <footer className="mt-12 flex flex-col gap-5">
      {farming.length > 0 && (
        <section aria-label={t('Farming context')}>
          <ul className="flex flex-wrap gap-2">
            {farming.map((item) => (
              <li key={item.name}>
                <Chip to={item.to}>
                  <span className="mr-1 text-ink-muted">{t(item.name)}</span>
                  {item.label}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tags.length > 0 && (
        <section aria-label={t('Tags')}>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Chip to={`/tags/${encodeURIComponent(tag)}`}>{tag}</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
    </footer>
  )
}
