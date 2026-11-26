import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md'

// The app's button names over shadcn's variants, so screens keep their wording while the look comes from one place.
const variants = { primary: 'default', secondary: 'outline', quiet: 'ghost', danger: 'destructive' } as const
const sizes = { sm: 'default', md: 'lg' } as const

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  // cn, not cva's className: a screen's classes must win over the variant's (e.g. `hidden` over `inline-flex`).
  return cn(buttonVariants({ variant: variants[variant], size: sizes[size] }), className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  pendingLabel?: string
  children: ReactNode
}

export function Button({ variant, size, loading = false, pendingLabel, disabled, className, children, type = 'button', ...rest }: ButtonProps) {
  const spinner = loading && <DelayedSpinner />

  return (
    <>
      <button
        type={type}
        data-slot="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClass(variant, size, className)}
        {...rest}
      >
        {pendingLabel ? (
          <span className="grid">
            <span aria-hidden={loading || undefined} className={cn('col-start-1 row-start-1 flex items-center justify-center gap-2', loading && 'invisible')}>
              {children}
            </span>
            <span aria-hidden={!loading || undefined} className={cn('col-start-1 row-start-1 flex items-center justify-center gap-2', !loading && 'invisible')}>
              <span aria-hidden="true" className="size-4 shrink-0">{spinner}</span>
              {pendingLabel}
            </span>
          </span>
        ) : (
          <>
            {spinner}
            {children}
          </>
        )}
      </button>
      {pendingLabel && <output className="sr-only">{loading ? pendingLabel : ''}</output>}
    </>
  )
}

function DelayedSpinner() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 1000)
    return () => window.clearTimeout(timer)
  }, [])

  return visible ? <Spinner size={16} label="" /> : null
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
}

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest} />
}
