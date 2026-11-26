import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonGroup } from '../../ui/LoadingSkeleton'

export const questionLayout = {
  page: 'mx-auto max-w-[65rem] px-4 pt-6 pb-20 sm:px-8 sm:pt-8',
  columns: 'mt-2 grid gap-6 xl:grid-cols-[minmax(0,1fr)_15.5rem] xl:items-start xl:gap-x-10',
  post: 'mt-6 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4',
  sidebar: 'hidden flex-col gap-5 pt-2 text-sm sm:flex xl:sticky xl:top-24',
}

export function QuestionSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className={questionLayout.page}>
      <div className="flex h-11 items-center">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className={questionLayout.columns}>
        <div className="min-w-0">
          <div className="flex h-7 items-start justify-between gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="size-7 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-8 w-5/6 sm:h-10" />
          <div className={questionLayout.post}>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-5" />
              <Skeleton className="size-9 rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20 rounded-full xl:w-9" />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className={questionLayout.sidebar}>
          <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-6 justify-self-end" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2 border-t border-border pt-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="hidden h-11 w-full rounded-full xl:block" />
        </div>
      </div>
    </SkeletonGroup>
  )
}
