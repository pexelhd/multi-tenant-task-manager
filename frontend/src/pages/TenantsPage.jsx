import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantApi } from '@/lib/tenantApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'

export function TenantsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [name, setName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenants', search],
    queryFn: () => tenantApi.list({ search }),
  })

  const createMutation = useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      toast.success('Tenant created successfully')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create tenant'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tenantApi.update(id, data),
    onSuccess: () => {
      toast.success('Tenant updated successfully')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update tenant'),
  })

  const deleteMutation = useMutation({
    mutationFn: tenantApi.delete,
    onSuccess: () => {
      toast.success('Tenant deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete tenant'),
  })

  function openCreateDialog() {
    setEditingTenant(null)
    setName('')
    setDialogOpen(true)
  }

  function openEditDialog(tenant) {
    setEditingTenant(tenant)
    setName(tenant.name)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingTenant(null)
    setName('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data: { name } })
    } else {
      createMutation.mutate({ name })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tenants</h2>
        <Button onClick={openCreateDialog}>+ New Tenant</Button>
      </div>

      <Input
        placeholder="Search tenants..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {isError && <p className="text-red-600">Failed to load tenants.</p>}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  No tenants found.
                </TableCell>
              </TableRow>
            )}
            {data?.data?.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(tenant)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(tenant)}
                  >
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
            <DialogTitle>{editingTenant ? 'Edit Tenant' : 'New Tenant'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2">Tenant Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingTenant ? 'Save Changes' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>? This action cannot be undone.
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
