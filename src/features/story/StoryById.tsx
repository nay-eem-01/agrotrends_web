import { Navigate, useParams } from 'react-router-dom'
import { useBlogById } from '../../api/blogs'
import { ReadingSkeleton } from '../../ui/LoadingSkeleton'
import { NotFoundPage } from '../errors/NotFoundPage'

/** `/s/:blogId`: AI answers cite stories by id; this sends the reader to the story's own address. */
export function StoryById() {
  const blogId = Number(useParams().blogId)
  const story = useBlogById(blogId)
  if (!Number.isFinite(blogId)) return <NotFoundPage />
  if (story.isPending) {
    return <ReadingSkeleton label="Opening story" />
  }
  if (story.isError || !story.data.slug) return <NotFoundPage />
  return <Navigate to={`/stories/${story.data.slug}`} replace />
}
