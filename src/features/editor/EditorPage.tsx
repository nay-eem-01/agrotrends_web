import { Check, Circle, EyeSlash } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { useCategories } from '../../api/categories'
import { SearchSelect } from '../../ui/SearchSelect'
import { TagInput } from '../topics/TagInput'

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

/** `/write` starts a story; `/write/:blogId` edits one of yours. Any signed-in account (RequireAuth handles visitors). */
export function EditorPage() {
  const { blogId } = useParams()
  return blogId ? <EditStory blogId={Number(blogId)} /> : <NewStory />
}

/** The writing column, with the publish checklist beside it from 1024px. */
function Page({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mx-auto grid max-w-[68rem] gap-10 px-4 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0">{children}</div>
      {aside && <aside aria-label="Story settings" className="hidden lg:block">{aside}</aside>}
    </section>
  )
}

const wordCount = (html: string) => html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length

/**
 * The panel beside the story: its topic and tags (they go with Publish), what it still needs, and how long it reads;
 * worked out from the draft itself.
 */
export function BeforePublish({
  title,
  html,
  cover,
  details,
  onDetailsChange,
}: {
  title: string
  html: string
  cover: string
  details?: StoryDetails
  onDetailsChange?: (details: StoryDetails) => void
}) {
  const words = wordCount(html)
  const items = [
    { label: 'A title', done: title.trim() !== '' },
    { label: 'Some text', done: hasText(html) },
    ...(details ? [{ label: 'A topic', done: details.categoryId != null }] : []),
    { label: 'A cover image (optional)', done: cover !== '' },
  ]
  return (
    <div className="sticky top-24 flex flex-col gap-6 pt-6 text-sm">
      {details && onDetailsChange && <TopicAndTags details={details} onChange={onDetailsChange} />}
      <div className="flex flex-col gap-2.5">
        <h2 className="font-sans text-sm font-semibold">Before you publish</h2>
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.label} className={item.done ? 'flex items-center gap-2' : 'flex items-center gap-2 text-muted-foreground'}>
              {item.done ? <Check size={16} weight="bold" className="text-primary" aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
              <span>
                {item.label}
                <span className="sr-only">{item.done ? ', done' : ', not yet'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-border pt-4 text-muted-foreground tabular-nums">
        {words === 0 ? 'No words yet' : `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'} · about ${Math.max(1, Math.round(words / 200))} min read`}
      </p>
    </div>
  )
}

function StatusBar({ status, children, heading }: { status: ReactNode; children?: ReactNode; heading: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 pt-4">
      <h1 className="sr-only">{heading}</h1>
      <output aria-live="polite" className="text-sm text-muted-foreground">
        {status}
      </output>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function TopicAndTags({ details, onChange }: { details: StoryDetails; onChange: (details: StoryDetails) => void }) {
  const categories = useCategories()
  return (
    <>
      <SearchSelect
        label="Topic"
        value={details.categoryId != null ? String(details.categoryId) : ''}
        options={(categories.data ?? []).map((category) => ({ value: String(category.id), label: category.categoryName ?? '' }))}
        placeholder="Choose a topic"
        onChange={(value) => onChange({ ...details, categoryId: value ? Number(value) : undefined })}
      />
      <TagInput tags={details.tags} onChange={(tags) => onChange({ ...details, tags })} />
    </>
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
  const [details, setDetails] = useState(() => detailsOf())
  const write = useBlogWrite()
  const navigate = useNavigate()
  const ready = draft.title.trim() !== '' && hasText(draft.html)

  function submit(details: StoryDetails, action: PublishAction) {
    setDetails(details)
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
    <Page aside={<BeforePublish title={draft.title} html={draft.html} cover={draft.cover ?? ''} details={details} onDetailsChange={setDetails} />}>
      <title>New story – AgroTrends</title>
      <StatusBar heading="New story" status={savedAt && !isBlank(content) ? 'Draft saved on this device' : 'New story'}>
        <Button size="sm" disabled={!ready} title={ready ? undefined : 'Add a title and some text first'} onClick={() => setSheetOpen(true)}>
          Publish
        </Button>
      </StatusBar>
      <PublishSheet
        open={sheetOpen}
        mode="new"
        initial={details}
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
      <div className="flex justify-center py-24 text-muted-foreground">
        <Spinner label="Loading story" />
      </div>
    )
  }
  if (story.isError) {
    if (story.error instanceof ApiError && story.error.isNotFound) return <NotFoundPage />
    return (
      <Page>
        <p role="alert" className="py-24 text-muted-foreground">
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
  const [details, setDetails] = useState(() => detailsOf(story))
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
    write.mutate({ kind: 'update', quiet, request: request(details) }, { onSuccess: () => setDirty(false) })
  }

  function submit(details: StoryDetails, action: PublishAction) {
    setDetails(details)
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
  // 409: the story is hidden while moderators review reports; nothing more is sent until they decide.
  const locked = [write.error, sheetWrite.error].some((error) => error instanceof ApiError && error.status === 409)
  useAutosave(`${title}\u0000${html}\u0000${cover}\u0000${JSON.stringify(details)}`, () => save(true), !published && !locked)

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
    <Page
      aside={
        <BeforePublish
          title={title}
          html={html}
          cover={cover}
          details={details}
          onDetailsChange={(next) => {
            setDetails(next)
            setDirty(true)
          }}
        />
      }
    >
      <title>{`Editing ${story.title} – AgroTrends`}</title>
      <StatusBar heading={`Editing ${story.title}`} status={statusText}>
        {story.slug && (
          <ButtonLink to={`/stories/${story.slug}`} variant="quiet" size="sm">
            Preview
          </ButtonLink>
        )}
        {published && (
          <Button size="sm" disabled={!dirty} loading={write.isPending} onClick={() => save(false)}>
            Save changes
          </Button>
        )}
        <Button size="sm" variant={published ? 'secondary' : 'primary'} onClick={() => setSheetOpen(true)}>
          {published ? 'Details' : 'Publish'}
        </Button>
      </StatusBar>
      {locked && (
        <Alert variant="destructive" className="mb-4">
          <EyeSlash aria-hidden="true" />
          <AlertTitle>This story is hidden while moderators review reports about it</AlertTitle>
          <AlertDescription>Changes can't be saved or published until they decide. Copy anything you want to keep.</AlertDescription>
        </Alert>
      )}
      <PublishSheet
        open={sheetOpen && !locked}
        mode={published ? 'published' : 'draft'}
        initial={details}
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
