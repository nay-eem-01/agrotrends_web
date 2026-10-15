import { ImageSquare, X } from '@phosphor-icons/react'
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { errorMessage } from '../../api/errors'
import { useUploadImage } from '../../api/images'
import { useT } from '../../lib/i18n'
import { IMAGE_TYPES, imageProblem } from '../../lib/images'
import { Button } from '../../ui/Button'

/** The backend's limit (AppConstants.MAX_IMAGES_PER_QUESTION). */
export const MAX_PHOTOS = 4

interface PhotoPickerProps {
  urls: string[]
  onChange: (urls: string[]) => void
  label?: string
  hint?: string
  max?: number
}

/** Photos uploaded one at a time through POST /api/images: a question's crop photos, an expert's proofs. */
export function PhotoPicker({ urls, onChange, label, hint, max = MAX_PHOTOS }: PhotoPickerProps) {
  const t = useT()
  const upload = useUploadImage()
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const hintId = useId()
  const full = urls.length >= max

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const found = imageProblem(file)
    setProblem(found)
    if (!found) upload.mutate(file, { onSuccess: (url) => onChange([...urls, url]) })
  }

  const error = problem ?? (upload.isError ? errorMessage(upload.error) : null)

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={hintId}>
      <legend className="mb-1.5 text-sm font-medium">{label ?? t('Photos (optional)')}</legend>
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, index) => (
            <li key={url} className="relative">
              <img src={url} alt={t('Photo {n}', { n: index + 1 })} className="aspect-square w-full rounded-xl object-cover ring-1 ring-border" />
              <button
                type="button"
                aria-label={t('Remove photo {n}', { n: index + 1 })}
                onClick={() => onChange(urls.filter((u) => u !== url))}
                className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm transition-transform duration-150 ease-(--ease-out) hover:bg-card active:scale-[0.97]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" disabled={full} loading={upload.isPending} onClick={() => input.current?.click()}>
          <ImageSquare size={18} aria-hidden="true" />
          {t('Add a photo')}
        </Button>
        <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} onChange={choose} className="sr-only" tabIndex={-1} aria-label={t('Add a photo')} />
        <span id={hintId} className="text-xs text-muted-foreground">
          {full ? t("That's the most you can add ({n}).", { n: max }) : (hint ?? t('A clear photo of the leaves, roots or pests helps. Up to {n}.', { n: max }))}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
