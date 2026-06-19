import { useState } from 'react'
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

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

const STATUS_COLORS = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
}

export function TasksPage() {
  const { hasRole } = useAuth()
  const isSuperAdmin = hasRole('SUPER_ADMIN')
  const isAdmin = hasRole('ADMIN')
  const isStaff = hasRole('STAFF') && !isSuperAdmin && !isAdmin
  const canManage = isSuperAdmin || isAdmin

  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    dueDate: '',
    tenantId: '',
    assignedToId: '',
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', search, statusFilter],
    queryFn: () =>
      taskApi.list({
        search,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
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

  const createMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      toast.success('Task created successfully')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create task'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskApi.update(id, data),
    onSuccess: () => {
      toast.success('Task updated successfully')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update task'),
  })

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      toast.success('Task deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete task'),
  })

  function openCreateDialog() {
    setEditingTask(null)
    setForm({
      title: '',
      description: '',
      status: 'PENDING',
      dueDate: '',
      tenantId: '',
      assignedToId: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(task) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
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
      // Staff can only update status
      updateMutation.mutate({ id: editingTask.id, data: { status: form.status } })
      return
    }

    if (editingTask) {
      const { title, description, status, dueDate, assignedToId } = form
      updateMutation.mutate({
        id: editingTask.id,
        data: {
          title,
          description,
          status,
          dueDate: dueDate || null,
          assignedToId: assignedToId || null,
        },
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

  // Filter assignable users to the selected tenant (for Super Admin creating tasks)
  const assignableUsers = usersData?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        {canManage && <Button onClick={openCreateDialog}>+ New Task</Button>}
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {isError && <p className="text-red-600">Failed to load tasks.</p>}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
            {data?.data?.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[task.status]}>{task.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>{task.assignedTo?.name || '—'}</TableCell>
                <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(task)}>
                    {isStaff ? 'Update Status' : 'Edit'}
                  </Button>
                  {canManage && (
                    <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(task)}>
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? (isStaff ? 'Update Task Status' : 'Edit Task') : 'New Task'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff editing: status only */}
            {isStaff && editingTask ? (
              <div>
                <Label className="mb-2">Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
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
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-2">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-2">Status</Label>
                  <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Select value={form.tenantId} onValueChange={(val) => setForm({ ...form, tenantId: val, assignedToId: '' })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenantsData?.data?.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
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
                      {assignableUsers
                        .filter((u) => !form.tenantId || u.tenantId === form.tenantId)
                        .map((u) => (
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
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
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
            Are you sure you want to delete <span className="font-medium">{deleteTarget?.title}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
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
