import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { ChatWidget } from '@/components/ChatWidget'

const navItems = [
  { to: '/', label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
  { to: '/tenants', label: 'Tenants', roles: ['SUPER_ADMIN'] },
  { to: '/users', label: 'Users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/tasks', label: 'Tasks', roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
]

export function Layout() {
  const { user, logout, hasRole } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter((item) => hasRole(...item.roles))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500 mb-3">{user?.roles?.[0]?.replace('_', ' ')}</p>
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  )
}
