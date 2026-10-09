import { useT } from '../../lib/i18n'
import { useParams } from 'react-router-dom'
import { useTagStories } from '../../api/topics'
import { ButtonLink } from '../../ui/Button'
import { StoryList } from '../feed/Feed'
import { FollowTagButton } from './FollowTagButton'

export function TagPage() {
  const t = useT()
  const { tagName = '' } = useParams()
  const stories = useTagStories(tagName)
  const total = stories.data?.pages[0]?.totalElements

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <title>{`${tagName} – AgroTrends`}</title>
      <p className="text-sm text-ink-muted">{t('Topic')}</p>
      <h1 className="mt-1 text-2xl first-letter:uppercase sm:text-3xl">{tagName}</h1>
      <div className="mt-4 flex items-center gap-4">
        <FollowTagButton tag={tagName} />
        {total != null && (
          <span className="text-sm text-ink-muted">
            {total} {total === 1 ? 'story' : 'stories'}
          </span>
        )}
      </div>
      <div className="mt-8 border-t border-rule">
        <StoryList
          ready
          query={stories}
          empty={
            <div className="py-16 text-center">
              <h2 className="text-xl">{t('No stories on this topic yet')}</h2>
              <p className="mt-2 text-ink-muted">{t('Follow it to see new ones in For you, or write the first.')}</p>
              <ButtonLink to="/write" size="sm" className="mt-6">
                {t('Write a story')}
              </ButtonLink>
            </div>
          }
        />
      </div>
    </section>
  )
}
