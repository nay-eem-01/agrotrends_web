import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'

/**
 * `/unsubscribed?kind=answer|digest[&error=invalid]`, where an e-mail's unsubscribe link lands after the backend
 * switched that kind off. Public: the link works without signing in.
 */
export function UnsubscribedPage() {
  const t = useT()
  const [params] = useSearchParams()
  const invalid = params.get('error') === 'invalid'
  const kind = params.get('kind') === 'digest' ? 'digest' : 'answer'
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-14 pb-20 sm:px-6">
      <title>{`${t('E-mails')} – AgroTrends`}</title>
      {invalid ? (
        <WarningCircle size={36} weight="fill" aria-hidden="true" className="text-destructive" />
      ) : (
        <CheckCircle size={36} weight="fill" aria-hidden="true" className="text-primary" />
      )}
      <h1 className="mt-4 font-serif text-[2rem] leading-tight font-medium">
        {invalid ? t('This unsubscribe link didn’t work') : kind === 'digest' ? t('No more weekly digests') : t('No more e-mails about answers')}
      </h1>
      <p className="mt-3 max-w-[58ch] text-muted-foreground">
        {invalid
          ? t('It may be cut short or from an old e-mail. You can choose your e-mails in Settings.')
          : kind === 'digest'
            ? t('We won’t send you the Monday digest. You can turn it back on in Settings.')
            : t('We won’t e-mail you when your questions get answers; you’ll still see them under notifications. You can turn this back on in Settings.')}
      </p>
      <ButtonLink to="/settings#emails" variant="secondary" className="mt-7">
        {t('Open settings')}
      </ButtonLink>
    </section>
  )
}
