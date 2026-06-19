import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children, roles }) {
  const { initialized, authenticated, hasRole } = useAuth()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">403 — You don't have access to this page.</p>
      </div>
    )
  }

  return children
}
