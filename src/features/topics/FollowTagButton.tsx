import { useT } from '../../lib/i18n'
import { useFollowedTags, useToggleTagFollow } from '../../api/topics'
import { Button } from '../../ui/Button'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

/** Follow / Following for a tag; a visitor is sent to sign-in. */
export function FollowTagButton({ tag }: { tag: string }) {
  const t = useT()
  const { status } = useSession()
  const signedIn = status === 'signed-in'
  const following = useFollowedTags(signedIn).data?.includes(tag) ?? false
  const toggle = useToggleTagFollow()
  const requireSignIn = useRequireSignIn()

  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      aria-pressed={signedIn ? following : undefined}
      onClick={() => requireSignIn(() => toggle.mutate({ tag, follow: !following }))}
    >
      {following ? t('Following') : t('Follow')}
    </Button>
  )
}
