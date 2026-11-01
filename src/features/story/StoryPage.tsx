import { useT, formatNumber } from '../../lib/i18n'
import { ArrowLeft } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'
import { looksLikeHtml, sanitizeHtml } from '../../lib/sanitize'
import { useStory } from '../../api/blogs'
import { ApiError, errorMessage } from '../../api/errors'
import type { BlogResponse } from '../../api/types'
import { filterPath, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { ButtonLink } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { TagList } from '../../ui/TagList'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useAuthor } from '../../api/authors'
import { useSession } from '../auth/session'
import { FollowAuthorButton } from '../authors/FollowAuthorButton'
import { ReportButton } from '../reports/ReportButton'
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
      <div className="flex justify-center py-24 text-muted-foreground">
        <Spinner label={t('Loading story')} />
      </div>
    )
  }
  if (story.isError) {
    if (story.error instanceof ApiError && story.error.isNotFound) return <NotFoundPage />
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-muted-foreground sm:px-6">
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
      {/* After Medium: the headline, byline and actions first, then the cover, then the reading column. */}
      <header className="mx-auto max-w-[calc(var(--container-read)+3rem)] px-4 pt-6 sm:px-6 sm:pt-8">
        <Link to="/stories" className="-ml-1 inline-flex h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} aria-hidden="true" />
          {t('Back to stories')}
        </Link>
        {notice && <output className="mt-4 block w-fit rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">{notice}</output>}
        {story.status === 'DRAFT' && (
          <p className="mt-4 inline-block rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{t('Draft — only you can see this')}</p>
        )}
        {story.category?.categoryName && (
          <div className="mt-6">
            <Badge variant="secondary">{story.category.categoryName}</Badge>
          </div>
        )}
        <h1 className="mt-4 font-serif text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-[3rem]">{story.title}</h1>
        {story.subtitle && <p className="mt-3 font-serif text-xl leading-snug text-pretty text-muted-foreground sm:text-[1.375rem]">{story.subtitle}</p>}
        {author?.name && (
          <div className="mt-7 flex items-center gap-3">
            <Avatar name={author.name} size={44} />
            <div className="min-w-0 text-sm">
              <Link to={`/authors/${author.authorId}`} className="font-semibold text-foreground hover:underline">
                {author.name}
              </Link>
              <p className="text-muted-foreground">{meta.join(' · ')}</p>
            </div>
            {own ? (
              <ButtonLink to={`/write/${story.id}`} variant="secondary" size="sm" className="ml-auto">
                {t('Edit story')}
              </ButtonLink>
            ) : (
              author.authorId != null && <BylineFollow authorId={author.authorId} />
            )}
          </div>
        )}
        <StoryActions story={story} />
      </header>
      {story.imageUrl && (
        <figure className="mx-auto mt-8 max-w-[52rem] px-4 sm:px-6">
          {/* A wide, deliberate crop from the centre; the photo is never stretched. */}
          <img src={story.imageUrl} alt="" fetchPriority="high" decoding="async" className="aspect-[16/9] w-full rounded-xl bg-muted object-cover" />
        </figure>
      )}

      <Body story={story} />
      <div className="mx-auto max-w-[calc(var(--container-read)+3rem)] px-4 sm:px-6">
        <StoryFooter story={story} />
        <StoryActions story={story} />
        {author?.authorId != null && <WrittenBy authorId={author.authorId} fallbackName={author.name ?? ''} />}
        {story.id != null && story.status === 'PUBLISHED' && <RelatedStories blogId={story.id} />}
        {story.id != null && story.status === 'PUBLISHED' && <Thread kind="comments" parentId={story.id} />}
      </div>
    </article>
  )
}

/** Follow in the byline, as on Medium; the author's profile is shared with "Written by" below, so it's read once. */
function BylineFollow({ authorId }: { authorId: number }) {
  const profile = useAuthor(authorId)
  if (!profile.data) return null
  return (
    <div className="ml-auto">
      <FollowAuthorButton author={profile.data} />
    </div>
  )
}

/** The story's own section headings (its h2s), for the contents list; none for plain-text stories. */
function storyHeadings(html: string | undefined): string[] {
  if (!html || !looksLikeHtml(html)) return []
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html')
  return Array.from(doc.querySelectorAll('h2')).map((heading) => heading.textContent?.trim() ?? '').filter(Boolean)
}

/**
 * The reading column; on wide screens, when the story has two or more sections, an "In this article" list beside it
 * that links to them. The headings get ids after render (the stored HTML is never changed).
 */
function Body({ story }: { story: BlogResponse }) {
  const t = useT()
  const column = useRef<HTMLDivElement>(null)
  const headings = useMemo(() => storyHeadings(story.content), [story.content])
  const contents = headings.length >= 2

  useEffect(() => {
    column.current?.querySelectorAll('h2').forEach((heading, index) => {
      heading.id = `section-${index + 1}`
    })
  }, [story.content])

  return (
    <div className={cn('mx-auto mt-10 px-4 sm:px-6', contents ? 'max-w-(--container-page) lg:grid lg:grid-cols-[13rem_minmax(0,var(--container-read))_13rem] lg:justify-center lg:gap-12' : 'max-w-[calc(var(--container-read)+3rem)]')}>
      {contents && (
        <nav aria-labelledby="story-contents" className="hidden lg:block">
          <div className="sticky top-24">
            <h2 id="story-contents" className="text-xs font-semibold text-muted-foreground">
              {t('In this article')}
            </h2>
            <ol className="mt-3 flex flex-col gap-1 border-l border-border">
              {headings.map((heading, index) => (
                <li key={index}>
                  <a href={`#section-${index + 1}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-foreground">
                    {heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}
      <div ref={column} className="min-w-0">
        <SafeHtml html={story.content} className="story-body" />
      </div>
    </div>
  )
}

function StoryActions({ story }: { story: BlogResponse }) {
  const t = useT()
  const { user } = useSession()
  const own = user?.authorId != null && user.authorId === story.author?.authorId
  return (
    <div className="mt-6 flex items-center justify-between border-y border-border py-1">
      <ClapButton story={story} />
      <div className="flex items-center gap-1">
        <ReportButton targetType="BLOG" targetId={story.id ?? 0} own={own} what={t('this story')} />
        <BookmarkButton story={story} />
      </div>
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
                  <span className="mr-1 text-muted-foreground">{t(item.name)}</span>
                  {item.label}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tags.length > 0 && (
        <TagList size="md" label={t('Tags')} items={tags.map((tag) => ({ label: tag, to: `/tags/${encodeURIComponent(tag)}` }))} />
      )}
    </footer>
  )
}
