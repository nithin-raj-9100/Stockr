import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import client from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import type { Product } from '@/types'

export function useProducts() {
  const { data = [], isLoading: loading, error, refetch } = useQuery<Product[], AxiosError<{ detail?: string }>>({
    queryKey: queryKeys.products,
    queryFn: async () => {
      const { data } = await client.get<Product[]>('/products')
      return data
    },
  })

  const errorMsg = error?.response?.data?.detail || error?.message || null

  return {
    products: data,
    loading,
    error: errorMsg,
    refetch,
  }
}
