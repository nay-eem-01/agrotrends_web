import { ArrowFatDown, ArrowFatUp } from '@phosphor-icons/react'
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
}

/**
 * Up, score, down. Optimistic: the score moves on click and rolls back if the backend refuses; while a vote is being
 * sent the arrows are disabled (a double tap can race on the backend). A refusal (e.g. the 50-point rule for
 * downvotes) shows the backend's message beside the arrows for a few seconds.
 */
export function VoteControl({ target, id, score, myVote, own }: VoteControlProps) {
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

  const label = target === 'questions' ? t('question') : t('answer')
  const scoreText = (
    <span className="text-lg font-semibold tabular-nums" aria-live="polite">
      <span className="sr-only">{t('Score')} </span>
      {formatNumber(state.score)}
    </span>
  )

  if (own && status === 'signed-in') {
    return <div className="flex w-11 flex-col items-center pt-1">{scoreText}</div>
  }

  return (
    <div className="relative flex w-11 flex-col items-center">
      <Arrow direction="UP" pressed={state.myVote === 'UP'} disabled={vote.isPending} label={t('Upvote this {what}', { what: label })} onClick={() => cast('UP')} />
      {scoreText}
      <Arrow direction="DOWN" pressed={state.myVote === 'DOWN'} disabled={vote.isPending} label={t('Downvote this {what}', { what: label })} onClick={() => cast('DOWN')} />
      {refusal && (
        <p role="alert" className="absolute top-1/2 left-full z-20 ml-2 w-56 -translate-y-1/2 rounded-2xl bg-foreground px-3 py-2 text-xs text-background shadow-md transition-opacity duration-150 starting:opacity-0">
          {refusal}
        </p>
      )}
    </div>
  )
}

function Arrow({ direction, pressed, disabled, label, onClick }: { direction: Direction; pressed: boolean; disabled: boolean; label: string; onClick: () => void }) {
  const Icon = direction === 'UP' ? ArrowFatUp : ArrowFatDown
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-11 items-center justify-center rounded-full transition-[color,background-color,transform] duration-150 ease-(--ease-out) active:scale-[0.92] disabled:cursor-wait',
        pressed ? (direction === 'UP' ? 'text-primary' : 'text-destructive') : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon size={22} weight={pressed ? 'fill' : 'regular'} aria-hidden="true" />
    </button>
  )
}
