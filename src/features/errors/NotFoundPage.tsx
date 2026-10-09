import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'

export function NotFoundPage() {
  const t = useT()
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl">{t('Page not found')}</h1>
      <p className="mt-3 text-ink-muted">{t('The link may be old, or the story may have been unpublished.')}</p>
      <ButtonLink to="/" variant="secondary" className="mt-8">
        {t('Go to the home page')}
      </ButtonLink>
    </section>
  )
}
