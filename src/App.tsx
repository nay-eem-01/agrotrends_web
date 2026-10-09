import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthorPage } from './features/authors/AuthorPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { SignInPage } from './features/auth/SignInPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { LibraryPage } from './features/library/LibraryPage'
import { MyStoriesPage } from './features/mystories/MyStoriesPage'
import { NotFoundPage } from './features/errors/NotFoundPage'
import { HomePage } from './features/home/HomePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { SearchPage } from './features/search/SearchPage'
import { StoryPage } from './features/story/StoryPage'
import { TagPage } from './features/topics/TagPage'
import { TopicsPage } from './features/topics/TopicsPage'
import { AppLayout } from './layout/AppLayout'
import { Spinner } from './ui/Spinner'

// The editor (Tiptap) is most of the bundle; only writers download it.
const EditorPage = lazy(() => import('./features/editor/EditorPage').then((m) => ({ default: m.EditorPage })))

const editor = (
  <Suspense
    fallback={
      <div className="flex justify-center py-24 text-ink-muted">
        <Spinner label="Loading editor" />
      </div>
    }
  >
    <EditorPage />
  </Suspense>
)

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/stories/:slug" element={<StoryPage />} />
        <Route path="/authors/:authorId" element={<AuthorPage />} />
        <Route path="/tags/:tagName" element={<TagPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/write" element={editor} />
          <Route path="/write/:blogId" element={editor} />
          <Route path="/me/stories" element={<MyStoriesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
