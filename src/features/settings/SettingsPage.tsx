import { useState, type FormEvent, type ReactNode } from 'react'
import { useChangePassword, useUpdateAccount } from '../../api/account'
import { errorMessage } from '../../api/errors'
import { isEmail, passwordProblem, splitMobile } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'
import { useSession } from '../auth/session'

export const EMAIL_CHANGED_NOTICE = 'E-mail changed. Sign in with your new address.'
export const PASSWORD_CHANGED_NOTICE = 'Password changed. Sign in with your new password.'

export function SettingsPage() {
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-12 pb-20 sm:px-6">
      <h1 className="text-2xl">Settings</h1>
      <Section title="Account" intro="Your name is shown on your stories, questions and answers.">
        <AccountForm />
      </Section>
      <Section title="Password" intro="Changing it signs you out on every device.">
        <PasswordForm />
      </Section>
    </section>
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

function AccountForm() {
  const { user, updateUser } = useSession()
  const update = useUpdateAccount()
  const signInAgain = useSignInAgain()
  const [form, setForm] = useState(() => ({ name: user?.name ?? '', email: user?.email ?? '', ...splitMobile(user?.mobileNumber) }))
  const [errors, setErrors] = useState<AccountErrors>({})

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    update.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: AccountErrors = {}
    if (!form.name.trim()) found.name = 'Enter your name.'
    if (!isEmail(form.email)) found.email = 'Enter a valid e-mail address.'
    if (!/^\+\d{1,4}$/.test(form.countryCode.trim())) found.countryCode = 'Like +880.'
    if (!/^\d{6,14}$/.test(form.mobileNumber.trim())) found.mobileNumber = 'Enter the number without the country code.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const request = {
      name: form.name.trim(),
      email: form.email.trim(),
      countryCode: form.countryCode.trim(),
      mobileNumber: form.mobileNumber.trim(),
    }
    const emailChanged = request.email.toLowerCase() !== (user?.email ?? '').toLowerCase()
    update.mutate(request, {
      onSuccess: () => {
        if (emailChanged) {
          signInAgain(EMAIL_CHANGED_NOTICE)
          return
        }
        updateUser({ name: request.name, email: request.email, mobileNumber: request.countryCode + request.mobileNumber })
      },
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <TextField label="Full name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        hint="You sign in with this. Changing it signs you out."
        value={form.email}
        onChange={(e) => set('email', e.target.value)}
        error={errors.email}
      />
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <TextField label="Code" autoComplete="tel-country-code" value={form.countryCode} onChange={(e) => set('countryCode', e.target.value)} error={errors.countryCode} />
        <TextField
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={form.mobileNumber}
          onChange={(e) => set('mobileNumber', e.target.value)}
          error={errors.mobileNumber}
        />
      </div>
      <FormError message={update.isError ? errorMessage(update.error) : null} />
      <div className="flex items-center gap-4">
        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
        {update.isSuccess && <output className="text-sm text-paddy">Changes saved</output>}
      </div>
    </form>
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
