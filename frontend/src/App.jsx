import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { TenantsPage } from '@/pages/TenantsPage'
import { UsersPage } from '@/pages/UsersPage'
import { TasksPage } from '@/pages/TasksPage'

function LoginPage() {
  const { login } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Task Manager</h1>
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login with SSO
        </button>
      </div>
    </div>
  )
}

function App() {
  const { initialized, authenticated } = useAuth()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={authenticated ? <Navigate to="/" /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="tenants"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <TenantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'STAFF']}>
              <TasksPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
