import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { useCustomers } from '@/hooks/useCustomers'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import client from '@/api/client'

export function Customers() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { customers, loading, error } = useCustomers(debouncedSearch)
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const deleteMutation = useMutation<void, AxiosError<{ detail?: string }>, number>({
    mutationFn: async (id: number) => {
      await client.delete(`/customers/${id}`)
    },
    onSuccess: () => {
      toast.success('Customer deleted')
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      setDeleteId(null)
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.message
      toast.error(msg ?? 'Failed to delete customer')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-semibold">Customers</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Customer
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search customers by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading customers…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={4} className="text-center text-destructive py-8">{error}</TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
            ) : customers.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(c.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={() => {
            setDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: queryKeys.customers })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
          }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteId !== null) {
                  deleteMutation.mutate(deleteId)
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
