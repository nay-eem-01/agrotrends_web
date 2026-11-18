/** Mirrors the backend's upload rule (ImageService): JPEG, PNG or WebP, up to 5 MB. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Null when the file can be uploaded, otherwise what to tell the reader. */
export function imageProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP image.'
  if (file.size > MAX_IMAGE_BYTES) return 'Choose an image under 5 MB.'
  if (file.size === 0) return 'That file is empty.'
  return null
}

/** Encode photographs as WebP when smaller. PNG and existing WebP keep their original transparency and animation. */
export async function optimiseImage(file: File): Promise<File> {
  if (file.type !== 'image/jpeg' || typeof createImageBitmap !== 'function') return file

  try {
    const image = await createImageBitmap(file)
    try {
      const scale = Math.min(1, 2048 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) return file
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const converted = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
      return converted?.type === 'image/webp' && converted.size > 0 && converted.size < file.size
        ? new File([converted], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: converted.type })
        : file
    } finally {
      image.close()
    }
  } catch {
    return file
  }
}
