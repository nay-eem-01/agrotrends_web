import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider } from '../features/auth/session'
import { createQueryClient } from '../queryClient'

function CurrentPath() {
  const location = useLocation()
  return <output data-testid="path">{location.pathname + location.search}</output>
}

/** Renders `ui` with the app's providers at `path`; `screen.getByTestId('path')` shows where it navigated. */
export function renderWithProviders(ui: ReactNode, path = '/') {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false }, mutations: { retry: false } })
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <MemoryRouter initialEntries={[path]}>
          {ui}
          <Routes>
            <Route path="*" element={<CurrentPath />} />
          </Routes>
        </MemoryRouter>
      </SessionProvider>
    </QueryClientProvider>,
  )
}
