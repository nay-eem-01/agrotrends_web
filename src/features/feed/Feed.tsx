import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBlogs } from '../../api/blogs'
import { errorMessage } from '../../api/errors'
import { useFeed, type FeedKind } from '../../api/feed'
import type { BlogResponse, Page } from '../../api/types'
import { hasAgriFilters, readAgriFilters } from '../../lib/agri'
import { Button, ButtonLink } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { AgriFilterBar } from './AgriFilterBar'
import { StoryCard } from './StoryCard'

const TABS: { kind: FeedKind; label: string; signedInOnly?: boolean }[] = [
  { kind: 'following', label: 'For you', signedInOnly: true },
  { kind: 'latest', label: 'Latest' },
  { kind: 'trending', label: 'Trending' },
]

/** The feed on `?feed=`; signed-in readers start on For you, visitors on Latest. */
export function useFeedKind(): { kind: FeedKind; signedIn: boolean } {
  const [params] = useSearchParams()
  const { status } = useSession()
  const signedIn = status === 'signed-in'
  const asked = params.get('feed')
  if (asked === 'latest' || asked === 'trending') return { kind: asked, signedIn }
  if (asked === 'following' && signedIn) return { kind: 'following', signedIn }
  return { kind: signedIn ? 'following' : 'latest', signedIn }
}

export function Feed() {
  const { status } = useSession()
  const [params] = useSearchParams()
  const { kind, signedIn } = useFeedKind()
  const filters = readAgriFilters(params)
  const filtered = hasAgriFilters(filters)
  // While the session restores, wait: For you vs Latest isn't known yet, and a read made before the token is back
  // would come back as anonymous.
  const ready = status !== 'restoring'
  const feed = useFeed(kind, ready && !filtered)
  const matching = useBlogs(filters, ready && filtered)

  return (
    <div>
      <nav aria-label="Feeds" className="sticky top-16 z-10 flex gap-6 border-b border-rule bg-paper">
        {TABS.filter((tab) => signedIn || !tab.signedInOnly).map((tab) => (
          <Link
            key={tab.kind}
            to={`/?feed=${tab.kind}`}
            aria-current={!filtered && tab.kind === kind ? 'page' : undefined}
            className={cx(
              '-mb-px flex h-12 items-center border-b text-sm',
              !filtered && tab.kind === kind ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <AgriFilterBar filters={filters} />
      {filtered ? (
        <StoryList ready={ready} query={matching} empty={<EmptyFiltered />} />
      ) : (
        <StoryList ready={ready} query={feed} empty={<EmptyFeed kind={kind} />} />
      )}
    </div>
  )
}

type StoryQuery = UseInfiniteQueryResult<InfiniteData<Page<BlogResponse>>>

/** Stories from any paged query, with loading, error, empty and load-more states. */
export function StoryList({ ready, query, empty }: { ready: boolean; query: StoryQuery; empty: ReactNode }) {
  const stories = query.data?.pages.flatMap((page) => page.content) ?? []
  if (!ready || query.isPending) {
    return (
      <div className="flex justify-center py-16 text-ink-muted">
        <Spinner label="Loading stories" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="py-16">
        <p role="alert" className="text-ink-muted">
          {errorMessage(query.error)}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    )
  }
  if (stories.length === 0) return <>{empty}</>
  return (
    <>
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
      <MoreStories
        hasMore={query.hasNextPage}
        loading={query.isFetchingNextPage}
        failed={query.isFetchNextPageError}
        onMore={() => void query.fetchNextPage()}
      />
    </>
  )
}

function EmptyFiltered() {
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl">No stories match these filters</h2>
      <p className="mt-2 text-ink-muted">Remove a filter, or ask the community about it.</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink to="/" variant="secondary" size="sm">
          Clear filters
        </ButtonLink>
        <ButtonLink to="/questions" variant="quiet" size="sm">
          Ask a question
        </ButtonLink>
      </div>
    </div>
  )
}

function EmptyFeed({ kind }: { kind: FeedKind }) {
  if (kind === 'following') {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl">Your feed is waiting for you</h2>
        <p className="mt-2 text-ink-muted">Follow authors and topics, and their new stories show up here.</p>
        <ButtonLink to="/?feed=latest" variant="secondary" size="sm" className="mt-6">
          Read the latest stories
        </ButtonLink>
      </div>
    )
  }
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl">No stories yet</h2>
      <p className="mt-2 text-ink-muted">Be the first to share what is working in your field.</p>
      <ButtonLink to="/write" size="sm" className="mt-6">
        Write a story
      </ButtonLink>
    </div>
  )
}

/** Loads the next page when the end of the list scrolls into view; the button does the same for keyboards. */
function MoreStories({ hasMore, loading, failed, onMore }: { hasMore: boolean; loading: boolean; failed: boolean; onMore: () => void }) {
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasMore || loading || failed || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onMore()
    }, { rootMargin: '600px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, failed, onMore])

  if (!hasMore) {
    return <p className="py-10 text-center text-sm text-ink-muted">You're all caught up.</p>
  }
  return (
    <div ref={sentinel} className="flex flex-col items-center gap-2 py-10">
      {failed && <p className="text-sm text-ink-muted">Couldn't load more stories.</p>}
      <Button variant="secondary" size="sm" loading={loading} onClick={onMore}>
        {failed ? 'Try again' : 'Show more stories'}
      </Button>
    </div>
  )
}
