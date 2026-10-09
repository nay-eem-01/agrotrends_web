import { useT } from '../../lib/i18n'
import { Sparkle } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MAX_ADVISOR_QUESTION, useAskAdvisor, type AiAnswer } from '../../api/ai'
import { errorMessage } from '../../api/errors'
import { seasonCalendar, SEASON_LABELS, type Season } from '../../lib/agri'
import { Button } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { TextArea } from '../../ui/TextArea'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { Sources } from './Sources'

/** Starting points that fit the season now; tapping one fills the box. */
const EXAMPLES: Record<Exclude<Season, 'YEAR_ROUND'>, string[]> = {
  RABI: [
    'How do I protect boro seedlings from cold injury?',
    'When should I sow mustard in the north?',
    'What causes late blight on potato?',
  ],
  KHARIF_1: [
    'How do I control stem borer in aus rice?',
    'When is jute ready to harvest?',
    'How much urea does aus rice need?',
  ],
  KHARIF_2: [
    'When should I transplant aman seedlings?',
    'How do I manage brown planthopper in aman?',
    'What should I do after a flood in my rice field?',
  ],
}

interface Exchange {
  question: string
  answer: AiAnswer
}

/** `/advisor`: ask a farming question; answers are built from AgroTrends stories and link to them. */
export function AdvisorPage() {
  const t = useT()
  const { status } = useSession()
  const [today] = useState(() => new Date())
  const season = seasonCalendar(today).current as Exclude<Season, 'YEAR_ROUND'>
  const ask = useAskAdvisor()
  const requireSignIn = useRequireSignIn()
  const [question, setQuestion] = useState('')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    const text = question.trim()
    if (!text) {
      setError('Write your question first.')
      return
    }
    setError(undefined)
    requireSignIn(() =>
      ask.mutate(text, {
        onSuccess: (answer) => {
          setExchanges((list) => [...list, { question: text, answer }])
          setQuestion('')
        },
      }),
    )
  }

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{t('AI advisor – AgroTrends')}</title>
      <h1 className="text-2xl sm:text-3xl">{t('Ask the advisor')}</h1>
      <p className="mt-2 text-ink-muted">
        {t(
          'Answers are written from stories farmers and agronomists published here, with links so you can check where the advice came from. A daily limit applies.',
        )}
      </p>

      {exchanges.length > 0 && (
        <ol aria-label={t('This conversation')} className="mt-10 flex flex-col gap-10">
          {exchanges.map((exchange, index) => (
            <li key={index}>
              <p className="font-sans text-lg font-semibold">{exchange.question}</p>
              <div className="mt-3 border-l-2 border-paddy pl-5">
                <SafeHtml
                  html={exchange.answer.answer}
                  className="font-serif text-lg whitespace-pre-line [&>p+p]:mt-4"
                />
                {exchange.answer.sources?.length ? (
                  <Sources sources={exchange.answer.sources} />
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">
                    {t('No story on AgroTrends matched, so this answer is general advice.')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={submit} noValidate className="mt-10 flex flex-col gap-3">
        <TextArea
          label={exchanges.length ? t('Ask another question') : t('Your question')}
          rows={4}
          maxLength={MAX_ADVISOR_QUESTION}
          placeholder={t('Bangla or English: what you grow, where, and what you are seeing')}
          hint={`${question.length} / ${MAX_ADVISOR_QUESTION}`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          error={error}
        />
        {ask.isError && (
          <p role="alert" className="text-sm text-danger">
            {errorMessage(ask.error)}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={ask.isPending}>
            <Sparkle size={18} aria-hidden="true" />
            {status === 'signed-in' ? t('Ask') : t('Sign in to ask')}
          </Button>
          {status === 'signed-in' && (
            <Link
              to="/advisor/history"
              className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {t('Your earlier questions')}
            </Link>
          )}
        </div>
      </form>

      {exchanges.length === 0 && (
        <section aria-label={`Questions for ${t(SEASON_LABELS[season])}`} className="mt-10">
          <h2 className="font-sans text-base font-semibold">
            {t('For this {season} season', { season: t(SEASON_LABELS[season]) })}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {EXAMPLES[season].map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => setQuestion(example)}
                  className="w-full rounded-lg border border-rule px-4 py-3 text-left font-serif hover:border-paddy hover:bg-field"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
