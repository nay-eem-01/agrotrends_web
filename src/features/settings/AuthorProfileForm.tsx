import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMyAuthorProfile, useUpdateMyAuthorProfile } from '../../api/authors'
import { errorMessage } from '../../api/errors'
import { useUploadImage } from '../../api/images'
import type { AuthorProfileResponse } from '../../api/types'
import { splitList } from '../../lib/auth'
import { IMAGE_TYPES, imageProblem } from '../../lib/images'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextArea } from '../../ui/TextArea'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'

/** Loads the signed-in author's profile, then shows the editor filled with it. */
export function AuthorProfileForm({ name }: { name: string }) {
  const profile = useMyAuthorProfile(true)

  if (profile.isPending) return <Spinner />
  if (profile.isError) return <FormError message={errorMessage(profile.error)} />
  return <ProfileEditor profile={profile.data} name={name} />
}

type Errors = Partial<Record<'designation' | 'specialities' | 'photo', string>>

function ProfileEditor({ profile, name }: { profile: AuthorProfileResponse; name: string }) {
  const update = useUpdateMyAuthorProfile()
  const upload = useUploadImage()
  const fileInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => ({
    designation: profile.designation ?? '',
    specialities: (profile.specialities ?? []).join(', '),
    occupation: profile.occupation ?? '',
    workPlaceOrInstitution: profile.workPlaceOrInstitution ?? '',
    bio: profile.bio ?? '',
    profileImageUrl: profile.profileImageUrl ?? '',
  }))
  const [errors, setErrors] = useState<Errors>({})

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    update.reset()
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = imageProblem(file)
    setErrors((current) => ({ ...current, photo: problem ?? undefined }))
    if (problem) return
    upload.mutate(file, { onSuccess: (url) => set('profileImageUrl', url) })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!form.designation.trim()) found.designation = 'Enter your designation.'
    if (splitList(form.specialities).length === 0) found.specialities = 'Enter at least one speciality.'
    setErrors(found)
    if (found.designation || found.specialities) return
    update.mutate({
      designation: form.designation.trim(),
      specialities: splitList(form.specialities),
      occupation: form.occupation.trim() || undefined,
      workPlaceOrInstitution: form.workPlaceOrInstitution.trim() || undefined,
      bio: form.bio.trim() || undefined,
      profileImageUrl: form.profileImageUrl || undefined,
    })
  }

  const photoError = errors.photo ?? (upload.isError ? errorMessage(upload.error) : undefined)

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={form.profileImageUrl || null} size={72} />
        <div className="flex flex-col items-start gap-1">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" loading={upload.isPending} onClick={() => fileInput.current?.click()}>
              {form.profileImageUrl ? 'Change photo' : 'Add photo'}
            </Button>
            {form.profileImageUrl && (
              <Button variant="quiet" size="sm" onClick={() => set('profileImageUrl', '')}>
                Remove photo
              </Button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            aria-label="Profile photo"
            className="sr-only"
            tabIndex={-1}
            onChange={choosePhoto}
          />
          {photoError ? (
            <p role="alert" className="text-xs text-danger">
              {photoError}
            </p>
          ) : (
            <p className="text-xs text-ink-muted">JPEG, PNG or WebP, up to 5 MB.</p>
          )}
        </div>
      </div>
      <TextField label="Designation" value={form.designation} onChange={(e) => set('designation', e.target.value)} error={errors.designation} />
      <TextField
        label="Specialities"
        hint="Separate with commas, for example: rice, soil health."
        value={form.specialities}
        onChange={(e) => set('specialities', e.target.value)}
        error={errors.specialities}
      />
      <TextField label="Occupation (optional)" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
      <TextField
        label="Workplace or institution (optional)"
        value={form.workPlaceOrInstitution}
        onChange={(e) => set('workPlaceOrInstitution', e.target.value)}
      />
      <TextArea
        label="About you (optional)"
        hint="A few lines on your work and what you write about. Shown on your author page."
        value={form.bio}
        onChange={(e) => set('bio', e.target.value)}
      />
      <FormError message={update.isError ? errorMessage(update.error) : null} />
      <div className="flex items-center gap-4">
        <Button type="submit" loading={update.isPending} disabled={upload.isPending}>
          Save profile
        </Button>
        {update.isSuccess && <output className="text-sm text-paddy">Profile saved</output>}
      </div>
    </form>
  )
}
