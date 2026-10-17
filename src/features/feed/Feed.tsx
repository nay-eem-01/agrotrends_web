import { useT } from '../../lib/i18n'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBlogs } from '../../api/blogs'
import { errorMessage } from '../../api/errors'
import { useFeed, type FeedKind } from '../../api/feed'
import type { Page, StorySummary } from '../../api/types'
import { hasAgriFilters, readAgriFilters } from '../../lib/agri'
import { Button, ButtonLink } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { AgriFilterBar } from './AgriFilterBar'
import { StoryCard } from './StoryCard'
import { StoryFeature, StoryTile } from './StoryTiles'

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
  const t = useT()
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
      <nav aria-label={t('Feeds')} className="sticky top-16 z-10 flex gap-6 border-b border-border bg-background">
        {TABS.filter((tab) => signedIn || !tab.signedInOnly).map((tab) => (
          <Link
            key={tab.kind}
            to={`/stories?feed=${tab.kind}`}
            aria-current={!filtered && tab.kind === kind ? 'page' : undefined}
            className={cx(
              '-mb-px flex h-12 items-center border-b-2 text-sm transition-colors duration-150',
              !filtered && tab.kind === kind ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(tab.label)}
          </Link>
        ))}
      </nav>
      <AgriFilterBar filters={filters} />
      {filtered ? (
        <StoryList ready={ready} query={matching} empty={<EmptyFiltered />} layout="grid" />
      ) : (
        <StoryList ready={ready} query={feed} empty={<EmptyFeed kind={kind} />} layout="grid" />
      )}
    </div>
  )
}

type StoryQuery = UseInfiniteQueryResult<InfiniteData<Page<StorySummary>>>

/** Stories from any paged query, with loading, error, empty and load-more states. */
export function StoryList({ ready, query, empty, layout = 'rows' }: { ready: boolean; query: StoryQuery; empty: ReactNode; layout?: 'rows' | 'grid' }) {
  const t = useT()
  const stories = query.data?.pages.flatMap((page) => page.content) ?? []
  if (!ready || query.isPending) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Spinner label={t('Loading stories')} />
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="py-16">
        <p role="alert" className="text-muted-foreground">
          {errorMessage(query.error)}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void query.refetch()}>
          {t('Try again')}
        </Button>
      </div>
    )
  }
  if (stories.length === 0) return <>{empty}</>
  return (
    <>
      {layout === 'grid' ? (
        // The feeds: the first story leads, the rest form an even grid (one column on phones).
        <div className="flex flex-col gap-10 pt-6">
          <StoryFeature story={stories[0]} />
          {stories.length > 1 && (
            <div className="grid gap-x-8 gap-y-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {stories.slice(1).map((story) => (
                <StoryTile key={story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      ) : (
        stories.map((story) => <StoryCard key={story.id} story={story} />)
      )}
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
  const t = useT()
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl">{t('No stories match these filters')}</h2>
      <p className="mt-2 text-muted-foreground">{t('Remove a filter, or ask the community about it.')}</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink to="/" variant="secondary" size="sm">
          {t('Clear filters')}
        </ButtonLink>
        <ButtonLink to="/questions" variant="quiet" size="sm">
          {t('Ask a question')}
        </ButtonLink>
      </div>
    </div>
  )
}

function EmptyFeed({ kind }: { kind: FeedKind }) {
  const t = useT()
  if (kind === 'following') {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl">{t('Your feed is waiting for you')}</h2>
        <p className="mt-2 text-muted-foreground">{t('Follow authors and topics, and their new stories show up here.')}</p>
        <ButtonLink to="/stories?feed=latest" variant="secondary" size="sm" className="mt-6">
          {t('Read the latest stories')}
        </ButtonLink>
      </div>
    )
  }
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl">{t('No stories yet')}</h2>
      <p className="mt-2 text-muted-foreground">{t('Be the first to share what is working in your field.')}</p>
      <ButtonLink to="/write" size="sm" className="mt-6">
        {t('Write a story')}
      </ButtonLink>
    </div>
  )
}

/** Loads the next page when the end of the list scrolls into view; the button does the same for keyboards. */
function MoreStories({ hasMore, loading, failed, onMore }: { hasMore: boolean; loading: boolean; failed: boolean; onMore: () => void }) {
  const t = useT()
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
    return <p className="py-10 text-center text-sm text-muted-foreground">{t('You\'re all caught up.')}</p>
  }
  return (
    <div ref={sentinel} className="flex flex-col items-center gap-2 py-10">
      {failed && <p className="text-sm text-muted-foreground">{t('Couldn\'t load more stories.')}</p>}
      <Button variant="secondary" size="sm" loading={loading} onClick={onMore}>
        {failed ? t('Try again') : t('Show more stories')}
      </Button>
    </div>
  )
}
