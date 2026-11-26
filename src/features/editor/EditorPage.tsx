import { Check, Circle, EyeSlash } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCategories } from '../../api/categories'
import { topicSelectionError } from '../topics/TopicCatalogStatus'
import { useBlogById, useBlogWrite } from '../../api/blogs'
import { ApiError, errorMessage } from '../../api/errors'
import type { BlogResponse } from '../../api/types'
import { clearLocalDraft, isBlank, loadLocalDraft, saveLocalDraft, type LocalDraft } from '../../lib/draft'
import { Button, ButtonLink } from '../../ui/Button'
import { FormError, useFormValidation } from '../../ui/FormValidation'
import { formatNumber, useT } from '../../lib/i18n'
import { EditorSkeleton } from '../../ui/LoadingSkeleton'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { StoryEditor } from './StoryEditor'
import { StorySettings, type StoryDetails } from './StorySettings'

const AUTOSAVE_DELAY = 1200

const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim() !== '' || /<img/i.test(html)

function detailsOf(story?: BlogResponse): StoryDetails {
  return {
    subtitle: story?.subtitle ?? '',
    aiCitable: story?.aiCitable ?? true,
    categoryId: story?.category?.id,
    categoryName: story?.category?.categoryName,
    tags: story?.tags ?? [],
  }
}

/** Omitting agri preserves metadata on existing stories. An empty subtitle clears it. */
function detailFields(details: StoryDetails) {
  return {
    subtitle: details.subtitle.trim(),
    aiCitable: details.aiCitable,
    categoryId: details.categoryId ?? 0,
    tags: details.tags,
  }
}

/** `/write` starts a story; `/write/:blogId` edits one of yours. Any signed-in account (RequireAuth handles visitors). */
export function EditorPage() {
  const { blogId } = useParams()
  return blogId ? <EditStory key={blogId} blogId={Number(blogId)} /> : <NewStory />
}

