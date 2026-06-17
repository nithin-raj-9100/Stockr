import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import client from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import type { Customer } from '@/types'

export function useCustomers() {
  const { data = [], isLoading: loading, error, refetch } = useQuery<Customer[], AxiosError<{ detail?: string }>>({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      const { data } = await client.get<Customer[]>('/customers')
      return data
    },
  })

  const errorMsg = error?.response?.data?.detail || error?.message || null

  return {
    customers: data,
    loading,
    error: errorMsg,
    refetch,
  }
}
