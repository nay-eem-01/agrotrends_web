import { Link } from 'react-router-dom'

/** The leaf mark plus the wordmark. The mark alone is the favicon. */
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md" aria-label="AgroTrends home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="var(--color-paddy)" />
        <path d="M16 25V12" stroke="var(--color-paper)" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16 17c-4 0-6.5-2.6-6.5-6.5 4 0 6.5 2.6 6.5 6.5Zm0-3c3.4 0 5.5-2.2 5.5-5.5-3.4 0-5.5 2.2-5.5 5.5Z"
          fill="var(--color-mustard)"
        />
      </svg>
      <span className="font-serif text-lg font-bold tracking-[-0.02em] text-ink sm:text-xl">AgroTrends</span>
    </Link>
  )
}
