import { Plus } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivileges, useRoles, useRoleWrite, type Role } from '../../api/admin'
import { errorMessage } from '../../api/errors'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AdminPage } from './AdminPage'

const TYPE_LABEL = { USER: 'Members', ADMIN: 'Admin role', SUPER_ADMIN: 'Super admin' } as const

/**
 * `/admin/roles`: who may moderate, review experts or read users is a role with those privileges. Admin roles are
 * created, edited and deleted here (super-admin only); the member and super-admin roles are fixed.
 */
export function AdminRolesPage() {
  const roles = useRoles()
  const [editing, setEditing] = useState<Role | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)

  return (
    <AdminPage title="Roles">
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">Give a role to a member on their page. Privileges apply at once, without a new sign-in.</p>
        <Button onClick={() => setEditing('new')}>
          <Plus size={18} weight="bold" aria-hidden="true" />
          New role
        </Button>
      </div>
      {roles.isPending ? (
        <Skeleton className="mt-6 h-40 rounded-xl" />
      ) : roles.isError ? (
        <p role="alert" className="mt-6 text-muted-foreground">
          {errorMessage(roles.error)}
        </p>
      ) : (
        <ul aria-label="Roles" className="mt-6 border-t border-border">
          {roles.data.map((role) => (
            <li key={role.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-border py-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{role.name}</span>
                  <Badge variant={role.type === 'ADMIN' ? 'secondary' : 'outline'}>{TYPE_LABEL[role.type ?? 'USER']}</Badge>
                </p>
                {(role.privileges?.length ?? 0) > 0 ? (
                  <ul aria-label={`Privileges of ${role.name}`} className="mt-2 flex flex-wrap gap-1.5">
                    {role.privileges!.map((privilege) => (
                      <li key={privilege.id} className="rounded-full px-2.5 py-0.5 text-xs ring-1 ring-border-strong ring-inset" title={privilege.description}>
                        {privilege.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No staff privileges.</p>
                )}
              </div>
              {role.type === 'ADMIN' && (
                <div className="flex gap-1">
                  <Button variant="quiet" size="sm" aria-label={`Edit ${role.name}`} onClick={() => setEditing(role)}>
                    Edit
                  </Button>
                  <Button variant="quiet" size="sm" aria-label={`Delete ${role.name}`} className="text-destructive" onClick={() => setDeleting(role)}>
                    Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="block max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {editing !== null && <RoleForm role={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <DeleteRole role={deleting} onClose={() => setDeleting(null)} />
    </AdminPage>
  )
}

/** Name, an optional description and the privileges, for a new role or an existing admin role. */
function RoleForm({ role, onDone }: { role?: Role; onDone: () => void }) {
  const privileges = usePrivileges()
  const write = useRoleWrite()
  const [name, setName] = useState(role?.name ?? '')
  const [chosen, setChosen] = useState<number[]>((role?.privileges ?? []).map((p) => p.id ?? 0))
  const [missing, setMissing] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return setMissing(true)
    const fields = { roleName: name.trim(), roleType: 'ADMIN' as const, privilegeIds: chosen }
    write.mutate(role ? { kind: 'update', request: { id: role.id ?? 0, ...fields } } : { kind: 'create', request: fields }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <DialogTitle className="text-xl font-semibold">{role ? `Edit ${role.name}` : 'New admin role'}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">Members holding it get exactly these privileges.</DialogDescription>
      </div>
      <TextField label="Name" placeholder="Moderator" value={name} onChange={(event) => setName(event.target.value)} error={missing && !name.trim() ? 'Give the role a name.' : undefined} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Privileges</legend>
        {privileges.isPending ? (
          <Skeleton className="h-24" />
        ) : privileges.isError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            {errorMessage(privileges.error)}
          </p>
        ) : (
          privileges.data.map((privilege) => (
            <label key={privilege.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors duration-150 hover:bg-surface has-data-checked:border-primary/40 has-data-checked:bg-secondary">
              <Checkbox
                className="mt-0.5"
                checked={chosen.includes(privilege.id ?? 0)}
                onCheckedChange={(checked) => setChosen((list) => (checked ? [...list, privilege.id ?? 0] : list.filter((id) => id !== privilege.id)))}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{privilege.name}</span>
                {privilege.description && <span className="block text-xs text-muted-foreground">{privilege.description}</span>}
              </span>
            </label>
          ))
        )}
      </fieldset>
      {write.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(write.error)}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="quiet" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={write.isPending}>
          {role ? 'Save role' : 'Create role'}
        </Button>
      </div>
    </form>
  )
}

function DeleteRole({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const write = useRoleWrite()
  return (
    <AlertDialog open={role !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {role?.name}?</AlertDialogTitle>
          <AlertDialogDescription>Members holding it lose its privileges at once.</AlertDialogDescription>
        </AlertDialogHeader>
        {write.isError && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(write.error)}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="danger" size="sm" loading={write.isPending} onClick={() => role && write.mutate({ kind: 'delete', roleId: role.id ?? 0 }, { onSuccess: onClose })}>
            Delete role
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
