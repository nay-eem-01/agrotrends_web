import { Link, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { errorMessage } from '../../api/errors'
import { useMarkRead, useNotifications, useUnreadCount } from '../../api/notifications'
import { useT } from '../../lib/i18n'
import { NotificationRow } from '../../layout/NotificationBell'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'

/** `/notifications`: everything, or only the unread (`?unread=true`), newest first, page by page. */
export function NotificationsPage() {
  const t = useT()
  const unreadOnly = useSearchParams()[0].get('unread') === 'true'
  const notifications = useNotifications({ unreadOnly })
  const unread = useUnreadCount(true).data ?? 0
  const markRead = useMarkRead()
  const items = notifications.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{t('Notifications – AgroTrends')}</title>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl">{t('Notifications')}</h1>
        {unread > 0 && (
          <Button variant="secondary" size="sm" loading={markRead.isPending} onClick={() => markRead.mutate('all')}>
            {t('Mark all read')}
          </Button>
        )}
      </div>
      <nav aria-label={t('Which notifications')} className="mt-6 flex gap-6 border-b border-border">
        {(
          [
            [false, t('All'), '/notifications'],
            [true, unread > 0 ? t('Unread ({n})', { n: unread }) : t('Unread'), '/notifications?unread=true'],
          ] as const
        ).map(([value, label, to]) => (
          <Link
            key={to}
            to={to}
            aria-current={unreadOnly === value ? 'page' : undefined}
            className={cn('-mb-px flex h-12 items-center border-b-2 text-sm', unreadOnly === value ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {label}
          </Link>
        ))}
      </nav>
      {notifications.isPending ? (
        <div className="py-12">
          <Spinner label={t('Loading')} />
        </div>
      ) : notifications.isError ? (
        <p role="alert" className="py-12 text-muted-foreground">
          {errorMessage(notifications.error)}
        </p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{unreadOnly ? t('You have read everything.') : t('Nothing new. Answers to your questions and replies show up here.')}</p>
      ) : (
        <>
          <ul className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-border">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border last:border-b-0">
                <NotificationRow item={item} />
              </li>
            ))}
          </ul>
          {notifications.hasNextPage && (
            <div className="flex justify-center py-6">
              <Button variant="secondary" size="sm" loading={notifications.isFetchingNextPage} onClick={() => void notifications.fetchNextPage()}>
                {t('Show older notifications')}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
