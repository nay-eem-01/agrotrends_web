import { CaretDown, Sparkle } from '@phosphor-icons/react'
import { useT } from '../../lib/i18n'
import { useAdvisorHistory } from '../../api/ai'
import { errorMessage } from '../../api/errors'
import { storyDate } from '../../lib/dates'
import { Button, ButtonLink } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { AskExperts } from './AskExperts'
import { Sources } from './Sources'

/** `/advisor/history`: the reader's earlier questions, newest first; each answer opens in place. */
export function AdvisorHistoryPage() {
  const t = useT()
  const history = useAdvisorHistory()
  const items = history.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{t('Your questions to the advisor – AgroTrends')}</title>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl">{t('Your earlier questions')}</h1>
        <ButtonLink to="/advisor" size="sm">
          {t('Ask the advisor')}
        </ButtonLink>
      </div>
      {history.isPending ? (
        <div className="py-16 text-muted-foreground">
          <Spinner label={t('Loading your questions')} />
        </div>
      ) : history.isError ? (
        <p role="alert" className="py-16 text-muted-foreground">
          {errorMessage(history.error)}
        </p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t('No questions yet. What you ask the advisor is kept here.')}</p>
      ) : (
        <>
          <ul className="mt-8 border-t border-border">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border">
                <details className="group py-5">
                  <summary className="-mx-2 flex cursor-pointer list-none items-start gap-3 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-surface [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium whitespace-pre-line group-open:font-semibold">{item.question}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{t('Asked {date}', { date: storyDate(item.askedAt) })}</span>
                    </span>
                    <CaretDown size={18} aria-hidden="true" className="mt-1 shrink-0 text-muted-foreground transition-transform duration-200 ease-(--ease-out) group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 border-l-2 border-primary pl-4 sm:pl-5">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Sparkle size={16} weight="fill" aria-hidden="true" />
                      {t('AI answer')}
                    </p>
                    <SafeHtml html={item.answer} className="mt-2 font-serif text-[1.0625rem] leading-relaxed whitespace-pre-line [&>p+p]:mt-3" />
                    <Sources sources={item.sources} />
                    <AskExperts item={item} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
          {history.hasNextPage && (
            <Button variant="secondary" size="sm" className="mt-6" loading={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>
              {t('Show older questions')}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
