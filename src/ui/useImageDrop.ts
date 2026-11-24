import { useState, type DragEvent } from 'react'
import { useT } from '../lib/i18n'

export function useImageDrop(onFile: (file: File, event: DragEvent<HTMLElement>) => void, onError: (message: string) => void, disabled: boolean) {
  const t = useT()
  const [active, setActive] = useState(false)

  function allowDrop(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
    setActive(!disabled)
  }

  return {
    active: active && !disabled,
    handlers: {
      onDragEnter: allowDrop,
      onDragOver: allowDrop,
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        const next = event.relatedTarget
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setActive(false)
      },
      // Handle file drops before the story editor's own drop handler.
      onDropCapture: (event: DragEvent<HTMLElement>) => {
        const { files, items, types } = event.dataTransfer
        setActive(false)
        if (!files.length && !types.includes('Files')) return
        event.preventDefault()
        event.stopPropagation()
        if (disabled) return

        if (Array.from(items ?? []).some((item) => item.webkitGetAsEntry?.()?.isDirectory)) {
          onError(t('Drop an image file instead of a folder.'))
        } else if (files.length > 1) {
          onError(t('Drop one image at a time.'))
        } else if (files[0]) {
          onFile(files[0], event)
        }
      },
    },
  }
}
