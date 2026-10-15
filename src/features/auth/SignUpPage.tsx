import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignUp, type SignUpRequest } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { isEmail, passwordProblem, safeNext } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
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

export function validateSignUp(form: Form): Errors {
  const errors: Errors = {}
  if (!form.name.trim()) errors.name = 'Enter your name.'
  if (!isEmail(form.email)) errors.email = 'Enter a valid e-mail address.'
  if (!/^\+\d{1,4}$/.test(form.countryCode.trim())) errors.countryCode = 'Like +880.'
  if (!/^\d{6,14}$/.test(form.mobileNumber.trim())) errors.mobileNumber = 'Enter the number without the country code.'
  const password = passwordProblem(form.password)
  if (password) errors.password = password
  return errors
}

/** Everyone gets the same account; profile details are an optional step after signing up. */
export function toSignUpRequest(form: Form): SignUpRequest {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    countryCode: form.countryCode.trim(),
    mobileNumber: form.mobileNumber.trim(),
    password: form.password,
  }
}

export function SignUpPage() {
  const t = useT()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const session = useSession()
  const signUp = useSignUp()
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})

  if (session.status === 'signed-in') return <Navigate to={next} replace />

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = validateSignUp(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    signUp.mutate(toSignUpRequest(form), {
      onSuccess: (tokens) => {
        session.signedIn(tokens)
        navigate(next, { replace: true })
      },
    })
  }

  const signInLink = next === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`

  return (
    <AuthPage title={t('Create your account')} intro={t('Join farmers, agronomists and students sharing what works in the field.')}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label={t('Full name')} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
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
      <p className="mt-8 text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to={signInLink} className="font-medium text-paddy underline-offset-4 hover:underline">
          {t('Sign in')}
        </Link>
      </p>
    </AuthPage>
  )
}
