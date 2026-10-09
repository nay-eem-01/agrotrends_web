import { useT } from '../../lib/i18n'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFollowedAuthors, useReadingList, useToggleAuthorFollow, type AuthorSummary } from '../../api/follows'
import { errorMessage } from '../../api/errors'
import { useFollowedTags } from '../../api/topics'
import { Avatar } from '../../ui/Avatar'
import { Button, ButtonLink } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { Spinner } from '../../ui/Spinner'
import { StoryList } from '../feed/Feed'
import { FollowTagButton } from '../topics/FollowTagButton'

type Tab = 'saved' | 'following'

/** The reader's own shelf: saved stories, and the authors and topics they follow. Signed-in only. */
export function LibraryPage() {
  const t = useT()
  const [params] = useSearchParams()
  const tab: Tab = params.get('tab') === 'following' ? 'following' : 'saved'

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{t('Library – AgroTrends')}</title>
      <h1 className="text-2xl sm:text-3xl">{t('Your library')}</h1>
      <nav aria-label={t('Library')} className="mt-6 flex gap-6 border-b border-rule">
        {(
          [
            ['saved', 'Reading list'],
            ['following', 'Following'],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            to={value === 'saved' ? '/library' : '/library?tab=following'}
            aria-current={tab === value ? 'page' : undefined}
            className={cx(
              '-mb-px flex h-12 items-center border-b text-sm',
              tab === value ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === 'saved' ? <ReadingList /> : <Following />}
    </section>
  )
}

function ReadingList() {
  const t = useT()
  const list = useReadingList()
  return (
    <StoryList
      ready
      query={list}
      empty={
        <div className="py-16 text-center">
          <h2 className="text-xl">{t('Nothing saved yet')}</h2>
          <p className="mt-2 text-ink-muted">{t('Tap the bookmark on any story to keep it here for later.')}</p>
          <ButtonLink to="/?feed=latest" variant="secondary" size="sm" className="mt-6">
            {t('Find stories')}
          </ButtonLink>
        </div>
      }
    />
  )
}

function Following() {
  const t = useT()
  const tags = useFollowedTags(true)
  const authors = useFollowedAuthors()
  const authorList = authors.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <div className="flex flex-col gap-10 pt-8">
      <section aria-labelledby="following-authors">
        <h2 id="following-authors" className="text-lg">
          {t('Authors')}
        </h2>
        {authors.isPending ? (
          <Spinner label={t('Loading authors')} />
        ) : authors.isError ? (
          <p role="alert" className="mt-3 text-ink-muted">
            {errorMessage(authors.error)}
          </p>
        ) : authorList.length === 0 ? (
          <p className="mt-3 text-ink-muted">{t('You don\'t follow any authors yet. Follow one from their page or a story.')}</p>
        ) : (
          <ul className="mt-2">
            {authorList.map((author) => (
              <AuthorRow key={author.authorId} author={author} />
            ))}
          </ul>
        )}
        {authors.hasNextPage && (
          <Button variant="secondary" size="sm" className="mt-4" loading={authors.isFetchingNextPage} onClick={() => void authors.fetchNextPage()}>
            {t('Show more authors')}
          </Button>
        )}
      </section>

      <section aria-labelledby="following-topics">
        <h2 id="following-topics" className="text-lg">
          {t('Topics')}
        </h2>
        {tags.isPending ? (
          <Spinner label={t('Loading topics')} />
        ) : tags.isError ? (
          <p role="alert" className="mt-3 text-ink-muted">
            {errorMessage(tags.error)}
          </p>
        ) : tags.data.length === 0 ? (
          <p className="mt-3 text-ink-muted">
            You don't follow any topics yet.{' '}
            <Link to="/topics" className="text-paddy underline-offset-4 hover:underline">
              {t('Browse topics')}
            </Link>
          </p>
        ) : (
          <ul className="mt-2">
            {tags.data.map((tag) => (
              <li key={tag} className="flex items-center justify-between gap-4 border-b border-rule py-3">
                <Link to={`/tags/${encodeURIComponent(tag)}`} className="font-medium first-letter:uppercase hover:underline">
                  {tag}
                </Link>
                <FollowTagButton tag={tag} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** One followed author; Unfollow keeps the row (so it can be undone) and shows Follow again. */
function AuthorRow({ author }: { author: AuthorSummary }) {
  const t = useT()
  const toggle = useToggleAuthorFollow()
  const [following, setFollowing] = useState(true)
  const name = author.name ?? t('Author')

  return (
    <li className="flex items-center gap-3 border-b border-rule py-3">
      <Avatar name={name} size={36} />
      <Link to={`/authors/${author.authorId}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
        {name}
      </Link>
      <Button
        variant={following ? 'secondary' : 'primary'}
        size="sm"
        aria-pressed={following}
        aria-label={`${following ? t('Following') : t('Follow')} ${name}`}
        onClick={() => {
          setFollowing(!following)
          toggle.mutate({ authorId: author.authorId ?? 0, follow: !following }, { onError: () => setFollowing(following) })
        }}
      >
        {following ? t('Following') : t('Follow')}
      </Button>
    </li>
  )
}
