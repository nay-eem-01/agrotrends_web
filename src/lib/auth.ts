/** Mirrors the backend's rule (CommonUtils.getInvalidPasswordMessage); null when the password is acceptable. */
export function passwordProblem(password: string): string | null {
  if (!password) return 'Enter a password.'
  if (/\s/.test(password)) return "A password can't contain spaces."
  if (password.length < 8 || password.length > 16) return 'Use 8 to 16 characters.'
  if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Include a capital letter, a number and a symbol.'
  }
  return null
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** "rice, jute ,, soil health" -> ["rice", "jute", "soil health"] */
export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Where to go after signing in. Only same-site paths are accepted, so a crafted `?next=//evil.example` link can't
 * send a reader off the site.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  if (next.startsWith('/sign-in') || next.startsWith('/sign-up')) return '/'
  return next
}

/** The link to sign-in that brings the reader back to `path` afterwards. */
export function signInPath(path: string): string {
  const next = safeNext(path)
  return next === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`
}

/**
 * The backend stores code and number joined ("+8801712345678") but takes them apart on update. Bangladesh numbers
 * split at +880; anything else is left whole in the number field for the reader to separate.
 */
export function splitMobile(mobile: string | undefined): { countryCode: string; mobileNumber: string } {
  const value = (mobile ?? '').trim()
  if (value.startsWith('+880')) return { countryCode: '+880', mobileNumber: value.slice(4) }
  return { countryCode: '', mobileNumber: value }
}
