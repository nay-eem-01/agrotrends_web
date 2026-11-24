import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { signInPath } from '../../lib/auth'
import { RouteSkeleton } from '../../layout/RouteSkeleton'
import { useSession } from './session'

/** Wraps routes that need a signed-in reader; anyone else goes to sign-in and comes back here afterwards. */
export function RequireAuth() {
  const { status, endNotice } = useSession()
  const location = useLocation()

  if (status === 'restoring') return <RouteSkeleton />
  if (status === 'anonymous') {
    return <Navigate to={signInPath(location.pathname + location.search)} replace state={endNotice ? { notice: endNotice } : undefined} />
  }
  return <Outlet />
}
