import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userApi } from '@/lib/userApi'
import { tenantApi } from '@/lib/tenantApi'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF']

export function UsersPage() {
  const { hasRole } = useAuth()
  const isSuperAdmin = hasRole('SUPER_ADMIN')
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [form, setForm] = useState({
    keycloakId: '',
    email: '',
    name: '',
    role: 'STAFF',
    tenantId: '',
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', search],
    queryFn: () => userApi.list({ search }),
  })

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-all'],
    queryFn: () => tenantApi.list({ limit: 100 }),
    enabled: isSuperAdmin,
  })

  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user'),
  })

  const deleteMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user'),
  })

  function openCreateDialog() {
    setEditingUser(null)
    setForm({ keycloakId: '', email: '', name: '', role: 'STAFF', tenantId: '' })
    setDialogOpen(true)
  }

  function openEditDialog(user) {
    setEditingUser(user)
    setForm({
      keycloakId: user.keycloakId,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId || '',
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingUser(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editingUser) {
      const { email, name, role, tenantId } = form
      updateMutation.mutate({ id: editingUser.id, data: { email, name, role, tenantId: tenantId || null } })
    } else {
      createMutation.mutate({ ...form, tenantId: form.tenantId || null })
    }
  }

  const availableRoles = isSuperAdmin ? ALL_ROLES : ['ADMIN', 'STAFF']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Users</h2>
        <Button onClick={openCreateDialog}>+ New User</Button>
      </div>

      <Input
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {isError && <p className="text-red-600">Failed to load users.</p>}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {data?.data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.role.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>{u.tenant?.name || '—'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(u)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(u)}>
                    Delete
                  </Button>
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
            <DialogTitle>{editingUser ? 'Edit User' : 'New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingUser && (
              <div>
                <Label htmlFor="keycloakId" className="mb-2">Keycloak User ID</Label>
                <Input
                  id="keycloakId"
                  value={form.keycloakId}
                  onChange={(e) => setForm({ ...form, keycloakId: e.target.value })}
                  placeholder="UUID from Keycloak"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="name" className="mb-2">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="mb-2">Role</Label>
              <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isSuperAdmin && form.role !== 'SUPER_ADMIN' && (
              <div>
                <Label className="mb-2">Tenant</Label>
                <Select value={form.tenantId} onValueChange={(val) => setForm({ ...form, tenantId: val })}>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>?
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
