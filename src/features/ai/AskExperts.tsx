import { SealCheck } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MAX_ASK_EXPERTS_TITLE, useAskExperts, type AiHistoryItem } from '../../api/ai'
import { useCategories } from '../../api/categories'
import { ApiError, errorMessage } from '../../api/errors'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { SearchSelect } from '../../ui/SearchSelect'

/**
 * Under an earlier private ask: publish it as a question for the experts in a topic, with that AI answer for them to
 * review. Once published it links to the question instead.
 */
export function AskExperts({ item }: { item: AiHistoryItem }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ask = useAskExperts()
  const published = ask.data?.questionId ?? item.publishedQuestionId

  if (published != null) {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <SealCheck size={18} weight="fill" className="text-mustard" aria-hidden="true" />
        {t('Asked in public for the experts.')}
        <Link to={`/questions/${published}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {t('Open the question')}
        </Link>
      </p>
    )
  }
  if (!open) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <SealCheck size={18} aria-hidden="true" />
          {t('Ask the experts')}
        </Button>
        <span className="text-xs text-muted-foreground">{t('Posts this as a public question; verified experts check the AI answer.')}</span>
      </div>
    )
  }
  return <AskExpertsForm item={item} onCancel={() => setOpen(false)} ask={ask} />
}

function AskExpertsForm({ item, onCancel, ask }: { item: AiHistoryItem; onCancel: () => void; ask: ReturnType<typeof useAskExperts> }) {
  const t = useT()
  const categories = useCategories()
  const [categoryId, setCategoryId] = useState<number>()
  const [title, setTitle] = useState('')
  const [missing, setMissing] = useState(false)
  // 409: published already (another tab, or a double tap); the refetched history carries the link.
  const conflict = ask.error instanceof ApiError && ask.error.status === 409

  function submit(event: FormEvent) {
    event.preventDefault()
    if (categoryId == null) return setMissing(true)
    ask.mutate({ aiAnswerId: item.id ?? 0, categoryId, title: title.trim() })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4 rounded-xl bg-surface p-4">
      <SearchSelect
        label={t('Topic')}
        disabled={categories.isPending}
        value={categoryId == null ? '' : String(categoryId)}
        error={missing && categoryId == null ? t('Choose a topic.') : undefined}
        onChange={(value) => setCategoryId(value ? Number(value) : undefined)}
        options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.categoryName ?? '' }))}
        placeholder={categories.isPending ? t('Loading…') : t('Choose a topic')}
      />
      <TextField
        label={t('Title (optional)')}
        maxLength={MAX_ASK_EXPERTS_TITLE}
        placeholder={(item.question ?? '').slice(0, MAX_ASK_EXPERTS_TITLE)}
        hint={t('Left empty, the question’s first {n} characters are used.', { n: MAX_ASK_EXPERTS_TITLE })}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      {ask.isError && (
        <p role="alert" className="text-sm text-destructive">
          {conflict ? t('This was already asked in public.') : errorMessage(ask.error)}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="sm" loading={ask.isPending}>
          {t('Post for the experts')}
        </Button>
        <Button variant="quiet" size="sm" onClick={onCancel}>
          {t('Cancel')}
        </Button>
      </div>
    </form>
  )
}
