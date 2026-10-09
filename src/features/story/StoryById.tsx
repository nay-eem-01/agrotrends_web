import { Navigate, useParams } from 'react-router-dom'
import { useBlogById } from '../../api/blogs'
import { Spinner } from '../../ui/Spinner'
import { NotFoundPage } from '../errors/NotFoundPage'

/** `/s/:blogId`: AI answers cite stories by id; this sends the reader to the story's own address. */
export function StoryById() {
  const story = useBlogById(Number(useParams().blogId))
  if (story.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label="Opening story" />
      </div>
    )
  }
  if (story.isError || !story.data.slug) return <NotFoundPage />
  return <Navigate to={`/stories/${story.data.slug}`} replace />
}
