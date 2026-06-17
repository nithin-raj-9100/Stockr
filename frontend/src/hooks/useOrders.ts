import { useState, useEffect, useCallback } from 'react'
import client from '@/api/client'
import type { OrderSummary } from '@/types'

export function useOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    client.get<OrderSummary[]>('/orders')
      .then(({ data }) => setOrders(data))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  return { orders, loading, error, refetch }
}
