import { ArrowRight, Sparkle } from '@phosphor-icons/react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { FieldScene } from '../../ui/Botanical'
import { useSession } from '../auth/session'

// Below the hero: topics, questions, the advisor and stories load just after it (their icons and lists are not
// needed for the first paint), keeping the main bundle in budget.
const DiscoverSections = lazy(() => import('./DiscoverSections').then((m) => ({ default: m.DiscoverSections })))

/**
 * `/`: Discover. What AgroTrends is and how to start (search, ask), the topics, what people are asking now, the
 * advisor, and stories from the field. Every list is real data; a section with nothing to show says so or steps aside.
 */
export function HomePage() {
  const t = useT()
  return (
    <div className="pb-16">
      <title>{t('AgroTrends – farming questions, stories and advice')}</title>
      <Hero />
      <div className="mx-auto flex max-w-(--container-page) flex-col gap-14 px-4 sm:gap-16 sm:px-8">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <DiscoverSections />
        </Suspense>
      </div>
    </div>
  )
}

/** The headline and how to start on the left; the drawn field with a pointer to the advisor on the right. */
function Hero() {
  const t = useT()
  const { status } = useSession()

  return (
    <section aria-labelledby="discover-title" className="mx-auto max-w-(--container-page) px-4 pt-8 pb-12 sm:px-8 sm:pt-12 sm:pb-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14">
        <div>
          <h1 id="discover-title" className="font-serif text-[2.375rem] leading-[1.06] font-medium tracking-[-0.02em] text-balance sm:text-4xl">
            {t('Farming questions, answered by people who grow.')}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t('Ask about your crop, your soil, your season. Farmers, agronomists and verified experts answer; an AI answer arrives first, and experts check it.')}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/questions/ask">{t('Ask a question')}</ButtonLink>
            {status === 'anonymous' && (
              <ButtonLink to="/sign-up" variant="secondary">
                {t('Join AgroTrends')}
              </ButtonLink>
            )}
          </div>
        </div>
        <figure className="relative hidden overflow-hidden rounded-2xl md:block">
          <FieldScene className="aspect-[4/3] w-full" />
          <figcaption className="absolute bottom-4 left-4 max-w-72 rounded-xl bg-background/95 p-4 shadow-sm ring-1 ring-border">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkle size={16} weight="fill" aria-hidden="true" className="text-primary" />
              {t('Ask the advisor')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t('A private answer in seconds, written from what farmers here have shared, with sources.')}</p>
            <Link to="/advisor" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t('Open the advisor')}
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
