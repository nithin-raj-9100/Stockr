import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import client from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import type { OrderSummary } from '@/types'

export function useOrders() {
  const { data = [], isLoading: loading, error, refetch } = useQuery<OrderSummary[], AxiosError<{ detail?: string }>>({
    queryKey: queryKeys.orders,
    queryFn: async () => {
      const { data } = await client.get<OrderSummary[]>('/orders')
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
