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

/** Spaces and dashes out: "+880 1712-345678" -> "+8801712345678". */
export function compactPhone(value: string): string {
  return value.trim().replace(/[\s-]/g, '')
}

/**
 * A phone number the backend can read: "+8801712345678", or a Bangladeshi number without the code ("01712345678",
 * which it reads as +880). Spaces and dashes are allowed.
 */
export function isPhone(value: string): boolean {
  return /^(\+\d{1,4}\d{6,14}|0\d{9,11})$/.test(compactPhone(value))
}

/** What sign-in sends: the e-mail as typed (trimmed), or the phone number without spaces and dashes. */
export function signInIdentifier(value: string): string {
  return isEmail(value) ? value.trim() : compactPhone(value)
}

/** "+880" and "1712345678" -> "+8801712345678" (how the backend stores and shows it). */
export function joinPhone(countryCode: string, mobileNumber: string): string {
  return compactPhone(countryCode) + compactPhone(mobileNumber).replace(/^0/, '')
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
