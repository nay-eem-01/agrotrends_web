import { Link, useParams } from 'react-router-dom'
import { useStory } from '../../api/blogs'
import { ApiError, errorMessage } from '../../api/errors'
import type { BlogResponse } from '../../api/types'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Chip } from '../../ui/Chip'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { BookmarkButton } from '../reactions/BookmarkButton'
import { ClapButton } from '../reactions/ClapButton'
import { WrittenBy } from '../authors/AuthorPage'
import { Responses } from '../comments/Responses'
import { NotFoundPage } from '../errors/NotFoundPage'

export function StoryPage() {
  const { slug = '' } = useParams()
  const { status } = useSession()
  // Wait for a restoring session: an author opening their own draft needs the token on the first read.
  const story = useStory(slug, status !== 'restoring')

  if (status === 'restoring' || story.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label="Loading story" />
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
  const author = story.author
  const meta = [story.readingTimeMinutes ? `${story.readingTimeMinutes} min read` : null, storyDate(story.publishedAt)].filter(Boolean)

  return (
    <article className="pb-20">
      <title>{`${story.title} – AgroTrends`}</title>
      <header className="mx-auto max-w-(--container-feed) px-4 pt-10 sm:px-6 sm:pt-14">
        {story.status === 'DRAFT' && (
          <p className="mb-4 inline-block rounded-full bg-field px-3 py-1 text-sm text-ink">Draft — only you can see this</p>
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
          </div>
        )}
        <StoryActions story={story} />
      </header>

      {story.imageUrl && (
        <figure className="mx-auto mt-10 max-w-[1000px] sm:px-6">
          <img src={story.imageUrl} alt="" className="w-full sm:rounded" />
        </figure>
      )}

      <div className="mx-auto mt-10 max-w-(--container-feed) px-4 sm:px-6">
        <SafeHtml html={story.content} className="story-body" />
        <StoryFooter story={story} />
        <StoryActions story={story} />
        {author?.authorId != null && <WrittenBy authorId={author.authorId} fallbackName={author.name ?? ''} />}
        {story.id != null && story.status === 'PUBLISHED' && <Responses blogId={story.id} />}
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
  const agri = story.agri ?? {}
  const farming = [
    agri.crop && { label: agri.crop, to: filterPath({ crop: agri.crop }), name: 'Crop' },
    agri.season && { label: SEASON_LABELS[agri.season], to: filterPath({ season: agri.season }), name: 'Season' },
    agri.region && { label: agri.region, to: filterPath({ region: agri.region }), name: 'Region' },
    agri.soil && { label: SOIL_LABELS[agri.soil], to: filterPath({ soil: agri.soil }), name: 'Soil' },
  ].filter((item): item is { label: string; to: string; name: string } => Boolean(item))
  const tags = story.tags ?? []

  if (farming.length === 0 && tags.length === 0) return null
  return (
    <footer className="mt-12 flex flex-col gap-5">
      {farming.length > 0 && (
        <section aria-label="Farming context">
          <ul className="flex flex-wrap gap-2">
            {farming.map((item) => (
              <li key={item.name}>
                <Chip to={item.to}>
                  <span className="mr-1 text-ink-muted">{item.name}</span>
                  {item.label}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tags.length > 0 && (
        <section aria-label="Tags">
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
