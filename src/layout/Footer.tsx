import { useQueryClient } from '@tanstack/react-query'
import { FacebookLogo, InstagramLogo, type Icon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { Link } from 'react-router-dom'
import { setLang, useLang, useT } from '../lib/i18n'
import { CONTACT_EMAIL, SOCIAL } from '../lib/site'
import { setTheme, useTheme } from '../lib/theme'
import { useUpdateUserSettings } from '../api/settings'
import { useSession } from '../features/auth/session'
import { Logo } from './Logo'

const YEAR = new Date().getFullYear()
const ICONS: Record<string, Icon> = { Facebook: FacebookLogo, Instagram: InstagramLogo }

/**
 * Full width under the page and the sidebar, on a tinted band: the sidebar's edge runs down to its top rule. The brand
 * line sits on the left and the three link groups together on the right; the copyright and the switches below.
 */
export function Footer({ className }: { className?: string }) {
  const t = useT()
  const social = SOCIAL.filter((link): link is { label: string; href: string } => link.href != null)
  const groups: { title: string; links: { label: string; to?: string; href?: string }[] }[] = [
    {
      title: t('Explore'),
      links: [
        { label: t('Questions'), to: '/questions' },
        { label: t('Stories'), to: '/stories' },
        { label: t('AI advisor'), to: '/advisor' },
        { label: t('Topics'), to: '/topics' },
      ],
    },
    {
      title: 'AgroTrends',
      links: [
        { label: t('About us'), to: '/about' },
        { label: t('Write a story'), to: '/write' },
        { label: t('Become a verified expert'), to: '/experts/apply' },
        { label: t('Contact us'), href: `mailto:${CONTACT_EMAIL}` },
      ],
    },
    {
      title: t('Legal'),
      links: [
        { label: t('Privacy policy'), to: '/privacy' },
        { label: t('Terms of use'), to: '/terms' },
      ],
    },
  ]
  const link = 'rounded-sm text-muted-foreground transition-colors hover:text-foreground'

  return (
    <footer className={cn('border-t border-border bg-surface', className)}>
      <div className="mx-auto max-w-(--container-page) px-4 pt-12 pb-8 text-sm sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="max-w-xs">
            <Logo link={false} />
            <p className="mt-3 leading-relaxed text-muted-foreground">{t('Farming knowledge from farmers, agronomists and students, with an AI advisor that cites them.')}</p>
            {social.length > 0 && (
              <ul aria-label={t('AgroTrends elsewhere')} className="mt-5 flex gap-2">
                {social.map(({ label, href }) => {
                  const Glyph = ICONS[label]
                  return (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="flex size-11 items-center justify-center rounded-full bg-background text-foreground ring-1 ring-border transition-colors hover:bg-primary hover:text-primary-foreground hover:ring-primary"
                      >
                        {Glyph ? <Glyph size={20} weight="fill" aria-hidden /> : label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-16 xl:gap-x-24">
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      {item.to ? (
                        <Link to={item.to} className={link}>
                          {item.label}
                        </Link>
                      ) : (
                        <a href={item.href} className={link}>
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6 text-muted-foreground">
          <span>© {YEAR} AgroTrends</span>
          <div className="flex gap-x-5 sm:ml-auto">
            {/* 44px tall, so a thumb can hit them on a phone. */}
            <LanguageSwitch className={`${link} inline-flex min-h-11 items-center`} />
            <ThemeSwitch className={`${link} inline-flex min-h-11 items-center`} />
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Switches the interface between English and Bengali; data reloads so the backend's messages follow. */
export function LanguageSwitch({ className }: { className?: string }) {
  const lang = useLang()
  const queryClient = useQueryClient()
  const { status } = useSession()
  const save = useUpdateUserSettings()
  const next = lang === 'bn' ? 'en' : 'bn'
  return (
    <button
      type="button"
      lang={next}
      onClick={() => {
        setLang(next)
        // Signed in, e-mails follow too (B5's preferredLang).
        if (status === 'signed-in') save.mutate({ preferredLang: next })
        void queryClient.invalidateQueries()
      }}
      className={className ?? 'hover:text-ink'}
    >
      {next === 'bn' ? 'বাংলা' : 'English'}
    </button>
  )
}

/** Light or dark, whichever isn't showing; the choice is remembered on this device. */
export function ThemeSwitch({ className }: { className?: string }) {
  const t = useT()
  const theme = useTheme()
  return (
    <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={className ?? 'hover:text-ink'}>
      {theme === 'dark' ? t('Light theme') : t('Dark theme')}
    </button>
  )
}
