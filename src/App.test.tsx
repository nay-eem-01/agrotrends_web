import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

test('renders the home page', () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'AgroTrends' })).toBeInTheDocument()
})

test('unknown paths show not found', () => {
  renderAt('/nowhere')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})
