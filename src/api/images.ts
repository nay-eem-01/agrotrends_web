import { useMutation } from '@tanstack/react-query'
import { api } from './client'

/** Uploads an image (authors only) and returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const { url } = await api<{ url: string }>('/api/images', { method: 'POST', body })
  return url
}

export function useUploadImage() {
  return useMutation({ mutationFn: uploadImage })
}
