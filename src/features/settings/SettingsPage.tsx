import { useState, type FormEvent, type ReactNode } from 'react'
import { useChangePassword, useUpdateAccount } from '../../api/account'
import { errorMessage } from '../../api/errors'
import { CheckCircle, Circle } from '@phosphor-icons/react'
import { fetchMe } from '../../api/auth'
import { compactPhone, isEmail, joinPhone, passwordProblem, splitMobile } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'
import { ResendLink } from '../auth/confirmEmail'
import { useSession } from '../auth/session'
import { AuthorProfileForm } from './AuthorProfileForm'
import { ProfilePageForm } from './ProfilePageForm'
import { useMyApplications } from '../../api/experts'
import { ApplicationStatus } from '../experts/ExpertApplyPage'
import { ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'

export const PASSWORD_CHANGED_NOTICE = 'Password changed. Sign in with your new password.'

export function SettingsPage() {
  const { user } = useSession()
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <h1 className="text-2xl">Settings</h1>
      <Section title="Account" intro="Your name is shown on your stories, questions and answers.">
        <AccountForm />
      </Section>
      <Section title="Profile" intro="Optional. People see it next to your stories and answers, and on your profile page.">
        <AuthorProfileForm name={user?.name ?? ''} />
      </Section>
      {user?.id != null && (
        <Section title="Profile page" intro="Optional. Shown at the top of your profile.">
          <ProfilePageForm userId={user.id} />
        </Section>
      )}
      <Section title="Verified expert" intro="Experts check AI answers in their topics and carry a badge on their answers.">
        <ExpertStatus />
      </Section>
      <Section title="Password" intro="Changing it signs you out on every device.">
        <PasswordForm />
      </Section>
    </section>
  )
}

/** The latest expert application's status, or the way to apply. */
function ExpertStatus() {
  const mine = useMyApplications()
  if (mine.isPending) return <Spinner />
  const latest = mine.data?.content[0]
  return (
    <div className="flex flex-col items-start gap-4">
      {latest && <ApplicationStatus application={latest} />}
      {latest?.status !== 'PENDING' && (
        <ButtonLink to="/experts/apply" variant="secondary" size="sm">
          {latest ? 'Apply again' : 'Apply to be a verified expert'}
        </ButtonLink>
      )}
    </div>
  )
}

