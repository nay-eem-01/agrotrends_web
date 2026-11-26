import type { useCategories, Category } from '../../api/categories'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'

export const TOPICS_UNAVAILABLE = 'Topics could not be loaded. Retry to choose a topic.'
export const NO_TOPICS = 'No topics are available yet. You can keep working on your draft.'

type Catalog = ReturnType<typeof useCategories>

export function catalogProblem(catalog: Catalog) {
  if (catalog.data?.length || catalog.isPending) return undefined
  return catalog.isError ? TOPICS_UNAVAILABLE : NO_TOPICS
}

export function topicSelectionError(catalog: Catalog, id?: number) {
  if (id == null) return catalogProblem(catalog) ?? 'Choose a topic.'
  if (catalog.isSuccess && catalog.dataUpdatedAt > 0 && !catalog.data.some((topic) => topic.id === id)) {
    return 'That topic is no longer available. Choose another topic.'
  }
}

export function includeSelectedTopic(catalog: Catalog, selected: Category | undefined) {
  const options = catalog.data ?? []
  if (catalog.isSuccess && catalog.dataUpdatedAt > 0) return options
  return selected?.id != null && !options.some((topic) => topic.id === selected.id)
    ? [selected, ...options]
    : options
}

export function TopicCatalogStatus({ catalog }: { catalog: Catalog }) {
  const t = useT()
  const problem = catalogProblem(catalog)
  if (!problem && !catalog.isError) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <output className="text-sm text-muted-foreground">
        {t(problem ?? 'Showing previously loaded topics. Retry to refresh the list.')}
      </output>
      <Button size="sm" variant="secondary" loading={catalog.isFetching} pendingLabel={t('Loading topics')} onClick={() => void catalog.refetch()}>
        {t('Retry topics')}
      </Button>
    </div>
  )
}
