import { useLocation, useNavigate } from 'react-router-dom'
import { signInPath } from '../../lib/auth'
import { useSession } from './session'

/**
 * For write controls a visitor can see (Clap, Save, Follow, Respond): runs `action` when signed in, otherwise
 * opens sign-in and comes back to this page afterwards.
 */
export function useRequireSignIn() {
  const { status } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  return (action: () => void) => {
    if (status === 'signed-in') action()
    else navigate(signInPath(location.pathname + location.search))
  }
}
