import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { expect } from 'vitest'
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

/**
 * Picks `option` in a searchable select (SearchSelect) by typing the start of it, then choosing it from the list.
 * Pass the test's `user` when it was set up with fake timers.
 */
export async function chooseOption(input: HTMLElement, option: string, user: UserEvent = userEvent.setup()) {
  await waitFor(() => expect(input).toBeEnabled())
  await user.clear(input)
  await user.type(input, option.slice(0, 3))
  await user.click(await screen.findByRole('option', { name: option }))
}

/** Picks `option` in a shadcn Select (season, soil…): opens it, then chooses the option. */
export async function pickOption(trigger: HTMLElement, option: string, user: UserEvent = userEvent.setup()) {
  await user.click(trigger)
  await user.click(await screen.findByRole('option', { name: option }))
}
