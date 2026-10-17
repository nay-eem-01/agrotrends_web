import { Check } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from './cx'

interface ChipProps {
  children: ReactNode
  to?: string
  selected?: boolean
  className?: string
}

/** A small sage label; a link when `to` is given (tags and farming filters are links). Selected adds a tick, not only colour. */
export function Chip({ children, to, selected = false, className }: ChipProps) {
  const classes = cx(
    'inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm transition-colors duration-150',
    selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
    to && !selected && 'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]',
    className,
  )
  const content = (
    <>
      {selected && <Check size={14} weight="bold" aria-hidden="true" />}
      {children}
    </>
  )
  return to ? (
    <Link to={to} className={classes} aria-current={selected ? 'true' : undefined}>
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  )
}
