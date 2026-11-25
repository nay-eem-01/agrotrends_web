import { ArrowUpRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export function FeedHighlight({ label, title, to, image }: { label: string; title: string; to: string; image?: string }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 hover:border-primary/50 hover:text-primary">
      {image && <img src={image} alt="" decoding="async" className="size-12 shrink-0 rounded-lg object-cover" />}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-snug font-semibold wrap-anywhere">{title}</span>
      </span>
      <ArrowUpRight size={14} aria-hidden="true" className="shrink-0" />
    </Link>
  )
}
