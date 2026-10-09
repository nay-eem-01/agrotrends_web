import { Link } from 'react-router-dom'
import { useRelatedStories } from '../../api/blogs'
import { useSession } from '../auth/session'

/** "Related stories" after a story, for signed-in readers; quietly absent when there are none or it fails. */
export function RelatedStories({ blogId }: { blogId: number }) {
  const { status } = useSession()
  const related = useRelatedStories(blogId, status === 'signed-in').data ?? []
  if (related.length === 0) return null
  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="text-xl">
        Related stories
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {related.map((story) => (
          <li key={story.blogId}>
            <Link to={`/s/${story.blogId}`} className="block h-full rounded-lg border border-rule p-4 font-serif text-lg font-bold leading-snug hover:border-paddy">
              {story.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
