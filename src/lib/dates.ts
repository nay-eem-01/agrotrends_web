import { getLang } from './i18n'

/** "Oct 7" this year, "Oct 7, 2025" otherwise — how Medium dates stories. Bengali months and digits in Bengali. */
export function storyDate(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString(getLang() === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}
