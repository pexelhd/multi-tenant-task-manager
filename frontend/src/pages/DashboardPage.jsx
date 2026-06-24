import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { dbApi } from '@/lib/dbApi'
import { taskApi } from '@/lib/taskApi'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function StatCard({ label, value, sub, color = 'blue', loading, onClick }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    gray: 'border-gray-200 bg-white text-gray-700',
  }
  return (
    <div
      onClick={onClick}
      className={`p-5 border rounded-xl shadow-sm transition-all ${colors[color]} ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <div className="mt-2 min-h-[2.5rem] flex items-end gap-2">
        {loading ? (
          <div className="w-16 h-8 animate-pulse rounded bg-current opacity-20" />
        ) : (
          <p className="text-3xl font-bold">{value ?? '--'}</p>
        )}
      </div>
      {sub && !loading && (
        <p className="mt-1 text-xs opacity-60">{sub}</p>
      )}
    </div>
  )
}

function StatusBar({ pending, inProgress, completed, total }) {
  if (!total) return null
  const pct = (n) => Math.round((n / total) * 100)
  return (
    <div className="mt-2">
      <div className="flex rounded-full overflow-hidden h-2 bg-gray-100">
        <div className="bg-amber-400 transition-all" style={{ width: `${pct(pending)}%` }} title={`Pending: ${pending}`} />
        <div className="bg-blue-500 transition-all" style={{ width: `${pct(inProgress)}%` }} title={`In Progress: ${inProgress}`} />
        <div className="bg-green-500 transition-all" style={{ width: `${pct(completed)}%` }} title={`Completed: ${completed}`} />
      </div>
      <div className="flex gap-4 mt-1 text-xs text-gray-500">
        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />Pending {pct(pending)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />In Progress {pct(inProgress)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Done {pct(completed)}%</span>
      </div>
    </div>
  )
}

const PRIORITY_COLORS = {
  HIGH: 'destructive',
  MEDIUM: 'default',
  LOW: 'secondary',
}

const STATUS_COLORS = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
}

export function DashboardPage() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const canManage = hasRole('SUPER_ADMIN') || hasRole('ADMIN')

  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['db-summary'],
    queryFn: () => dbApi.getSummary(),
    staleTime: 30_000,
  })

  const { data: recentTasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-recent'],
    queryFn: () => taskApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' }),
    staleTime: 30_000,
  })

  const summary = summaryData?.summary

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {(['SUPER_ADMIN','ADMIN','STAFF'].find(r => user?.roles?.includes(r)) || user?.roles?.[0] || '').replace(/_/g, ' ')} &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/tasks')}>+ New Task</Button>
        )}
      </div>

      {/* Top-level stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={summary?.taskCount}
          sub={`${summary?.completedCount ?? 0} completed`}
          color="blue"
          loading={summaryLoading}
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          label="In Progress"
          value={summary?.inProgressCount}
          sub="actively being worked"
          color="purple"
          loading={summaryLoading}
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          label="Overdue"
          value={summary?.overdueCount}
          sub={summary?.overdueCount > 0 ? 'needs attention' : 'all on track'}
          color={summary?.overdueCount > 0 ? 'red' : 'green'}
          loading={summaryLoading}
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          label="High Priority Open"
          value={summary?.highPriorityCount}
          sub="not yet completed"
          color={summary?.highPriorityCount > 0 ? 'amber' : 'green'}
          loading={summaryLoading}
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Admin-level stats row */}
      {hasRole('SUPER_ADMIN') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total Users" value={summary?.userCount} color="gray" loading={summaryLoading} onClick={() => navigate('/users')} />
          <StatCard label="Tenants" value={summary?.tenantCount} color="gray" loading={summaryLoading} onClick={() => navigate('/tenants')} />
        </div>
      )}

      {/* Task status breakdown bar */}
      {!summaryLoading && summary && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Task Status Breakdown</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            {[
              { label: 'Pending', count: summary.pendingCount, color: 'text-amber-600 bg-amber-50' },
              { label: 'In Progress', count: summary.inProgressCount, color: 'text-blue-600 bg-blue-50' },
              { label: 'Completed', count: summary.completedCount, color: 'text-green-600 bg-green-50' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
                <p className="text-2xl font-bold">{count ?? 0}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <StatusBar
            pending={summary.pendingCount}
            inProgress={summary.inProgressCount}
            completed={summary.completedCount}
            total={summary.taskCount}
          />
        </div>
      )}

      {/* Recent tasks */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Tasks</h3>
          <button onClick={() => navigate('/tasks')} className="text-xs text-blue-600 hover:underline">
            View all
          </button>
        </div>
        {tasksLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3 items-center">
                <div className="h-4 w-4 rounded bg-gray-200" />
                <div className="h-4 flex-1 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : recentTasksData?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm">No tasks yet. Create your first one!</p>
            {canManage && (
              <Button className="mt-3" size="sm" onClick={() => navigate('/tasks')}>
                + New Task
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentTasksData?.data?.map((task) => {
              const isOverdue =
                task.dueDate &&
                task.status !== 'COMPLETED' &&
                new Date(task.dueDate) < new Date()
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/tasks')}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>
                      {isOverdue && <span className="mr-1">⚠️</span>}
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned'}
                      {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant={PRIORITY_COLORS[task.priority]} className="text-xs">
                      {task.priority}
                    </Badge>
                    <Badge variant={STATUS_COLORS[task.status]} className="text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {summaryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load summary data. Refresh or try again later.
        </div>
      )}
    </div>
  )
}
