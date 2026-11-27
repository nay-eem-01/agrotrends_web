import type { ReactNode } from 'react'
import { cn } from 'cn'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '../lib/i18n'

export function SkeletonGroup({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  const t = useT()
  const message = label ?? t('Loading')
  return (
    <div className={className}>
      <output className="sr-only" aria-label={message}>{message}</output>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export function RowsSkeleton({ label, className, kind = 'list', count = 3 }: {
  label?: string
  className?: string
  kind?: 'list' | 'avatar' | 'question' | 'story'
  count?: number
}) {
  return (
    <SkeletonGroup label={label} className={className}>
      <div className="divide-y divide-border border-y border-border">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={cn('flex items-start gap-4', kind === 'question' ? 'py-5 sm:gap-6' : 'py-4')}>
            {kind === 'avatar' && <Skeleton className="size-10 shrink-0 rounded-full" />}
            <div className="min-w-0 flex-1 space-y-2">
              {kind === 'question' && <Skeleton className="h-4 w-20 rounded-full" />}
              <Skeleton className="h-5 w-3/4 max-w-md" />
              <Skeleton className="h-4 w-full max-w-lg" />
              {(kind === 'question' || kind === 'story') && <Skeleton className="h-3 w-1/2 max-w-40" />}
            </div>
            {kind === 'question' && <Skeleton className="size-20 shrink-0 rounded-xl sm:size-28" />}
            {kind === 'story' && <Skeleton className="aspect-[4/3] w-20 shrink-0 sm:w-28" />}
          </div>
        ))}
      </div>
    </SkeletonGroup>
  )
}

export function TopicsSkeleton({ label, className }: { label?: string; className?: string }) {
  return (
    <SkeletonGroup label={label} className={className}>
      <div className="flex flex-wrap gap-2">
        {['w-20', 'w-28', 'w-24', 'w-16', 'w-28', 'w-20'].map((width, index) => (
          <Skeleton key={index} className={cn('h-9 rounded-full', width)} />
        ))}
      </div>
    </SkeletonGroup>
  )
}

export function FormSkeleton({ label, className, cover, avatar, fields = 3 }: {
  label?: string
  className?: string
  cover?: boolean
  avatar?: boolean
  fields?: number
}) {
  return (
    <SkeletonGroup label={label} className={className}>
      <div className="space-y-5">
        {cover && <Skeleton className="h-28 w-full rounded-xl" />}
        {avatar && <Skeleton className="size-[72px] rounded-full" />}
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </SkeletonGroup>
  )
}

export function ProfileSkeleton({ label, cover }: { label?: string; cover?: boolean }) {
  return (
    <SkeletonGroup label={label} className="mx-auto max-w-[68rem] px-4 pt-6 pb-20 sm:px-8">
      {cover && <Skeleton className="h-28 rounded-2xl sm:h-36" />}
      <div className={cn('space-y-4', cover && 'relative -mt-11 px-1 sm:px-6')}>
        <Skeleton className={cn('size-[88px] rounded-full', cover && 'ring-4 ring-background')} />
        <Skeleton className="h-9 w-2/3 max-w-64" />
        <Skeleton className="h-5 w-4/5 max-w-80" />
        <Skeleton className="h-4 w-1/3 max-w-40" />
      </div>
      <div className="mt-8 flex gap-4 border-b border-border pb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-28 w-full rounded-2xl" />
    </SkeletonGroup>
  )
}

export function ReadingSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="mx-auto max-w-[calc(var(--container-read)+3rem)] px-4 pt-8 pb-20 sm:px-8">
      <Skeleton className="mb-7 h-4 w-28" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-9 w-5/6 sm:h-12" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="aspect-[2/1] w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </SkeletonGroup>
  )
}

export function AuthSkeleton({ label, fields = 2 }: { label?: string; fields?: number }) {
  return (
    <div className="mx-auto grid max-w-(--container-page) gap-12 px-4 pt-8 pb-20 sm:px-8 sm:pt-12 lg:grid-cols-2 lg:gap-16">
      <Skeleton aria-hidden="true" className="hidden min-h-[36rem] rounded-2xl lg:block" />
      <div className="mx-auto w-full max-w-md">
        <Skeleton aria-hidden="true" className="mb-4 h-10 w-3/4" />
        <Skeleton aria-hidden="true" className="mb-8 h-4 w-5/6" />
        <FormSkeleton label={label} fields={fields} />
      </div>
    </div>
  )
}

export function EditorSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="mx-auto max-w-[68rem] px-4 py-8 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-2/3" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Skeleton className="hidden h-40 rounded-xl lg:block" />
      </div>
    </SkeletonGroup>
  )
}

export function StoryGridSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="pt-6">
      <div className="grid items-center gap-5 md:grid-cols-2">
        <Skeleton className="aspect-[16/10] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-9 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="mt-10 grid gap-8 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[16/10] rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  )
}
