import { useT } from '../../lib/i18n'
import { BookmarkSimple } from '@phosphor-icons/react'
import { useBookmarkedIds, useToggleBookmark } from '../../api/reactions'
import type { StorySummary } from '../../api/types'
import { errorMessage } from '../../api/errors'
import { cx } from '../../ui/cx'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

/** Save to (or remove from) the reader's reading list. Visitors are sent to sign-in. */
export function BookmarkButton({ story, className }: { story: Pick<StorySummary, 'id' | 'title'>; className?: string }) {
  const t = useT()
  const blogId = story.id ?? 0
  const { status } = useSession()
  const signedIn = status === 'signed-in'
  const bookmarks = useBookmarkedIds(signedIn)
  const saved = bookmarks.data?.has(blogId) ?? false
  const toggle = useToggleBookmark()
  const requireSignIn = useRequireSignIn()

  return (
    <span className="inline-flex max-w-full flex-col items-end">
      <button
        type="button"
        aria-pressed={signedIn ? saved : undefined}
        disabled={toggle.isPending || (signedIn && bookmarks.isPending)}
        aria-label={signedIn ? t('Save “{title}”', { title: story.title ?? '' }) : t('Sign in to save')}
        onClick={() => requireSignIn(() => {
          if (bookmarks.isError && !bookmarks.data) void bookmarks.refetch()
          else toggle.mutate({ blogId, save: !saved })
        })}
        className={cx('inline-flex size-11 items-center justify-center rounded-full', saved ? 'text-ink' : 'text-ink-muted hover:text-ink', className)}
      >
        <BookmarkSimple size={22} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />
      </button>
      {toggle.isError && <span role="alert" className="max-w-40 text-right text-xs text-destructive">{errorMessage(toggle.error)}</span>}
      {bookmarks.isError && !bookmarks.data && <span role="alert" className="max-w-40 text-right text-xs text-destructive">{t('Could not check saved stories. Tap to retry.')}</span>}
    </span>
  )
}
