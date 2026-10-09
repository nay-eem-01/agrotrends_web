import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useQuestion, useQuestionWrite, type Question } from '../../api/questions'
import { htmlToText } from '../../lib/html'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextArea } from '../../ui/TextArea'
import { TextField } from '../../ui/TextField'
import { useSession } from '../auth/session'
import { NotFoundPage } from '../errors/NotFoundPage'
import { FarmingFields, toAgri, type Farming } from '../farming/FarmingFields'

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
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label={t('Loading question')} />
      </div>
    )
  }
  if (question.isError && !(question.error instanceof ApiError && question.error.isNotFound)) {
    return (
      <p role="alert" className="mx-auto max-w-(--container-feed) px-4 py-24 text-ink-muted sm:px-6">
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
  const [title, setTitle] = useState(question?.title ?? '')
  // Older questions were saved as HTML; they are edited as plain text.
  const [details, setDetails] = useState(() => htmlToText(question?.content))
  const [farming, setFarming] = useState<Farming>({
    crop: question?.agri?.crop ?? '',
    season: question?.agri?.season,
    region: question?.agri?.region ?? '',
    soil: question?.agri?.soil,
  })
  const [errors, setErrors] = useState<{ title?: string; details?: string }>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      title: title.trim() ? undefined : t('Write your question in a line.'),
      details: details.trim() ? undefined : t('Add what you have seen and tried.'),
    }
    setErrors(found)
    if (found.title || found.details) return
    const fields = { title: title.trim(), content: details.trim(), agri: toAgri(farming) }
    write.mutate(question ? { kind: 'update', request: { questionId: question.questionId ?? 0, ...fields } } : { kind: 'create', request: fields }, {
      onSuccess: (saved) => navigate(`/questions/${saved?.questionId ?? question?.questionId}`, { replace: true }),
    })
  }

  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{question ? t('Edit question – AgroTrends') : t('Ask a question – AgroTrends')}</title>
      <h1 className="text-2xl sm:text-3xl">{question ? t('Edit your question') : t('Ask a question')}</h1>
      <p className="mt-2 text-ink-muted">{t('Say what you grow, where, and what you have already tried. Specific questions get useful answers.')}</p>
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
        <FarmingFields value={farming} onChange={(changes) => setFarming((f) => ({ ...f, ...changes }))} />
        {write.isError && (
          <p role="alert" className="text-sm text-danger">
            {errorMessage(write.error)}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="submit" loading={write.isPending}>
            {question ? t('Save question') : t('Post question')}
          </Button>
          <Button variant="quiet" onClick={() => navigate(-1)}>
            {t('Cancel')}
          </Button>
        </div>
      </form>
    </section>
  )
}
