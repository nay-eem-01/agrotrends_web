import { Medal, SealCheck } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import type { Badge } from '../../api/reputation'
import { formatNumber, useT } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'

/** A badge earned in a topic: Verified Expert in mustard (the trust colour), Top Contributor quieter. */
export function BadgeMark({ badge, field, className }: { badge: Badge; field?: string | null; className?: string }) {
  const t = useT()
  const expert = badge === 'VERIFIED_EXPERT'
  const Icon = expert ? SealCheck : Medal
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap',
        expert ? 'bg-mustard-soft text-foreground' : 'bg-secondary text-secondary-foreground',
        className,
      )}
    >
      <Icon size={14} weight="fill" className={expert ? 'text-mustard' : 'text-primary'} aria-hidden="true" />
      {expert ? (field ? t('Verified expert · {field}', { field }) : t('Verified expert')) : t('Top contributor')}
    </span>
  )
}

interface AuthorLineProps {
  userId?: number
  name?: string
  reputation?: number
  /** The author's badges in this question's topic. */
  badges?: Badge[]
  /** The date text after the name, e.g. "Asked Oct 15". */
  meta?: string
  size?: 'sm' | 'md'
}

/** Who wrote a question or answer: name (to their profile), reputation and badges in the topic, and when. */
export function AuthorLine({ userId, name = '?', reputation, badges = [], meta, size = 'md' }: AuthorLineProps) {
  const t = useT()
  const nameEl =
    userId != null ? (
      <Link to={`/users/${userId}`} state={{ name }} className="font-medium hover:underline">
        {name}
      </Link>
    ) : (
      <span className="font-medium">{name}</span>
    )
  return (
    <div className={cn('flex items-center gap-2.5', size === 'sm' ? 'text-sm' : 'text-sm')}>
      <Avatar name={name} size={size === 'sm' ? 24 : 36} />
      <div className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {nameEl}
          {reputation != null && (
            <span className="text-muted-foreground tabular-nums" title={t('Reputation')}>
              <span className="sr-only">{t('Reputation')} </span>
              {formatNumber(reputation)}
            </span>
          )}
          {badges.map((badge) => (
            <BadgeMark key={badge} badge={badge} />
          ))}
        </span>
        {meta && <span className="text-muted-foreground">{meta}</span>}
      </div>
    </div>
  )
}
