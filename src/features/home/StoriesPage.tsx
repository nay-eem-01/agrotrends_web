import { NotePencil } from '@phosphor-icons/react'
import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { Feed } from '../feed/Feed'
import { TopicsRail } from '../topics/TopicsPage'

/** `/stories`: field notes and guides as an editorial front page; tags to follow sit beside it on wide screens. */
export function StoriesPage() {
  const t = useT()
  return (
    <div className="mx-auto max-w-(--container-page) px-4 pb-16 sm:px-8">
      <title>{t('Stories – AgroTrends')}</title>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-8 sm:pt-10">
        <div className="max-w-xl">
          <h1 className="font-serif text-[2.25rem] leading-[1.1] font-medium sm:text-[2.75rem]">{t('Stories')}</h1>
          <p className="mt-2 text-muted-foreground">{t('Field notes, guides and experiences from farmers and agronomists.')}</p>
        </div>
        <ButtonLink to="/write" variant="secondary" className="shrink-0">
          <NotePencil size={18} aria-hidden="true" />
          {t('Write a story')}
        </ButtonLink>
      </header>
      <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-12">
        <div className="min-w-0">
          <Feed />
        </div>
        <aside className="hidden pt-6 xl:block">
          <TopicsRail />
        </aside>
      </div>
    </div>
  )
}
