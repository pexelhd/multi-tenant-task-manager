import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskApi } from '@/lib/taskApi'
import { userApi } from '@/lib/userApi'
import { tenantApi } from '@/lib/tenantApi'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

const STATUS_COLORS = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
}

const PRIORITY_COLORS = {
  HIGH: 'destructive',
  MEDIUM: 'default',
  LOW: 'secondary',
}

const PRIORITY_SORT_WEIGHT = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function dueDateLabel(dateStr, status) {
  if (!dateStr) return null
  const due = new Date(dateStr)
  const now = new Date()
  const diffMs = due - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const isOverdue = diffMs < 0 && status !== 'COMPLETED'

  if (isOverdue) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true }
  if (diffDays === 0) return { label: 'Due today', overdue: false, urgent: true }
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false, urgent: true }
  if (diffDays <= 3) return { label: `${diffDays}d left`, overdue: false, urgent: true }
  return { label: due.toLocaleDateString(), overdue: false, urgent: false }
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useState(null)
  const set = useCallback(
    (v) => {
      clearTimeout(timerRef[0])
      timerRef[0] = setTimeout(() => setDebounced(v), delay)
    },
    [delay, timerRef]
  )
  return [debounced, set]
}

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'PENDING',
  priority: 'MEDIUM',
  dueDate: '',
  tenantId: '',
  assignedToId: '',
}

