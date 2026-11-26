import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { useCategories, useCategoryWrite, type Category } from '../../api/categories'
import { errorMessage } from '../../api/errors'
import { Button } from '../../ui/Button'
import { RowsSkeleton } from '../../ui/LoadingSkeleton'
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
  const t = useT()
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
        <TextField label={t("New category")} className="flex-1" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <Button type="submit" loading={create.isPending} pendingLabel={t("Creating category…")} className="mt-7">
          {t("Add category")}
        </Button>
      </form>
      <FormError message={create.isError ? errorMessage(create.error) : null} />
      {categories.isPending ? (
        <RowsSkeleton label={t("Loading categories")} className="mt-4" />
      ) : categories.isError ? (
        <p role="alert" className="py-8 text-ink-muted">
          {errorMessage(categories.error)}
        </p>
      ) : categories.data.length === 0 ? (
        <p className="py-8 text-ink-muted">No categories yet. Authors need one to publish.</p>
      ) : (
        <ul aria-label={t("Categories")} className="mt-8 border-t border-rule">
          {categories.data.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const t = useT()
  const write = useCategoryWrite()
  const [mode, setMode] = useState<'view' | 'rename' | 'confirm'>('view')
  const [name, setName] = useState(category.categoryName ?? '')
  const [problem, setProblem] = useState<string>()
  const id = category.id ?? 0

  function rename(event: FormEvent) {
    event.preventDefault()
    const value = name.trim()
    if (!value) {
      setProblem('Enter a name.')
      return
    }
    setProblem(undefined)
    write.mutate({ kind: 'rename', id, name: value }, { onSuccess: () => setMode('view') })
  }

  return (
    <li className="border-b border-rule py-4">
      {mode === 'rename' ? (
        <form onSubmit={rename} className="flex items-end gap-2">
          <TextField label={`Rename ${category.categoryName}`} className="flex-1" value={name} error={problem} onChange={(e) => {
            setName(e.target.value)
            if (e.target.value.trim()) setProblem(undefined)
          }} />
          <Button type="submit" size="sm" loading={write.isPending} pendingLabel={t("Saving category…")}>
            {t("Save")}
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
            {t("Cancel")}
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex-1 font-medium">{category.categoryName}</span>
          {mode === 'confirm' ? (
            <>
              <span className="text-sm">Delete it? Stories in it may block this.</span>
              <Button variant="danger" size="sm" loading={write.isPending} pendingLabel={t("Deleting category…")} onClick={() => write.mutate({ kind: 'delete', id })}>
                {t("Delete category")}
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setMode('view')}>
                {t("Keep it")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="quiet" size="sm" aria-label={`Rename ${category.categoryName}`} onClick={() => {
                setName(category.categoryName ?? '')
                setProblem(undefined)
                write.reset()
                setMode('rename')
              }}>
                {t("Rename")}
              </Button>
              <Button variant="quiet" size="sm" aria-label={`Delete ${category.categoryName}`} className="text-destructive" onClick={() => setMode('confirm')}>
                {t("Delete")}
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
