import { useT } from '../../lib/i18n'
import { BookmarkSimple } from '@phosphor-icons/react'
import { useBookmarkedIds, useToggleBookmark } from '../../api/reactions'
import type { BlogResponse } from '../../api/types'
import { cx } from '../../ui/cx'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

/** Save to (or remove from) the reader's reading list. Visitors are sent to sign-in. */
export function BookmarkButton({ story, className }: { story: BlogResponse; className?: string }) {
  const t = useT()
  const blogId = story.id ?? 0
  const { status } = useSession()
  const signedIn = status === 'signed-in'
  const saved = useBookmarkedIds(signedIn).data?.has(blogId) ?? false
  const toggle = useToggleBookmark()
  const requireSignIn = useRequireSignIn()

  return (
    <button
      type="button"
      aria-pressed={signedIn ? saved : undefined}
      aria-label={signedIn ? `Save “${story.title}”` : t('Sign in to save')}
      onClick={() => requireSignIn(() => toggle.mutate({ blogId, save: !saved }))}
      className={cx('inline-flex size-11 items-center justify-center rounded-full', saved ? 'text-ink' : 'text-ink-muted hover:text-ink', className)}
    >
      <BookmarkSimple size={22} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />
    </button>
  )
}
