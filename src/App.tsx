import { Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main>
      <h1>AgroTrends</h1>
      <p>Farming knowledge from people who grow it.</p>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
