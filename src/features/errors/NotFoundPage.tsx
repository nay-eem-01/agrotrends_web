import { ButtonLink } from '../../ui/Button'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl">Page not found</h1>
      <p className="mt-3 text-ink-muted">The link may be old, or the story may have been unpublished.</p>
      <ButtonLink to="/" variant="secondary" className="mt-8">
        Go to the home page
      </ButtonLink>
    </section>
  )
}
