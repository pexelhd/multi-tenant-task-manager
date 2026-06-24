import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { ChatWidget } from '@/components/ChatWidget'
import { dbApi } from '@/lib/dbApi'

const NAV_ICONS = {
  '/analytics': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  '/': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  '/tenants': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  '/users': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  '/tasks': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
}

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/analytics': 'Analytics',
  '/tenants': 'Tenants',
  '/users': 'Users',
  '/tasks': 'Tasks',
}

const navItems = [
  { to: '/', label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
  { to: '/analytics', label: 'Analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
  { to: '/tenants', label: 'Tenants', roles: ['SUPER_ADMIN'] },
  { to: '/users', label: 'Users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/tasks', label: 'Tasks', roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
]

function Breadcrumb() {
  const location = useLocation()
  const label = ROUTE_LABELS[location.pathname] || location.pathname.replace('/', '')
  if (location.pathname === '/') return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
      <span>Home</span>
      <span>/</span>
      <span className="text-gray-600 font-medium">{label}</span>
    </div>
  )
}

export function Layout() {
  const { user, logout, hasRole } = useAuth()

  const { data: summaryData } = useQuery({
    queryKey: ['db-summary'],
    queryFn: () => dbApi.getSummary(),
    staleTime: 60_000,
  })

  const overdueCount = summaryData?.summary?.overdueCount || 0
  const roleLabel = user?.roles?.[0]?.replace(/_/g, ' ') || ''

  const ROLE_COLORS = {
    'SUPER ADMIN': 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-gray-100 text-gray-600',
  }
  const roleBadgeColor = ROLE_COLORS[roleLabel] || 'bg-gray-100 text-gray-600'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            TM
          </div>
          <h1 className="text-base font-bold text-gray-900">Task Manager</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems
            .filter((item) => hasRole(...item.roles))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>
                      {NAV_ICONS[item.to]}
                    </span>
                    <span>{item.label}</span>
                    {item.to === '/tasks' && overdueCount > 0 && (
                      <span className={cn(
                        'ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full',
                        isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                      )}>
                        {overdueCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase', roleBadgeColor)}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto min-h-screen">
        <Breadcrumb />
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  )
}
