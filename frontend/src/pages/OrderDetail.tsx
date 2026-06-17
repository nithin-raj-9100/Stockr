import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import client from '@/api/client'
import type { Order } from '@/types'

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: order, isLoading: loading, error } = useQuery<Order, AxiosError<{ detail?: string }>>({
    queryKey: queryKeys.order(id),
    queryFn: async () => {
      const { data } = await client.get<Order>(`/orders/${id}`)
      return data
    },
    enabled: !!id,
  })

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">{error.response?.data?.detail || error.message || 'Failed to load order'}</p>
  if (!order) return <p className="text-destructive">Order not found</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        {/* Base UI Button uses render prop instead of asChild */}
        <Button variant="ghost" size="icon" render={<Link to="/orders" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-semibold">Order #{order.id}</h2>
        <Badge variant="outline" className="capitalize">{order.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Customer ID</span><span className="font-medium">{order.customer_id}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{new Date(order.created_at).toLocaleString()}</span></div>
          <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total</span><span className="font-semibold">${Number(order.total_amount).toFixed(2)}</span></div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map(item => (
              <TableRow key={item.id}>
                <TableCell>#{item.product_id}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                <TableCell className="font-medium">${(Number(item.unit_price) * item.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
