import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { queryKeys } from '@/api/queryKeys'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import client from '@/api/client'
import type { DashboardStats } from '@/types'

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: stats, isLoading: loading, error } = useQuery<DashboardStats, AxiosError<{ detail?: string }>>({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const { data } = await client.get<DashboardStats>('/dashboard/stats')
      return data
    },
  })

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">{error.response?.data?.detail || error.message || 'Failed to load stats.'}</p>
  if (!stats) return <p className="text-destructive">No stats available.</p>

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Products" value={stats.total_products} icon={Package} />
        <StatCard title="Total Customers" value={stats.total_customers} icon={Users} />
        <StatCard title="Total Orders" value={stats.total_orders} icon={ShoppingCart} />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Low Stock Products
        </h3>
        {stats.low_stock_products.length === 0 ? (
          <p className="text-muted-foreground text-sm">All products are sufficiently stocked.</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">SKU</th>
                  <th className="text-left px-4 py-2 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-2">
                      <Badge variant={p.quantity_in_stock === 0 ? 'destructive' : 'secondary'}>
                        {p.quantity_in_stock}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
