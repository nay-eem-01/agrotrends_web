import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { signInPath } from '../../lib/auth'
import { Spinner } from '../../ui/Spinner'
import { useSession } from './session'

/** Wraps routes that need a signed-in reader; anyone else goes to sign-in and comes back here afterwards. */
export function RequireAuth() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'restoring') {
    return (
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner />
      </div>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to={signInPath(location.pathname + location.search)} replace />
  }
  return <Outlet />
}
