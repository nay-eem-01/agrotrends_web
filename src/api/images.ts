import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { optimiseImage } from '../lib/images'
import { api } from './client'

/** Uploads an image (authors only) and returns its public URL. */
export async function uploadImage(file: File, onUploadProgress?: (percent: number | null) => void): Promise<string> {
  const body = new FormData()
  body.append('file', await optimiseImage(file))
  const { url } = await api<{ url: string }>('/api/images', { method: 'POST', body, onUploadProgress })
  return url
}

export function useUploadImage() {
  const [progress, setProgress] = useState<number | null>(null)
  const upload = useMutation({
    mutationFn: (file: File) => {
      setProgress(null)
      return uploadImage(file, setProgress)
    },
  })
  return { ...upload, progress }
}
