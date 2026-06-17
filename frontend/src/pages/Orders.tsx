import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { OrderForm } from '@/components/orders/OrderForm'
import { useOrders } from '@/hooks/useOrders'
import client from '@/api/client'

export function Orders() {
  const { orders, loading, error } = useOrders()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const deleteMutation = useMutation<void, AxiosError<{ detail?: string }>, number>({
    mutationFn: async (id: number) => {
      await client.delete(`/orders/${id}`)
    },
    onSuccess: () => {
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      queryClient.invalidateQueries({ queryKey: queryKeys.products })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      setDeleteId(null)
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.message
      toast.error(msg ?? 'Failed to cancel order')
    },
  })

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-semibold">Orders</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Order
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead className="hidden md:table-cell">Customer ID</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders yet</TableCell></TableRow>
            )}
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">#{o.id}</TableCell>
                <TableCell className="hidden md:table-cell">{o.customer_id}</TableCell>
                <TableCell>${Number(o.total_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{o.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(o.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {/* Base UI Button uses render prop instead of asChild */}
                    <Button variant="ghost" size="icon" render={<Link to={`/orders/${o.id}`} />}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(o.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>
          <OrderForm onSuccess={() => {
            setDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: queryKeys.orders })
            queryClient.invalidateQueries({ queryKey: queryKeys.products })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
          }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action will restore product quantities and cannot be undone.
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
              {deleteMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
