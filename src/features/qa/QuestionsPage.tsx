import { Link, useSearchParams } from 'react-router-dom'
import { useQuestions, type Question } from '../../api/questions'
import { errorMessage } from '../../api/errors'
import { filterPath, hasAgriFilters, readAgriFilters, SEASON_LABELS, SOIL_LABELS } from '../../lib/agri'
import { storyDate } from '../../lib/dates'
import { excerpt, htmlToText } from '../../lib/html'
import { Avatar } from '../../ui/Avatar'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { AgriFilterBar } from '../feed/AgriFilterBar'
import { SeasonStrip } from '../feed/SeasonStrip'

/** `/questions`: what people are asking, filterable by season (the strip) and by crop, region and soil. */
export function QuestionsPage() {
  const [params] = useSearchParams()
  const filters = readAgriFilters(params)
  const questions = useQuestions(filters)
  const list = questions.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <>
      <title>Questions – AgroTrends</title>
      <div className="mx-auto max-w-(--container-page) px-4 pt-10 sm:px-6">
        <div className="flex max-w-(--container-feed) items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl">Questions</h1>
            <p className="mt-1 text-ink-muted">Ask the community about your crop, your soil, your season.</p>
          </div>
          <ButtonLink to="/questions/ask" size="sm">
            Ask a question
          </ButtonLink>
        </div>
      </div>
      <div className="mt-6">
        <SeasonStrip />
      </div>
      <div className="mx-auto max-w-(--container-page) px-4 pb-16 sm:px-6">
        <div className="max-w-(--container-feed)">
          <AgriFilterBar filters={filters} />
          {questions.isPending ? (
            <div className="flex justify-center py-16 text-ink-muted">
              <Spinner label="Loading questions" />
            </div>
          ) : questions.isError ? (
            <p role="alert" className="py-16 text-ink-muted">
              {errorMessage(questions.error)}
            </p>
          ) : list.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="text-xl">{hasAgriFilters(filters) ? 'No questions match these filters' : 'No questions yet'}</h2>
              <p className="mt-2 text-ink-muted">Ask the first one. Farmers and agronomists answer here.</p>
              <ButtonLink to="/questions/ask" size="sm" className="mt-6">
                Ask a question
              </ButtonLink>
            </div>
          ) : (
            <>
              <ul>
                {list.map((question) => (
                  <QuestionRow key={question.questionId} question={question} />
                ))}
              </ul>
              {questions.hasNextPage && (
                <div className="flex justify-center py-8">
                  <Button variant="secondary" size="sm" loading={questions.isFetchingNextPage} onClick={() => void questions.fetchNextPage()}>
                    Show more questions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function QuestionRow({ question }: { question: Question }) {
  const agri = question.agri ?? {}
  const chips = [
    agri.crop && { label: agri.crop, to: filterPath({ crop: agri.crop }, '/questions') },
    agri.season && { label: SEASON_LABELS[agri.season], to: filterPath({ season: agri.season }, '/questions') },
    agri.region && { label: agri.region, to: filterPath({ region: agri.region }, '/questions') },
    agri.soil && { label: SOIL_LABELS[agri.soil], to: filterPath({ soil: agri.soil }, '/questions') },
  ].filter((chip): chip is { label: string; to: string } => Boolean(chip))
  const preview = excerpt(htmlToText(question.content), 180)

  return (
    <li className="border-b border-rule py-6">
      <h2 className="text-lg leading-snug sm:text-xl">
        <Link to={`/questions/${question.questionId}`} className="hover:underline">
          {question.title}
        </Link>
      </h2>
      {preview && <p className="mt-1 line-clamp-2 text-ink-muted">{preview}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Avatar name={question.authorName ?? '?'} size={20} />
          {question.authorName} · {storyDate(question.createdAt)}
        </span>
        {chips.map((chip) => (
          <Link key={chip.to} to={chip.to} className="rounded-full bg-field px-2 py-0.5 text-ink hover:bg-rule">
            {chip.label}
          </Link>
        ))}
      </div>
    </li>
  )
}
