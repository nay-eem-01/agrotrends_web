import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { vi } from 'vitest'
import { Avatar, initials } from './Avatar'
import { Button } from './Button'
import { Chip } from './Chip'
import { SearchSelect } from './SearchSelect'
import { TagList } from './TagList'
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

test('a selected chip shows a tick as well as its colour', () => {
  const { container } = render(<Chip selected>rice</Chip>)
  expect(container.querySelector('svg')).not.toBeNull()
  expect(render(<Chip>jute</Chip>).container.querySelector('svg')).toBeNull()
})

const topics = [
  { value: '1', label: 'Rice' },
  { value: '2', label: 'Fisheries' },
  { value: '3', label: 'Potato' },
]

function TopicPicker({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <SearchSelect
      label="Topic"
      placeholder="Choose a topic"
      value={value}
      options={topics}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

test('search select filters by typing and picks an option', async () => {
  const onChange = vi.fn()
  render(<TopicPicker onChange={onChange} />)
  const input = screen.getByRole('combobox', { name: 'Topic' })
  await userEvent.type(input, 'fish')
  const listbox = await screen.findByRole('listbox')
  expect(within(listbox).queryByRole('option', { name: 'Rice' })).toBeNull()
  await userEvent.click(within(listbox).getByRole('option', { name: 'Fisheries' }))
  expect(onChange).toHaveBeenLastCalledWith('2')
  expect(input).toHaveValue('Fisheries')
})

test('search select says when nothing matches, and clears back to none', async () => {
  const onChange = vi.fn()
  render(<TopicPicker onChange={onChange} />)
  const input = screen.getByRole('combobox', { name: 'Topic' })
  await userEvent.type(input, 'zzz')
  expect(await screen.findByText('Nothing matches')).toBeInTheDocument()
  await userEvent.clear(input)
  await userEvent.type(input, 'pot')
  await userEvent.click(await screen.findByRole('option', { name: 'Potato' }))
  await userEvent.click(screen.getByRole('button', { name: 'Clear Topic' }))
  expect(onChange).toHaveBeenLastCalledWith('')
})

test('search select links its error', () => {
  render(<SearchSelect label="Topic" placeholder="Choose" value="" options={topics} error="Choose a topic." onChange={() => {}} />)
  const input = screen.getByRole('combobox', { name: 'Topic' })
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Choose a topic.')
})

const tagItems = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `tag${i + 1}`, to: `/questions?tag=tag${i + 1}` }))

function renderTags(n: number) {
  return render(
    <MemoryRouter>
      <TagList items={tagItems(n)} label="Tags" />
    </MemoryRouter>,
  )
}

test('the tag list shows up to three tags, then +N', async () => {
  expect(renderTags(0).container).toBeEmptyDOMElement()
  for (const n of [1, 3]) {
    const { unmount } = renderTags(n)
    expect(screen.getAllByRole('link')).toHaveLength(n)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    unmount()
  }
  const { unmount } = renderTags(4)
  expect(screen.getAllByRole('link')).toHaveLength(3)
  expect(await screen.findByRole('button', { name: 'Show 1 more tags' })).toHaveTextContent('+1')
  unmount()
})

test('+N opens every tag in a popover, and Escape closes it', async () => {
  renderTags(7)
  expect(screen.getAllByRole('link')).toHaveLength(3)
  await userEvent.click(await screen.findByRole('button', { name: 'Show 4 more tags' }))
  const popover = await screen.findByRole('dialog')
  expect(within(popover).getAllByRole('link')).toHaveLength(7)
  expect(within(popover).getByRole('link', { name: 'tag7' })).toHaveAttribute('href', '/questions?tag=tag7')
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})
