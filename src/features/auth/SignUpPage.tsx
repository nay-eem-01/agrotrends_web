import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useSignUp, type SignUpRequest } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { compactPhone, isEmail, passwordProblem, safeNext } from '../../lib/auth'
import { Button } from '../../ui/Button'
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
    setErrors(found)
    if (Object.keys(found).length > 0) return
    signUp.mutate(toSignUpRequest(form), {
      onSuccess: (tokens) => session.signedIn(tokens),
    })
  }

  const signInLink = next === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`

  return (
    <AuthPage title={t('Create your account')} intro={t('Join farmers, agronomists and students sharing what works in the field.')}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label={t('Full name')} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium">{t('How we reach you')}</legend>
          <p className="text-sm text-muted-foreground">{t('An e-mail, a phone number or both. You can add the other later.')}</p>
          <TextField label={t('E-mail')} type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
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
        </fieldset>
        <TextField
          label={t('Password')}
          type="password"
          autoComplete="new-password"
          hint="8 to 16 characters, with a capital letter, a number and a symbol."
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
        />

        <FormError message={signUp.isError ? errorMessage(signUp.error) : null} />
        <Button type="submit" loading={signUp.isPending} className="mt-1">
          {t('Create account')}
        </Button>
      </form>
      <GoogleSignIn next={next} />
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={signInLink} className="font-medium text-primary underline-offset-4 hover:underline">
          {t('Sign in')}
        </Link>
      </p>
    </AuthPage>
  )
}
