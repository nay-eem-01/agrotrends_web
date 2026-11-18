import { Checkbox } from '@/components/ui/checkbox'
import { errorMessage } from '../../api/errors'
import { useUpdateUserSettings, useUserSettings, type UserSettingsChange } from '../../api/settings'
import { useT } from '../../lib/i18n'
import { Spinner } from '../../ui/Spinner'
import { useSession } from '../auth/session'

/** Which e-mails you get. They go only to a confirmed address, so without one the switches say what's missing. */
export function EmailSettings() {
  const t = useT()
  const { user } = useSession()
  const settings = useUserSettings(true)
  const update = useUpdateUserSettings()
  if (settings.isPending) return <Spinner label={t('Loading')} />
  if (settings.isError) return <p className="text-sm text-muted-foreground">{errorMessage(settings.error)}</p>
  const confirmed = Boolean(user?.email && user.emailVerified)
  const options: { key: keyof Pick<UserSettingsChange, 'emailOnAnswer' | 'emailWeeklyDigest'>; label: string; hint: string }[] = [
    { key: 'emailOnAnswer', label: t('When someone answers my question'), hint: t('At most one e-mail an hour per question.') },
    { key: 'emailWeeklyDigest', label: t('A weekly digest'), hint: t('On Monday mornings: unanswered questions in the topics you follow, and for experts, answers waiting for a check.') },
  ]
  return (
    <div className="flex flex-col gap-5">
      {!confirmed && (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm">
          {user?.email ? t('Confirm {email} (above) to get these e-mails.', { email: user.email }) : t('Add an e-mail address above to get these e-mails.')}
        </p>
      )}
      {options.map(({ key, label, hint }) => {
        const id = `email-${key}`
        return (
          <div key={key} className="flex items-start gap-3">
            <Checkbox
              id={id}
              checked={settings.data[key] !== false}
              onCheckedChange={(checked) => update.mutate({ [key]: checked === true })}
              aria-describedby={`${id}-hint`}
              className="mt-0.5"
            />
            <div>
              <label htmlFor={id} className="text-sm font-medium">
                {label}
              </label>
              <p id={`${id}-hint`} className="text-sm text-muted-foreground">
                {hint}
              </p>
            </div>
          </div>
        )
      })}
      {update.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(update.error)}
        </p>
      )}
    </div>
  )
}
