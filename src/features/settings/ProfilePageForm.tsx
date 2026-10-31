import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { errorMessage } from '../../api/errors'
import { useUploadImage } from '../../api/images'
import { MAX_LOCATION, useUpdateUserProfile, useUserProfile, type UserProfile } from '../../api/users'
import { IMAGE_TYPES, imageProblem } from '../../lib/images'
import { CoverFallback } from '../../ui/Botanical'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'

/** Loads your public summary, then the location and cover editor filled with it. */
export function ProfilePageForm({ userId }: { userId: number }) {
  const profile = useUserProfile(userId)
  if (profile.isPending) return <Spinner />
  if (profile.isError) return <FormError message={errorMessage(profile.error)} />
  return <Editor profile={profile.data} />
}

function Editor({ profile }: { profile: UserProfile }) {
  const update = useUpdateUserProfile()
  const upload = useUploadImage()
  const fileInput = useRef<HTMLInputElement>(null)
  const [location, setLocation] = useState(profile.location ?? '')
  const [cover, setCover] = useState(profile.coverUrl ?? '')
  const [coverError, setCoverError] = useState<string | null>(null)

  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = imageProblem(file)
    setCoverError(problem)
    if (problem) return
    update.reset()
    upload.mutate(file, { onSuccess: setCover })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    // Both are replaced on every save, so the current values always go.
    update.mutate({ location: location.trim(), coverUrl: cover })
  }

  const photoError = coverError ?? (upload.isError ? errorMessage(upload.error) : null)

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Cover photo</span>
        <div className="h-28 overflow-hidden rounded-xl bg-muted">
          {cover ? <img src={cover} alt="Your cover photo" className="size-full object-cover" /> : <CoverFallback className="size-full" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={upload.isPending} onClick={() => fileInput.current?.click()}>
            {cover ? 'Change cover' : 'Add cover'}
          </Button>
          {cover && (
            <Button variant="quiet" size="sm" onClick={() => setCover('')}>
              Remove cover
            </Button>
          )}
        </div>
        <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} aria-label="Cover photo" className="sr-only" tabIndex={-1} onChange={chooseCover} />
        {photoError ? (
          <p role="alert" className="text-xs text-destructive">
            {photoError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">A wide photo across the top of your profile. JPEG, PNG or WebP, up to 5 MB.</p>
        )}
      </div>
      <TextField
        label="Location (optional)"
        hint="Where you farm or work, for example: Rangpur."
        value={location}
        maxLength={MAX_LOCATION}
        onChange={(event) => {
          setLocation(event.target.value)
          update.reset()
        }}
      />
      <FormError message={update.isError ? errorMessage(update.error) : null} />
      <div className="flex items-center gap-4">
        <Button type="submit" loading={update.isPending} disabled={upload.isPending}>
          Save profile page
        </Button>
        {update.isSuccess && <output className="text-sm text-primary">Profile page saved</output>}
      </div>
    </form>
  )
}
