import { useT, formatNumber } from '../../lib/i18n'
import { Bug, ClockCounterClockwise, Drop, Leaf, Plant, Plus, Sparkle, Warning, WarningCircle } from '@phosphor-icons/react'
import { useId, useRef, useState, type FormEvent, type Ref } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { MAX_ADVISOR_QUESTION, useAdvisorHistory, useAskAdvisor, type AiAnswer } from '../../api/ai'
import { ApiError, errorMessage } from '../../api/errors'
import { seasonCalendar, SEASON_LABELS, type Season } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { Button } from '../../ui/Button'
import { Sprig } from '../../ui/Botanical'
import { SafeHtml } from '../../ui/SafeHtml'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { ADVISOR_EXAMPLES, COMMON_QUESTIONS } from './examples'
import { Sources } from './Sources'

/** From here on the counter says how many characters are left, and screen readers hear it. */
const NEAR_LIMIT = MAX_ADVISOR_QUESTION - 100

const TOPIC_ICONS = { leaves: Leaf, soil: Plant, pests: Bug, water: Drop }

interface Exchange {
  question: string
  answer: AiAnswer
}

/**
 * `/advisor`: a workspace for asking the AI advisor. Signed-in readers get a rail with their recent questions (the
 * advisor's real history; one opens in place) and New conversation; the main column holds the conversation and the
 * question box. `?q=` fills the box (Discover links its examples here).
 */
