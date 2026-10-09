import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useBlogById, useBlogWrite } from '../../api/blogs'
import { ApiError, errorMessage } from '../../api/errors'
import type { BlogResponse } from '../../api/types'
import { loadLocalDraft, saveLocalDraft } from '../../lib/draft'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { StoryEditor } from './StoryEditor'

const AUTOSAVE_DELAY = 1200

/** `/write` starts a story; `/write/:blogId` edits one of yours. Authors only (RequireAuth handles visitors). */
export function EditorPage() {
  const { user } = useSession()
  const { blogId } = useParams()

  if (user?.authorId == null) {
    return (
      <Page>
        <h1 className="mt-16 text-2xl">Publishing is for authors</h1>
        <p className="mt-3 max-w-prose text-ink-muted">
          Your account reads, asks and answers. To publish stories, create an author account with your professional
          details.
        </p>
        <ButtonLink to="/questions" variant="secondary" className="mt-8">
          Ask a question instead
        </ButtonLink>
      </Page>
    )
  }
  return blogId ? <EditStory blogId={Number(blogId)} /> : <NewStory />
}

function Page({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-(--container-feed) px-4 pb-24 sm:px-6">{children}</section>
}

function StatusBar({ status, children }: { status: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 pt-4">
      <output aria-live="polite" className="text-sm text-ink-muted">
        {status}
      </output>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

/** Runs `save` once the value has been still for a moment. */
function useAutosave<T>(value: T, save: (value: T) => void, enabled: boolean) {
  const first = useRef(true)
  const latest = useRef(save)
  useEffect(() => {
    latest.current = save
  })
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!enabled) return
    const timer = window.setTimeout(() => latest.current(value), AUTOSAVE_DELAY)
    return () => window.clearTimeout(timer)
  }, [value, enabled])
}

function NewStory() {
  const [draft, setDraft] = useState(() => loadLocalDraft() ?? { title: '', html: '', savedAt: 0 })
  const [savedAt, setSavedAt] = useState(draft.savedAt)
  const content = { title: draft.title, html: draft.html }
  useAutosave(JSON.stringify(content), () => setSavedAt(saveLocalDraft(content).savedAt), true)

  return (
    <Page>
      <title>New story – AgroTrends</title>
      <StatusBar status={savedAt ? 'Draft saved on this device' : 'New story'} />
      <StoryEditor
        title={draft.title}
        html={draft.html}
        onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
        onHtmlChange={(html) => setDraft((d) => ({ ...d, html }))}
      />
    </Page>
  )
}

function EditStory({ blogId }: { blogId: number }) {
  const { status } = useSession()
  const story = useBlogById(blogId, status === 'signed-in')

  if (story.isPending) {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label="Loading story" />
      </div>
    )
  }
  if (story.isError) {
    if (story.error instanceof ApiError && story.error.isNotFound) return <NotFoundPage />
    return (
      <Page>
        <p role="alert" className="py-24 text-ink-muted">
          {errorMessage(story.error)}
        </p>
      </Page>
    )
  }
  return <StoryForm story={story.data} />
}

/** Drafts save themselves; a published story changes only on Save changes, so half-done edits never go live. */
function StoryForm({ story }: { story: BlogResponse }) {
  const write = useBlogWrite()
  const [title, setTitle] = useState(story.title ?? '')
  const [html, setHtml] = useState(story.content ?? '')
  const [dirty, setDirty] = useState(false)
  const published = story.status === 'PUBLISHED'

  function save(quiet: boolean) {
    if (!title.trim() || !html.replace(/<[^>]*>/g, '').trim()) return
    write.mutate(
      {
        kind: 'update',
        quiet,
        request: {
          blogId: story.id ?? 0,
          title: title.trim(),
          content: html,
          categoryId: story.category?.id ?? 0,
          imageUrl: story.imageUrl,
          tags: story.tags,
          agri: story.agri,
        },
      },
      { onSuccess: () => setDirty(false) },
    )
  }
  useAutosave(`${title}\u0000${html}`, () => save(true), !published)

  const statusText = write.isPending
    ? 'Saving…'
    : write.isError
      ? errorMessage(write.error)
      : dirty
        ? published
          ? 'Unsaved changes'
          : 'Editing draft'
        : published
          ? 'Published'
          : write.isSuccess
            ? 'Draft saved'
            : 'Draft'

  return (
    <Page>
      <title>{`Editing ${story.title} – AgroTrends`}</title>
      <StatusBar status={statusText}>
        {published && (
          <Button size="sm" disabled={!dirty} loading={write.isPending} onClick={() => save(false)}>
            Save changes
          </Button>
        )}
      </StatusBar>
      <StoryEditor
        title={title}
        html={html}
        onTitleChange={(value) => {
          setTitle(value)
          setDirty(true)
        }}
        onHtmlChange={(value) => {
          setHtml(value)
          setDirty(true)
        }}
      />
    </Page>
  )
}
