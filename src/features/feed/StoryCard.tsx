import { HandsClapping } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { BlogResponse } from '../../api/types'
import { SEASON_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { excerpt, htmlToText } from '../../lib/html'
import { Avatar } from '../../ui/Avatar'

/** One story in a feed: text on the left, cover on the right, separated by a hairline rather than a box. */
export function StoryCard({ story }: { story: BlogResponse }) {
  const href = `/stories/${story.slug}`
  const author = story.author
  const preview = excerpt(htmlToText(story.content))
  const season = story.agri?.season ? SEASON_LABELS[story.agri.season] : null
  const meta = [storyDate(story.publishedAt), story.readingTimeMinutes ? `${story.readingTimeMinutes} min read` : null].filter(Boolean)

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
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            {meta.length > 0 && <span>{meta.join(' · ')}</span>}
            {(story.clapCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1" aria-label={`${story.clapCount} claps`}>
                <HandsClapping size={16} aria-hidden="true" />
                {story.clapCount}
              </span>
            )}
            {story.agri?.crop && <span className="rounded-full bg-field px-2 py-0.5 text-ink">{story.agri.crop}</span>}
            {season && <span className="rounded-full bg-field px-2 py-0.5 text-ink">{season}</span>}
          </div>
        </div>
        {story.imageUrl && (
          <Link to={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <img src={story.imageUrl} alt="" loading="lazy" className="size-20 rounded object-cover sm:h-28 sm:w-40" />
          </Link>
        )}
      </div>
    </article>
  )
}
