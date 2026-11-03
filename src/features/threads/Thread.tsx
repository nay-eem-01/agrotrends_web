import { useT } from '../../lib/i18n'
import { useId, useState, type ReactNode } from 'react'
import { useThread, useThreadReplies, useThreadWrite, type ThreadItem, type ThreadKind } from '../../api/threads'
import { ApiError, errorMessage } from '../../api/errors'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { PostMenu } from './PostMenu'
import { Composer } from './Composer'

const COPY = {
  comments: {
    heading: 'Responses',
    item: 'Response',
    compose: 'Your response',
    placeholder: 'What are your thoughts?',
    submit: 'Respond',
    posted: 'Response posted',
    signIn: 'Sign in to respond',
    edit: 'Edit your response',
    remove: 'Delete this response?',
    empty: "No responses yet. Share what worked, or what didn't, on your farm.",
  }
}

type Copy = (typeof COPY)[ThreadKind]

interface ThreadProps {
  kind: ThreadKind
  /** The story or question the thread belongs to. */
  parentId: number
  /** Shown under the empty message. */
  whenEmpty?: ReactNode
}

/** Responses under a story with their replies (a reply can be answered too); owners edit and delete. Answers have their own component. */
export function Thread({ kind, parentId, whenEmpty }: ThreadProps) {
  const t = useT()
  const copy = COPY[kind]
  const headingId = useId()
  const { status } = useSession()
  const thread = useThread(kind, parentId)
  const requireSignIn = useRequireSignIn()
  const list = thread.data ?? []
  const replies = useThreadReplies(kind, list)
  // The backend's counts where it gives them, so the heading is right before any replies are read.
  const replyCount = list.reduce((sum, item, index) => sum + (item.replyCount ?? replies[index]?.data?.length ?? 0), 0)

  return (
    <section aria-labelledby={headingId} className="mt-14">
      <h2 id={headingId} className="text-xl">
        {t(copy.heading)}
        {thread.data ? ` (${list.length + replyCount})` : ''}
      </h2>
      <div className="mt-6">
        {status === 'signed-in' ? (
          <ThreadComposer kind={kind} parentId={parentId} placeholder={t(copy.placeholder)} label={t(copy.compose)} submitLabel={t(copy.submit)} doneLabel={t(copy.posted)} />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => requireSignIn(() => {})}>
            {t(copy.signIn)}
          </Button>
        )}
      </div>
      {thread.isPending ? (
        <div className="py-8 text-ink-muted">
          <Spinner label={t('Loading')} />
        </div>
      ) : thread.isError ? (
        <p role="alert" className="py-8 text-ink-muted">
          {thread.error instanceof ApiError && thread.error.isNotFound ? t('This conversation is no longer available.') : errorMessage(thread.error)}
        </p>
      ) : list.length === 0 ? (
        <div className="py-8">
          <p className="text-ink-muted">{t(copy.empty)}</p>
          {whenEmpty}
        </div>
      ) : (
        <ol className="mt-4">
          {list.map((item) => (
            <li key={item.id} className="border-b border-rule py-6">
              <Conversation kind={kind} parentId={parentId} copy={copy} item={item} replies={replies[list.indexOf(item)]?.data ?? []} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

interface ItemProps {
  kind: ThreadKind
  parentId: number
  copy: Copy
}

/**
 * A response and its replies, two levels deep like Facebook: Reply on a reply starts "@name " and is sent with that
 * reply's id; the backend files it under the same response.
 */
function Conversation({ kind, parentId, copy, item, replies }: ItemProps & { item: ThreadItem; replies: ThreadItem[] }) {
  const { status } = useSession()
  const requireSignIn = useRequireSignIn()
  const [replyTo, setReplyTo] = useState<ThreadItem | null>(null)
  const reply = (to: ThreadItem) => (replyTo?.id === to.id ? undefined : () => requireSignIn(() => setReplyTo(to)))

  return (
    <>
      <Item kind={kind} parentId={parentId} copy={copy} item={item} onReply={reply(item)} />
      {(replies.length > 0 || replyTo) && (
        <ol className="mt-4 ml-3 flex flex-col gap-5 border-l-2 border-field pl-5 sm:ml-5">
          {replies.map((each) => (
            <li key={each.id}>
              <Item kind={kind} parentId={parentId} copy={copy} item={each} onReply={reply(each)} />
            </li>
          ))}
          {replyTo && status === 'signed-in' && (
            <li>
              <ThreadComposer
                key={replyTo.id}
                kind={kind}
                parentId={parentId}
                replyTo={replyTo.id}
                initial={replyTo.id === item.id ? '' : `@${replyTo.authorName} `}
                label={`Reply to ${replyTo.authorName}`}
                submitLabel="Reply"
                doneLabel="Reply posted"
                focusOnOpen
                onCancel={() => setReplyTo(null)}
                onDone={() => setReplyTo(null)}
              />
            </li>
          )}
        </ol>
      )}
    </>
  )
}

function Item({ kind, parentId, copy, item, onReply }: ItemProps & { item: ThreadItem; onReply?: () => void }) {
  const t = useT()
  const { user } = useSession()
  const own = user?.id != null && user.id === item.userId
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const remove = useThreadWrite(kind, parentId)
  const edited = new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 1000

  return (
    <article aria-label={`${t(copy.item)} by ${item.authorName}`}>
      <header className="flex items-center gap-2 text-sm">
        <Avatar name={item.authorName} size={28} />
        <span className="font-medium">{item.authorName}</span>
        <span className="min-w-0 flex-1 text-muted-foreground">
          · {storyDate(item.createdAt)}
          {edited && ' · edited'}
        </span>
        {mode === 'view' && (
          <PostMenu
            own={own}
            what={t('this response')}
            report={{ targetType: 'COMMENT', targetId: item.id }}
            onEdit={() => setMode('edit')}
            onDelete={() => setMode('confirm-delete')}
          />
        )}
      </header>

      {mode === 'edit' ? (
        <div className="mt-3">
          <ThreadComposer
            kind={kind}
            parentId={parentId}
            editing={item.id}
            initial={item.content}
            label={t(copy.edit)}
            submitLabel="Save"
            doneLabel="Saved"
            focusOnOpen
            onCancel={() => setMode('view')}
            onDone={() => setMode('view')}
          />
        </div>
      ) : (
        <SafeHtml html={item.content} className="mt-2 text-base leading-relaxed whitespace-pre-line [&>p+p]:mt-3" />
      )}

      {mode === 'confirm-delete' ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>{t(copy.remove)}</span>
          <Button
            variant="danger"
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate({ action: 'delete', id: item.id })}
          >
            {t('Delete')}
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
            {t('Cancel')}
          </Button>
          {remove.isError && (
            <span role="alert" className="text-destructive">
              {errorMessage(remove.error)}
            </span>
          )}
        </div>
      ) : (
        mode === 'view' &&
        onReply && (
          <div className="mt-1 -ml-3 flex gap-1">
            <Button variant="quiet" size="sm" onClick={onReply}>
              {t('Reply')}
            </Button>
          </div>
        )
      )}
    </article>
  )
}

interface ThreadComposerProps {
  kind: ThreadKind
  parentId: number
  /** Set to reply to that item. */
  replyTo?: number
  /** Set to edit that item. */
  editing?: number
  initial?: string
  placeholder?: string
  label: string
  submitLabel: string
  doneLabel: string
  focusOnOpen?: boolean
  onCancel?: () => void
  onDone?: () => void
}

function ThreadComposer({ kind, parentId, replyTo, editing, ...rest }: ThreadComposerProps) {
  const write = useThreadWrite(kind, parentId)
  return (
    <Composer
      {...rest}
      pending={write.isPending}
      error={write.isError ? write.error : null}
      onSubmit={(content, done) => {
        const request =
          editing != null
            ? { action: 'update' as const, id: editing, content }
            : replyTo != null
              ? { action: 'reply' as const, id: replyTo, content }
              : { action: 'create' as const, content }
        write.mutate(request, { onSuccess: done })
      }}
    />
  )
}
