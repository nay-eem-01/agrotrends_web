import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { Button } from './Button'

afterEach(() => vi.useRealTimers())

test('a submit button announces the action immediately and delays the spinner', () => {
  vi.useFakeTimers()
  const { rerender } = render(<Button pendingLabel="Posting question…">Post question</Button>)
  expect(screen.getByRole('button', { name: 'Post question' })).toBeEnabled()

  rerender(<Button loading pendingLabel="Posting question…">Post question</Button>)
  const button = screen.getByRole('button', { name: 'Posting question…' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('status')).toHaveTextContent('Posting question…')
  expect(button.querySelector('svg')).toBeNull()

  act(() => vi.advanceTimersByTime(1000))
  expect(button.querySelector('svg')).toBeInTheDocument()

  rerender(<Button pendingLabel="Posting question…">Post question</Button>)
  expect(screen.getByRole('button', { name: 'Post question' })).toBeEnabled()
  expect(button.querySelector('svg')).toBeNull()
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
})
