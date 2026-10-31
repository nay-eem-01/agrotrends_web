import { CheckCircle, PaperPlaneTilt } from '@phosphor-icons/react'
import { useT } from '../../lib/i18n'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useCategories } from '../../api/categories'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { htmlToText, textToHtml } from '../../lib/html'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { TagInput } from '../topics/TagInput'
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
  const [title, setTitle] = useState(question?.title ?? '')
  // Older questions were saved as plain text; they open as paragraphs.
  const [details, setDetails] = useState(() => textToHtml(question?.content))
  const [errors, setErrors] = useState<{ title?: string; details?: string; topic?: string }>({})

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

  // What still stands between the asker and Post, in their words.
  const missing = [!title.trim() && t('a title'), !htmlToText(details) && t('details'), categoryId == null && t('a topic')].filter(
    (item): item is string => Boolean(item),
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      title: title.trim() ? undefined : t('Write your question in a line.'),
      details: htmlToText(details) ? undefined : t('Add what you have seen and tried.'),
      topic: categoryId == null ? t('Choose a topic.') : undefined,
    }
    setErrors(found)
    if (found.title || found.details || categoryId == null) return
    // No `agri`: the form no longer asks for it, and an update without it keeps an older question's farming details.
    const fields = { title: title.trim(), content: details, categoryId }
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
    <section className="mx-auto max-w-(--container-page) px-4 pt-8 pb-20 sm:px-8 sm:pt-10">
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
            <QuestionEditor
              title={title}
              html={details}
              photos={imageUrls}
              titleError={errors.title}
              detailsError={errors.details}
              onTitleChange={setTitle}
              onHtmlChange={setDetails}
              onPhotosChange={setImageUrls}
            />
            {!question && <SimilarQuestions title={title} />}
            <div className="flex flex-col gap-7 border-t border-border pt-7">
              <TopicPicker categories={categories.data ?? []} loading={categories.isPending} value={categoryId} error={errors.topic} onChange={setCategoryId} />
              <TagInput popular tags={tags} onChange={setTags} />
            </div>
            {write.isError && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(write.error)}
              </p>
            )}
            {/* The one primary action stays in reach however long the details get; on phones it rides above the
                bottom navigation (BottomNav, 3.5rem plus the safe area). */}
            <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:px-0 md:bottom-0">
              <p className="mr-auto hidden min-w-0 text-sm text-muted-foreground sm:block" aria-live="polite">
                {missing.length > 0 ? (
                  t('Still needed: {list}', { list: missing.join(', ') })
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <CheckCircle size={16} weight="fill" className="text-primary" aria-hidden="true" />
                    {question ? t('Ready to save') : t('Ready to post')}
                    <kbd className="ml-1 rounded-md border border-border-strong px-1.5 font-sans text-xs text-muted-foreground">{t('Ctrl + Enter')}</kbd>
                  </span>
                )}
              </p>
              <Button variant="quiet" className="ml-auto sm:ml-0" onClick={() => navigate(-1)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={write.isPending} className="min-w-36">
                <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
                {question ? t('Save question') : t('Post question')}
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
