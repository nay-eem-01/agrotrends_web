import { cn } from 'cn'
import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useSignUp, type SignUpRequest } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { compactPhone, isEmail, passwordProblem, safeNext } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { PasswordField } from '../../ui/PasswordField'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
import { GoogleSignIn } from './GoogleSignIn'
import { useSession } from './session'

interface Form {
  name: string
  email: string
  countryCode: string
  mobileNumber: string
  password: string
}

type Errors = Partial<Record<keyof Form, string>>

const EMPTY: Form = {
  name: '',
  email: '',
  countryCode: '+880',
  mobileNumber: '',
  password: '',
}

/** An e-mail, a phone number or both; each one given must be well formed. */
export function validateSignUp(form: Form): Errors {
  const errors: Errors = {}
  const email = form.email.trim()
  const mobile = compactPhone(form.mobileNumber)
  if (!form.name.trim()) errors.name = 'Enter your name.'
  if (!email && !mobile) {
    errors.email = 'Give an e-mail address, a phone number or both.'
  } else {
    if (email && !isEmail(email)) errors.email = 'Enter a valid e-mail address.'
    if (mobile) {
      if (!/^\+\d{1,4}$/.test(form.countryCode.trim())) errors.countryCode = 'Like +880.'
      if (!/^0?\d{6,14}$/.test(mobile)) errors.mobileNumber = 'Enter the number without the country code.'
    }
  }
  const password = passwordProblem(form.password)
  if (password) errors.password = password
  return errors
}

/** Everyone gets the same account; profile details are an optional step after signing up. Blank contacts stay out. */
export function toSignUpRequest(form: Form): SignUpRequest {
  const email = form.email.trim()
  const mobile = compactPhone(form.mobileNumber)
  return {
    name: form.name.trim(),
    email: email || undefined,
    countryCode: mobile ? form.countryCode.trim() : undefined,
    mobileNumber: mobile || undefined,
    password: form.password,
  }
}

export function SignUpPage() {
  const t = useT()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const session = useSession()
  const signUp = useSignUp()
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  // Which contact shows first (phone, as most farmers sign up by phone); "both" once the other is added too.
  const [contact, setContact] = useState<'phone' | 'email' | 'both'>('phone')
  const showPhone = contact !== 'email'
  const showEmail = contact !== 'phone'

  // A new account goes to the optional profile step first (a phone-only account confirms its number before that);
  // someone already signed in goes straight on.
  if (session.status === 'signed-in') {
    if (!signUp.isSuccess) return <Navigate to={next} replace />
    const welcome = `/welcome?next=${encodeURIComponent(next)}`
    const phoneOnly = !signUp.variables?.email && Boolean(signUp.variables?.mobileNumber)
    return <Navigate to={phoneOnly ? `/verify-phone?next=${encodeURIComponent(welcome)}` : welcome} replace />
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = validateSignUp(form)
    // "Give an e-mail or a phone" belongs on the field that's showing.
    if (found.email && !form.email.trim() && !showEmail) {
      found.mobileNumber = found.email
      delete found.email
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return
    signUp.mutate(toSignUpRequest(form), {
      onSuccess: (tokens) => session.signedIn(tokens),
    })
  }

  const signInLink = next === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`

  return (
    <AuthPage title={t('Create your account')} intro={t('Join farmers, agronomists and students sharing what works in the field.')}>
      <GoogleSignIn next={next} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label={t('Full name')} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">{t('How we reach you')}</legend>
          <div className="grid grid-cols-2 rounded-full bg-surface p-1 text-sm font-semibold">
            {(['phone', 'email'] as const).map((kind) => {
              const current = contact === kind
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={contact === kind}
                  onClick={() => setContact(kind)}
                  className={cn('h-9 rounded-full transition-colors duration-150', current ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}
                >
                  {kind === 'phone' ? t('Mobile number') : t('E-mail')}
                </button>
              )
            })}
          </div>
          {showPhone && (
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <TextField
                label={t('Code')}
                autoComplete="tel-country-code"
                value={form.countryCode}
                onChange={(e) => set('countryCode', e.target.value)}
                error={errors.countryCode}
              />
              <TextField
                label={t('Mobile number')}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="1712345678"
                value={form.mobileNumber}
                onChange={(e) => set('mobileNumber', e.target.value)}
                error={errors.mobileNumber}
              />
            </div>
          )}
          {showEmail && <TextField label={t('E-mail')} type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />}
          {contact === 'both' ? (
            <p className="text-sm text-muted-foreground">{t('An e-mail, a phone number or both. You can add the other later.')}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {contact === 'phone' ? t("We'll text a code to check it.") : t("We'll e-mail a link to check it.")}{' '}
              <button type="button" onClick={() => setContact('both')} className="font-semibold text-primary underline-offset-4 hover:underline">
                {contact === 'phone' ? t('Add an e-mail too') : t('Add a phone number too')}
              </button>
            </p>
          )}
        </fieldset>
        <PasswordField
          label={t('Password')}
          autoComplete="new-password"
          meter
          hint="8 to 16 characters, with a capital letter, a number and a symbol."
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
        />

        <FormError message={signUp.isError ? errorMessage(signUp.error) : null} />
        <Button type="submit" loading={signUp.isPending} className="mt-1">
          {t('Create account')}
        </Button>
        <p className="text-xs text-muted-foreground">
          {/* The links sit where each language puts them, so the sentence is split on its placeholders. */}
          {t('By creating an account you agree to the {terms} and the {privacy}.')
            .split(/(\{\w+\})/)
            .map((part) =>
              part === '{terms}' ? (
                <Link key={part} to="/terms" className="underline underline-offset-2 hover:text-foreground">{t('Terms of use')}</Link>
              ) : part === '{privacy}' ? (
                <Link key={part} to="/privacy" className="underline underline-offset-2 hover:text-foreground">{t('Privacy policy')}</Link>
              ) : (
                part
              ),
            )}
        </p>
      </form>
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={signInLink} className="font-medium text-primary underline-offset-4 hover:underline">
          {t('Sign in')}
        </Link>
      </p>
    </AuthPage>
  )
}
