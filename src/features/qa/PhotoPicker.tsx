import { ImageSquare, X } from '@phosphor-icons/react'
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { errorMessage } from '../../api/errors'
import { useUploadImage } from '../../api/images'
import { useT } from '../../lib/i18n'
import { IMAGE_TYPES, imageProblem } from '../../lib/images'
import { Spinner } from '../../ui/Spinner'

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
      {/* Thumbnails and the add tile share one grid, so an attached photo sits exactly where the tile was. */}
      <ul className="grid max-w-md grid-cols-4 gap-2.5">
        {urls.map((url, index) => (
          <li key={url} className="relative">
            <img src={url} alt={t('Photo {n}', { n: index + 1 })} className="aspect-square w-full rounded-xl bg-muted object-cover ring-1 ring-border" />
            <button
              type="button"
              aria-label={t('Remove photo {n}', { n: index + 1 })}
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border transition-[background-color,transform] duration-150 ease-(--ease-out) after:absolute after:-inset-2 hover:bg-background active:scale-[0.94]"
            >
              <X size={12} weight="bold" aria-hidden="true" />
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <button
              type="button"
              disabled={upload.isPending}
              aria-busy={upload.isPending || undefined}
              onClick={() => input.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong text-muted-foreground transition-[border-color,background-color,color] duration-150 hover:border-primary/50 hover:bg-surface hover:text-primary disabled:cursor-wait"
            >
              {upload.isPending ? <Spinner size={18} label={t('Uploading image')} /> : <ImageSquare size={22} aria-hidden="true" />}
              <span className="text-xs font-medium">{t('Add a photo')}</span>
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} onChange={choose} className="sr-only" tabIndex={-1} aria-label={t('Add a photo')} />
      <p id={hintId} className="text-sm text-muted-foreground">
        {full ? t("That's the most you can add ({n}).", { n: max }) : (hint ?? t('A clear photo of the leaves, roots or pests helps. Up to {n}.', { n: max }))}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
