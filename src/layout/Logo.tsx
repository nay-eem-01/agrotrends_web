import { cn } from 'cn'
import { Link } from 'react-router-dom'

/** The leaf mark plus the wordmark. The mark alone is the favicon. In the footer it's plain, so home has one link. */
export function Logo({ link = true, compactOnMobile = false }: { link?: boolean; compactOnMobile?: boolean }) {
  const mark = (
    <>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" className={compactOnMobile ? 'hidden min-[420px]:block' : undefined}>
        <rect width="32" height="32" rx="10" fill="var(--color-paddy)" />
        <path d="M16 25V12" stroke="var(--color-paper)" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16 17c-4 0-6.5-2.6-6.5-6.5 4 0 6.5 2.6 6.5 6.5Zm0-3c3.4 0 5.5-2.2 5.5-5.5-3.4 0-5.5 2.2-5.5 5.5Z"
          fill="var(--color-mustard)"
        />
      </svg>
      <span className={cn('font-serif text-lg font-bold whitespace-nowrap tracking-[-0.02em] text-ink sm:text-xl', compactOnMobile && 'max-[379px]:text-base')}>AgroTrends</span>
    </>
  )
  return link ? (
    <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2 rounded-md" aria-label="AgroTrends home">
      {mark}
    </Link>
  ) : (
    <span className="flex items-center gap-2">{mark}</span>
  )
}
