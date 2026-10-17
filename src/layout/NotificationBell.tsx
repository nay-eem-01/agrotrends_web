import { Bell } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from 'cn'
import { errorMessage } from '../api/errors'
import { useMarkRead, useNotifications, useUnreadCount, type Notification } from '../api/notifications'
import { storyDate } from '../lib/dates'
import { formatNumber, useT } from '../lib/i18n'
import { describeNotification } from '../lib/notifications'
import { Spinner } from '../ui/Spinner'

/** The bell in the top bar: the unread count (polled), and the latest ten in a panel. */
export function NotificationBell() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const unread = useUnreadCount(true).data ?? 0
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) {
        setOpen(false)
        if (event instanceof KeyboardEvent) trigger.current?.focus()
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-11 items-center justify-center rounded-full text-muted-foreground transition-[color,transform] duration-150 ease-(--ease-out) hover:text-foreground active:scale-[0.94]"
      >
        <Bell size={22} weight={open ? 'fill' : 'regular'} aria-hidden="true" />
        <span className="sr-only">{unread > 0 ? t('Notifications, {n} unread', { n: unread }) : t('Notifications')}</span>
        {unread > 0 && (
          <span aria-hidden="true" className="absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[0.6875rem] font-semibold text-white tabular-nums">
            {unread > 99 ? '99+' : formatNumber(unread)}
          </span>
        )}
      </button>
      {open && <Panel id={panelId} hasUnread={unread > 0} onClose={() => setOpen(false)} />}
    </div>
  )
}

function Panel({ id, hasUnread, onClose }: { id: string; hasUnread: boolean; onClose: () => void }) {
  const t = useT()
  const latest = useNotifications({ pageSize: 10 })
  const markRead = useMarkRead()
  const items = latest.data?.pages[0]?.content ?? []

  return (
    <section
      id={id}
      aria-label={t('Notifications')}
      // Grows out of the bell (top right) and fades in: an entrance answering the click, under 200ms.
      className="absolute right-0 z-30 mt-1 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-border transition-[opacity,transform] duration-150 ease-(--ease-out) starting:scale-95 starting:opacity-0"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <h2 className="font-sans text-sm font-semibold">{t('Notifications')}</h2>
        {hasUnread && (
          <button type="button" onClick={() => markRead.mutate('all')} className="h-9 rounded-full px-3 text-sm text-primary hover:bg-muted">
            {t('Mark all read')}
          </button>
        )}
      </div>
      {latest.isPending ? (
        <div className="p-4">
          <Spinner size={18} label={t('Loading')} />
        </div>
      ) : latest.isError ? (
        <p role="alert" className="p-4 text-sm text-muted-foreground">
          {errorMessage(latest.error)}
        </p>
      ) : items.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{t('Nothing new. Answers to your questions and replies show up here.')}</p>
      ) : (
        <ul className="max-h-[60vh] overflow-y-auto py-1">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationRow item={item} onOpen={onClose} />
            </li>
          ))}
        </ul>
      )}
      <Link to="/notifications" onClick={onClose} className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted">
        {t('See all notifications')}
      </Link>
    </section>
  )
}

/** One notification: opening it marks it read, then goes to its page (when it has one). */
export function NotificationRow({ item, onOpen }: { item: Notification; onOpen?: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const markRead = useMarkRead()
  const { text, values, to } = describeNotification(item)

  function open() {
    if (!item.read && item.id != null) markRead.mutate(item.id)
    onOpen?.()
    if (to) navigate(to)
  }

  const body = (
    <>
      <span aria-hidden="true" className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.read ? 'bg-transparent' : 'bg-primary')} />
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-sm', !item.read && 'font-medium')}>
          {!item.read && <span className="sr-only">{t('Unread')}:</span>}{' '}
          {t(text, { ...values, actor: values.actor ?? t('A member') })}
        </span>{' '}
        <span className="text-xs text-muted-foreground">{storyDate(item.createdAt)}</span>
      </span>
    </>
  )

  return to || !item.read ? (
    <button type="button" onClick={open} className="flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted">
      {body}
    </button>
  ) : (
    <div className="flex gap-3 px-4 py-3">{body}</div>
  )
}
