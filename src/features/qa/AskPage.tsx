import { CheckCircle, PaperPlaneTilt, Sparkle } from '@phosphor-icons/react'
import { useT } from '../../lib/i18n'
import { cn } from 'cn'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useCategories } from '../../api/categories'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { splitAskDraft } from '../../lib/askDraft'
import { htmlToText, textToHtml } from '../../lib/html'
import { MAX_ADVISOR_QUESTION } from '../../api/ai'
import { useUserProfile } from '../../api/users'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { TagInput } from '../topics/TagInput'
import { PhotoPicker } from './PhotoPicker'
import { QuestionEditor } from './QuestionEditor'
import { SimilarQuestions } from './SimilarQuestions'
import { TopicPicker } from './TopicPicker'
import { AskingWell } from './QuestionsPage'

/** `/questions/ask`, and `/questions/:questionId/edit` for the asker. */
export function AskPage() {
  const { questionId } = useParams()
  return questionId ? <EditQuestion questionId={Number(questionId)} /> : <QuestionForm />
}

function EditQuestion({ questionId }: { questionId: number }) {
  const t = useT()
  const { user } = useSession()
  const question = useQuestion(questionId)
  if (question.isPending) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Spinner label={t('Loading question')} />
      </div>
    )
  }
  if (question.isError && !(question.error instanceof ApiError && question.error.isNotFound)) {
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-muted-foreground sm:px-6">
        {errorMessage(question.error)}
      </p>
    )
  }
  // Someone else's question is "not found" here, as the backend would refuse the edit anyway.
  if (question.isError || question.data.userId !== user?.id) return <NotFoundPage />
  return <QuestionForm question={question.data} />
}

