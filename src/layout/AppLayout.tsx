import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ConfirmEmailHost, EmailBanner } from '../features/auth/confirmEmail'
import { Spinner } from '../ui/Spinner'
import { AppSidebar, SidebarProvider } from './AppSidebar'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <TopBar />
        <EmailBanner />
        {/* The navigation sits beside every page from 1024px; the page and footer take the rest of the width. */}
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
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
          </div>
        </div>
        <BottomNav />
        <ConfirmEmailHost />
        <Toaster position="bottom-center" mobileOffset={{ bottom: 80 }} />
      </div>
    </SidebarProvider>
  )
}
