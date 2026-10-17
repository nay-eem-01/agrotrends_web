import { ArrowLeft, CheckCircle, Circle, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminUser, useRoles, useUserRole, type AdminUserDetail } from '../../api/admin'
import { ApiError, errorMessage } from '../../api/errors'
import { useExpertDecision } from '../../api/experts'
import { storyDate } from '../../lib/dates'
import { formatNumber } from '../../lib/i18n'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Select } from '../farming/FarmingFields'
import { AdminPage } from './AdminPage'
import { BanControls } from './BanControls'

/** `/admin/users/:userId`: one member, what they have posted, and what staff can do about the account. */
export function AdminUserPage() {
  const userId = Number(useParams().userId)
  const detail = useAdminUser(userId)

  return (
    <AdminPage title={detail.data?.user?.name ?? 'Member'}>
      <Link to="/admin/users" className="mt-2 inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} aria-hidden="true" />
        All users
      </Link>
      {detail.isPending ? (
        <Skeleton className="mt-4 h-40 rounded-xl" />
      ) : detail.isError ? (
        <p role="alert" className="mt-4 text-muted-foreground">
          {detail.error instanceof ApiError && detail.error.isNotFound ? 'No member with that id.' : errorMessage(detail.error)}
        </p>
      ) : (
        <Member detail={detail.data} userId={userId} />
      )}
    </AdminPage>
  )
}

function Member({ detail, userId }: { detail: AdminUserDetail; userId: number }) {
  const user = detail.user ?? {}
  const name = user.name ?? 'Member'
  const counts = [
    { label: 'Questions', value: detail.questions },
    { label: 'Answers', value: detail.answers },
    { label: 'Published stories', value: detail.publishedStories },
    { label: 'Open reports about them', value: detail.openReports },
  ]

  return (
    <div className="mt-2 flex flex-col gap-10">
      <section aria-label="Account" className="flex flex-wrap items-start gap-4">
        <Avatar name={name} size={56} />
        <div className="min-w-0 flex-1">
          <ul className="flex flex-col gap-1 text-sm">
            {user.email && <Contact value={user.email} confirmed={user.emailVerified} />}
            {user.mobileNumber && <Contact value={user.mobileNumber} confirmed={user.phoneVerified} />}
            <li className="text-muted-foreground">Joined {storyDate(user.createdAt)}</li>
          </ul>
          {user.banned && (
            <p className="mt-3 rounded-xl border border-destructive/25 bg-destructive-soft px-4 py-3 text-sm">
              <span className="font-semibold text-destructive">Banned {storyDate(user.bannedAt)}.</span> {user.banReason}
            </p>
          )}
        </div>
      </section>

      <dl className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
        {counts.map(({ label, value }) => (
          <div key={label} className="border-b border-border py-4 pr-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatNumber(value ?? 0)}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="member-ban">
        <h2 id="member-ban" className="text-lg">
          Ban
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">{user.banned ? 'They cannot sign in until the ban is lifted.' : 'A ban signs them out everywhere and closes the open reports about them.'}</p>
        <BanControls userId={userId} name={name} banned={Boolean(user.banned)} />
      </section>

      <ExpertTopics userId={userId} topics={detail.expertTopics ?? []} />
      <AdminRoles userId={userId} held={user.roles ?? []} />
    </div>
  )
}

function Contact({ value, confirmed }: { value: string; confirmed?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className="font-medium">{value}</span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        {confirmed ? <CheckCircle size={14} weight="fill" className="text-primary" aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
        {confirmed ? 'Confirmed' : 'Not confirmed'}
      </span>
    </li>
  )
}

/** Their Verified Expert topics, each with Revoke. */
function ExpertTopics({ userId, topics }: { userId: number; topics: { id?: number; name?: string }[] }) {
  const decide = useExpertDecision()
  return (
    <section aria-labelledby="member-expert">
      <h2 id="member-expert" className="text-lg">
        Expert topics
      </h2>
      {topics.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">Not a verified expert in any topic.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <li key={topic.id} className="inline-flex h-9 items-center gap-2 rounded-full bg-mustard-soft pr-1 pl-3.5 text-sm">
              {topic.name}
              <Button
                variant="quiet"
                size="sm"
                className="h-7 px-2.5"
                loading={decide.isPending && decide.variables?.action === 'revoke' && decide.variables.categoryId === topic.id}
                onClick={() => decide.mutate({ action: 'revoke', userId, categoryId: topic.id ?? 0 })}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
      {decide.isError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errorMessage(decide.error)}
        </p>
      )}
    </section>
  )
}

/** Admin roles they hold (remove) and the ones they could be given (grant). Only ADMIN-type roles change here. */
function AdminRoles({ userId, held }: { userId: number; held: string[] }) {
  const roles = useRoles()
  const change = useUserRole()
  const [chosen, setChosen] = useState('')
  const adminRoles = (roles.data ?? []).filter((role) => role.type === 'ADMIN')
  const holds = adminRoles.filter((role) => held.includes(role.name ?? ''))
  const grantable = adminRoles.filter((role) => !held.includes(role.name ?? ''))
  const fixed = held.filter((name) => !adminRoles.some((role) => role.name === name))

  return (
    <section aria-labelledby="member-roles">
      <h2 id="member-roles" className="text-lg">
        Roles
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">An admin role gives its privileges at once, without a new sign-in. An account with an admin role can't be banned.</p>
      {roles.isError ? (
        <p role="alert" className="mt-3 text-sm text-muted-foreground">
          {errorMessage(roles.error)}
        </p>
      ) : (
        <>
          <ul aria-label="Roles held" className="mt-3 flex flex-wrap gap-2">
            {fixed.map((name) => (
              <li key={name}>
                <Badge variant="outline">{name}</Badge>
              </li>
            ))}
            {holds.map((role) => (
              <li key={role.id} className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-sm">
                {role.name}
                <button
                  type="button"
                  aria-label={`Remove role ${role.name}`}
                  disabled={change.isPending}
                  onClick={() => change.mutate({ userId, roleId: role.id ?? 0, grant: false })}
                  className="flex size-7 items-center justify-center rounded-full hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_10%)]"
                >
                  <X size={12} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {grantable.length > 0 && (
            <div className="mt-4 flex max-w-md flex-wrap items-end gap-3">
              <div className="min-w-48 flex-1">
                <Select label="Give a role" value={chosen} onChange={setChosen} placeholder="Choose a role" options={grantable.map((role) => ({ value: String(role.id), label: role.name ?? '' }))} />
              </div>
              <Button
                disabled={!chosen}
                loading={change.isPending && change.variables?.grant}
                onClick={() => change.mutate({ userId, roleId: Number(chosen), grant: true }, { onSuccess: () => setChosen('') })}
              >
                Give role
              </Button>
            </div>
          )}
        </>
      )}
      {change.isError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errorMessage(change.error)}
        </p>
      )}
    </section>
  )
}
