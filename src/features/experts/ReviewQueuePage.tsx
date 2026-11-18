import { SealCheck } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { ApiError, errorMessage } from '../../api/errors'
import { useReviewQueue } from '../../api/review'
import { excerpt, htmlToText } from '../../lib/html'
import { useT } from '../../lib/i18n'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { ReviewActions } from './ReviewActions'

/** `/review`: unchecked AI answers in the expert's topics, oldest first, to confirm, correct or flag. */
export function ReviewQueuePage() {
  const t = useT()
  const queue = useReviewQueue()
  const items = queue.data?.pages.flatMap((page) => page.content) ?? []
  const notExpert = queue.error instanceof ApiError && queue.error.status === 403

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{t('Review queue – AgroTrends')}</title>
      <h1 className="flex items-center gap-2 font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">
        <SealCheck size={28} weight="fill" className="text-mustard-ink" aria-hidden="true" />
        {t('Review queue')}
      </h1>
      <p className="mt-2 text-muted-foreground">{t('AI answers in your topics that no expert has checked yet, oldest first.')}</p>
      {queue.isPending ? (
        <div className="py-12 text-muted-foreground">
          <Spinner label={t('Loading')} />
        </div>
      ) : notExpert ? (
        <div className="mt-8 rounded-xl bg-card p-6 ring-1 ring-border">
          <p>{t('The review queue is for verified experts.')}</p>
          <ButtonLink to="/experts/apply" variant="secondary" size="sm" className="mt-4">
            {t('Become a verified expert')}
          </ButtonLink>
        </div>
      ) : queue.isError ? (
        <p role="alert" className="py-12 text-muted-foreground">
          {errorMessage(queue.error)}
        </p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t('Nothing to review. Every AI answer in your topics has been checked.')}</p>
      ) : (
        <>
          <ul className="mt-8 flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.questionId}>
                <article aria-labelledby={`review-${item.questionId}`} className="rounded-xl bg-card p-5 ring-1 ring-border">
                  {item.topic?.categoryName && <Badge variant="secondary">{item.topic.categoryName}</Badge>}
                  <h2 id={`review-${item.questionId}`} className="mt-2 font-serif text-lg font-bold">
                    <Link to={`/questions/${item.questionId}`} className="hover:underline">
                      {item.questionTitle}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-3 text-muted-foreground">{excerpt(htmlToText(item.questionContent), 280)}</p>
                  <div className="mt-4 rounded-xl border border-dashed border-input p-4">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground">{t('AI answer')}</p>
                    <p className="mt-1 font-serif whitespace-pre-line">{item.aiAnswer?.answer}</p>
                  </div>
                  <ReviewActions questionId={item.questionId ?? 0} canConfirm canFlag />
                </article>
              </li>
            ))}
          </ul>
          {queue.hasNextPage && (
            <Button variant="secondary" size="sm" className="mt-6" loading={queue.isFetchingNextPage} onClick={() => void queue.fetchNextPage()}>
              {t('Show more')}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
