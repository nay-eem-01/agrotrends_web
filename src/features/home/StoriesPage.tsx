import { useT } from '../../lib/i18n'
import { Feed } from '../feed/Feed'
import { TopicsRail } from '../topics/TopicsPage'
import { HomeTabs, Welcome } from './HomePage'

/** `/stories`: the story feeds, the second tab of home. */
export function StoriesPage() {
  const t = useT()
  return (
    <>
      <Welcome />
      <HomeTabs />
      <div className="mx-auto max-w-(--container-page) px-4 pb-16 sm:px-6">
        <title>{t('Stories – AgroTrends')}</title>
        <div className="lg:flex lg:gap-12">
          <div className="max-w-(--container-feed) min-w-0 flex-1">
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
