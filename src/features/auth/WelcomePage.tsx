import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { safeNext } from '../../lib/auth'
import { useT } from '../../lib/i18n'
import { buttonClass } from '../../ui/Button'
import { AuthorProfileForm } from '../settings/AuthorProfileForm'
import { useSession } from './session'

/** `/welcome`: right after sign-up, an optional profile step. Skipping is always fine; Settings has the same form. */
export function WelcomePage() {
  const t = useT()
  const { user } = useSession()
  const navigate = useNavigate()
  const next = safeNext(useSearchParams()[0].get('next'))

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{t('Welcome – AgroTrends')}</title>
      <h1 className="text-2xl sm:text-3xl">{t('Welcome to AgroTrends')}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        {t('Tell people what you grow or what you work on. It shows next to your answers and stories, so they know whose advice they read. You can skip this and add it later in Settings.')}
      </p>
      <div className="mt-8">
        <AuthorProfileForm name={user?.name ?? ''} onSaved={() => navigate(next, { replace: true })} />
      </div>
      <Link to={next} replace className={buttonClass('quiet', 'sm', 'mt-4 -ml-4')}>
        {t('Skip for now')}
      </Link>
    </section>
  )
}
