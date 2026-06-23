import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { dbApi } from '@/lib/dbApi'

export function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    dbApi.getSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data.summary)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || err.message)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h2>
        <p className="text-gray-600 mt-1">
          You're logged in as <span className="font-medium">{user?.roles?.[0]?.replace('_', ' ')}</span>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {['Users', 'Tasks', 'Tenants'].map((label, index) => {
          const value = summary ? [summary.userCount, summary.taskCount, summary.tenantCount][index] : null

          return (
            <div key={label} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <div className="mt-3 min-h-[3rem] flex items-center">
                {loading ? (
                  <div className="w-full animate-pulse">
                    <div className="h-10 max-w-[5rem] rounded-md bg-gray-200" />
                  </div>
                ) : (
                  <p className="text-3xl font-semibold text-gray-900">{value ?? '--'}</p>
                )}
              </div>
            </div>
          )
        })}
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-800">Unable to load summary</p>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <p className="mt-3 text-xs text-red-600">Refresh the page or try again later.</p>
        </div>
      ) : null}
    </div>
  )
}
