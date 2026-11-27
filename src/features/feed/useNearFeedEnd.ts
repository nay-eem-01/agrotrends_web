import { useEffect, useRef } from 'react'

/** Observe the position after the latest page so the next page starts before the reader reaches it. */
export function useNearFeedEnd(enabled: boolean, load: () => void) {
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      load()
    }, { rootMargin: '600px 0px' })
    observer.observe(node)

    return () => {
      observer.disconnect()
      observer.takeRecords()
    }
  }, [enabled, load])

  return sentinel
}
