import { useEffect, useId, useState, type FormEvent } from 'react'
import { useCommentWrite, useComments, useReplies, type CommentResponse } from '../../api/comments'
import { errorMessage } from '../../api/errors'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { TextArea } from '../../ui/TextArea'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'

/** The responses under a story: one level of replies, like Medium; owners edit and delete their own. */
export function Responses({ blogId }: { blogId: number }) {
  const headingId = useId()
  const { status } = useSession()
  const comments = useComments(blogId)
  const requireSignIn = useRequireSignIn()
  const list = comments.data ?? []
  const replies = useReplies(list.map((comment) => comment.commentId))
  const replyCount = replies.reduce((sum, thread) => sum + (thread.data?.length ?? 0), 0)

  return (
    <section aria-labelledby={headingId} className="mt-14">
      <h2 id={headingId} className="text-xl">
        Responses{comments.data ? ` (${list.length + replyCount})` : ''}
      </h2>
      <div className="mt-6">
        {status === 'signed-in' ? (
          <Composer blogId={blogId} label="Your response" submitLabel="Respond" doneLabel="Response posted" />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => requireSignIn(() => {})}>
            Sign in to respond
          </Button>
        )}
      </div>
      {comments.isPending ? (
        <div className="py-8 text-ink-muted">
          <Spinner label="Loading responses" />
        </div>
      ) : comments.isError ? (
        <p role="alert" className="py-8 text-ink-muted">
          {errorMessage(comments.error)}
        </p>
      ) : list.length === 0 ? (
        <p className="py-8 text-ink-muted">No responses yet. Share what worked, or what didn't, on your farm.</p>
      ) : (
        <ol className="mt-4">
          {list.map((comment, index) => (
            <li key={comment.commentId} className="border-b border-rule py-6">
              <Thread comment={comment} replies={replies[index]?.data ?? []} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function Thread({ comment, replies }: { comment: CommentResponse; replies: CommentResponse[] }) {
  const { status } = useSession()
  const requireSignIn = useRequireSignIn()
  const [replying, setReplying] = useState(false)

  return (
    <>
      <Comment comment={comment} onReply={replying ? undefined : () => requireSignIn(() => setReplying(true))} />
      {(replies.length > 0 || replying) && (
        <ol className="mt-4 ml-3 flex flex-col gap-5 border-l-2 border-field pl-5 sm:ml-5">
          {replies.map((reply) => (
            <li key={reply.commentId}>
              <Comment comment={reply} />
            </li>
          ))}
          {replying && status === 'signed-in' && (
            <li>
              <Composer
                blogId={comment.blogId}
                parentCommentId={comment.commentId}
                label={`Reply to ${comment.authorName}`}
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

function Comment({ comment, onReply }: { comment: CommentResponse; onReply?: () => void }) {
  const { user } = useSession()
  const own = user?.id != null && user.id === comment.userId
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const remove = useCommentWrite()
  const edited = new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000

  return (
    <article aria-label={`Response by ${comment.authorName}`}>
      <header className="flex items-center gap-2 text-sm">
        <Avatar name={comment.authorName} size={28} />
        <span className="font-medium">{comment.authorName}</span>
        <span className="text-ink-muted">
          · {storyDate(comment.createdAt)}
          {edited && ' · edited'}
        </span>
      </header>

      {mode === 'edit' ? (
        <div className="mt-3">
          <Composer
            blogId={comment.blogId}
            commentId={comment.commentId}
            initial={comment.content}
            label="Edit your response"
            submitLabel="Save"
            doneLabel="Saved"
            focusOnOpen
            onCancel={() => setMode('view')}
            onDone={() => setMode('view')}
          />
        </div>
      ) : (
        <SafeHtml html={comment.content} className="mt-2 font-serif text-base whitespace-pre-line [&>p+p]:mt-3" />
      )}

      {mode === 'confirm-delete' ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>Delete this response?</span>
          <Button
            variant="danger"
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate({ kind: 'delete', commentId: comment.commentId })}
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
  blogId: number
  /** Set to reply to that comment. */
  parentCommentId?: number
  /** Set to edit that comment. */
  commentId?: number
  initial?: string
  label: string
  submitLabel: string
  doneLabel: string
  /** Move focus into the field when it appears (it was opened by Reply or Edit). */
  focusOnOpen?: boolean
  onCancel?: () => void
  onDone?: () => void
}

function Composer({ blogId, parentCommentId, commentId, initial = '', label, submitLabel, doneLabel, focusOnOpen, onCancel, onDone }: ComposerProps) {
  const fieldId = useId()
  const write = useCommentWrite()
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
      commentId != null
        ? { kind: 'update' as const, request: { commentId, blogId, content } }
        : parentCommentId != null
          ? { kind: 'reply' as const, request: { blogId, parentCommentId, content } }
          : { kind: 'create' as const, request: { blogId, content } }
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
        placeholder="What are your thoughts?"
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
