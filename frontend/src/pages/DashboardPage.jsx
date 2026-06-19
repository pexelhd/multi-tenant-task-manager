import { useAuth } from '@/context/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.name}</h2>
      <p className="text-gray-600">
        You're logged in as <span className="font-medium">{user?.roles?.[0]?.replace('_', ' ')}</span>.
      </p>
    </div>
  )
}
