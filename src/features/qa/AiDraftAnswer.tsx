import { Sparkle } from '@phosphor-icons/react'
import { errorMessage } from '../../api/errors'
import { useAiDraftAnswer } from '../../api/questions'
import { Button } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { Sources } from '../ai/Sources'

/** For an unanswered question: an AI draft built from the platform's stories, labelled and never posted. */
export function AiDraftAnswer({ questionId }: { questionId: number }) {
  const draft = useAiDraftAnswer(questionId)
  const requireSignIn = useRequireSignIn()

  if (!draft.data) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" loading={draft.isPending} onClick={() => requireSignIn(() => draft.mutate())}>
          <Sparkle size={16} aria-hidden="true" />
          See an AI draft answer
        </Button>
        {draft.isError && (
          <span role="alert" className="text-sm text-ink-muted">
            {errorMessage(draft.error)}
          </span>
        )}
      </div>
    )
  }
  return (
    <aside aria-label="AI draft answer" className="mt-6 rounded-lg border border-dashed border-paddy/50 p-5">
      <p className="flex items-center gap-1.5 text-sm font-medium text-paddy">
        <Sparkle size={16} weight="fill" aria-hidden="true" />
        {draft.data.label ?? 'AI-generated draft, not reviewed'}
      </p>
      <SafeHtml html={draft.data.answer} className="mt-3 font-serif text-base whitespace-pre-line [&>p+p]:mt-3" />
      <Sources sources={draft.data.sources} />
      <p className="mt-4 text-xs text-ink-muted">Not posted. If you know better, answer in your own words above.</p>
    </aside>
  )
}
