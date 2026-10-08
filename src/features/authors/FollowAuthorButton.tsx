import { useToggleAuthorFollow } from '../../api/follows'
import type { AuthorProfileResponse } from '../../api/types'
import { Button, ButtonLink } from '../../ui/Button'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

/** Follow / Following for an author's profile; Edit profile on your own; sign-in for visitors. */
export function FollowAuthorButton({ author, size = 'sm' }: { author: AuthorProfileResponse; size?: 'sm' | 'md' }) {
  const { status, user } = useSession()
  const toggle = useToggleAuthorFollow()
  const requireSignIn = useRequireSignIn()
  const signedIn = status === 'signed-in'

  if (signedIn && user?.authorId != null && user.authorId === author.authorId) {
    return (
      <ButtonLink to="/settings" variant="secondary" size={size}>
        Edit profile
      </ButtonLink>
    )
  }
  const following = signedIn && Boolean(author.followedByMe)
  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size={size}
      aria-pressed={signedIn ? following : undefined}
      aria-label={`${following ? 'Following' : 'Follow'} ${author.name ?? 'this author'}`}
      onClick={() => requireSignIn(() => toggle.mutate({ authorId: author.authorId ?? 0, follow: !following }))}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
