import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-(--container-page) flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-ink-muted sm:px-6">
        <span>© {YEAR} AgroTrends</span>
        <nav aria-label="Footer" className="flex gap-5 sm:ml-auto">
          <Link to="/questions" className="hover:text-ink">Questions</Link>
          <Link to="/advisor" className="hover:text-ink">AI advisor</Link>
          <Link to="/write" className="hover:text-ink">Write</Link>
        </nav>
      </div>
    </footer>
  )
}
