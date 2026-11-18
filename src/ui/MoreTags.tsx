import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { useT } from '../lib/i18n'

/** TagList's "+N": a button that opens every tag (`children`, list items) in a popover kept inside the viewport. */
export function MoreTags({ count, label, triggerClassName, children }: { count: number; label: string; triggerClassName: string; children: ReactNode }) {
  const t = useT()
  return (
    <Popover>
      <PopoverTrigger aria-label={t('Show {n} more tags', { n: count })} className={triggerClassName}>
        +{count}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[min(20rem,calc(100vw-2rem))] gap-2 p-3">
        <PopoverTitle className="text-xs font-semibold text-muted-foreground">{label}</PopoverTitle>
        <ul className="flex flex-wrap gap-1.5">{children}</ul>
      </PopoverContent>
    </Popover>
  )
}