function QuestionForm({ question }: { question?: Question }) {
  const t = useT()
  const navigate = useNavigate()
  const write = useQuestionWrite()
  const categories = useCategories()
  const [categoryId, setCategoryId] = useState<number | undefined>(question?.category?.id)
  const [tags, setTags] = useState<string[]>(question?.tags ?? [])
  const [imageUrls, setImageUrls] = useState<string[]>(question?.imageUrls ?? [])
  // A new question can arrive typed already, from Discover's ask box (`?q=`), split into a title and details.
  const [params] = useSearchParams()
  const [draft] = useState(() => (question ? null : splitAskDraft(params.get('q') ?? '')))
  const [title, setTitle] = useState(question?.title ?? draft?.title ?? '')
  // Older questions were saved as plain text; they open as paragraphs.
  const [details, setDetails] = useState(() => textToHtml(question ? question.content : draft?.details))
  const [errors, setErrors] = useState<{ title?: string; details?: string; topic?: string }>({})
  // Where the asker is: local answers depend on it. A new question starts from the profile's location; an edit from
  // what the question had. `null` until the asker types, so a late profile still fills it.
  const { user } = useSession()
  const profileLocation = useUserProfile(question ? 0 : (user?.id ?? 0)).data?.location ?? ''
  const [typedPlace, setPlace] = useState<string | null>(question ? (question.agri?.region ?? '') : null)
  const place = typedPlace ?? profileLocation
  // One Ask, two answers: in public (the AI first, then people, and an expert checks the AI) or privately to the AI
  // advisor (only the AI, not checked). An edit is always the public question it was.
  const [audience, setAudience] = useState<'public' | 'private'>('public')
  const isPrivate = !question && audience === 'private'

  const form = useRef<HTMLFormElement>(null)
  // Ctrl/⌘+Enter posts from anywhere in the form, as answers do; never while a Bangla input method composes.
  useEffect(() => {
    const element = form.current
    if (!element) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
        event.preventDefault()
        element.requestSubmit()
      }
    }
    element.addEventListener('keydown', onKeyDown)
    return () => element.removeEventListener('keydown', onKeyDown)
  }, [])

  // What still stands between the asker and Post, in their words. The advisor needs only the question.
  const missing = (isPrivate ? [!title.trim() && !htmlToText(details) && t('your question')] : [!title.trim() && t('a title'), !htmlToText(details) && t('details'), categoryId == null && t('a topic')]).filter(
    (item): item is string => Boolean(item),
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (isPrivate) {
      const text = [title.trim(), htmlToText(details).trim()].filter(Boolean).join('\n\n')
      if (!text) {
        setErrors({ title: t('Write your question in a line.') })
        return
      }
      // The advisor opens with the question in its box; nothing is posted.
      navigate(`/advisor?q=${encodeURIComponent(text.slice(0, MAX_ADVISOR_QUESTION))}`)
      return
    }
    const found = {
      title: title.trim() ? undefined : t('Write your question in a line.'),
      details: htmlToText(details) ? undefined : t('Add what you have seen and tried.'),
      topic: categoryId == null ? t('Choose a topic.') : undefined,
    }
    setErrors(found)
    if (found.title || found.details || categoryId == null) return
    // Only the place is asked; an edit keeps the question's other farming details by sending them back as they were.
    const region = place.trim()
    const agri = question
      ? region !== (question.agri?.region ?? '')
        ? { ...question.agri, region: region || undefined }
        : undefined
      : region
        ? { region }
        : undefined
    const fields = { title: title.trim(), content: details, categoryId, ...(agri ? { agri } : {}) }
    // On an edit, tags and photos left as they were are omitted: the backend keeps the old ones.
    const same = (a: string[], b: string[] = []) => a.length === b.length && a.every((value, i) => value === b[i])
    const extras = question
      ? { tags: same(tags, question.tags) ? undefined : tags, imageUrls: same(imageUrls, question.imageUrls) ? undefined : imageUrls }
      : { tags: tags.length ? tags : undefined, imageUrls: imageUrls.length ? imageUrls : undefined }
    const request = { ...fields, ...extras }
    write.mutate(question ? { kind: 'update', request: { questionId: question.questionId ?? 0, ...request } } : { kind: 'create', request }, {
      // A new question gets an AI answer in the background; the question page waits for it (askedAt).
      onSuccess: (saved) => navigate(`/questions/${saved?.questionId ?? question?.questionId}`, { replace: true, state: question ? undefined : { askedAt: Date.now() } }),
    })
  }

  return (
    <section className="mx-auto max-w-(--container-page) px-4 pt-6 pb-8 sm:px-8 sm:pt-10 sm:pb-20">
      <title>{question ? t('Edit question – AgroTrends') : t('Ask a question – AgroTrends')}</title>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <div className="max-w-(--container-feed) min-w-0">
          <h1 className="text-xl sm:text-2xl">{question ? t('Edit your question') : t('Ask a question')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{t('Say what you are working with, where, and what you have already tried. Specific questions get useful answers.')}</p>
          <form
            ref={form}
            onSubmit={submit}
            noValidate
            className="mt-8 flex flex-col gap-5"
          >
            {!question && <AudienceChoice value={audience} onChange={setAudience} />}
            <QuestionEditor
              title={title}
              html={details}
              titleError={errors.title}
              detailsError={errors.details}
              onTitleChange={setTitle}
              onHtmlChange={setDetails}
            />
            {!isPrivate && <PhotoPicker urls={imageUrls} onChange={setImageUrls} />}
            {!question && <SimilarQuestions title={title} />}
            <div hidden={isPrivate} className="flex flex-col gap-7 border-t border-border pt-7">
              <TopicPicker categories={categories.data ?? []} loading={categories.isPending} value={categoryId} error={errors.topic} onChange={setCategoryId} />
              <TextField
                label={t('Where are you? (optional)')}
                hint={t('A district or upazila. Answers that fit your soil and weather depend on it.')}
                placeholder={t('Mymensingh')}
                autoComplete="address-level2"
                maxLength={60}
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                className="max-w-sm"
              />
              <TagInput popular tags={tags} onChange={setTags} />
            </div>
            {write.isError && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(write.error)}
              </p>
            )}
            {/* The one primary action stays in reach however long the details get. Asking is a task page (AppLayout):
                no tab bar under it on phones, so the bar sits on the screen's edge, clear of the home indicator. */}
            <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:mx-0 sm:px-0">
              <p className="mr-auto hidden min-w-0 text-sm text-muted-foreground sm:block" aria-live="polite">
                {missing.length > 0 ? (
                  t('Still needed: {list}', { list: missing.join(', ') })
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <CheckCircle size={16} weight="fill" className="text-primary" aria-hidden="true" />
                    {question ? t('Ready to save') : isPrivate ? t('Ready to ask') : t('Ready to post')}
                    <kbd className="ml-1 rounded-md border border-border-strong px-1.5 font-sans text-xs text-muted-foreground">{t('Ctrl + Enter')}</kbd>
                  </span>
                )}
              </p>
              <Button variant="quiet" className="ml-auto sm:ml-0" onClick={() => navigate(-1)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={write.isPending} className="min-w-36 flex-1 sm:flex-none">
                {isPrivate ? <Sparkle size={18} weight="fill" aria-hidden="true" /> : <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />}
                {question ? t('Save question') : isPrivate ? t('Ask the AI privately') : t('Post question')}
              </Button>
            </div>
          </form>
        </div>
        <aside className="hidden pt-2 lg:block">
          <div className="sticky top-24 rounded-xl bg-surface p-5">
            <AskingWell className="" />
          </div>
        </aside>
      </div>
    </section>
  )
}

/** Who answers, chosen before writing: two radio cards saying what each way means, so nothing private goes public. */
function AudienceChoice({ value, onChange }: { value: 'public' | 'private'; onChange: (value: 'public' | 'private') => void }) {
  const t = useT()
  const options = [
    { value: 'public' as const, title: t('Everyone, in public'), text: t('The AI answers in seconds, then farmers and agronomists. A verified expert checks the AI answer.') },
    { value: 'private' as const, title: t('Only the AI, privately'), text: t('Only you see it. An answer in seconds with sources; no expert checks it.') },
  ]
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold">{t('Who should answer?')}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              'relative flex items-start gap-3 rounded-xl border p-4 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
              value === option.value ? 'border-primary bg-secondary' : 'border-border hover:border-border-strong',
            )}
          >
            <input
              id={`audience-${option.value}`}
              type="radio"
              name="audience"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-describedby={`audience-${option.value}-text`}
              className="mt-1 size-4 shrink-0 accent-(--color-primary) focus-visible:outline-none"
            />
            <div>
              {/* The label covers the card, so the whole card picks the option. */}
              <label htmlFor={`audience-${option.value}`} className="block cursor-pointer text-sm font-semibold after:absolute after:inset-0 after:rounded-xl">
                {option.title}
              </label>
              <p id={`audience-${option.value}-text`} className="mt-0.5 text-sm text-muted-foreground">
                {option.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
