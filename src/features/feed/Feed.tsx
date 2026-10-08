import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFeed, type FeedKind } from '../../api/feed'
import { errorMessage } from '../../api/errors'
import { Button, ButtonLink } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
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
  const { kind, signedIn } = useFeedKind()
  // While the session restores, wait: For you vs Latest isn't known yet, and a read made before the token is back
  // would come back as anonymous.
  const ready = status !== 'restoring'
  const feed = useFeed(kind, ready)
  const stories = feed.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <div>
      <nav aria-label="Feeds" className="sticky top-16 z-10 flex gap-6 border-b border-rule bg-paper">
        {TABS.filter((tab) => signedIn || !tab.signedInOnly).map((tab) => (
          <Link
            key={tab.kind}
            to={`/?feed=${tab.kind}`}
            aria-current={tab.kind === kind ? 'page' : undefined}
            className={cx(
              '-mb-px flex h-12 items-center border-b text-sm',
              tab.kind === kind ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {!ready || feed.isPending ? (
        <div className="flex justify-center py-16 text-ink-muted">
          <Spinner label="Loading stories" />
        </div>
      ) : feed.isError ? (
        <div className="py-16">
          <p role="alert" className="text-ink-muted">
            {errorMessage(feed.error)}
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => void feed.refetch()}>
            Try again
          </Button>
        </div>
      ) : stories.length === 0 ? (
        <EmptyFeed kind={kind} />
      ) : (
        <>
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
          <MoreStories
            hasMore={feed.hasNextPage}
            loading={feed.isFetchingNextPage}
            failed={feed.isFetchNextPageError}
            onMore={() => void feed.fetchNextPage()}
          />
        </>
      )}
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
