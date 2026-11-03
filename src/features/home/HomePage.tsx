import { PaperPlaneTilt, Plant, SealCheck, Sparkle } from '@phosphor-icons/react'
import { lazy, Suspense, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublicStats } from '../../api/stats'
import { seasonCalendar, SEASON_LABELS, type Season } from '../../lib/agri'
import { formatNumber, useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { ADVISOR_EXAMPLES } from '../ai/examples'
import { useSession } from '../auth/session'

// Below the hero: topics, questions, the advisor and stories load just after it (their icons and lists are not
// needed for the first paint), keeping the main bundle in budget.
const DiscoverSections = lazy(() => import('./DiscoverSections').then((m) => ({ default: m.DiscoverSections })))
const HomeFeed = lazy(() => import('./HomeFeed').then((m) => ({ default: m.HomeFeed })))

/**
 * `/`: signed-in readers get their home feed (`HomeFeed`). Visitors get Discover: the question box first (public, or
 * privately to the advisor), then questions that need an answer, what people are asking and stories from the field.
 * Every list is real data; a section with nothing to show says so or steps aside.
 */
export function HomePage() {
  const t = useT()
  const { status } = useSession()
  if (status === 'signed-in') {
    return (
      <Suspense fallback={<Skeleton className="mx-auto mt-8 h-64 max-w-(--container-page) rounded-2xl" />}>
        <HomeFeed />
      </Suspense>
    )
  }
  return (
    <div className="pb-16">
      <title>{t('AgroTrends – farming questions, stories and advice')}</title>
      <Hero />
      <div className="mx-auto flex max-w-(--container-page) flex-col gap-16 px-4 sm:px-8 lg:gap-20">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <DiscoverSections />
        </Suspense>
      </div>
    </div>
  )
}

/**
 * The first screen is the job: the headline and one sentence on the left, and on the right the question itself, typed
 * here and carried into the ask form (through sign-in, for visitors). Under it, the private way: the advisor, with
 * this season's questions to start from. Claims only what is live: the expert line waits for a verified expert.
 */
function Hero() {
  const t = useT()
  const experts = usePublicStats({ everywhere: true }).data?.verifiedExperts ?? 0

  return (
    <section
      aria-labelledby="discover-title"
      className="mx-auto max-w-(--container-page) px-4 pt-6 pb-14 sm:px-8 sm:pt-10 lg:py-16"
    >
      <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div className="min-w-0">
          <h1
            id="discover-title"
            className="font-serif text-[2.125rem] leading-[1.08] font-medium tracking-[-0.02em] text-balance [overflow-wrap:break-word] sm:text-[2.5rem] min-[1360px]:text-[3.25rem]"
          >
            {t('Farming questions, answered by people who grow.')}
          </h1>
          <p className="mt-4 max-w-[36ch] text-lg leading-relaxed text-muted-foreground lg:mt-5 lg:text-[1.375rem]">{t('An AI answer in seconds, then farmers and agronomists weigh in.')}</p>
          {experts > 0 && (
            <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
              <SealCheck size={18} weight="fill" aria-hidden="true" className="text-mustard-ink" />
              {t('{n} verified experts check the answers', { n: formatNumber(experts) })}
            </p>
          )}
        </div>
        <AskPanel />
      </div>
    </section>
  )
}

function AskPanel() {
  const t = useT()
  const navigate = useNavigate()
  const fieldId = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const [today] = useState(() => new Date())
  const season = seasonCalendar(today).current as Exclude<Season, 'YEAR_ROUND'>

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) {
      setError(true)
      field.current?.focus()
      return
    }
    navigate(`/questions/ask?q=${encodeURIComponent(text.trim())}`)
  }

  return (
    <div className="min-w-0 rounded-2xl bg-surface p-5 sm:p-7 lg:p-9">
      <form onSubmit={submit} noValidate>
        <label htmlFor={fieldId} className="block text-base font-semibold">
          {t("What's happening on your farm?")}
        </label>
        <textarea
          ref={field}
          id={fieldId}
          rows={3}
          maxLength={1000}
          value={text}
          aria-invalid={error || undefined}
          aria-describedby={error ? `${fieldId}-error` : `${fieldId}-hint`}
          placeholder={t('Why are my boro seedlings turning yellow?')}
          onChange={(event) => {
            setText(event.target.value)
            if (error) setError(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          className="mt-3 block min-h-28 w-full lg:min-h-36 resize-none rounded-xl border border-subtle bg-card px-4 py-3 text-base leading-relaxed text-foreground [field-sizing:content] placeholder:text-muted-foreground/70 hover:border-foreground/60 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive"
        />
        {error && (
          <p id={`${fieldId}-error`} role="alert" className="mt-2 text-sm text-destructive">
            {t('Write your question first.')}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button type="submit" className="w-full sm:w-auto">
            <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
            {t('Ask a question')}
          </Button>
          <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
            {t('Public: anyone can read and answer it.')}
          </p>
        </div>
      </form>
      {/* The private way, a step quieter than the question box: the page's one job is asking. */}
      <div className="mt-6 border-t border-border-strong/60 pt-5 lg:mt-8">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkle size={16} weight="fill" aria-hidden="true" className="text-primary" />
          {t('Or ask the AI advisor privately')}
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{t("Answers in seconds, with sources. Experts don't check them, and they can be wrong.")}</p>
        <p id={`${fieldId}-season`} className="mt-4 text-xs font-semibold text-foreground">
          {t('For this {season} season', { season: t(SEASON_LABELS[season]) })}
        </p>
        <ul aria-labelledby={`${fieldId}-season`} className="mt-1 flex flex-col">
          {ADVISOR_EXAMPLES[season].map((example) => (
            <li key={example}>
              <Link
                to={`/advisor?q=${encodeURIComponent(t(example))}`}
                className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground underline-offset-4 transition-colors duration-150 hover:bg-background hover:text-primary hover:underline active:bg-background"
              >
                <Plant size={16} aria-hidden="true" className="shrink-0 text-primary" />
                {t(example)}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/advisor"
              className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary underline-offset-4 transition-colors duration-150 hover:bg-background hover:underline active:bg-background"
            >
              <Sparkle size={16} aria-hidden="true" className="shrink-0" />
              {t('Ask the advisor something else')}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
