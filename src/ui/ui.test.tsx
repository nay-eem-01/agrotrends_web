import { render, screen } from '@testing-library/react'
import { Avatar, initials } from './Avatar'
import { Button } from './Button'
import { TextField } from './TextField'

test('initials take the first and last name, Bengali included', () => {
  expect(initials('Rahim Uddin Ahmed')).toBe('RA')
  expect(initials('  karim ')).toBe('K')
  expect(initials('')).toBe('?')
  expect(initials('রহিম উদ্দিন')).toBe('রউ')
})

test('avatar falls back to initials without a photo', () => {
  const { container } = render(<Avatar name="Nasrin Akter" />)
  expect(container).toHaveTextContent('NA')
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})

test('a loading button is disabled and busy', () => {
  render(<Button loading>Publish</Button>)
  const button = screen.getByRole('button', { name: 'Publish' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})

test('text field links its label and error', () => {
  render(<TextField label="Email" error="Invalid email." />)
  const input = screen.getByLabelText('Email')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Invalid email.')
})
