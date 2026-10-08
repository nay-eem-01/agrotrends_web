import { cx } from './cx'

interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  className?: string
}

/** Up to two initials from a name, for when there is no photo. Works for Bengali names too. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = Array.from(parts[0])[0]
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : ''
  return (first + last).toUpperCase()
}

/** Decorative: a name is always shown next to an avatar, so screen readers skip it. */
export function Avatar({ name, src, size = 32, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) }
  if (src) {
    return <img src={src} alt="" style={style} className={cx('rounded-full object-cover', className)} />
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cx('inline-flex items-center justify-center rounded-full bg-field font-sans font-semibold text-paddy', className)}
    >
      {initials(name)}
    </span>
  )
}
