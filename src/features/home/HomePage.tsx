import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { useSession } from '../auth/session'
import { Feed } from '../feed/Feed'
import { SeasonStrip } from '../feed/SeasonStrip'
import { TopicsRail } from '../topics/TopicsPage'

/** Visitors get a short welcome above the feed; signed-in readers go straight to it. */
export function HomePage() {
  const t = useT()
  const { status } = useSession()
  return (
    <>
      {status === 'anonymous' && (
        <section className="border-b border-rule">
          <div className="mx-auto max-w-(--container-page) px-4 pt-14 pb-12 sm:px-6 sm:pt-20">
            <h1 className="max-w-3xl text-3xl sm:text-[3.5rem] sm:leading-[1.05]">
              {t('Farming knowledge from people who grow it.')}
            </h1>
            <p className="mt-6 max-w-xl font-serif text-lg text-ink-muted">
              {t(
                'Stories from farmers and agronomists across Bangladesh, answers to the questions you have this season, and an advisor that shows you where its advice came from.',
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/sign-up">{t('Join AgroTrends')}</ButtonLink>
              <ButtonLink to="/questions" variant="secondary">
                {t('Ask a question')}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}
      <SeasonStrip />
      <div className="mx-auto max-w-(--container-page) px-4 pt-2 pb-16 sm:px-6">
        <div className="lg:flex lg:gap-16">
          <div className="max-w-(--container-feed) min-w-0 flex-1">
            {status === 'anonymous' ? (
              <h2 className="sr-only">{t('Stories')}</h2>
            ) : (
              <h1 className="sr-only">{t('Stories')}</h1>
            )}
            <Feed />
          </div>
          <aside className="hidden w-80 shrink-0 pt-6 lg:block">
            <TopicsRail />
          </aside>
        </div>
      </div>
    </>
  )
}
