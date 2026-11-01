import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from 'cn'
import { useAdminUsers, type AdminUser } from '../../api/admin'
import { errorMessage } from '../../api/errors'
import { storyDate } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { AdminPage } from './AdminPage'

const TABS = [
  { label: 'All', banned: undefined },
  { label: 'Active', banned: 'false' },
  { label: 'Banned', banned: 'true' },
] as const

/** `/admin/users?q=&banned=`: find a member by name or e-mail, filter by ban state, open one. */
export function AdminUsersPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const bannedParam = params.get('banned')
  const banned = bannedParam === 'true' ? true : bannedParam === 'false' ? false : undefined
  const users = useAdminUsers(q, banned)
  const list = users.data?.pages.flatMap((page) => page.content) ?? []

  const tabLink = (value?: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('banned', value)
    else next.delete('banned')
    const query = next.toString()
    return query ? `/admin/users?${query}` : '/admin/users'
  }

  return (
    <AdminPage title="Users">
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <UserSearch key={q} initial={q} />
        <nav aria-label="Ban state" className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => {
            const current = (bannedParam ?? undefined) === tab.banned
            return (
              <Link
                key={tab.label}
                to={tabLink(tab.banned)}
                aria-current={current ? 'page' : undefined}
                className={cn('flex h-9 items-center rounded-md px-3.5 text-sm transition-colors duration-150', current ? 'bg-card font-semibold text-primary shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground')}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {users.isPending ? (
        <div aria-busy="true" className="mt-6 flex flex-col gap-3">
          <output className="sr-only">Loading members</output>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-16" />
          ))}
        </div>
      ) : users.isError ? (
        <p role="alert" className="mt-6 text-muted-foreground">
          {errorMessage(users.error)}
        </p>
      ) : list.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{q ? `No member matches “${q}”.` : 'No members here.'}</p>
      ) : (
        <>
          <ul aria-label="Members" className="mt-6 border-t border-border">
            {list.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
          {users.hasNextPage && (
            <div className="flex justify-center py-6">
              <Button variant="secondary" size="sm" loading={users.isFetchingNextPage} onClick={() => void users.fetchNextPage()}>
                Show more members
              </Button>
            </div>
          )}
        </>
      )}
    </AdminPage>
  )
}

/** The name-or-e-mail search; Enter applies it (and keeps the ban tab). */
function UserSearch({ initial }: { initial: string }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState(initial)

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value.trim())
    else next.delete('q')
    const query = next.toString()
    navigate(query ? `/admin/users?${query}` : '/admin/users')
  }

  return (
    <search className="w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
      <form onSubmit={submit}>
        <label className="flex h-11 items-center gap-2.5 rounded-full border border-input bg-card px-4 text-muted-foreground transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/60 hover:border-subtle">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="sr-only">Search members by name or e-mail</span>
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Name or e-mail"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
      </form>
    </search>
  )
}

function UserRow({ user }: { user: AdminUser }) {
  const staff = (user.roles ?? []).filter((role) => role !== 'USER')
  const contact = user.email ?? user.mobileNumber ?? ''
  return (
    <li className="group relative flex items-center gap-3 border-b border-border py-3.5">
      <Avatar name={user.name ?? '?'} size={36} />
      <div className="min-w-0 flex-1">
        <Link to={`/admin/users/${user.id}`} className="font-medium decoration-primary/60 decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:text-primary group-hover:underline">
          {user.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {contact}
          {contact && ' · '}joined {storyDate(user.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        {staff.map((role) => (
          <Badge key={role} variant="secondary">
            {role}
          </Badge>
        ))}
        {user.banned && (
          <Badge variant="destructive" title={user.banReason}>
            Banned
          </Badge>
        )}
      </div>
    </li>
  )
}
