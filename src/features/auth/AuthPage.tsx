import { ChatCircleText, SealCheck, Sparkle, WarningCircle } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from 'cn'
import { setLang, useLang, useT } from '../../lib/i18n'
import { Sprig } from '../../ui/Botanical'

/**
 * The sign-in and sign-up screens: from 1024px a leaf-wash panel saying what AgroTrends gives you, beside the form;
 * on phones the form alone. The language switch sits on the form, so a Bengali reader can change it before typing.
 */
export function AuthPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  const t = useT()
  const perks = [
    { icon: ChatCircleText, title: t('Ask anything'), text: t('Crops, fish, livestock or your studies') },
    { icon: Sparkle, title: t('An AI advisor with sources'), text: t('Answers that cite the stories shared here') },
    { icon: SealCheck, title: t('Verified experts'), text: t('Agronomists, vets and researchers answer') },
  ]
  return (
    <div className="mx-auto grid max-w-(--container-page) gap-12 px-4 pt-8 pb-20 sm:px-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <aside
        aria-label={t('Why join AgroTrends')}
        className="relative isolate hidden min-h-[36rem] flex-col gap-10 overflow-hidden rounded-2xl bg-surface p-10 lg:flex"
      >
        {/* A mustard sun and a sprig in the corner: decoration, in theme colours. */}
        <span aria-hidden="true" className="absolute -right-20 -bottom-20 -z-10 size-80 rounded-full bg-mustard-soft" />
        <Sprig className="absolute right-8 bottom-6 -z-10 h-56 text-primary/70" />
        <p className="max-w-[14ch] font-serif text-[2.25rem] leading-[1.1] font-medium">{t('Grow better with AgroTrends.')}</p>
        <ul className="flex max-w-sm flex-col gap-5">
          {perks.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-auto text-sm text-muted-foreground">{t('Free, in English and Bengali.')}</p>
      </aside>
      <section className="mx-auto flex w-full max-w-md flex-col lg:justify-center">
        <LanguageSwitch />
        <h1 className="mt-6 font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">{title}</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
        <div className="mt-8">{children}</div>
      </section>
    </div>
  )
}

/** English | বাংলা as a pill switch; each name is written in its own language. */
function LanguageSwitch() {
  const t = useT()
  const lang = useLang()
  const option = (value: 'en' | 'bn', label: string) => (
    <button
      type="button"
      lang={value}
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      className={cn(
        'h-8 rounded-full px-3 text-sm font-semibold transition-[background-color,color] duration-150',
        lang === value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
  return (
    <fieldset className="flex self-end rounded-full bg-surface p-0.5">
      <legend className="sr-only">{t('Language')}</legend>
      {option('en', 'English')}
      {option('bn', 'বাংলা')}
    </fieldset>
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
