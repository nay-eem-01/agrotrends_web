import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from './cx'

interface ChipProps {
  children: ReactNode
  to?: string
  selected?: boolean
  className?: string
}

/** A small rounded label; a link when `to` is given (tags and farming filters are links). */
export function Chip({ children, to, selected = false, className }: ChipProps) {
  const classes = cx(
    'inline-flex h-8 items-center rounded-full px-3 text-sm',
    selected ? 'bg-ink text-paper' : 'bg-field text-ink',
    to && !selected && 'hover:bg-rule',
    className,
  )
  return to ? (
    <Link to={to} className={classes} aria-current={selected ? 'true' : undefined}>
      {children}
    </Link>
  ) : (
    <span className={classes}>{children}</span>
  )
}
