import { cn } from 'cn'
import { useState, type ReactNode } from 'react'
import type { Category } from '../../api/categories'
import { useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'

const PAGE_SIZE = 5

export function TopicChips({ categories, selected, children, renderTopic, scrollOnMobile }: {
  categories: Category[]
  selected?: number
  scrollOnMobile?: boolean
  children?: ReactNode
  renderTopic: (category: Category) => ReactNode
}) {
  const t = useT()
  const activeIndex = categories.findIndex((category) => category.id === selected)
  const activePage = Math.max(0, Math.floor(activeIndex / PAGE_SIZE))
  const [browsing, setBrowsing] = useState<{ selected?: number; page: number }>()
  const lastPage = Math.max(0, Math.ceil(categories.length / PAGE_SIZE) - 1)
  const page = browsing && browsing.selected === selected ? Math.min(browsing.page, lastPage) : activePage
  const goToPage = (page: number) => setBrowsing({ selected, page })

  return (
    <nav aria-label={t('Topics')} className={cn('min-w-0', scrollOnMobile && 'max-sm:w-full')}>
      <ul className={cn('flex flex-wrap items-center gap-2 pb-1', scrollOnMobile && 'max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:[&>li]:shrink-0')}>
        {children}
        {categories.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((category) => (
          <li key={category.id} className="max-w-full min-w-0">{renderTopic(category)}</li>
        ))}
        {page > 0 && (
          <li><Button size="sm" variant="secondary" onClick={() => goToPage(page - 1)}>{t('Previous topics')}</Button></li>
        )}
        {page < lastPage && (
          <li><Button size="sm" variant="secondary" onClick={() => goToPage(page + 1)}>{t('More topics')}</Button></li>
        )}
      </ul>
    </nav>
  )
}
