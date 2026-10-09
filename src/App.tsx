import { lazy, type ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './features/auth/RequireAuth'
import { NotFoundPage } from './features/errors/NotFoundPage'
import { HomePage } from './features/home/HomePage'
import { StoryPage } from './features/story/StoryPage'
import { AppLayout } from './layout/AppLayout'

// Home and the story page load with the app (most visits start there); every other page is fetched when first
// opened. The editor (Tiptap) is the largest of them. AppLayout's Suspense shows a spinner meanwhile.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const AdvisorHistoryPage = page(() => import('./features/ai/AdvisorHistoryPage'), 'AdvisorHistoryPage')
const AdvisorPage = page(() => import('./features/ai/AdvisorPage'), 'AdvisorPage')
const AuthorPage = page(() => import('./features/authors/AuthorPage'), 'AuthorPage')
const ForgotPasswordPage = page(() => import('./features/auth/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = page(() => import('./features/auth/ResetPasswordPage'), 'ResetPasswordPage')
const SignInPage = page(() => import('./features/auth/SignInPage'), 'SignInPage')
const SignUpPage = page(() => import('./features/auth/SignUpPage'), 'SignUpPage')
const LibraryPage = page(() => import('./features/library/LibraryPage'), 'LibraryPage')
const MyStoriesPage = page(() => import('./features/mystories/MyStoriesPage'), 'MyStoriesPage')
const AskPage = page(() => import('./features/qa/AskPage'), 'AskPage')
const QuestionPage = page(() => import('./features/qa/QuestionPage'), 'QuestionPage')
const QuestionsPage = page(() => import('./features/qa/QuestionsPage'), 'QuestionsPage')
const SettingsPage = page(() => import('./features/settings/SettingsPage'), 'SettingsPage')
const SearchPage = page(() => import('./features/search/SearchPage'), 'SearchPage')
const StoryById = page(() => import('./features/story/StoryById'), 'StoryById')
const TagPage = page(() => import('./features/topics/TagPage'), 'TagPage')
const TopicsPage = page(() => import('./features/topics/TopicsPage'), 'TopicsPage')
const AdminCategoriesPage = page(() => import('./features/admin/AdminCategoriesPage'), 'AdminCategoriesPage')
const EditorPage = page(() => import('./features/editor/EditorPage'), 'EditorPage')

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/stories/:slug" element={<StoryPage />} />
        <Route path="/s/:blogId" element={<StoryById />} />
        <Route path="/authors/:authorId" element={<AuthorPage />} />
        <Route path="/tags/:tagName" element={<TagPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/questions/:questionId" element={<QuestionPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/write" element={<EditorPage />} />
          <Route path="/write/:blogId" element={<EditorPage />} />
          <Route path="/questions/ask" element={<AskPage />} />
          <Route path="/questions/:questionId/edit" element={<AskPage />} />
          <Route path="/advisor/history" element={<AdvisorHistoryPage />} />
          <Route path="/me/stories" element={<MyStoriesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
