import { ChatCircleText, Newspaper } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { useT } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { useSession } from '../auth/session'
import { QuestionsPage } from '../qa/QuestionsPage'

/** `/`: questions first (the product is Q&A-first); visitors get a short welcome above. */
export function HomePage() {
  return (
    <>
      <Welcome />
      <HomeTabs />
      <QuestionsPage heading={false} />
    </>
  )
}

export function Welcome() {
  const t = useT()
  const { status } = useSession()
  if (status !== 'anonymous') return null
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-(--container-page) px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
        <h1 className="max-w-3xl text-3xl sm:text-[3.25rem] sm:leading-[1.05]">{t('Farming questions, answered by people who grow.')}</h1>
        <p className="mt-5 max-w-xl font-serif text-lg text-muted-foreground">
          {t('Ask about your crop, your soil, your season. Farmers, agronomists and verified experts answer; an AI answer arrives first, and experts check it.')}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/questions/ask">{t('Ask a question')}</ButtonLink>
          <ButtonLink to="/sign-up" variant="secondary">
            {t('Join AgroTrends')}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

/** Questions | Stories, as links so each has its own URL. */
export function HomeTabs() {
  const t = useT()
  const { status } = useSession()
  const tabs = [
    { to: '/', label: t('Questions'), icon: ChatCircleText },
    { to: '/stories', label: t('Stories'), icon: Newspaper },
  ]
  return (
    <div className="mx-auto max-w-(--container-page) px-4 pt-6 sm:px-6">
      {status !== 'anonymous' && <h1 className="sr-only">{t('Home')}</h1>}
      <nav aria-label={t('Home sections')} className="flex gap-6 border-b border-border">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                '-mb-px flex h-12 items-center gap-2 border-b-2 text-base transition-colors duration-150',
                isActive ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon size={20} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
