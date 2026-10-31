import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from 'cn'
import { ApiError } from '../../api/errors'
import { nextVote, optimisticScore, useVote, type Direction, type VoteTarget } from '../../api/votes'
import { formatNumber, useT } from '../../lib/i18n'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { isConfirmEmailError } from '../auth/confirmEmail'

interface VoteControlProps {
  target: VoteTarget
  id: number
  score: number
  /** The signed-in reader's vote, from `my-votes`. */
  myVote?: Direction
  /** Your own post: the score shows, the arrows don't (the backend refuses self-votes). */
  own: boolean
  /** `horizontal`: one pill-free bar of up, score, down (the question page); vertical beside answers. */
  orientation?: 'vertical' | 'horizontal'
}

/**
 * Up, score, down. Optimistic: the score moves on click and rolls back if the backend refuses; while a vote is being
 * sent the arrows are disabled (a double tap can race on the backend). A refusal (e.g. the 50-point rule for
 * downvotes) shows the backend's message beside the arrows for a few seconds.
 */
export function VoteControl({ target, id, score, myVote, own, orientation = 'vertical' }: VoteControlProps) {
  const t = useT()
  const { status } = useSession()
  const requireSignIn = useRequireSignIn()
  const vote = useVote(target, id)
  const [state, setState] = useState({ score, myVote })
  const [refusal, setRefusal] = useState<string | null>(null)
  // Follow fresh server data (a refetch, or my-votes arriving after the page), adjusting state during render.
  const [synced, setSynced] = useState({ score, myVote })
  if (synced.score !== score || synced.myVote !== myVote) {
    setSynced({ score, myVote })
    setState({ score, myVote })
  }
  useEffect(() => {
    if (!refusal) return
    const timer = setTimeout(() => setRefusal(null), 4000)
    return () => clearTimeout(timer)
  }, [refusal])

  function cast(direction: Direction) {
    requireSignIn(() => {
      const before = state
      const to = nextVote(before.myVote, direction)
      setRefusal(null)
      setState({ score: optimisticScore(before.score, before.myVote, to), myVote: to ?? undefined })
      vote.mutate(to, {
        onSuccess: (result) => setState({ score: result.score ?? 0, myVote: result.myVote }),
        onError: (error) => {
          setState(before)
          if (!isConfirmEmailError(error)) setRefusal(error instanceof ApiError ? error.message : t('That vote did not go through.'))
        },
      })
    })
  }

  const horizontal = orientation === 'horizontal'
  const scoreText = (
    <span className={cn('min-w-6 text-center font-semibold tabular-nums', horizontal ? 'text-sm' : 'text-base')} aria-live="polite">
      <span className="sr-only">{t('Score')} </span>
      {formatNumber(state.score)}
    </span>
  )

  if (own && status === 'signed-in') {
    return horizontal ? (
      <div className="flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-muted-foreground">
        {scoreText} {t('votes')}
      </div>
    ) : (
      <div className="flex w-9 flex-col items-center pt-1">{scoreText}</div>
    )
  }

  return (
    <div className={cn('relative flex items-center', horizontal ? 'h-10 gap-0.5 rounded-xl border border-border p-0.5' : 'w-9 flex-col gap-0.5')}>
      <Arrow direction="UP" pressed={state.myVote === 'UP'} disabled={vote.isPending} label={target === 'questions' ? t('Upvote this question') : t('Upvote this answer')} onClick={() => cast('UP')} />
      {scoreText}
      <Arrow direction="DOWN" pressed={state.myVote === 'DOWN'} disabled={vote.isPending} label={target === 'questions' ? t('Downvote this question') : t('Downvote this answer')} onClick={() => cast('DOWN')} />
      {refusal && (
        <p
          role="alert"
          className={cn(
            'absolute z-20 w-56 rounded-xl bg-foreground px-3 py-2 text-xs text-background shadow-md transition-opacity duration-150 starting:opacity-0',
            horizontal ? 'top-full left-0 mt-2' : 'top-1/2 left-full ml-2 -translate-y-1/2',
          )}
        >
          {refusal}
        </p>
      )}
    </div>
  )
}

/**
 * One vote button: a caret at the same weight as the score beside it, in a 36px square whose touch area reaches 44px.
 * Pressed is a tint, not just a colour change: sage with green for up, a soft red for down.
 */
function Arrow({ direction, pressed, disabled, label, onClick }: { direction: Direction; pressed: boolean; disabled: boolean; label: string; onClick: () => void }) {
  const Icon = direction === 'UP' ? CaretUp : CaretDown
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-lg transition-[color,background-color,transform] duration-150 ease-(--ease-out) after:absolute after:-inset-1 active:scale-[0.92] disabled:cursor-wait disabled:opacity-60',
        pressed
          ? direction === 'UP'
            ? 'bg-secondary text-primary'
            : 'bg-destructive-soft text-destructive'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon size={18} weight="bold" aria-hidden="true" />
    </button>
  )
}
