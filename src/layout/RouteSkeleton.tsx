import { useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '../lib/i18n'
import { QuestionSkeleton } from '../features/qa/QuestionSkeleton'
import { AuthSkeleton, EditorSkeleton, FormSkeleton, ProfileSkeleton, ReadingSkeleton, RowsSkeleton, StoryGridSkeleton, TopicsSkeleton } from '../ui/LoadingSkeleton'

export function RouteSkeleton() {
  const { pathname } = useLocation()
  const t = useT()
  const label = t('Loading page')

  if (/^\/(stories|s)\//.test(pathname)) return <ReadingSkeleton label={label} />
  if (/^\/questions\/\d+$/.test(pathname)) return <QuestionSkeleton label={label} />
  if (pathname.startsWith('/users/')) return <ProfileSkeleton label={label} cover />
  if (pathname.startsWith('/authors/')) return <ProfileSkeleton label={label} />
  if (pathname === '/write' || pathname.startsWith('/write/')) return <EditorSkeleton label={label} />
  if (/^\/(sign-in|sign-up|forgot-password|reset-password|verify-email|verify-phone|welcome)$/.test(pathname)) {
    return <AuthSkeleton label={label} />
  }
  if (/^\/(settings|experts\/apply|questions\/(ask|\d+\/edit))$/.test(pathname)) {
    return <FormSkeleton label={label} className="mx-auto max-w-(--container-feed) px-4 py-8 sm:px-6" />
  }

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 sm:px-8">
      <Skeleton aria-hidden="true" className="mb-6 h-9 w-2/3 max-w-60" />
      {pathname === '/stories' ? (
        <StoryGridSkeleton label={label} />
      ) : pathname === '/topics' ? (
        <TopicsSkeleton label={label} />
      ) : (
        <RowsSkeleton label={label} kind={pathname === '/questions' || pathname === '/search' ? 'question' : pathname === '/me/stories' ? 'story' : 'list'} />
      )}
    </div>
  )
}