function Page({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-[68rem] px-4 pb-24 sm:px-8">{children}</section>
}

const wordCount = (html: string) => html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length

/** A checklist and reading time calculated from the current story. */
export function BeforePublish({
  title,
  html,
  cover,
  hasTopic,
}: {
  title: string
  html: string
  cover: string
  hasTopic?: boolean
}) {
  const t = useT()
  const words = wordCount(html)
  const items = [
    { label: 'A title', done: title.trim() !== '' },
    { label: 'Some text', done: hasText(html) },
    ...(hasTopic !== undefined ? [{ label: 'A topic', done: hasTopic }] : []),
    { label: 'A cover image (optional)', done: cover !== '' },
  ]
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-5 text-sm">
      <div className="flex flex-col gap-2.5">
        <h2 className="font-sans text-sm font-semibold">{t("Before you publish")}</h2>
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={t(item.label)} className={item.done ? 'flex items-center gap-2' : 'flex items-center gap-2 text-muted-foreground'}>
              {item.done ? <Check size={16} weight="bold" className="text-primary" aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
              <span>
                {t(item.label)}
                <span className="sr-only">{item.done ? ', done' : ', not yet'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-border pt-4 text-muted-foreground tabular-nums">
        {words === 0 ? t('No words yet') : `${t(words === 1 ? '{n} word' : '{n} words', { n: formatNumber(words) })} · ${t('about {n} min read', { n: formatNumber(Math.max(1, Math.round(words / 200))) })}`}
      </p>
    </div>
  )
}

function StatusBar({ status, children, heading }: { status: ReactNode; children?: ReactNode; heading: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h1 className="sr-only">{heading}</h1>
      <output aria-live="polite" className="min-w-0 flex-1 basis-28 text-sm text-muted-foreground [overflow-wrap:anywhere]">
        {status}
      </output>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  )
}

function useStorySettings(story?: BlogResponse, restored?: StoryDetails) {
  const [details, setDetails] = useState(() => restored ?? detailsOf(story))
  const t = useT()
  const categories = useCategories()
  const { errors, setErrors, reportErrors, fieldId, summary } = useFormValidation<'title' | 'body' | 'topic'>()

  const topicError = topicSelectionError(categories, details.categoryId)
  return {
    details,
    topicError,
    validate: (title: string, html: string) => reportErrors({
      title: title.trim() ? undefined : t('Add a title.'),
      body: hasText(html) ? undefined : t('Add some text or an image to your story.'),
      topic: topicError ? t(topicError) : undefined,
    }),
    clearError: (field: 'title' | 'body') => setErrors((current) => current[field] ? { ...current, [field]: undefined } : current),
    fields: {
      title: { id: fieldId('title'), error: errors.title },
      body: { id: fieldId('body'), error: errors.body },
    },
    summary,
    props: {
      details,
      categories,
      topicId: fieldId('topic'),
      topicError: errors.topic,
      onChange: (changes: Partial<StoryDetails>) => {
        if (changes.categoryId != null) setErrors((current) => ({ ...current, topic: undefined }))
        setDetails((current) => ({ ...current, ...changes }))
      },
    },
  }
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
  const t = useT()
  const [draft, setDraft] = useState<LocalDraft>(() => loadLocalDraft() ?? { title: '', html: '', cover: '', savedAt: 0 })
  const [savedAt, setSavedAt] = useState(draft.savedAt)
  const [deviceSaveNotice, setDeviceSaveNotice] = useState<string>()
  const settings = useStorySettings(undefined, draft.settings)
  const content = { title: draft.title, html: draft.html, cover: draft.cover, coverAlt: draft.coverAlt, settings: settings.details }
  const write = useBlogWrite()
  const navigate = useNavigate()
  useAutosave(JSON.stringify(content), () => setSavedAt(saveLocalDraft(content).savedAt), !write.isPending)

  function submit(status: 'PUBLISHED' | 'DRAFT') {
    if (write.isPending) return
    const deviceSave = saveLocalDraft(content)
    setSavedAt(deviceSave.savedAt)
    setDeviceSaveNotice(undefined)
    if (status === 'DRAFT' && (settings.topicError || !draft.title.trim() || !hasText(draft.html))) {
      const notice = !deviceSave.savedAt
        ? 'Could not save the draft on this device.'
        : settings.topicError
          ? 'Add a topic to sync this draft to your account.'
          : 'Add a title and body to sync this draft to your account.'
      setDeviceSaveNotice(t(notice))
      return
    }
    if (settings.validate(draft.title, draft.html)) return
    write.mutate(
      { kind: 'create', request: { ...detailFields(settings.details), title: draft.title.trim(), content: draft.html, imageUrl: draft.cover || undefined, imageAlt: draft.cover ? draft.coverAlt?.trim() : undefined, status } },
      {
        onSuccess: (story) => {
          clearLocalDraft()
          navigate(status === 'PUBLISHED' ? `/stories/${story?.slug}` : `/write/${story?.id}`, { replace: true, state: { notice: status === 'PUBLISHED' ? 'Published' : 'Draft saved' } })
        },
      },
    )
  }

  const action = write.variables?.kind === 'create' ? write.variables.request.status : undefined

  return (
    <Page>
      <title>{`${t('New story')} – AgroTrends`}</title>
      <StoryEditor
        settings={
          <>
            <StorySettings {...settings.props} draft={{ title: draft.title, content: draft.html }} />
            <BeforePublish title={draft.title} html={draft.html} cover={draft.cover ?? ''} hasTopic={settings.details.categoryId != null} />
          </>
        }
        actions={
          <>
            <StatusBar heading={t('New story')} status={savedAt && !isBlank(content) ? t('Draft saved on this device') : t('New story')}>
              <Button size="sm" variant="secondary" disabled={write.isPending} loading={write.isPending && action === 'DRAFT'} pendingLabel={t("Saving draft…")} onClick={() => submit('DRAFT')}>
                {t("Save as draft")}
              </Button>
              <Button size="sm" disabled={write.isPending} loading={write.isPending && action === 'PUBLISHED'} pendingLabel={t("Publishing…")} onClick={() => submit('PUBLISHED')}>
                {t("Publish")}
              </Button>
            </StatusBar>
            {deviceSaveNotice && <p className="text-sm text-muted-foreground">{deviceSaveNotice}</p>}
            <FormError message={write.isError ? errorMessage(write.error) : null} />
          </>
        }
        validationSummary={settings.summary}
        fields={settings.fields}
        title={draft.title}
        html={draft.html}
        cover={draft.cover ?? ''}
        coverAlt={draft.coverAlt}
        onCoverAltChange={(coverAlt) => setDraft((d) => ({ ...d, coverAlt }))}
        onTitleChange={(title) => {
          setDraft((d) => ({ ...d, title }))
          if (title.trim()) settings.clearError('title')
        }}
        onHtmlChange={(html) => {
          setDraft((d) => ({ ...d, html }))
          if (hasText(html)) settings.clearError('body')
        }}
        onCoverChange={(cover) => setDraft((d) => ({ ...d, cover, coverAlt: undefined }))}
      />
    </Page>
  )
}

function EditStory({ blogId }: { blogId: number }) {
  const t = useT()
  const { status } = useSession()
  const story = useBlogById(blogId, status === 'signed-in')

  if (!Number.isFinite(blogId)) return <NotFoundPage />
  if (story.isPending) {
    return <EditorSkeleton label={t("Loading story")} />
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
  const t = useT()
  const write = useBlogWrite()
  const [title, setTitle] = useState(story.title ?? '')
  const [html, setHtml] = useState(story.content ?? '')
  const [cover, setCover] = useState(story.imageUrl ?? '')
  const [coverAlt, setCoverAlt] = useState(story.imageAlt)
  const settings = useStorySettings(story)
  const navigate = useNavigate()
  const published = story.status === 'PUBLISHED'
  const blogId = story.id ?? 0
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [action, setAction] = useState<'save' | 'publish' | 'unpublish' | null>(null)
  const request = { blogId, title: title.trim(), content: html, imageUrl: cover || undefined, imageAlt: cover ? coverAlt?.trim() : undefined, ...detailFields(settings.details) }
  const snapshot = JSON.stringify(request)
  const [saved, setSaved] = useState(snapshot)
  const failedAutosave = useRef<string | null>(null)
  const dirty = snapshot !== saved
  const ready = title.trim() !== '' && hasText(html)
  const locked = write.error instanceof ApiError && write.error.status === 409
  const busy = action !== null || write.isPending
  const canSave = ready && !settings.topicError

  useAutosave(snapshot, (current) => {
    if (failedAutosave.current === current) return
    failedAutosave.current = null
    write.mutate({ kind: 'update', quiet: true, request }, {
      onSuccess: () => setSaved(current),
      onError: () => { failedAutosave.current = current },
    })
  }, !published && !locked && !busy && canSave && dirty)

  async function submit(next: NonNullable<typeof action>) {
    if (busy || locked) return
    if (next !== 'unpublish' && settings.validate(title, html)) return
    setAction(next)
    try {
      if (next === 'unpublish') {
        await write.mutateAsync({ kind: 'unpublish', blogId })
      } else {
        await write.mutateAsync({ kind: 'update', request })
        failedAutosave.current = null
        setSaved(snapshot)
        if (next === 'publish') {
          const live = await write.mutateAsync({ kind: 'publish', blogId })
          navigate(`/stories/${live?.slug ?? story.slug}`, { state: { notice: 'Published' } })
        }
      }
    } catch {
      // The mutation keeps the error visible in the editor so the author can retry.
    } finally {
      setAction(null)
    }
  }

  const statusText = published
    ? (dirty ? 'Unsaved changes' : 'Published')
    : busy && !action
      ? 'Saving…'
      : dirty
        ? 'Editing draft'
        : write.isSuccess
          ? 'Draft saved'
          : (notice ?? 'Draft')

  return (
    <Page>
      <title>{`${t('Editing {title}', { title: story.title ?? '' })} – AgroTrends`}</title>
      <StoryEditor
        settings={
          <>
            <StorySettings {...settings.props} draft={{ title, content: html }} />
            {!published && <BeforePublish title={title} html={html} cover={cover} hasTopic={settings.details.categoryId != null} />}
          </>
        }
        actions={
          <>
            <StatusBar heading={t('Editing {title}', { title: story.title ?? '' })} status={t(statusText)}>
              {story.slug && (
                <ButtonLink to={`/stories/${story.slug}`} variant="quiet" size="sm">
                  {t("Preview")}
                </ButtonLink>
              )}
              {published ? (
                <>
                  <Button size="sm" variant="quiet" disabled={busy || locked} loading={action === 'unpublish'} pendingLabel={t("Unpublishing…")} onClick={() => void submit('unpublish')}>
                    {t("Unpublish")}
                  </Button>
                  <Button size="sm" disabled={!dirty || busy || locked} loading={action === 'save'} pendingLabel={t("Saving changes…")} onClick={() => void submit('save')}>
                    {t("Save changes")}
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" disabled={busy || locked} loading={action === 'save'} pendingLabel={t("Saving draft…")} onClick={() => void submit('save')}>
                    {t("Save as draft")}
                  </Button>
                  <Button size="sm" disabled={busy || locked} loading={action === 'publish'} pendingLabel={t("Publishing…")} onClick={() => void submit('publish')}>
                    {t("Publish")}
                  </Button>
                </>
              )}
            </StatusBar>
            <FormError message={!locked && write.isError ? errorMessage(write.error) : null} />
            {locked && (
              <Alert variant="destructive">
                <EyeSlash aria-hidden="true" />
                <AlertTitle>{t("This story is hidden while moderators review reports about it")}</AlertTitle>
                <AlertDescription>{t("Changes can't be saved or published until they decide. Copy anything you want to keep.")}</AlertDescription>
              </Alert>
            )}
          </>
        }
        validationSummary={settings.summary}
        fields={settings.fields}
        title={title}
        html={html}
        cover={cover}
        coverAlt={coverAlt}
        onCoverAltChange={setCoverAlt}
        onCoverChange={(value) => {
          setCover(value)
          setCoverAlt('')
        }}
        onTitleChange={(value) => {
          setTitle(value)
          if (value.trim()) settings.clearError('title')
        }}
        onHtmlChange={(value) => {
          setHtml(value)
          if (hasText(value)) settings.clearError('body')
        }}
      />
    </Page>
  )
}
