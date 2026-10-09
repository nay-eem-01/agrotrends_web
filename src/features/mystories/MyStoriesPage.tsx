import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthorStories } from '../../api/authors'
import { useBlogWrite, useMyDrafts } from '../../api/blogs'
import { errorMessage } from '../../api/errors'
import type { BlogResponse, Page } from '../../api/types'
import { storyDate } from '../../lib/dates'
import { isBlank, loadLocalDraft } from '../../lib/draft'
import { Button, ButtonLink } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'

type Tab = 'drafts' | 'published'

/** `/me/stories`: the author's drafts and published stories, to edit or delete. */
export function MyStoriesPage() {
  const { user } = useSession()
  const [params] = useSearchParams()
  const tab: Tab = params.get('tab') === 'published' ? 'published' : 'drafts'

  if (user?.authorId == null) {
    return (
      <section className="mx-auto max-w-(--container-feed) px-4 py-16 sm:px-6">
        <h1 className="text-2xl">Your stories</h1>
        <p className="mt-3 text-ink-muted">Only authors publish stories. Your saved stories are in your library.</p>
        <ButtonLink to="/library" variant="secondary" className="mt-8">
          Open your library
        </ButtonLink>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>Your stories – AgroTrends</title>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl">Your stories</h1>
        <ButtonLink to="/write" size="sm">
          Write a story
        </ButtonLink>
      </div>
      <nav aria-label="Your stories" className="mt-6 flex gap-6 border-b border-rule">
        {(
          [
            ['drafts', 'Drafts'],
            ['published', 'Published'],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            to={value === 'drafts' ? '/me/stories' : '/me/stories?tab=published'}
            aria-current={tab === value ? 'page' : undefined}
            className={cx('-mb-px flex h-12 items-center border-b text-sm', tab === value ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === 'drafts' ? <Drafts /> : <Published authorId={user.authorId} />}
    </section>
  )
}

function Drafts() {
  const drafts = useMyDrafts()
  const [local] = useState(() => loadLocalDraft())
  return (
    <>
      {local && !isBlank(local) && (
        <div className="flex items-center gap-4 border-b border-rule py-5">
          <div className="min-w-0 flex-1">
            <Link to="/write" className="font-serif text-lg font-bold hover:underline">
              {local.title.trim() || 'Untitled story'}
            </Link>
            <p className="text-sm text-ink-muted">Not published or saved yet · on this device</p>
          </div>
          <ButtonLink to="/write" variant="secondary" size="sm">
            Continue
          </ButtonLink>
        </div>
      )}
      <StoryRows query={drafts} empty={local && !isBlank(local) ? null : 'No drafts. A story you save without publishing waits here.'} />
    </>
  )
}

function Published({ authorId }: { authorId: number }) {
  return <StoryRows query={useAuthorStories(authorId)} empty="Nothing published yet. Your published stories appear here." />
}

function StoryRows({ query, empty }: { query: UseInfiniteQueryResult<InfiniteData<Page<BlogResponse>>>; empty: string | null }) {
  const stories = query.data?.pages.flatMap((page) => page.content) ?? []
  if (query.isPending) return <Spinner label="Loading stories" />
  if (query.isError) {
    return (
      <p role="alert" className="py-8 text-ink-muted">
        {errorMessage(query.error)}
      </p>
    )
  }
  if (stories.length === 0) return empty ? <p className="py-12 text-center text-ink-muted">{empty}</p> : null
  return (
    <>
      <ul>
        {stories.map((story) => (
          <StoryRow key={story.id} story={story} />
        ))}
      </ul>
      {query.hasNextPage && (
        <Button variant="secondary" size="sm" className="mt-6" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          Show more
        </Button>
      )}
    </>
  )
}

function StoryRow({ story }: { story: BlogResponse }) {
  const [confirming, setConfirming] = useState(false)
  const remove = useBlogWrite()
  const draft = story.status === 'DRAFT'
  const when = draft ? `Edited ${storyDate(story.updatedAt)}` : `Published ${storyDate(story.publishedAt)}`

  return (
    <li className="border-b border-rule py-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Link to={draft ? `/write/${story.id}` : `/stories/${story.slug}`} className="font-serif text-lg font-bold hover:underline">
            {story.title}
          </Link>
          <p className="text-sm text-ink-muted">
            {when}
            {story.readingTimeMinutes ? ` · ${story.readingTimeMinutes} min read` : ''}
          </p>
        </div>
        {!confirming && (
          <div className="flex shrink-0 gap-1">
            <ButtonLink to={`/write/${story.id}`} variant="quiet" size="sm" aria-label={`Edit ${story.title}`}>
              Edit
            </ButtonLink>
            <Button variant="quiet" size="sm" aria-label={`Delete ${story.title}`} onClick={() => setConfirming(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>
      {confirming && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-field px-4 py-3 text-sm">
          <span>Delete “{story.title}”? Its claps and responses go too. This can't be undone.</span>
          <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate({ kind: 'delete', blogId: story.id ?? 0 })}>
            Delete story
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setConfirming(false)}>
            Keep it
          </Button>
          {remove.isError && (
            <span role="alert" className="text-danger">
              {errorMessage(remove.error)}
            </span>
          )}
        </div>
      )}
    </li>
  )
}
