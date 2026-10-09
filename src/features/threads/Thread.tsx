import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { useThread, useThreadReplies, useThreadWrite, type ThreadItem, type ThreadKind } from '../../api/threads'
import { errorMessage } from '../../api/errors'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { TextArea } from '../../ui/TextArea'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

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
  },
  answers: {
    heading: 'Answers',
    item: 'Answer',
    compose: 'Your answer',
    placeholder: 'What has worked for you?',
    submit: 'Post answer',
    posted: 'Answer posted',
    signIn: 'Sign in to answer',
    edit: 'Edit your answer',
    remove: 'Delete this answer?',
    empty: 'No answers yet. If you have grown this, your answer helps.',
  },
}

type Copy = (typeof COPY)[ThreadKind]

interface ThreadProps {
  kind: ThreadKind
  /** The story or question the thread belongs to. */
  parentId: number
  /** Shown under the empty message, e.g. the AI draft offer on an unanswered question. */
  whenEmpty?: ReactNode
}

/** Responses under a story or answers under a question: one level of replies, like Medium; owners edit and delete. */
export function Thread({ kind, parentId, whenEmpty }: ThreadProps) {
  const copy = COPY[kind]
  const headingId = useId()
  const { status } = useSession()
  const thread = useThread(kind, parentId)
  const requireSignIn = useRequireSignIn()
  const all = thread.data ?? []
  const replies = useThreadReplies(kind, all.map((item) => item.id))
  // The answers list also returns replies (with no parent field); anything that is someone's reply isn't top-level.
  const replyIds = new Set(replies.flatMap((thread) => thread.data?.map((reply) => reply.id) ?? []))
  const list = all.filter((item) => !replyIds.has(item.id))
  const replyCount = replyIds.size

  return (
    <section aria-labelledby={headingId} className="mt-14">
      <h2 id={headingId} className="text-xl">
        {copy.heading}
        {thread.data ? ` (${list.length + replyCount})` : ''}
      </h2>
      <div className="mt-6">
        {status === 'signed-in' ? (
          <Composer kind={kind} parentId={parentId} placeholder={copy.placeholder} label={copy.compose} submitLabel={copy.submit} doneLabel={copy.posted} />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => requireSignIn(() => {})}>
            {copy.signIn}
          </Button>
        )}
      </div>
      {thread.isPending ? (
        <div className="py-8 text-ink-muted">
          <Spinner label={`Loading ${copy.heading.toLowerCase()}`} />
        </div>
      ) : thread.isError ? (
        <p role="alert" className="py-8 text-ink-muted">
          {errorMessage(thread.error)}
        </p>
      ) : list.length === 0 ? (
        <div className="py-8">
          <p className="text-ink-muted">{copy.empty}</p>
          {whenEmpty}
        </div>
      ) : (
        <ol className="mt-4">
          {list.map((item) => (
            <li key={item.id} className="border-b border-rule py-6">
              <Conversation kind={kind} parentId={parentId} copy={copy} item={item} replies={replies[all.indexOf(item)]?.data ?? []} />
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

function Conversation({ kind, parentId, copy, item, replies }: ItemProps & { item: ThreadItem; replies: ThreadItem[] }) {
  const { status } = useSession()
  const requireSignIn = useRequireSignIn()
  const [replying, setReplying] = useState(false)

  return (
    <>
      <Item kind={kind} parentId={parentId} copy={copy} item={item} onReply={replying ? undefined : () => requireSignIn(() => setReplying(true))} />
      {(replies.length > 0 || replying) && (
        <ol className="mt-4 ml-3 flex flex-col gap-5 border-l-2 border-field pl-5 sm:ml-5">
          {replies.map((reply) => (
            <li key={reply.id}>
              <Item kind={kind} parentId={parentId} copy={copy} item={reply} />
            </li>
          ))}
          {replying && status === 'signed-in' && (
            <li>
              <Composer
                kind={kind}
                parentId={parentId}
                replyTo={item.id}
                label={`Reply to ${item.authorName}`}
                submitLabel="Reply"
                doneLabel="Reply posted"
                focusOnOpen
                onCancel={() => setReplying(false)}
                onDone={() => setReplying(false)}
              />
            </li>
          )}
        </ol>
      )}
    </>
  )
}

function Item({ kind, parentId, copy, item, onReply }: ItemProps & { item: ThreadItem; onReply?: () => void }) {
  const { user } = useSession()
  const own = user?.id != null && user.id === item.userId
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const remove = useThreadWrite(kind, parentId)
  const edited = new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 1000

  return (
    <article aria-label={`${copy.item} by ${item.authorName}`}>
      <header className="flex items-center gap-2 text-sm">
        <Avatar name={item.authorName} size={28} />
        <span className="font-medium">{item.authorName}</span>
        <span className="text-ink-muted">
          · {storyDate(item.createdAt)}
          {edited && ' · edited'}
        </span>
      </header>

      {mode === 'edit' ? (
        <div className="mt-3">
          <Composer
            kind={kind}
            parentId={parentId}
            editing={item.id}
            initial={item.content}
            label={copy.edit}
            submitLabel="Save"
            doneLabel="Saved"
            focusOnOpen
            onCancel={() => setMode('view')}
            onDone={() => setMode('view')}
          />
        </div>
      ) : (
        <SafeHtml html={item.content} className="mt-2 font-serif text-base whitespace-pre-line [&>p+p]:mt-3" />
      )}

      {mode === 'confirm-delete' ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>{copy.remove}</span>
          <Button
            variant="danger"
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate({ action: 'delete', id: item.id })}
          >
            Delete
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
            Cancel
          </Button>
          {remove.isError && (
            <span role="alert" className="text-danger">
              {errorMessage(remove.error)}
            </span>
          )}
        </div>
      ) : (
        mode === 'view' && (
          <div className="mt-1 -ml-3 flex gap-1">
            {onReply && (
              <Button variant="quiet" size="sm" onClick={onReply}>
                Reply
              </Button>
            )}
            {own && (
              <>
                <Button variant="quiet" size="sm" onClick={() => setMode('edit')}>
                  Edit
                </Button>
                <Button variant="quiet" size="sm" onClick={() => setMode('confirm-delete')}>
                  Delete
                </Button>
              </>
            )}
          </div>
        )
      )}
    </article>
  )
}

interface ComposerProps {
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
  /** Move focus into the field when it appears (it was opened by Reply or Edit). */
  focusOnOpen?: boolean
  onCancel?: () => void
  onDone?: () => void
}

function Composer({ kind, parentId, replyTo, editing, initial = '', placeholder, label, submitLabel, doneLabel, focusOnOpen, onCancel, onDone }: ComposerProps) {
  const fieldId = useId()
  const write = useThreadWrite(kind, parentId)
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (focusOnOpen) document.getElementById(fieldId)?.focus()
  }, [focusOnOpen, fieldId])

  function submit(event: FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content) {
      setError('Write something first.')
      return
    }
    setError(undefined)
    const request =
      editing != null
        ? { action: 'update' as const, id: editing, content }
        : replyTo != null
          ? { action: 'reply' as const, id: replyTo, content }
          : { action: 'create' as const, content }
    write.mutate(request, {
      onSuccess: () => {
        setText('')
        setDone(true)
        onDone?.()
      },
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <TextArea
        id={fieldId}
        label={label}
        rows={3}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setDone(false)
        }}
        error={error}
      />
      {write.isError && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage(write.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={write.isPending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="quiet" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {done && !onDone && <output className="text-sm text-paddy">{doneLabel}</output>}
      </div>
    </form>
  )
}
