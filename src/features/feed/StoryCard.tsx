import { formatNumber, useT } from '../../lib/i18n'
import { HandsClapping } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { BlogResponse } from '../../api/types'
import { filterPath, SEASON_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { excerpt, htmlToText } from '../../lib/html'
import { Avatar } from '../../ui/Avatar'
import { BookmarkButton } from '../reactions/BookmarkButton'

/** One story in a feed: text on the left, cover on the right, separated by a hairline rather than a box. */
export function StoryCard({ story }: { story: BlogResponse }) {
  const t = useT()
  const href = `/stories/${story.slug}`
  const author = story.author
  const preview = excerpt(htmlToText(story.content))
  const crop = story.agri?.crop
  const season = story.agri?.season
  const meta = [storyDate(story.publishedAt), story.readingTimeMinutes ? t('{n} min read', { n: formatNumber(story.readingTimeMinutes) }) : null].filter(Boolean)

  return (
    <article className="border-b border-rule py-6">
      {author?.name && (
        <Link to={`/authors/${author.authorId}`} className="flex w-fit items-center gap-2 text-sm text-ink hover:underline">
          <Avatar name={author.name} size={24} />
          {author.name}
        </Link>
      )}
      <div className="mt-2 flex gap-4 sm:gap-10">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-snug sm:text-xl">
            <Link to={href} className="hover:underline">
              {story.title}
            </Link>
          </h2>
          {preview && <p className="mt-1 line-clamp-2 font-serif text-ink-muted sm:line-clamp-3">{preview}</p>}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              {meta.length > 0 && <span>{meta.join(' · ')}</span>}
              {(story.clapCount ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1" aria-label={`${story.clapCount} claps`}>
                  <HandsClapping size={16} aria-hidden="true" />
                  {story.clapCount}
                </span>
              )}
              {crop && (
                <Link to={filterPath({ crop })} className="rounded-full bg-field px-2 py-0.5 text-ink hover:bg-rule" aria-label={`Stories about ${crop}`}>
                  {crop}
                </Link>
              )}
              {season && (
                <Link to={filterPath({ season })} className="rounded-full bg-field px-2 py-0.5 text-ink hover:bg-rule" aria-label={t('{season} season stories', { season: t(SEASON_LABELS[season]) })}>
                  {t(SEASON_LABELS[season])}
                </Link>
              )}
            </div>
            <BookmarkButton story={story} className="-my-2 shrink-0" />
          </div>
        </div>
        {story.imageUrl && (
          <Link to={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <img src={story.imageUrl} alt="" loading="lazy" decoding="async" className="size-20 rounded object-cover sm:h-28 sm:w-40" />
          </Link>
        )}
      </div>
    </article>
  )
}
