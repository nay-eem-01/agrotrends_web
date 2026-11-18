import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import { useT } from '../lib/i18n'

export interface TagItem {
  label: string
  to: string
  /** `tag` (sage) for tags, `context` (outlined) for farming details such as crop or season. */
  kind?: 'tag' | 'context'
  /** Read before the label by screen readers, e.g. "Crop". */
  name?: string
}

// The popover (and its positioning code) loads just after the page; the "+N" shows meanwhile.
const MoreTags = lazy(() => import('./MoreTags').then((m) => ({ default: m.MoreTags })))

const chip = {
  tag: 'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]',
  context: 'text-foreground ring-1 ring-border-strong ring-inset hover:bg-muted',
}

/**
 * Tags as a short row: up to `max` chips, then "+N" for the rest, which opens them in a popover (Escape or a click
 * outside closes it; it stays inside the viewport). Chips sit above a row's covering link (`relative z-10`), so
 * opening the rest never follows the row's link. Renders nothing for no tags.
 */
export function TagList({ items, max = 3, size = 'sm', label, className }: { items: TagItem[]; max?: number; size?: 'sm' | 'md'; label?: string; className?: string }) {
  const t = useT()
  if (items.length === 0) return null
  const shown = items.length > max ? items.slice(0, max) : items
  const rest = items.slice(shown.length)
  const base = cn('relative z-10 inline-flex items-center rounded-full whitespace-nowrap transition-colors duration-150', size === 'sm' ? 'h-6 px-2.5 text-xs' : 'h-8 px-3 text-sm')

  const link = (item: TagItem) => (
    <Link to={item.to} className={cn(base, chip[item.kind ?? 'tag'])}>
      {item.name && <span className="sr-only">{item.name}:</span>}{' '}
      {item.label}
    </Link>
  )

  return (
    <ul aria-label={label} className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {shown.map((item) => (
        <li key={item.to}>{link(item)}</li>
      ))}
      {rest.length > 0 && (
        <li>
          <Suspense fallback={<span aria-hidden="true" className={cn(base, 'text-muted-foreground ring-1 ring-border ring-inset')}>+{rest.length}</span>}>
            <MoreTags count={rest.length} label={label ?? t('Tags')} triggerClassName={cn(base, 'font-medium text-muted-foreground ring-1 ring-border ring-inset hover:bg-muted hover:text-foreground data-popup-open:bg-muted')}>
              {items.map((item) => (
                <li key={item.to}>{link(item)}</li>
              ))}
            </MoreTags>
          </Suspense>
        </li>
      )}
    </ul>
  )
}
