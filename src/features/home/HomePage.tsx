import { ButtonLink } from '../../ui/Button'

/** Placeholder until the feed (roadmap F2.1); shows the shell and type scale at work. */
export function HomePage() {
  return (
    <section className="mx-auto max-w-(--container-page) px-4 pt-16 pb-8 sm:px-6 sm:pt-24">
      <h1 className="max-w-3xl text-3xl sm:text-[3.5rem] sm:leading-[1.05]">Farming knowledge from people who grow it.</h1>
      <p className="mt-6 max-w-xl font-serif text-lg text-ink-muted">
        Stories from farmers and agronomists across Bangladesh, answers to the questions you have this season, and an
        advisor that shows you where its advice came from.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/sign-up">Start reading</ButtonLink>
        <ButtonLink to="/questions" variant="secondary">
          Ask a question
        </ButtonLink>
      </div>
    </section>
  )
}
