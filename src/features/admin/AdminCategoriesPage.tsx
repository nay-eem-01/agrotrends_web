import { useState, type FormEvent } from 'react'
import { useCategories, useCategoryWrite, type Category } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'
import { AdminPage } from './AdminPage'

/** `/admin/categories`: staff add, rename and delete story categories. Others get the admin sign-in. */
export function AdminCategoriesPage() {
  return (
    <AdminPage title="Categories">
      <Categories />
    </AdminPage>
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
              <Button variant="quiet" size="sm" aria-label={`Delete ${category.categoryName}`} className="text-destructive" onClick={() => setMode('confirm')}>
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
