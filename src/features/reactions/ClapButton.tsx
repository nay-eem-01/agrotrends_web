import { useT } from '../../lib/i18n'
import { HandsClapping } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../api/errors'
import { MAX_CLAPS, useClap, useClaps } from '../../api/reactions'
import type { BlogResponse } from '../../api/types'
import { cx } from '../../ui/cx'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

/** Claps made in a burst are sent together this long after the last one. */
export const CLAP_SEND_DELAY = 500
const HOLD_START = 350
const HOLD_REPEAT = 120

/**
 * Medium-style claps: a tap adds one, holding keeps adding; up to 50 per reader. Claps are counted at once and sent
 * as one request when the burst ends. Visitors are sent to sign-in; an author can't clap their own story.
 */
export function ClapButton({ story }: { story: BlogResponse }) {
  const t = useT()
  const blogId = story.id ?? 0
  const { status, user } = useSession()
  const signedIn = status === 'signed-in'
  const own = signedIn && user?.authorId != null && user.authorId === story.author?.authorId
  const claps = useClaps(blogId, signedIn && !own)
  const clap = useClap(blogId)
  const requireSignIn = useRequireSignIn()

  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(0)
  const sendTimer = useRef<number | undefined>(undefined)
  const holdTimer = useRef<number | undefined>(undefined)
  const held = useRef(false)

  const total = (claps.data?.totalClaps ?? story.clapCount ?? 0) + pending
  const mine = (claps.data?.myClaps ?? 0) + pending
  const full = mine >= MAX_CLAPS

  useEffect(
    () => () => {
      window.clearTimeout(sendTimer.current)
      window.clearInterval(holdTimer.current)
    },
    [],
  )

  function send() {
    const count = pendingRef.current
    if (count === 0) return
    clap.mutate(count, {
      // Only take off what this request carried: claps made while it was in flight are still to send.
      onSettled: () => {
        pendingRef.current -= count
        setPending(pendingRef.current)
        if (pendingRef.current > 0) sendTimer.current = window.setTimeout(send, CLAP_SEND_DELAY)
      },
      onError: (failure) => setError(errorMessage(failure)),
    })
  }

  function addOne() {
    if ((claps.data?.myClaps ?? 0) + pendingRef.current >= MAX_CLAPS) return stopHold()
    pendingRef.current += 1
    setPending(pendingRef.current)
    setError(null)
    window.clearTimeout(sendTimer.current)
    sendTimer.current = window.setTimeout(send, CLAP_SEND_DELAY)
  }

  function startHold() {
    if (!signedIn || own) return
    held.current = false
    window.clearInterval(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      held.current = true
      addOne()
      holdTimer.current = window.setInterval(addOne, HOLD_REPEAT)
    }, HOLD_START)
  }

  function stopHold() {
    window.clearTimeout(holdTimer.current)
    window.clearInterval(holdTimer.current)
  }

  function onClick() {
    // A hold already clapped; the click that ends it shouldn't add another.
    if (held.current) {
      held.current = false
      return
    }
    requireSignIn(addOne)
  }

  if (own) {
    return (
      <span className="inline-flex h-11 items-center gap-1.5 text-sm text-ink-muted">
        <HandsClapping size={22} aria-hidden="true" />
        <span>
          {total} <span className="sr-only">{t('claps')}</span>
        </span>
      </span>
    )
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={onClick}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onContextMenu={(event) => event.preventDefault()}
        disabled={full && signedIn}
        className={cx(
          'inline-flex h-11 items-center gap-1.5 rounded-full pr-2 text-sm select-none touch-manipulation',
          mine > 0 ? 'text-ink' : 'text-ink-muted hover:text-ink',
          'disabled:cursor-default',
        )}
      >
        <HandsClapping size={22} weight={mine > 0 ? 'fill' : 'regular'} className={mine > 0 ? 'text-mustard' : undefined} aria-hidden="true" />
        <span aria-live="polite">
          {/* The action first, then the count people see, so the name matches what's on screen. */}
          <span className="sr-only">{signedIn ? (full ? t('You gave this story 50 claps') : t('Clap for this story')) : t('Sign in to clap')},</span>{' '}
          {total} <span className="sr-only">{total === 1 ? t('clap') : t('claps')}</span>
        </span>
      </button>
      {pending > 0 && (
        <span aria-hidden="true" className="absolute -top-7 left-0 animate-bounce rounded-full bg-ink px-2 py-0.5 text-xs text-paper">
          +{mine}
        </span>
      )}
      {error && (
        <span role="alert" className="ml-2 text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  )
}
