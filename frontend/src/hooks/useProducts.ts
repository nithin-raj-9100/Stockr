import { useState, useEffect, useCallback } from 'react'
import client from '@/api/client'
import type { Product } from '@/types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    client.get<Product[]>('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false))
  }, [tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  return { products, loading, error, refetch }
}
