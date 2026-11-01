import type { ReactNode } from 'react'
import { useLang, useT } from '../../lib/i18n'
import { CONTACT_EMAIL, LEGAL_UPDATED } from '../../lib/site'

/** About, Privacy and Terms: a reading column with a serif title; the body reuses the story typography. */
export function SitePage({ title, lead, updated, englishOnly, children }: { title: string; lead?: string; updated?: boolean; englishOnly?: boolean; children: ReactNode }) {
  const t = useT()
  const lang = useLang()
  return (
    <article className="mx-auto max-w-(--container-read) px-4 pt-12 pb-20 sm:px-6">
      <title>{`${title} – AgroTrends`}</title>
      <h1 className="font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">{title}</h1>
      {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
      {updated && <p className="mt-3 text-sm text-muted-foreground">{t('Last updated {date}', { date: new Date(LEGAL_UPDATED).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { dateStyle: 'long' }) })}</p>}
      {englishOnly && lang === 'bn' && (
        <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-sm">{t('This page is in English for now. A Bengali version is coming.')}</p>
      )}
      <div className="story-body mt-10" lang={englishOnly ? 'en' : undefined}>
        {children}
      </div>
    </article>
  )
}

export function MailLink() {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
}
