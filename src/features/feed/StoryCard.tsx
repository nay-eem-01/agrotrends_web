import { formatNumber, useT } from '../../lib/i18n'
import { HandsClapping } from '@phosphor-icons/react'
import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import type { StorySummary } from '../../api/types'
import { filterPath, SEASON_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { BookmarkButton } from '../reactions/BookmarkButton'

const chip = 'rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]'

/** A cover that fails to load leaves no broken-image box: its link is hidden. */
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  const link = event.currentTarget.parentElement
  if (link) link.hidden = true
}

/** One story as a row (search, tags, library): text on the left, cover on the right, separated by a hairline. */
export function StoryCard({ story }: { story: StorySummary }) {
  const t = useT()
  const href = `/stories/${story.slug}`
  const author = story.author
  // Lists carry a plain-text excerpt (up to 200 characters) instead of the body.
  const preview = story.excerpt
  const crop = story.agri?.crop
  const season = story.agri?.season
  const meta = [storyDate(story.publishedAt), story.readingTimeMinutes ? t('{n} min read', { n: formatNumber(story.readingTimeMinutes) }) : null].filter(Boolean)

  return (
    <article className="border-b border-border py-6">
      {author?.name && (
        <Link to={`/authors/${author.authorId}`} className="flex w-fit items-center gap-2 text-sm text-foreground hover:underline">
          <Avatar name={author.name} size={24} />
          {author.name}
        </Link>
      )}
      <div className="mt-2 flex gap-4 sm:gap-10">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg leading-snug font-medium text-balance sm:text-xl">
            <Link to={href} className="decoration-primary/60 decoration-2 underline-offset-4 hover:underline">
              {story.title}
            </Link>
          </h2>
          {preview && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-3">{preview}</p>}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {meta.length > 0 && <span>{meta.join(' · ')}</span>}
              {(story.clapCount ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1" aria-label={`${story.clapCount} claps`}>
                  <HandsClapping size={16} aria-hidden="true" />
                  {story.clapCount}
                </span>
              )}
              {crop && (
                <Link to={filterPath({ crop })} className={chip} aria-label={`Stories about ${crop}`}>
                  {crop}
                </Link>
              )}
              {season && (
                <Link to={filterPath({ season })} className={chip} aria-label={t('{season} season stories', { season: t(SEASON_LABELS[season]) })}>
                  {t(SEASON_LABELS[season])}
                </Link>
              )}
            </div>
            <BookmarkButton story={story} className="-my-2 shrink-0" />
          </div>
        </div>
        {story.imageUrl && (
          <Link to={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <img src={story.imageUrl} alt="" loading="lazy" decoding="async" onError={hideBrokenImage} className="size-20 rounded-md bg-muted object-cover sm:h-28 sm:w-40" />
          </Link>
        )}
      </div>
    </article>
  )
}
