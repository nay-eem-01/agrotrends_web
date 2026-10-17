import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ConfirmEmailHost, EmailBanner } from '../features/auth/confirmEmail'
import { Spinner } from '../ui/Spinner'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <TopBar />
      <EmailBanner />
      <main id="main" className="flex-1">
        <Suspense
          fallback={
            <div className="flex justify-center py-24 text-ink-muted">
              <Spinner label="Loading page" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
      <ConfirmEmailHost />
      <Toaster position="bottom-center" mobileOffset={{ bottom: 80 }} />
    </div>
  )
}
