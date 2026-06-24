import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/analyticsApi'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

const STATUS_PALETTE = {
  'PENDING':     '#f59e0b',
  'IN PROGRESS': '#3b82f6',
  'COMPLETED':   '#10b981',
}

const PRIORITY_PALETTE = {
  HIGH:   '#ef4444',
  MEDIUM: '#3b82f6',
  LOW:    '#6b7280',
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-5 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,
    staleTime: 60_000,
  })

  const analytics = data?.data

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 text-sm">
        Failed to load analytics. Please refresh and try again.
      </div>
    )
  }

  const timelineWithLabel = analytics?.timeline?.map((r) => ({
    ...r,
    label: formatDate(r.date),
  })) || []

  // Summary stat strip
  const totalTasks = analytics?.byStatus?.reduce((s, r) => s + r.value, 0) ?? 0
  const completedCount = analytics?.byStatus?.find((r) => r.name === 'COMPLETED')?.value ?? 0
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const overdueTotal = analytics?.overdueByPriority?.reduce((s, r) => s + r.value, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Task performance and workload overview</p>
      </div>

      {/* KPI strip */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalTasks}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Completion Rate</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
              <p className="text-sm text-gray-400 mb-1">{completedCount} done</p>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className={`border rounded-xl p-4 shadow-sm ${overdueTotal > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs uppercase font-semibold tracking-wide ${overdueTotal > 0 ? 'text-red-500' : 'text-gray-500'}`}>Overdue Tasks</p>
            <p className={`text-3xl font-bold mt-1 ${overdueTotal > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdueTotal}</p>
            {overdueTotal > 0 && <p className="text-xs text-red-400 mt-1">needs immediate attention</p>}
          </div>
        </div>
      )}

      {/* Row 1: Area chart (timeline) */}
      {isLoading ? <SkeletonCard className="col-span-2" /> : (
        <Card title="Task Activity — Last 30 Days">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timelineWithLabel} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                interval={4}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCreated)" dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradCompleted)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Row 2: Pie (status) + Pie (priority) */}
      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <Card title="Tasks by Status">
              {analytics?.byStatus?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={analytics?.byStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      labelLine={false}
                      label={PieLabel}
                    >
                      {analytics?.byStatus?.map((entry, i) => (
                        <Cell key={i} fill={STATUS_PALETTE[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Tasks by Priority">
              {analytics?.byPriority?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={analytics?.byPriority}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      labelLine={false}
                      label={PieLabel}
                    >
                      {analytics?.byPriority?.map((entry, i) => (
                        <Cell key={i} fill={PRIORITY_PALETTE[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Row 3: Bar chart (workload by assignee) */}
      {isLoading ? <SkeletonCard /> : analytics?.byAssignee?.length > 0 && (
        <Card title="Workload by Assignee">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.byAssignee} margin={{ top: 4, right: 16, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                {analytics.byAssignee.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Row 4: Overdue breakdown table + status/priority detail table */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status breakdown table */}
        {isLoading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <Card title="Status Breakdown">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500 font-semibold">Status</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-semibold">Count</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analytics?.byStatus?.map((row) => {
                    const pct = totalTasks > 0 ? Math.round((row.value / totalTasks) * 100) : 0
                    const color = STATUS_PALETTE[row.name] || '#6b7280'
                    return (
                      <tr key={row.name}>
                        <td className="py-2.5 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {row.name}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-gray-800">{row.value}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            {/* Priority breakdown table */}
            <Card title="Priority Breakdown">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500 font-semibold">Priority</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-semibold">Total</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-semibold">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(['HIGH', 'MEDIUM', 'LOW']).map((p) => {
                    const row = analytics?.byPriority?.find((r) => r.name === p) || { value: 0 }
                    const overdue = analytics?.overdueByPriority?.find((r) => r.name === p)?.value || 0
                    const color = PRIORITY_PALETTE[p]
                    return (
                      <tr key={p}>
                        <td className="py-2.5 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {p}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-gray-800">{row.value}</td>
                        <td className="py-2.5 text-right">
                          {overdue > 0 ? (
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{overdue}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>

      {/* Top assignees table */}
      {!isLoading && analytics?.byAssignee?.length > 0 && (
        <Card title="Team Workload Table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">#</th>
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">Assignee</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Tasks Assigned</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Share of Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {analytics.byAssignee.map((row, i) => {
                const total = analytics.byAssignee.reduce((s, r) => s + r.count, 0)
                const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
                return (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-2.5 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        >
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        {row.name}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-gray-800">{row.count}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
