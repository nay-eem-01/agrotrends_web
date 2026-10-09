import { useAdvisorHistory } from '../../api/ai'
import { errorMessage } from '../../api/errors'
import { storyDate } from '../../lib/dates'
import { Button, ButtonLink } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'

/** `/advisor/history`: the reader's earlier questions, newest first; each answer opens in place. */
export function AdvisorHistoryPage() {
  const history = useAdvisorHistory()
  const items = history.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>Your questions to the advisor – AgroTrends</title>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl">Your earlier questions</h1>
        <ButtonLink to="/advisor" size="sm">
          Ask the advisor
        </ButtonLink>
      </div>
      {history.isPending ? (
        <div className="py-16 text-ink-muted">
          <Spinner label="Loading your questions" />
        </div>
      ) : history.isError ? (
        <p role="alert" className="py-16 text-ink-muted">
          {errorMessage(history.error)}
        </p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">No questions yet. What you ask the advisor is kept here.</p>
      ) : (
        <>
          <ul className="mt-8 border-t border-rule">
            {items.map((item) => (
              <li key={item.id} className="border-b border-rule">
                <details className="group py-5">
                  <summary className="cursor-pointer list-none">
                    <span className="block font-medium group-open:font-semibold">{item.question}</span>
                    <span className="mt-1 block text-sm text-ink-muted">Asked {storyDate(item.askedAt)}</span>
                  </summary>
                  <div className="mt-4 border-l-2 border-paddy pl-5">
                    <SafeHtml html={item.answer} className="font-serif text-base whitespace-pre-line [&>p+p]:mt-3" />
                  </div>
                </details>
              </li>
            ))}
          </ul>
          {history.hasNextPage && (
            <Button variant="secondary" size="sm" className="mt-6" loading={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>
              Show older questions
            </Button>
          )}
        </>
      )}
    </section>
  )
}
