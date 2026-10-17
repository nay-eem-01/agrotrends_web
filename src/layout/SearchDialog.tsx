import { MagnifyingGlass } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useT } from '../lib/i18n'

/**
 * The site-wide search, opened from the top bar (or Ctrl/⌘+K): one field, Enter searches questions, stories and
 * topics on `/search`. No suggestions are shown: the backend has none to offer, and made-up ones would mislead.
 */
export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const field = useRef<HTMLInputElement>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    if (!q) return
    onOpenChange(false)
    setQuery('')
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} initialFocus={field} className="top-[12vh] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{t('Search AgroTrends')}</DialogTitle>
        <search>
          <form onSubmit={submit} className="flex h-14 items-center gap-3 border-b border-border px-4">
            <MagnifyingGlass size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            <input
              type="search"
              ref={field}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t('Search questions and stories')}
              placeholder={t('Search questions, crops, pests')}
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-sans text-xs text-muted-foreground sm:inline">Esc</kbd>
          </form>
        </search>
        <DialogDescription className="px-4 py-3 text-sm text-muted-foreground">
          {t('Questions, stories and topics. Press Enter to search.')}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
