import { useState, type FormEvent } from 'react'
import { isAdmin, useAdminSignIn } from '../../api/auth'
import { useCategories, useCategoryWrite, type Category } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { isEmail } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'
import { useSession } from '../auth/session'

/** `/admin/categories`: staff add, rename and delete story categories. Others get the admin sign-in. */
export function AdminCategoriesPage() {
  const { status, user } = useSession()
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>Categories – Admin – AgroTrends</title>
      <p className="text-sm text-ink-muted">Admin</p>
      <h1 className="mt-1 text-2xl sm:text-3xl">Categories</h1>
      {status === 'restoring' ? <Spinner /> : isAdmin(user) ? <Categories /> : <AdminSignIn signedInAsReader={status === 'signed-in'} />}
    </section>
  )
}

function AdminSignIn({ signedInAsReader }: { signedInAsReader: boolean }) {
  const session = useSession()
  const signIn = useAdminSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!isEmail(email) || !password) {
      setError('Enter your admin e-mail and password.')
      return
    }
    setError(undefined)
    signIn.mutate({ email: email.trim(), password }, { onSuccess: (tokens) => session.signedIn(tokens) })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 flex max-w-md flex-col gap-5">
      <p className="text-ink-muted">
        {signedInAsReader ? 'Your account has no admin access. Sign in with an admin account.' : 'Sign in with an admin account.'}
      </p>
      <TextField label="Admin e-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <FormError message={error ?? (signIn.isError ? errorMessage(signIn.error) : null)} />
      <Button type="submit" loading={signIn.isPending} className="self-start">
        Sign in as admin
      </Button>
    </form>
  )
}

function Categories() {
  const categories = useCategories()
  const create = useCategoryWrite()
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  function add(event: FormEvent) {
    event.preventDefault()
    const value = name.trim()
    if (!value) return setError('Enter a name.')
    if (categories.data?.some((c) => c.categoryName?.toLowerCase() === value.toLowerCase())) return setError('That category already exists.')
    setError(undefined)
    create.mutate({ kind: 'create', name: value }, { onSuccess: () => setName('') })
  }

  return (
    <>
      <form onSubmit={add} noValidate className="mt-8 flex items-start gap-3">
        <TextField label="New category" className="flex-1" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <Button type="submit" loading={create.isPending} className="mt-7">
          Add category
        </Button>
      </form>
      <FormError message={create.isError ? errorMessage(create.error) : null} />
      {categories.isPending ? (
        <Spinner label="Loading categories" />
      ) : categories.isError ? (
        <p role="alert" className="py-8 text-ink-muted">
          {errorMessage(categories.error)}
        </p>
      ) : categories.data.length === 0 ? (
        <p className="py-8 text-ink-muted">No categories yet. Authors need one to publish.</p>
      ) : (
        <ul aria-label="Categories" className="mt-8 border-t border-rule">
          {categories.data.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const write = useCategoryWrite()
  const [mode, setMode] = useState<'view' | 'rename' | 'confirm'>('view')
  const [name, setName] = useState(category.categoryName ?? '')
  const id = category.id ?? 0

  function rename(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) write.mutate({ kind: 'rename', id, name: name.trim() }, { onSuccess: () => setMode('view') })
  }

  return (
    <li className="border-b border-rule py-4">
      {mode === 'rename' ? (
        <form onSubmit={rename} className="flex items-end gap-2">
          <TextField label={`Rename ${category.categoryName}`} className="flex-1" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" size="sm" loading={write.isPending}>
            Save
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
            Cancel
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex-1 font-medium">{category.categoryName}</span>
          {mode === 'confirm' ? (
            <>
              <span className="text-sm">Delete it? Stories in it may block this.</span>
              <Button variant="danger" size="sm" loading={write.isPending} onClick={() => write.mutate({ kind: 'delete', id })}>
                Delete category
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
                Keep it
              </Button>
            </>
          ) : (
            <>
              <Button variant="quiet" size="sm" aria-label={`Rename ${category.categoryName}`} onClick={() => setMode('rename')}>
                Rename
              </Button>
              <Button variant="quiet" size="sm" aria-label={`Delete ${category.categoryName}`} onClick={() => setMode('confirm')}>
                Delete
              </Button>
            </>
          )}
        </div>
      )}
      {write.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {errorMessage(write.error)}
        </p>
      )}
    </li>
  )
}
