import { CheckCircle } from '@phosphor-icons/react'
import { useId, useState } from 'react'
import { cn } from 'cn'
import { useAcceptAnswer, useAnswerReplies, useAnswers, useAnswerWrite, type Answer } from '../../api/answers'
import { errorMessage } from '../../api/errors'
import { useMyVotes } from '../../api/votes'
import { storyDate } from '../../lib/dates'
import { formatNumber, useT } from '../../lib/i18n'
import { Button } from '../../ui/Button'
import { SafeHtml } from '../../ui/SafeHtml'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { Composer } from '../threads/Composer'
import { AuthorLine } from './AuthorLine'
import { VoteControl } from './VoteControl'

/** A question's answers as cards, in the backend's order, each with its replies on demand; then the answer form. */
export function Answers({ questionId, askerId }: { questionId: number; askerId?: number }) {
  const t = useT()
  const headingId = useId()
  const { status, user } = useSession()
  const requireSignIn = useRequireSignIn()
  const answers = useAnswers(questionId)
  const write = useAnswerWrite(questionId)
  const list = answers.data ?? []

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <h2 id={headingId} className="text-xl">
        {answers.data ? t(list.length === 1 ? '{n} answer' : '{n} answers', { n: formatNumber(list.length) }) : t('Answers')}
      </h2>
      {answers.isPending ? (
        <div className="py-8 text-muted-foreground">
          <Spinner label={t('Loading')} />
        </div>
      ) : answers.isError ? (
        <p role="alert" className="py-8 text-muted-foreground">
          {errorMessage(answers.error)}
        </p>
      ) : list.length === 0 ? (
        <p className="py-6 text-muted-foreground">{t('No answers yet. If you have grown this, your answer helps.')}</p>
      ) : (
        <ol className="mt-5 flex flex-col gap-4">
          {list.map((answer) => (
            <li key={answer.answerId}>
              <AnswerCard questionId={questionId} answer={answer} asker={user?.id != null && user.id === askerId} />
            </li>
          ))}
        </ol>
      )}
      <div className="mt-10">
        <div>
          {status === 'signed-in' ? (
            <Composer
              label={t('Your answer')}
              placeholder={t('What has worked for you?')}
              submitLabel={t('Post answer')}
              doneLabel={t('Answer posted')}
              rows={5}
              pending={write.isPending}
              error={write.isError ? write.error : null}
              onSubmit={(content, done) => write.mutate({ action: 'create', content }, { onSuccess: done })}
            />
          ) : (
            <Button variant="secondary" size="sm" onClick={() => requireSignIn(() => {})}>
              {t('Sign in to answer')}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function AnswerCard({ questionId, answer, asker }: { questionId: number; answer: Answer; asker: boolean }) {
  const t = useT()
  const id = answer.answerId ?? 0
  const { status, user } = useSession()
  const myVotes = useMyVotes(questionId, status === 'signed-in')
  const requireSignIn = useRequireSignIn()
  const [open, setOpen] = useState(false)
  const [replying, setReplying] = useState(false)
  const repliesId = useId()
  const replies = useAnswerReplies(id, open)
  const write = useAnswerWrite(questionId)

  return (
    <article
      id={`answer-${id}`}
      aria-label={t('Answer by {name}', { name: answer.authorName ?? '' })}
      className={cn('flex scroll-mt-24 gap-2 rounded-2xl bg-card p-4 ring-1 sm:gap-4 sm:p-5', answer.accepted ? 'ring-2 ring-mustard' : 'ring-border')}
    >
      <VoteControl target="answers" id={id} score={answer.score ?? 0} myVote={myVotes.data?.answers?.[String(id)]} own={user?.id != null && user.id === answer.userId} />
      <div className="min-w-0 flex-1">
        {answer.accepted && (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-mustard-soft px-3 py-1 text-sm font-medium">
            <CheckCircle size={16} weight="fill" className="text-mustard" aria-hidden="true" />
            {t('Accepted by the asker')}
          </p>
        )}
        <Post questionId={questionId} item={answer} />
        <div className="mt-2 -ml-3 flex flex-wrap gap-1">
          <Button
            variant="quiet"
            size="sm"
            aria-expanded={open}
            aria-controls={repliesId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t('Hide replies') : t('Show replies')}
          </Button>
          {asker && <AcceptButton questionId={questionId} answerId={id} accepted={Boolean(answer.accepted)} />}
          {!replying && (
            <Button
              variant="quiet"
              size="sm"
              onClick={() =>
                requireSignIn(() => {
                  setOpen(true)
                  setReplying(true)
                })
              }
            >
              {t('Reply')}
            </Button>
          )}
        </div>
        {open && (
          <div id={repliesId} className="mt-3 ml-2 border-l-2 border-border pl-5">
            {replies.isPending ? (
              <Spinner size={16} label={t('Loading replies')} />
            ) : replies.isError ? (
              <p role="alert" className="text-sm text-muted-foreground">
                {errorMessage(replies.error)}
              </p>
            ) : replies.data.length === 0 && !replying ? (
              <p className="text-sm text-muted-foreground">{t('No replies yet.')}</p>
            ) : (
              <ol className="flex flex-col gap-5">
                {replies.data.map((reply) => (
                  <li key={reply.answerId}>
                    <article aria-label={t('Reply by {name}', { name: reply.authorName ?? '' })}>
                      <Post questionId={questionId} item={reply} compact />
                    </article>
                  </li>
                ))}
              </ol>
            )}
            {replying && status === 'signed-in' && (
              <div className="mt-4">
                <Composer
                  label={t('Reply to {name}', { name: answer.authorName ?? '' })}
                  submitLabel={t('Reply')}
                  doneLabel={t('Reply posted')}
                  focusOnOpen
                  pending={write.isPending}
                  error={write.isError ? write.error : null}
                  onSubmit={(content, done) => write.mutate({ action: 'reply', answerId: id, content }, { onSuccess: done })}
                  onCancel={() => setReplying(false)}
                  onDone={() => setReplying(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/** The asker's accept (or take back) on an answer. One answer at a time; the backend moves the mark. */
function AcceptButton({ questionId, answerId, accepted }: { questionId: number; answerId: number; accepted: boolean }) {
  const t = useT()
  const accept = useAcceptAnswer(questionId)
  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        aria-pressed={accepted}
        loading={accept.isPending}
        onClick={() => accept.mutate({ answerId, accept: !accepted })}
        className={accepted ? 'text-foreground' : undefined}
      >
        <CheckCircle size={18} weight={accepted ? 'fill' : 'regular'} className={accepted ? 'text-mustard' : undefined} aria-hidden="true" />
        {accepted ? t('Accepted') : t('Accept answer')}
      </Button>
      {accept.isError && (
        <span role="alert" className="self-center text-sm text-destructive">
          {errorMessage(accept.error)}
        </span>
      )}
    </>
  )
}

/** The author line, the text, and the owner's edit and delete; shared by answers and replies. */
function Post({ questionId, item, compact = false }: { questionId: number; item: Answer; compact?: boolean }) {
  const t = useT()
  const { user } = useSession()
  const id = item.answerId ?? 0
  const own = user?.id != null && user.id === item.userId
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const write = useAnswerWrite(questionId)
  const edited = item.updatedAt && item.createdAt && new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 1000

  return (
    <>
      <header>
        <AuthorLine
          userId={item.userId}
          name={item.authorName}
          reputation={compact ? undefined : item.authorReputation}
          badges={item.authorBadges}
          meta={`${storyDate(item.createdAt)}${edited ? ` · ${t('edited')}` : ''}`}
          size={compact ? 'sm' : 'md'}
        />
      </header>
      {mode === 'edit' ? (
        <div className="mt-3">
          <Composer
            label={t('Edit your answer')}
            initial={item.content ?? ''}
            submitLabel={t('Save')}
            doneLabel={t('Saved')}
            focusOnOpen
            pending={write.isPending}
            error={write.isError ? write.error : null}
            onSubmit={(content, done) => write.mutate({ action: 'update', answerId: id, content }, { onSuccess: done })}
            onCancel={() => setMode('view')}
            onDone={() => setMode('view')}
          />
        </div>
      ) : (
        <SafeHtml html={item.content} className={compact ? 'mt-1.5 text-base whitespace-pre-line' : 'mt-3 font-serif text-[1.0625rem] leading-relaxed whitespace-pre-line [&>p+p]:mt-3'} />
      )}
      {own && mode === 'view' && (
        <div className="mt-1 -ml-3 flex gap-1">
          <Button variant="quiet" size="sm" onClick={() => setMode('edit')}>
            {t('Edit')}
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('confirm-delete')}>
            {t('Delete')}
          </Button>
        </div>
      )}
      {mode === 'confirm-delete' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>{t('Delete this answer?')}</span>
          <Button variant="danger" size="sm" loading={write.isPending} onClick={() => write.mutate({ action: 'delete', answerId: id })}>
            {t('Delete')}
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
            {t('Cancel')}
          </Button>
          {write.isError && (
            <span role="alert" className="text-destructive">
              {errorMessage(write.error)}
            </span>
          )}
        </div>
      )}
    </>
  )
}
