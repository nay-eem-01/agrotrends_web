import { useT } from '../../lib/i18n'
import { Link, useParams } from 'react-router-dom'
import { useAuthor, useAuthorStories } from '../../api/authors'
import { ApiError, errorMessage } from '../../api/errors'
import { Avatar } from '../../ui/Avatar'
import { Chip } from '../../ui/Chip'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { StoryList } from '../feed/Feed'
import { FollowAuthorButton } from './FollowAuthorButton'

const count = (n: number | undefined, one: string, many: string) => `${n ?? 0} ${(n ?? 0) === 1 ? one : many}`

export function AuthorPage() {
  const t = useT()
  const authorId = Number(useParams().authorId)
  const { status } = useSession()
  // Wait for a restoring session so followedByMe comes back for the reader, not for an anonymous visitor.
  const author = useAuthor(authorId, status !== 'restoring')
  const stories = useAuthorStories(authorId)

  if (!Number.isFinite(authorId)) return <NotFoundPage />
  if (status === 'restoring' || author.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label={t('Loading author')} />
      </div>
    )
  }
  if (author.isError) {
    if (author.error instanceof ApiError && author.error.isNotFound) return <NotFoundPage />
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-ink-muted sm:px-6">
        {errorMessage(author.error)}
      </p>
    )
  }

  const profile = author.data
  const name = profile.name ?? t('Author')
  const work = [profile.designation, profile.workPlaceOrInstitution].filter(Boolean).join(' · ')

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{`${name} – AgroTrends`}</title>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar name={name} src={profile.profileImageUrl} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">{name}</h1>
          {work && <p className="mt-1 text-ink-muted">{work}</p>}
          <p className="mt-2 text-sm text-ink-muted">
            {count(profile.followerCount, 'follower', 'followers')} · {count(profile.publishedPostCount, 'story', 'stories')}
          </p>
          <div className="mt-4">
            <FollowAuthorButton author={profile} />
          </div>
        </div>
      </header>
      {profile.bio && <p className="mt-8 font-serif text-lg whitespace-pre-line">{profile.bio}</p>}
      {(profile.specialities?.length ?? 0) > 0 && (
        <section aria-label={t('Specialities')} className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {profile.specialities!.map((speciality) => (
              <li key={speciality}>
                <Chip>{speciality}</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2 className="mt-12 border-b border-rule pb-3 font-sans text-base font-semibold">{t('Stories')}</h2>
      <StoryList
        ready
        query={stories}
        empty={<p className="py-12 text-center text-ink-muted">{name} hasn't published a story yet.</p>}
      />
    </section>
  )
}

/** "Written by" under a story: the author's photo, followers, bio and Follow. */
export function WrittenBy({ authorId, fallbackName }: { authorId: number; fallbackName: string }) {
  const t = useT()
  const { status } = useSession()
  const author = useAuthor(authorId, status !== 'restoring')
  const profile = author.data
  if (!profile) return null
  const name = profile.name ?? fallbackName

  return (
    <aside aria-label={t('About the author')} className="mt-12 flex flex-col items-start gap-4 rounded-lg border border-rule p-6 sm:flex-row">
      <Avatar name={name} src={profile.profileImageUrl} size={56} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-muted">{t('Written by')}</p>
        <Link to={`/authors/${authorId}`} className="font-serif text-xl font-bold hover:underline">
          {name}
        </Link>
        <p className="mt-1 text-sm text-ink-muted">
          {[profile.designation, count(profile.followerCount, 'follower', 'followers')].filter(Boolean).join(' · ')}
        </p>
        {profile.bio && <p className="mt-3 line-clamp-3 text-sm">{profile.bio}</p>}
      </div>
      <FollowAuthorButton author={profile} />
    </aside>
  )
}
