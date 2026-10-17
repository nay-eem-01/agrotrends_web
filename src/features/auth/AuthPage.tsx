import { WarningCircle } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useT } from '../../lib/i18n'
import { Sprig } from '../../ui/Botanical'

/**
 * The sign-in and sign-up screens: the form in a narrow column; from 1024px a forest-green panel beside it with the
 * drawn sprig and what AgroTrends is for.
 */
export function AuthPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  const t = useT()
  return (
    <div className="mx-auto grid max-w-(--container-page) gap-12 px-4 pt-10 pb-20 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <section className="mx-auto w-full max-w-md lg:pt-6">
        <h1 className="font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">{title}</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
        <div className="mt-8">{children}</div>
      </section>
      <aside aria-hidden="true" className="relative hidden min-h-[32rem] overflow-hidden rounded-2xl bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-end">
        <Sprig className="absolute -top-6 right-6 h-80 text-primary-foreground/80" />
        <p className="relative font-serif text-[2.25rem] leading-[1.1] font-medium">{t('Grow better with AgroTrends.')}</p>
        <p className="relative mt-3 max-w-sm text-primary-foreground/85">{t('Questions answered by people who grow, stories from the field, and an advisor that shows its sources.')}</p>
      </aside>
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <WarningCircle aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