function Section({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-rule pt-8">
      <h2 className="text-xl">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{intro}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

/**
 * The backend revoked every session (new e-mail or password): end it here too. RequireAuth then sends the reader to
 * sign-in, with the notice, and back to settings afterwards.
 */
function useSignInAgain() {
  const { signOut } = useSession()
  return (notice: string) => void signOut({ remote: false, notice })
}

type AccountErrors = Partial<Record<'name' | 'email' | 'countryCode' | 'mobileNumber', string>>

/**
 * Name, e-mail and phone. Either contact may be added, changed or removed while one remains; a new one starts
 * unconfirmed (a new e-mail gets a link, a new phone a code). Changing them keeps the reader signed in.
 */
function AccountForm() {
  const { user, updateUser } = useSession()
  const update = useUpdateAccount()
  const [form, setForm] = useState(() => ({ name: user?.name ?? '', email: user?.email ?? '', ...splitMobile(user?.mobileNumber), ...(user?.mobileNumber ? {} : { countryCode: '+880' }) }))
  const [errors, setErrors] = useState<AccountErrors>({})
  const [sent, setSent] = useState<{ email?: string; phone?: string }>({})

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    update.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const email = form.email.trim()
    const mobile = compactPhone(form.mobileNumber)
    const found: AccountErrors = {}
    if (!form.name.trim()) found.name = 'Enter your name.'
    if (!email && !mobile) found.email = 'Keep an e-mail address, a phone number or both.'
    if (email && !isEmail(email)) found.email = 'Enter a valid e-mail address.'
    if (mobile && !/^\+\d{1,4}$/.test(form.countryCode.trim())) found.countryCode = 'Like +880.'
    if (mobile && !/^0?\d{6,14}$/.test(mobile)) found.mobileNumber = 'Enter the number without the country code.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const request = {
      name: form.name.trim(),
      email: email || undefined,
      countryCode: mobile ? form.countryCode.trim() : undefined,
      mobileNumber: mobile || undefined,
    }
    const phone = mobile ? joinPhone(form.countryCode, mobile) : undefined
    const newEmail = email && email.toLowerCase() !== (user?.email ?? '').toLowerCase() ? email : undefined
    const newPhone = phone && phone !== user?.mobileNumber ? phone : undefined
    update.mutate(request, {
      onSuccess: () => {
        setSent({ email: newEmail, phone: newPhone })
        // Reload the account for its confirmation state; fall back to what was sent.
        void fetchMe().then(updateUser, () => updateUser({ name: request.name, email: request.email, mobileNumber: phone }))
      },
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <TextField label="Full name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <div className="flex flex-col gap-2">
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          hint="You can sign in with it. Leave it empty to remove it, if you keep a phone number."
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
        />
        {user?.email && user.email === form.email.trim() && <ContactStatus confirmed={user.emailVerified} action={user.emailVerified ? null : <ResendLink email={user.email} variant="quiet" />} />}
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <TextField label="Code" autoComplete="tel-country-code" value={form.countryCode} onChange={(e) => set('countryCode', e.target.value)} error={errors.countryCode} />
          <TextField
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="1712345678"
            value={form.mobileNumber}
            onChange={(e) => set('mobileNumber', e.target.value)}
            error={errors.mobileNumber}
          />
        </div>
        {user?.mobileNumber && compactPhone(form.mobileNumber) && joinPhone(form.countryCode, form.mobileNumber) === user.mobileNumber && (
          <ContactStatus
            confirmed={user.phoneVerified}
            action={
              user.phoneVerified ? null : (
                <ButtonLink to="/verify-phone?next=%2Fsettings" variant="quiet" size="sm">
                  Enter the SMS code
                </ButtonLink>
              )
            }
          />
        )}
      </div>
      <FormError message={update.isError ? errorMessage(update.error) : null} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
        {update.isSuccess && (
          <output className="text-sm text-success">
            Changes saved.
            {sent.email && ` We sent a confirmation link to ${sent.email}.`}
            {sent.phone && ` We texted a code to ${sent.phone}.`}
          </output>
        )}
      </div>
    </form>
  )
}

/** Whether a saved contact is confirmed, with what to do while it isn't. */
function ContactStatus({ confirmed, action }: { confirmed?: boolean; action: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className={confirmed ? 'inline-flex items-center gap-1.5 font-medium text-success' : 'inline-flex items-center gap-1.5 text-muted-foreground'}>
        {confirmed ? <CheckCircle size={16} weight="fill" aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
        {confirmed ? 'Confirmed' : 'Not confirmed yet'}
      </span>
      {action}
    </p>
  )
}

type PasswordErrors = Partial<Record<'current' | 'next' | 'confirm', string>>

function PasswordForm() {
  const change = useChangePassword()
  const signInAgain = useSignInAgain()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: PasswordErrors = {}
    if (!current) found.current = 'Enter your current password.'
    const problem = passwordProblem(next)
    if (problem) found.next = problem
    else if (next === current) found.next = 'Choose a password different from the current one.'
    if (confirm !== next) found.confirm = "The passwords don't match."
    setErrors(found)
    if (Object.keys(found).length > 0) return
    change.mutate({ currentPassword: current, newPassword: next }, { onSuccess: () => signInAgain(PASSWORD_CHANGED_NOTICE) })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        error={errors.current}
      />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="8 to 16 characters, with a capital letter, a number and a symbol."
        value={next}
        onChange={(e) => setNext(e.target.value)}
        error={errors.next}
      />
      <TextField
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <FormError message={change.isError ? errorMessage(change.error) : null} />
      <Button type="submit" loading={change.isPending} className="self-start">
        Change password
      </Button>
    </form>
  )
}
