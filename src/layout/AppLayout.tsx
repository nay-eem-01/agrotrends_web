import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ConfirmEmailHost, EmailBanner } from '../features/auth/confirmEmail'
import { Spinner } from '../ui/Spinner'
import { AppSidebar, SidebarProvider } from './AppSidebar'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useLinkPrefetch } from './useLinkPrefetch'

// Signing in, signing up and the password and e-mail steps are a single task: no navigation around them.
const FOCUSED = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/verify-email']

export function AppLayout() {
  const focused = FOCUSED.includes(useLocation().pathname)
  useLinkPrefetch()
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <TopBar focused={focused} />
        <EmailBanner />
        {/* The navigation sits beside every other page from 1024px and the page takes the rest of the width; the footer
            runs under both, so the sidebar's edge ends on its rule. */}
        <div className="flex flex-1">
          {!focused && <AppSidebar />}
          <div className="flex min-w-0 flex-1 flex-col">
            <main id="main" className="flex-1 pb-16">
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
          </div>
        </div>
        {/* Below 768px the footer's band also runs under the fixed tab bar. */}
        <Footer className={focused ? undefined : 'pb-16 md:pb-0'} />
        {!focused && <BottomNav />}
        <ConfirmEmailHost />
        <Toaster position="bottom-center" mobileOffset={{ bottom: 80 }} />
      </div>
    </SidebarProvider>
  )
}
