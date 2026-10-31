import { CheckCircle, Sparkle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuestionSearch } from '../../api/questions'
import { formatNumber, useT } from '../../lib/i18n'

/** Below this many characters a title is too short to search on. */
const MIN_TITLE = 12

/**
 * "Already answered, might help": while the asker types the title, questions that match it (answered ones first), so a
 * repeat question finds its answer before it's posted. Searches a moment after typing stops; nothing shows on a miss.
 */
export function SimilarQuestions({ title }: { title: string }) {
  const t = useT()
  const [query, setQuery] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(title.trim().length >= MIN_TITLE ? title.trim() : ''), 500)
    return () => window.clearTimeout(timer)
  }, [title])
  const search = useQuestionSearch(query)
  const found = (search.data?.pages[0]?.content ?? [])
    .filter((question) => (question.answerCount ?? 0) > 0)
    .sort((a, b) => Number(b.acceptedAnswerId != null) - Number(a.acceptedAnswerId != null))
    .slice(0, 3)
  if (!query || found.length === 0) return null

  return (
    <section aria-labelledby="similar-questions" className="rounded-xl bg-surface px-4 py-3.5">
      <h2 id="similar-questions" className="flex items-center gap-1.5 font-sans text-sm font-semibold">
        <Sparkle size={15} weight="fill" className="text-primary" aria-hidden="true" />
        {t('Already answered, might help')}
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {found.map((question) => (
          <li key={question.questionId} className="text-sm">
            <Link to={`/questions/${question.questionId}`} target="_blank" rel="noopener" className="font-semibold text-primary hover:underline">
              {question.title}
            </Link>
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              {question.acceptedAnswerId != null && <CheckCircle size={13} weight="fill" className="text-mustard-ink" aria-hidden="true" />}
              {question.acceptedAnswerId != null ? t('Accepted') : t(question.answerCount === 1 ? '{n} answer' : '{n} answers', { n: formatNumber(question.answerCount ?? 0) })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
