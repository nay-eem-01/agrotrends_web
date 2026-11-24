import { useT, formatNumber } from '../../lib/i18n'
import { ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { ReadingSkeleton } from '../../ui/LoadingSkeleton'
import { useAuthor } from '../../api/authors'
import { useSession } from '../auth/session'
import { FollowAuthorButton } from '../authors/FollowAuthorButton'
import { ReportButton } from '../reports/ReportButton'
import { ShareButton } from '../share/ShareButton'
import { BookmarkButton } from '../reactions/BookmarkButton'
import { ClapButton } from '../reactions/ClapButton'
import { WrittenBy } from '../authors/AuthorPage'
import { NotFoundPage } from '../errors/NotFoundPage'
import { Thread } from '../threads/Thread'
import { RelatedStories } from './RelatedStories'

const storyColumn = 'mx-auto max-w-[calc(var(--container-read)+3rem)] px-4 sm:px-6'

export function StoryPage() {
  const t = useT()
  const { slug = '' } = useParams()
  const { status } = useSession()
  // Wait for a restoring session: an author opening their own draft needs the token on the first read.
  const story = useStory(slug, status !== 'restoring')

  if (status === 'restoring' || story.isPending) {
    return <ReadingSkeleton label={t('Loading story')} story />
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
      <header className={cn(storyColumn, 'pt-6 sm:pt-8')}>
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
            <Avatar name={author.name} src={author.profileImageUrl} size={44} />
            <div className="min-w-0 text-sm">
              <Link to={`/authors/${author.authorId}`} className="font-semibold text-foreground hover:underline">
                {author.name}
              </Link>
              <p className="text-muted-foreground">{meta.join(' · ')}</p>
              {(story.citedCount ?? 0) > 0 && (
                // The reason to write here that only AgroTrends has: the advisor answers from this story.
                <p className="mt-0.5 inline-flex items-center gap-1 text-primary">
                  <Sparkle size={14} weight="fill" aria-hidden="true" />
                  {story.citedCount === 1 ? t('Cited in 1 AI answer') : t('Cited in {n} AI answers', { n: formatNumber(story.citedCount ?? 0) })}
                </p>
              )}
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
        <figure className={cn(storyColumn, 'mt-8')}>
          {/* A wide, deliberate crop from the centre; the photo is never stretched. */}
          <img src={story.imageUrl} alt="" fetchPriority="high" decoding="async" className="aspect-[16/9] w-full rounded-xl bg-muted object-cover" />
        </figure>
      )}

      <Body story={story} />
      <div className={storyColumn}>
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

/** The contents bar stays below the site header for the length of the story body. */
function Body({ story }: { story: BlogResponse }) {
  const t = useT()
  const column = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const headings = useMemo(() => storyHeadings(story.content), [story.content])
  const contents = headings.length >= 2
  const [active, setActive] = useState<string>()

  useEffect(() => {
    const body = column.current
    if (!body) return
    const sections = Array.from(body.querySelectorAll('h2')).filter((heading) => heading.textContent?.trim())
    sections.forEach((heading, index) => {
      heading.id = `section-${index + 1}`
      heading.tabIndex = -1
    })
    const initialSection = sections.find((heading) => `#${heading.id}` === window.location.hash)
    initialSection?.scrollIntoView?.()
    if (!contents) return

    let frame: number | undefined
    function updateActive() {
      frame = undefined
      // Use the same offset as the section links so active state and anchor navigation agree.
      const offset = Number.parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0
      let current: string | undefined
      for (const heading of sections) {
        if (heading.getBoundingClientRect().top > offset + 1) break
        current = heading.id
      }
      setActive(current)
    }
    function scheduleUpdate() {
      frame ??= requestAnimationFrame(updateActive)
    }

    updateActive()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleUpdate)
    observer?.observe(body)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      observer?.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [story.content, contents])

  useEffect(() => {
    const row = list.current
    const link = row?.querySelector('[aria-current="location"]')
    if (!row || !link) return
    const viewport = row.getBoundingClientRect()
    const item = link.getBoundingClientRect()
    // Reveal the active item without moving the article vertically.
    if (item.left < viewport.left) row.scrollLeft += item.left - viewport.left
    else if (item.right > viewport.right) row.scrollLeft += item.right - viewport.right
  }, [active])

  return (
    <div className={cn(storyColumn, 'mt-10')}>
      {contents && (
        <nav aria-label={t('In this article')} className="sticky top-16 z-10 -mx-4 mb-6 border-y border-border bg-background px-4 sm:mx-0 sm:px-0">
          <ol ref={list} className="flex h-14 items-stretch gap-4 overflow-x-auto sm:gap-6">
            {headings.map((heading, index) => {
              const id = `section-${index + 1}`
              const current = id === active
              return (
                <li key={id} className="flex shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={current ? 'location' : undefined}
                    className={cn(
                      'flex max-w-[65vw] items-center border-b-2 text-sm font-medium transition-colors duration-150 focus-visible:-outline-offset-2 sm:max-w-72',
                      current ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{heading}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>
      )}
      <div ref={column} className="min-w-0">
        <SafeHtml html={story.content} className={cn('story-body', contents && '[&_h2]:scroll-mt-[8.5rem]')} />
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
        {/* Drafts have no public address to share. */}
        {story.status === 'PUBLISHED' && story.slug && <ShareButton path={`/stories/${encodeURIComponent(story.slug)}`} title={story.title ?? ''} />}
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
