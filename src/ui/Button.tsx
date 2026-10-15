import type { ButtonHTMLAttributes, ReactNode } from 'react'
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
  children: ReactNode
}

export function Button({ variant, size, loading = false, disabled, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading && <Spinner size={16} label="" />}
      {children}
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
}

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest} />
}
