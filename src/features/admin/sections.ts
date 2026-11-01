import { Flag, IdentificationBadge, SquaresFour, Tag, UserList, UsersThree, type Icon } from '@phosphor-icons/react'

/**
 * The admin sections: in the app sidebar's Admin group from 1024px, as scrolling tabs on the admin pages below that.
 * Every staff member sees every section; the backend checks the exact privilege and its 403 is shown as written.
 */
export const ADMIN_SECTIONS: { to: string; label: string; end?: boolean; icon: Icon }[] = [
  { to: '/admin', label: 'Overview', end: true, icon: SquaresFour },
  { to: '/admin/users', label: 'Users', icon: UsersThree },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/experts', label: 'Expert applications', icon: IdentificationBadge },
  { to: '/admin/roles', label: 'Roles', icon: UserList },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
]
