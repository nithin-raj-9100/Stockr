import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import client from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import type { OrderSummary } from '@/types'

export function useOrders(search?: string, status?: string) {
  const { data = [], isLoading: loading, error, refetch } = useQuery<OrderSummary[], AxiosError<{ detail?: string }>>({
    queryKey: (search || status) ? [...queryKeys.orders, search, status] : queryKeys.orders,
    queryFn: async () => {
      const { data } = await client.get<OrderSummary[]>('/orders', {
        params: {
          ...(search ? { q: search } : {}),
          ...(status ? { status } : {}),
        },
      })
      return data
    },
  })

  const errorMsg = error?.response?.data?.detail || error?.message || null

  return {
    orders: data,
    loading,
    error: errorMsg,
    refetch,
  }
}
