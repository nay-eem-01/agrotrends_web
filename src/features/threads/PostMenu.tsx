import { lazy, Suspense } from 'react'
import type { PostMenuProps } from './PostMenuImpl'

// The menu (Base UI's menu and positioning code) loads just after the page; a same-size space holds its place.
const Impl = lazy(() => import('./PostMenuImpl').then((m) => ({ default: m.PostMenuImpl })))

/** A post's Edit, Delete and Report behind one "More actions" button; see PostMenuImpl. */
export function PostMenu(props: PostMenuProps) {
  return (
    <Suspense fallback={<span aria-hidden="true" className="-my-1 size-9 shrink-0" />}>
      <Impl {...props} />
    </Suspense>
  )
}
