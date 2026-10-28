import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { AppShell } from './components/AppShell'
import { AddShowPage } from './pages/AddShowPage'
import { DiaryPage } from './pages/DiaryPage'
import { ForYouPage } from './pages/ForYouPage'
import { LoginPage } from './pages/LoginPage'
import { SetupPage } from './pages/SetupPage'
import { ShowPage } from './pages/ShowPage'
import { StatsPage } from './pages/StatsPage'
import { isConfigured } from './lib/supabase'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? <Outlet /> : <LoginPage />
}

const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DiaryPage /> },
          { path: 'fuer-dich', element: <ForYouPage /> },
          { path: 'statistik', element: <StatsPage /> },
        ],
      },
      { path: 'neu', element: <AddShowPage /> },
      { path: 'show/:id', element: <ShowPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  if (!isConfigured) return <SetupPage />
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
