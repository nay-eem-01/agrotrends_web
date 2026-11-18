import {
  EnvelopeSimple,
  FacebookLogo,
  LinkedinLogo,
  LinkSimple,
  MessengerLogo,
  ShareNetwork,
  TelegramLogo,
  WhatsappLogo,
  XLogo,
  type Icon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useT } from '../../lib/i18n'
import { shareLinks, shareUrl, type ShareTarget } from '../../lib/share'
import { buttonClass } from '../../ui/Button'

const ICONS: Record<ShareTarget, Icon> = {
  facebook: FacebookLogo,
  messenger: MessengerLogo,
  whatsapp: WhatsappLogo,
  x: XLogo,
  linkedin: LinkedinLogo,
  telegram: TelegramLogo,
  email: EnvelopeSimple,
}

/** A phone or tablet: the share sheet there lists the reader's own apps, and Messenger's app can take a link. */
function isTouch() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
}

interface ShareButtonProps {
  /** The app path being shared, e.g. `/questions/5`. */
  path: string
  /** What the post is called; services that take text put it before the link. */
  title: string
  variant?: 'secondary' | 'quiet'
  className?: string
}

/**
 * Share a question, story or profile. On a phone with a share sheet it opens that sheet, which lists every app the
 * reader has (Facebook, Messenger, WhatsApp, Instagram, IMO...). Everywhere else, and in in-app browsers without
 * one, it opens a menu: Copy link, then each service's own share page in a new tab.
 */
export function ShareButton({ path, title, variant = 'quiet', className }: ShareButtonProps) {
  const t = useT()
  const url = shareUrl(path)
  const touch = isTouch()
  const label = (
    <>
      <ShareNetwork size={18} aria-hidden="true" />
      {t('Share')}
    </>
  )

  function copy() {
    if (!navigator.clipboard) return void toast.error(t("Couldn't copy the link. Copy it from the address bar."))
    navigator.clipboard.writeText(url).then(
      () => toast.success(t('Link copied')),
      () => toast.error(t("Couldn't copy the link. Copy it from the address bar.")),
    )
  }

  if (touch && typeof navigator.share === 'function') {
    return (
      <button
        type="button"
        className={buttonClass(variant, 'sm', className)}
        onClick={() =>
          navigator.share({ title, text: title, url }).catch((error: unknown) => {
            // Closing the sheet is a choice, not a failure; anything else falls back to copying.
            if ((error as { name?: string } | null)?.name !== 'AbortError') copy()
          })
        }
      >
        {label}
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonClass(variant, 'sm', className)}>{label}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem className="min-h-11" onClick={copy}>
            <LinkSimple size={18} aria-hidden="true" />
            {t('Copy link')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {shareLinks(url, title, { touch }).map(({ target, label: name, href }) => {
            const Glyph = ICONS[target]
            // Apps (mailto:, fb-messenger:) open in place; the web services in a new tab, so the reader stays here.
            const web = href.startsWith('https:')
            const shown = target === 'email' ? t('E-mail') : name
            return (
              <DropdownMenuItem
                key={target}
                className="min-h-11"
                render={<a href={href} aria-label={shown} target={web ? '_blank' : undefined} rel={web ? 'noopener noreferrer' : undefined} />}
              >
                <Glyph size={18} aria-hidden="true" />
                {shown}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