export function TasksPage() {
  const { hasRole } = useAuth()
  const isSuperAdmin = hasRole('SUPER_ADMIN')
  const isAdmin = hasRole('ADMIN')
  const isStaff = hasRole('STAFF') && !isSuperAdmin && !isAdmin
  const canManage = isSuperAdmin || isAdmin

  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useDebounce('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('DESC')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTask, setDetailTask] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setDebouncedSearch(e.target.value)
    setPage(1)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', debouncedSearch, statusFilter, priorityFilter, page, sortBy, sortOrder],
    queryFn: () =>
      taskApi.list({
        search: debouncedSearch || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      }),
    keepPreviousData: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => userApi.list({ limit: 100 }),
    enabled: canManage,
  })

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-all'],
    queryFn: () => tenantApi.list({ limit: 100 }),
    enabled: isSuperAdmin,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] })

  const createMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => { toast.success('Task created'); invalidate(); closeDialog() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create task'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskApi.update(id, data),
    onSuccess: () => { toast.success('Task updated'); invalidate(); closeDialog() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update task'),
  })

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => { toast.success('Task deleted'); invalidate(); setDeleteTarget(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete task'),
  })

  function openCreateDialog() {
    setEditingTask(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(task, e) {
    e?.stopPropagation()
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      tenantId: task.tenantId || '',
      assignedToId: task.assignedToId || '',
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingTask(null)
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (isStaff && editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: { status: form.status } })
      return
    }

    if (editingTask) {
      const { title, description, status, priority, dueDate, assignedToId } = form
      updateMutation.mutate({
        id: editingTask.id,
        data: { title, description, status, priority, dueDate: dueDate || null, assignedToId: assignedToId || null },
      })
    } else {
      createMutation.mutate({
        ...form,
        dueDate: form.dueDate || null,
        tenantId: form.tenantId || undefined,
        assignedToId: form.assignedToId || null,
      })
    }
  }

  function toggleSort(col) {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setSortBy(col)
      setSortOrder('DESC')
    }
    setPage(1)
  }

  const assignableUsers = (usersData?.data || []).filter(
    (u) => !form.tenantId || u.tenantId === form.tenantId
  )

  const tasks = data?.data || []
  const pagination = data?.pagination

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="ml-1 opacity-30">↕</span>
    return <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        {canManage && <Button onClick={openCreateDialog}>+ New Task</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch(''); setDebouncedSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); setPage(1)
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load tasks. Please refresh and try again.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {tasks.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-base font-medium text-gray-500">No tasks found</p>
              <p className="text-sm mt-1">
                {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : canManage ? 'Create your first task to get started' : 'No tasks have been assigned to you yet'}
              </p>
              {canManage && !search && statusFilter === 'ALL' && priorityFilter === 'ALL' && (
                <Button className="mt-4" onClick={openCreateDialog}>+ New Task</Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead
                      className="cursor-pointer select-none hover:text-gray-900"
                      onClick={() => toggleSort('title')}
                    >
                      Title <SortIcon col="title" />
                    </TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:text-gray-900"
                      onClick={() => toggleSort('dueDate')}
                    >
                      Due <SortIcon col="dueDate" />
                    </TableHead>
                    {isSuperAdmin && <TableHead>Tenant</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const dueInfo = dueDateLabel(task.dueDate, task.status)
                    const rowOverdue = dueInfo?.overdue
                    return (
                      <TableRow
                        key={task.id}
                        className={`cursor-pointer transition-colors ${rowOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                        onClick={() => setDetailTask(task)}
                      >
                        <TableCell className="font-medium max-w-[200px]">
                          <span className={`truncate block ${rowOverdue ? 'text-red-700' : ''}`}>
                            {rowOverdue && '⚠️ '}
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-xs text-gray-400 truncate block">{task.description}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={PRIORITY_COLORS[task.priority] || 'secondary'}>
                            {task.priority || 'MEDIUM'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_COLORS[task.status]}>{task.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {task.assignedTo?.name || <span className="text-gray-400">Unassigned</span>}
                        </TableCell>
                        <TableCell>
                          {dueInfo ? (
                            <span className={`text-xs font-medium ${dueInfo.overdue ? 'text-red-600' : dueInfo.urgent ? 'text-amber-600' : 'text-gray-500'}`}>
                              {dueInfo.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-xs text-gray-500">{task.tenant?.name || '—'}</TableCell>
                        )}
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={(e) => openEditDialog(task, e)}>
                            {isStaff ? 'Update' : 'Edit'}
                          </Button>
                          {canManage && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(task) }}
                            >
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Task Detail Drawer */}
      <Sheet open={!!detailTask} onOpenChange={(open) => !open && setDetailTask(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[480px]">
          {detailTask && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex gap-2 mb-1">
                  <Badge variant={PRIORITY_COLORS[detailTask.priority] || 'secondary'}>
                    {detailTask.priority || 'MEDIUM'} Priority
                  </Badge>
                  <Badge variant={STATUS_COLORS[detailTask.status]}>
                    {detailTask.status.replace('_', ' ')}
                  </Badge>
                </div>
                <SheetTitle className="text-lg leading-snug">{detailTask.title}</SheetTitle>
              </SheetHeader>

              <div className="space-y-5 text-sm">
                {detailTask.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{detailTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assigned To</p>
                    <p className="text-gray-800">{detailTask.assignedTo?.name || 'Unassigned'}</p>
                    {detailTask.assignedTo?.email && (
                      <p className="text-xs text-gray-400">{detailTask.assignedTo.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created By</p>
                    <p className="text-gray-800">{detailTask.createdBy?.name || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                    {detailTask.dueDate ? (() => {
                      const info = dueDateLabel(detailTask.dueDate, detailTask.status)
                      return (
                        <div>
                          <p className="text-gray-800">{new Date(detailTask.dueDate).toLocaleDateString()}</p>
                          {info && (
                            <p className={`text-xs font-medium ${info.overdue ? 'text-red-600' : info.urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                              {info.label}
                            </p>
                          )}
                        </div>
                      )
                    })() : <p className="text-gray-400">No due date</p>}
                  </div>
                  {isSuperAdmin && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tenant</p>
                      <p className="text-gray-800">{detailTask.tenant?.name || '—'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</p>
                  <p className="text-gray-700">{new Date(detailTask.createdAt).toLocaleString()}</p>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => { openEditDialog(detailTask); setDetailTask(null) }}
                  >
                    {isStaff ? 'Update Status' : 'Edit Task'}
                  </Button>
                  {canManage && (
                    <Button
                      variant="destructive"
                      onClick={() => { setDeleteTarget(detailTask); setDetailTask(null) }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? (isStaff ? 'Update Task Status' : 'Edit Task') : 'New Task'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isStaff && editingTask ? (
              <div>
                <Label className="mb-2">Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="title" className="mb-2">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="Task title..."
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-2">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-2">Priority</Label>
                    <Select value={form.priority} onValueChange={(val) => setForm({ ...form, priority: val })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2">Status</Label>
                    <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="dueDate" className="mb-2">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
                {isSuperAdmin && !editingTask && (
                  <div>
                    <Label className="mb-2">Tenant</Label>
                    <Select
                      value={form.tenantId}
                      onValueChange={(val) => setForm({ ...form, tenantId: val, assignedToId: '' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenantsData?.data?.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="mb-2">Assign To</Label>
                  <Select
                    value={form.assignedToId}
                    onValueChange={(val) => setForm({ ...form, assignedToId: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role.replace('_', ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold">"{deleteTarget?.title}"</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
