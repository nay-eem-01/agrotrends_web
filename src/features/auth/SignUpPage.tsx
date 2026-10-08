import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignUp, type SignUpRequest } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { isEmail, passwordProblem, safeNext, splitList } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { cx } from '../../ui/cx'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
import { useSession } from './session'

type AccountType = 'reader' | 'author'

interface Form {
  name: string
  email: string
  countryCode: string
  mobileNumber: string
  password: string
  type: AccountType
  designation: string
  specialities: string
  occupation: string
  institution: string
}

type Errors = Partial<Record<keyof Form, string>>

const EMPTY: Form = {
  name: '',
  email: '',
  countryCode: '+880',
  mobileNumber: '',
  password: '',
  type: 'reader',
  designation: '',
  specialities: '',
  occupation: '',
  institution: '',
}

export function validateSignUp(form: Form): Errors {
  const errors: Errors = {}
  if (!form.name.trim()) errors.name = 'Enter your name.'
  if (!isEmail(form.email)) errors.email = 'Enter a valid e-mail address.'
  if (!/^\+\d{1,4}$/.test(form.countryCode.trim())) errors.countryCode = 'Like +880.'
  if (!/^\d{6,14}$/.test(form.mobileNumber.trim())) errors.mobileNumber = 'Enter the number without the country code.'
  const password = passwordProblem(form.password)
  if (password) errors.password = password
  if (form.type === 'author') {
    if (!form.designation.trim()) errors.designation = 'Enter your designation.'
    if (splitList(form.specialities).length === 0) errors.specialities = 'Enter at least one speciality.'
  }
  return errors
}

export function toSignUpRequest(form: Form): SignUpRequest {
  const request: SignUpRequest = {
    name: form.name.trim(),
    email: form.email.trim(),
    countryCode: form.countryCode.trim(),
    mobileNumber: form.mobileNumber.trim(),
    password: form.password,
    userType: [form.type === 'author' ? 'AUTHOR' : 'CONSUMER'],
  }
  if (form.type === 'author') {
    request.professionalInfoRequest = {
      designation: form.designation.trim(),
      specialities: splitList(form.specialities),
      occupation: form.occupation.trim() || undefined,
      institution: form.institution.trim() || undefined,
    }
  }
  return request
}

const ACCOUNT_TYPES: { value: AccountType; label: string; hint: string }[] = [
  { value: 'reader', label: 'Reader', hint: 'Read stories, ask and answer questions.' },
  { value: 'author', label: 'Author', hint: 'Also publish stories, with your professional details shown.' },
]

export function SignUpPage() {
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
    <AuthPage title="Create your account" intro="Join farmers, agronomists and students sharing what works in the field.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label="Full name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <TextField
            label="Code"
            autoComplete="tel-country-code"
            value={form.countryCode}
            onChange={(e) => set('countryCode', e.target.value)}
            error={errors.countryCode}
          />
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
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="8 to 16 characters, with a capital letter, a number and a symbol."
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium text-ink">I want to join as</legend>
          {ACCOUNT_TYPES.map((option) => (
            // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text comes from option.label
            <label
              key={option.value}
              className={cx(
                'flex cursor-pointer gap-3 rounded-lg border px-3 py-3',
                form.type === option.value ? 'border-paddy bg-field' : 'border-rule',
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={option.value}
                checked={form.type === option.value}
                onChange={() => set('type', option.value)}
                className="mt-1 size-4 accent-paddy"
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="block text-sm text-ink-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {form.type === 'author' && (
          <fieldset className="flex flex-col gap-5 border-l-2 border-field pl-4">
            <legend className="sr-only">Professional details</legend>
            <TextField
              label="Designation"
              placeholder="Agronomist, Upazila Agriculture Officer"
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              error={errors.designation}
            />
            <TextField
              label="Specialities"
              hint="Separate with commas, for example: rice, soil health."
              value={form.specialities}
              onChange={(e) => set('specialities', e.target.value)}
              error={errors.specialities}
            />
            <TextField label="Occupation (optional)" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
            <TextField label="Workplace or institution (optional)" value={form.institution} onChange={(e) => set('institution', e.target.value)} />
          </fieldset>
        )}

        <FormError message={signUp.isError ? errorMessage(signUp.error) : null} />
        <Button type="submit" loading={signUp.isPending} className="mt-1">
          Create account
        </Button>
      </form>
      <p className="mt-8 text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to={signInLink} className="font-medium text-paddy underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPage>
  )
}
