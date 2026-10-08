import type { ReactNode } from 'react'

/** The narrow column shared by the sign-in and sign-up screens. */
export function AuthPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md px-4 pt-12 pb-20 sm:pt-20">
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-2 text-ink-muted">{intro}</p>
      <div className="mt-8">{children}</div>
    </section>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  )
}
