import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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
  // The app's own defaults (staleTime and the rest), without retries so failures show at once.
  const defaults = queryClient.getDefaultOptions()
  queryClient.setDefaultOptions({ queries: { ...defaults.queries, retry: false }, mutations: { ...defaults.mutations, retry: false } })
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

/** Opens a post's "More actions" menu (the one inside `scope`, when given) and returns the open menu. */
export async function openMoreActions(scope: HTMLElement = document.body, user: UserEvent = userEvent.setup()) {
  // The menu loads lazily, so wait for its button.
  await user.click((await within(scope).findAllByRole('button', { name: 'More actions' }))[0])
  return within(await screen.findByRole('menu'))
}
