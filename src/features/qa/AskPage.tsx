import { CaretDown } from '@phosphor-icons/react'
import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useCategories } from '../../api/categories'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { htmlToText } from '../../lib/html'
import { Button } from '../../ui/Button'
import { SearchSelect } from '../../ui/SearchSelect'
import { Spinner } from '../../ui/Spinner'
import { TextArea } from '../../ui/TextArea'
import { TextField } from '../../ui/TextField'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { FarmingFields, toAgri, type Farming } from '../farming/FarmingFields'
import { TagInput } from '../topics/TagInput'
import { PhotoPicker } from './PhotoPicker'
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
  // Older questions were saved as HTML; they are edited as plain text.
  const [details, setDetails] = useState(() => htmlToText(question?.content))
  const [farming, setFarming] = useState<Farming>({
    crop: question?.agri?.crop ?? '',
    season: question?.agri?.season,
    region: question?.agri?.region ?? '',
    soil: question?.agri?.soil,
  })
  const [errors, setErrors] = useState<{ title?: string; details?: string; topic?: string }>({})
  // Read once: the section starts open when the question already has farming details, then the reader decides.
  const [farmingOpen] = useState(() => Object.values(toAgri(farming)).some(Boolean))

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      title: title.trim() ? undefined : t('Write your question in a line.'),
      details: details.trim() ? undefined : t('Add what you have seen and tried.'),
      topic: categoryId == null ? t('Choose a topic.') : undefined,
    }
    setErrors(found)
    if (found.title || found.details || categoryId == null) return
    const fields = { title: title.trim(), content: details.trim(), categoryId, agri: toAgri(farming) }
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
          <h1 className="text-2xl sm:text-[2rem]">{question ? t('Edit your question') : t('Ask a question')}</h1>
          <p className="mt-2 text-muted-foreground">{t('Say what you grow, where, and what you have already tried. Specific questions get useful answers.')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('Every field is needed unless it says optional.')}</p>
          <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-6">
            <TextField
              label={t('Your question')}
              placeholder={t('Why are my boro seedlings turning yellow?')}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />
            <TextArea
              label={t('Details')}
              rows={7}
              placeholder={t('Variety, age of the crop, weather, what you applied and when…')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              error={errors.details}
            />
            <SearchSelect
              label={t('Topic')}
              value={categoryId == null ? '' : String(categoryId)}
              error={errors.topic}
              disabled={categories.isPending}
              onChange={(value) => setCategoryId(value ? Number(value) : undefined)}
              options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.categoryName ?? '' }))}
              placeholder={categories.isPending ? t('Loading…') : t('Choose a topic')}
            />
            <TagInput tags={tags} onChange={setTags} />
            <PhotoPicker urls={imageUrls} onChange={setImageUrls} />
            {/* Optional, so folded away. */}
            <details open={farmingOpen || undefined} className="group rounded-xl border border-border">
              <summary className="flex h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 font-medium transition-colors duration-150 hover:bg-surface [&::-webkit-details-marker]:hidden">
                <span>
                  {t('Farming details')} <span className="font-normal text-muted-foreground">{t('(optional)')}</span>
                </span>
                <CaretDown size={18} aria-hidden="true" className="text-muted-foreground transition-transform duration-200 ease-(--ease-out) group-open:rotate-180" />
              </summary>
              <div className="border-t border-border p-4">
                <FarmingFields value={farming} onChange={(changes) => setFarming((f) => ({ ...f, ...changes }))} hideLegend />
              </div>
            </details>
            {write.isError && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(write.error)}
              </p>
            )}
            <div className="flex gap-3 border-t border-border pt-6">
              <Button type="submit" loading={write.isPending}>
                {question ? t('Save question') : t('Post question')}
              </Button>
              <Button variant="quiet" onClick={() => navigate(-1)}>
                {t('Cancel')}
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
