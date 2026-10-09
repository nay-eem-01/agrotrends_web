import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useBlogById, useBlogWrite } from '../../api/blogs'
import { ApiError, errorMessage } from '../../api/errors'
import type { BlogResponse } from '../../api/types'
import { clearLocalDraft, isBlank, loadLocalDraft, saveLocalDraft } from '../../lib/draft'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { toAgri } from '../farming/FarmingFields'
import { PublishSheet, type PublishAction, type StoryDetails } from './PublishSheet'
import { StoryEditor } from './StoryEditor'

const AUTOSAVE_DELAY = 1200

const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim() !== '' || /<img/i.test(html)

function detailsOf(story?: BlogResponse): StoryDetails {
  const agri = story?.agri ?? {}
  return { categoryId: story?.category?.id, tags: story?.tags ?? [], crop: agri.crop ?? '', season: agri.season, region: agri.region ?? '', soil: agri.soil }
}

/** The request fields the publish sheet controls. Empty farming details are sent as absent. */
function detailFields(details: StoryDetails) {
  return {
    categoryId: details.categoryId ?? 0,
    tags: details.tags,
    agri: toAgri(details),
  }
}

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
  const [draft, setDraft] = useState(() => loadLocalDraft() ?? { title: '', html: '', cover: '', savedAt: 0 })
  const [savedAt, setSavedAt] = useState(draft.savedAt)
  const content = { title: draft.title, html: draft.html, cover: draft.cover }
  useAutosave(JSON.stringify(content), () => setSavedAt(saveLocalDraft(content).savedAt), true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const write = useBlogWrite()
  const navigate = useNavigate()
  const ready = draft.title.trim() !== '' && hasText(draft.html)

  function submit(details: StoryDetails, action: PublishAction) {
    const status = action === 'publish' ? 'PUBLISHED' : 'DRAFT'
    write.mutate(
      { kind: 'create', request: { ...detailFields(details), title: draft.title.trim(), content: draft.html, imageUrl: draft.cover || undefined, status } },
      {
        onSuccess: (story) => {
          clearLocalDraft()
          navigate(status === 'PUBLISHED' ? `/stories/${story?.slug}` : `/write/${story?.id}`, { replace: true, state: { notice: status === 'PUBLISHED' ? 'Published' : 'Draft saved' } })
        },
      },
    )
  }

  return (
    <Page>
      <title>New story – AgroTrends</title>
      <StatusBar status={savedAt && !isBlank(content) ? 'Draft saved on this device' : 'New story'}>
        <Button size="sm" disabled={!ready} title={ready ? undefined : 'Add a title and some text first'} onClick={() => setSheetOpen(true)}>
          Publish
        </Button>
      </StatusBar>
      <PublishSheet
        open={sheetOpen}
        mode="new"
        initial={detailsOf()}
        draft={{ title: draft.title, content: draft.html }}
        busy={write.isPending}
        error={write.isError ? errorMessage(write.error) : null}
        onSubmit={submit}
        onClose={() => setSheetOpen(false)}
      />
      <StoryEditor
        title={draft.title}
        html={draft.html}
        cover={draft.cover ?? ''}
        onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
        onHtmlChange={(html) => setDraft((d) => ({ ...d, html }))}
        onCoverChange={(cover) => setDraft((d) => ({ ...d, cover }))}
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
  const [cover, setCover] = useState(story.imageUrl ?? '')
  const [dirty, setDirty] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetWrite = useBlogWrite()
  const navigate = useNavigate()
  const published = story.status === 'PUBLISHED'
  const blogId = story.id ?? 0
  const notice = (useLocation().state as { notice?: string } | null)?.notice

  function request(details: StoryDetails) {
    return { blogId, title: title.trim(), content: html, imageUrl: cover || undefined, ...detailFields(details) }
  }

  function save(quiet: boolean) {
    if (!title.trim() || !hasText(html)) return
    write.mutate({ kind: 'update', quiet, request: request(detailsOf(story)) }, { onSuccess: () => setDirty(false) })
  }

  function submit(details: StoryDetails, action: PublishAction) {
    if (action === 'unpublish') {
      return sheetWrite.mutate({ kind: 'unpublish', blogId }, { onSuccess: () => setSheetOpen(false) })
    }
    sheetWrite.mutate(
      { kind: 'update', request: request(details) },
      {
        onSuccess: () => {
          setDirty(false)
          if (action !== 'publish') return setSheetOpen(false)
          sheetWrite.mutate({ kind: 'publish', blogId }, { onSuccess: (live) => navigate(`/stories/${live?.slug ?? story.slug}`, { state: { notice: 'Published' } }) })
        },
      },
    )
  }
  useAutosave(`${title}\u0000${html}\u0000${cover}`, () => save(true), !published)

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
            : (notice ?? 'Draft')

  return (
    <Page>
      <title>{`Editing ${story.title} – AgroTrends`}</title>
      <StatusBar status={statusText}>
        {published && (
          <Button size="sm" disabled={!dirty} loading={write.isPending} onClick={() => save(false)}>
            Save changes
          </Button>
        )}
        <Button size="sm" variant={published ? 'secondary' : 'primary'} onClick={() => setSheetOpen(true)}>
          {published ? 'Details' : 'Publish'}
        </Button>
      </StatusBar>
      <PublishSheet
        open={sheetOpen}
        mode={published ? 'published' : 'draft'}
        initial={detailsOf(story)}
        draft={{ title, content: html }}
        busy={sheetWrite.isPending}
        error={sheetWrite.isError ? errorMessage(sheetWrite.error) : null}
        onSubmit={submit}
        onClose={() => setSheetOpen(false)}
      />
      <StoryEditor
        title={title}
        html={html}
        cover={cover}
        onCoverChange={(value) => {
          setCover(value)
          setDirty(true)
        }}
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
