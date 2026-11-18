import { render, screen } from '@testing-library/react'
import { AiAnswerText } from './AiAnswerText'

test('renders Markdown and citations and strips unsafe links and raw HTML handlers', () => {
  const { container } = render(
    <AiAnswerText text={'## Rice\n\n- **Scout** today [1].\n- Add water.\n\n[Unsafe](javascript:alert%281%29) <img src="x" onerror="alert(1)">'} sources={1} />,
  )
  expect(screen.getByRole('heading', { name: 'Rice' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(container.querySelector('strong')).toHaveTextContent('Scout')
  expect(container.querySelector('sup')).toHaveTextContent('1')
  expect(container.querySelector('a')).not.toHaveAttribute('href')
  expect(container.querySelector('img')).not.toHaveAttribute('onerror')
})
