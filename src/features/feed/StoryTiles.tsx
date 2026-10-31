import { HandsClapping } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import type { StorySummary } from '../../api/types'
import { filterPath, SEASON_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { CoverFallback } from '../../ui/Botanical'
import { BookmarkButton } from '../reactions/BookmarkButton'

/*
 * Stories as editorial pieces rather than a list of rows: a featured story with a large cover, tiles in a grid, and
 * compact rows beside a feature. Covers keep fixed proportions; a story without a photo (or whose photo fails) gets
 * the drawn field cover with its crop or topic, never a made-up image.
 */

/** The cover, cropped to the container's proportions; the drawn cover when there is no photo or it fails. */
function Cover({ story, className, eager = false }: { story: StorySummary; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  const label = story.agri?.crop ?? story.category?.categoryName
  if (!story.imageUrl || failed) return <CoverFallback label={label} className={className} />
  return (
    <img
      src={story.imageUrl}
      alt=""
      loading={eager ? undefined : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('bg-muted object-cover transition-transform duration-300 ease-(--ease-out) group-hover:scale-[1.02] motion-reduce:transform-none', className)}
    />
  )
}

/**
 * Date, reading time and claps; the crop and the season (a small warm label) as links that filter the stories.
 */
function Meta({ story, className }: { story: StorySummary; className?: string }) {
  const t = useT()
  const { crop, season } = story.agri ?? {}
  const claps = story.clapCount ?? 0
  const parts = [storyDate(story.publishedAt), story.readingTimeMinutes ? t('{n} min read', { n: formatNumber(story.readingTimeMinutes) }) : null].filter(Boolean)
  return (
    <div className={cn('relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground', className)}>
      <span>{parts.join(' · ')}</span>
      {claps > 0 && (
        <span className="inline-flex items-center gap-1" aria-label={`${claps} claps`}>
          <HandsClapping size={14} aria-hidden="true" />
          {formatNumber(claps)}
        </span>
      )}
      {crop && (
        <Link to={filterPath({ crop })} aria-label={`Stories about ${crop}`} className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]">
          {crop}
        </Link>
      )}
      {season && (
        <Link
          to={filterPath({ season })}
          aria-label={t('{season} season stories', { season: t(SEASON_LABELS[season]) })}
          className="inline-flex items-center gap-1 rounded-full bg-mustard-soft px-2 py-0.5 font-medium text-foreground hover:bg-[color-mix(in_oklch,var(--mustard-soft),var(--foreground)_6%)]"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-mustard" />
          {t(SEASON_LABELS[season])}
        </Link>
      )}
    </div>
  )
}

function Topic({ story }: { story: StorySummary }) {
  const name = story.category?.categoryName
  if (!name) return null
  return <p className="text-xs font-semibold text-primary">{name}</p>
}

function Byline({ story }: { story: StorySummary }) {
  const author = story.author
  if (!author?.name) return null
  return (
    <Link to={`/authors/${author.authorId}`} className="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground hover:underline">
      <Avatar name={author.name} size={24} />
      {author.name}
    </Link>
  )
}

/** The lead story: a wide cover beside (or above, on phones) a large headline, the excerpt and the byline. */
export function StoryFeature({ story }: { story: StorySummary }) {
  const href = `/stories/${story.slug}`
  return (
    <article className="group relative grid gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-center md:gap-8">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-2xl">
        <Cover story={story} eager className="aspect-[16/10] w-full" />
      </Link>
      <div className="flex flex-col gap-3">
        <Topic story={story} />
        <h2 className="font-serif text-[1.75rem] leading-[1.15] font-medium text-balance sm:text-[2.125rem]">
          <Link to={href} className="decoration-primary/50 decoration-2 underline-offset-4 hover:underline">
            {story.title}
          </Link>
        </h2>
        {(story.subtitle || story.excerpt) && <p className="line-clamp-3 font-serif text-lg leading-relaxed text-muted-foreground">{story.subtitle || story.excerpt}</p>}
        <div className="mt-1 flex items-center gap-3">
          <Byline story={story} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Meta story={story} />
          <BookmarkButton story={story} className="-my-2 shrink-0" />
        </div>
      </div>
    </article>
  )
}

/** A story in a grid: cover on top, topic, headline, byline, date and save. */
export function StoryTile({ story }: { story: StorySummary }) {
  const href = `/stories/${story.slug}`
  return (
    <article className="group flex flex-col gap-3">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-xl">
        <Cover story={story} className="aspect-[16/10] w-full" />
      </Link>
      <Topic story={story} />
      <h3 className="font-serif text-xl leading-snug font-medium text-pretty">
        <Link to={href} className="decoration-primary/50 decoration-2 underline-offset-4 hover:underline">
          {story.title}
        </Link>
      </h3>
      {(story.subtitle || story.excerpt) && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{story.subtitle || story.excerpt}</p>}
      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Byline story={story} />
          <Meta story={story} />
        </div>
        <BookmarkButton story={story} className="-mb-2 shrink-0" />
      </div>
    </article>
  )
}

/** A small row beside a feature: thumbnail, topic, headline and date. */
export function StoryCompact({ story }: { story: StorySummary }) {
  const href = `/stories/${story.slug}`
  return (
    <article className="group flex gap-4">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="block shrink-0 overflow-hidden rounded-lg">
        <Cover story={story} className="aspect-square w-20 sm:w-24" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <Topic story={story} />
        <h3 className="font-serif text-lg leading-snug font-medium text-pretty">
          <Link to={href} className="decoration-primary/50 decoration-2 underline-offset-4 hover:underline">
            {story.title}
          </Link>
        </h3>
        <Meta story={story} />
      </div>
    </article>
  )
}
