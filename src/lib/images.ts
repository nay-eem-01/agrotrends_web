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