export function AdvisorPage() {
  const t = useT()
  const { status } = useSession()
  const [params] = useSearchParams()
  const [today] = useState(() => new Date())
  const season = seasonCalendar(today).current as Exclude<Season, 'YEAR_ROUND'>
  const ask = useAskAdvisor()
  const requireSignIn = useRequireSignIn()
  const [question, setQuestion] = useState(() => (params.get('q') ?? '').slice(0, MAX_ADVISOR_QUESTION))
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [error, setError] = useState<string>()
  const field = useRef<HTMLTextAreaElement>(null)
  const signedIn = status === 'signed-in'

  function submit(event: FormEvent) {
    event.preventDefault()
    // Ctrl+Enter again while a question is on its way would ask it twice.
    if (ask.isPending) return
    const text = question.trim()
    if (!text) {
      setError(t('Write your question first.'))
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

  function fill(text: string) {
    setQuestion(text)
    field.current?.focus()
  }

  function startOver() {
    setExchanges([])
    setQuestion('')
    ask.reset()
    field.current?.focus()
  }

  const composer = (
    <form onSubmit={submit} noValidate>
      <Composer
        ref={field}
        label={exchanges.length ? t('Ask another question') : t('Your question')}
        value={question}
        error={error}
        pending={ask.isPending}
        signedIn={signedIn}
        onChange={setQuestion}
      />
      {ask.isError && <AskError error={ask.error} />}
    </form>
  )

  return (
    <div className="mx-auto max-w-(--container-page) px-4 pt-6 pb-16 sm:px-8 sm:pt-8">
      <title>{t('AI advisor – AgroTrends')}</title>
      <div className={cn('lg:grid lg:gap-10', signedIn && 'lg:grid-cols-[15rem_minmax(0,1fr)]')}>
        {signedIn && <HistoryRail onOpen={(item) => setExchanges([item])} onNew={startOver} canStartOver={exchanges.length > 0} />}
        <section className="mx-auto w-full max-w-3xl min-w-0">
          {exchanges.length === 0 ? (
            <>
              <header className="relative overflow-hidden rounded-2xl border border-border px-5 py-7 sm:px-8 sm:py-9">
                <Sprig className="pointer-events-none absolute -right-4 -bottom-8 h-44 opacity-25 sm:h-56" />
                <span className="relative flex size-11 items-center justify-center rounded-full bg-secondary">
                  <Sparkle size={22} weight="fill" aria-hidden="true" className="text-primary" />
                </span>
                <h1 className="relative mt-4 font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">{t('Ask the advisor')}</h1>
                <p className="relative mt-2 max-w-xl text-muted-foreground">
                  {t(
                    'Answers are written from stories farmers and agronomists published here, with links so you can check where the advice came from. A daily limit applies.',
                  )}
                </p>
              </header>
              <div className="mt-6">{composer}</div>
              <Suggestions season={season} onPick={fill} />
            </>
          ) : (
            <>
              <h1 className="sr-only">{t('Ask the advisor')}</h1>
              <ol aria-label={t('This conversation')} className="flex flex-col gap-10">
                {exchanges.map((exchange, index) => (
                  <li key={index}>
                    <ExchangeView exchange={exchange} />
                  </li>
                ))}
              </ol>
              {/* Stays in reach at the bottom of the screen (above the phone tab bar) while the conversation scrolls. */}
              <div className="sticky bottom-[4.5rem] mt-10 bg-background py-2 md:bottom-4">{composer}</div>
              {signedIn && (
                <Button variant="quiet" size="sm" className="mt-2 lg:hidden" onClick={startOver}>
                  <Plus size={16} aria-hidden="true" />
                  {t('New conversation')}
                </Button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

/**
 * The reader's recent questions to the advisor (their saved history), newest first; opening one shows it in the
 * main column. New conversation clears the screen. A rail on wide screens; a link to the history page on phones.
 */
function HistoryRail({ onOpen, onNew, canStartOver }: { onOpen: (exchange: Exchange) => void; onNew: () => void; canStartOver: boolean }) {
  const t = useT()
  const history = useAdvisorHistory()
  const items = (history.data?.pages[0]?.content ?? []).slice(0, 8)

  return (
    <>
      <Link to="/advisor/history" className="mb-4 inline-flex h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline lg:hidden">
        <ClockCounterClockwise size={18} aria-hidden="true" />
        {t('Your earlier questions')}
      </Link>
      <aside aria-labelledby="advisor-history" className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-5">
          <Button variant="secondary" disabled={!canStartOver} onClick={onNew} className="w-full justify-start">
            <Plus size={18} aria-hidden="true" />
            {t('New conversation')}
          </Button>
          <div>
            <h2 id="advisor-history" className="px-1 text-xs font-semibold text-muted-foreground">
              {t('Recent questions')}
            </h2>
            {history.isPending ? null : items.length === 0 ? (
              <p className="mt-2 px-1 text-sm text-muted-foreground">{t('No questions yet. What you ask the advisor is kept here.')}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onOpen({ question: item.question ?? '', answer: { answer: item.answer, sources: item.sources } })}
                      className="flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-surface"
                    >
                      <span className="line-clamp-2 text-sm text-foreground">{item.question}</span>
                      <span className="text-xs text-muted-foreground">{storyDate(item.askedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/advisor/history" className="mt-3 inline-flex px-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t('Your earlier questions')}
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

/** Questions that fit the season, then common kinds of problem, as cards that fill the box. */
function Suggestions({ season, onPick }: { season: Exclude<Season, 'YEAR_ROUND'>; onPick: (text: string) => void }) {
  const t = useT()
  const card =
    'flex h-full min-h-14 w-full items-start gap-3 rounded-xl border border-border p-4 text-left text-sm leading-snug transition-[border-color,background-color] duration-150 hover:border-primary/40 hover:bg-surface'
  return (
    <div className="mt-10 flex flex-col gap-8">
      <section aria-labelledby="advisor-examples">
        <h2 id="advisor-examples" className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className="size-2 rounded-full bg-mustard" />
          {t('For this {season} season', { season: t(SEASON_LABELS[season]) })}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {ADVISOR_EXAMPLES[season].map((example) => (
            <li key={example}>
              <button type="button" onClick={() => onPick(example)} className={card}>
                <Plant size={18} aria-hidden="true" className="mt-px shrink-0 text-primary" />
                {example}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="advisor-common">
        <h2 id="advisor-common" className="text-sm font-semibold">
          {t('Common questions')}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {COMMON_QUESTIONS.map(({ topic, question }) => {
            const Icon = TOPIC_ICONS[topic]
            return (
              <li key={question}>
                <button type="button" onClick={() => onPick(question)} className={card}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon size={16} aria-hidden="true" className="text-primary" />
                  </span>
                  <span className="self-center">{question}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

/**
 * The question box: one bordered surface holding the label, the text and a footer with the counter and the button.
 * Ctrl+Enter (⌘+Enter) sends; Enter is a new line. Near the limit the counter says what is left and is announced.
 */
function Composer({
  ref,
  label,
  value,
  error,
  pending,
  signedIn,
  onChange,
}: {
  ref: Ref<HTMLTextAreaElement>
  label: string
  value: string
  error?: string
  pending: boolean
  signedIn: boolean
  onChange: (value: string) => void
}) {
  const t = useT()
  const id = useId()
  const near = value.length >= NEAR_LIMIT
  const left = MAX_ADVISOR_QUESTION - value.length

  return (
    <div>
      <div
        className={cn(
          'rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/60',
          error ? 'border-destructive' : 'border-input hover:border-foreground/60',
        )}
      >
        <Label htmlFor={id} className="px-4 pt-3.5 text-sm font-semibold">
          {label}
        </Label>
        <textarea
          ref={ref}
          id={id}
          rows={3}
          maxLength={MAX_ADVISOR_QUESTION}
          placeholder={t('Bangla or English: what you grow, where, and what you are seeing')}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-count`}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          className="block min-h-24 w-full resize-y bg-transparent px-4 pt-2 pb-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5 sm:pl-4">
          <p id={`${id}-count`} className={cn('inline-flex items-center gap-1.5 text-sm tabular-nums', near ? 'font-medium text-foreground' : 'text-muted-foreground')}>
            {near && <Warning size={16} weight="fill" aria-hidden="true" className="text-warning" />}
            {near ? t('{n} characters left', { n: formatNumber(left) }) : `${formatNumber(value.length)} / ${formatNumber(MAX_ADVISOR_QUESTION)}`}
          </p>
          {/* Announced only near the limit, so typing isn't read out on every key. */}
          <p className="sr-only" aria-live="polite">
            {near ? t('{n} characters left', { n: formatNumber(left) }) : ''}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{t('Ctrl+Enter to send')}</span>
            <Button type="submit" size="sm" loading={pending}>
              {!pending && <Sparkle size={18} aria-hidden="true" />}
              {signedIn ? t('Ask') : t('Sign in to ask')}
            </Button>
          </div>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
          <WarningCircle size={16} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/** The daily limit (429) is a pause, not a fault, so it reads as a caution; anything else is an error. */
function AskError({ error }: { error: unknown }) {
  const limit = error instanceof ApiError && error.status === 429
  return (
    <Alert variant={limit ? 'warning' : 'destructive'} className="mt-4">
      {limit ? <Warning aria-hidden="true" /> : <WarningCircle aria-hidden="true" />}
      <AlertDescription>{errorMessage(error)}</AlertDescription>
    </Alert>
  )
}

/**
 * One turn. The reader's question on the right in green; the advisor's answer on the left beside its mark, labelled
 * as AI, its sources apart so they read as evidence, and a plain note to check them before acting.
 */
function ExchangeView({ exchange }: { exchange: Exchange }) {
  const t = useT()
  const sources = exchange.answer.sources ?? []
  return (
    <article className="flex flex-col gap-5">
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-base leading-relaxed whitespace-pre-line text-primary-foreground">
        {exchange.question}
      </p>
      <div className="flex gap-3 sm:gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Sparkle size={18} weight="fill" aria-hidden="true" className="text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">{t('AI answer')}</p>
          <SafeHtml html={exchange.answer.answer} className="mt-1.5 text-base leading-relaxed whitespace-pre-line [&>p+p]:mt-4" />
          {sources.length ? (
            <div className="mt-5 rounded-xl border border-border bg-surface px-4 pt-0.5 pb-4">
              <Sources sources={sources} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t('No story on AgroTrends matched, so this answer is general advice.')}</p>
          )}
          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <Warning size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {t('Written by AI, not checked by an expert. Check the sources before you act on it.')}
          </p>
        </div>
      </div>
    </article>
  )
}
