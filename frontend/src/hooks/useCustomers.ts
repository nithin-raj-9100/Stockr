import { useState, useEffect, useCallback } from 'react'
import client from '@/api/client'
import type { Customer } from '@/types'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    client.get<Customer[]>('/customers')
      .then(({ data }) => setCustomers(data))
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false))
  }, [tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  return { customers, loading, error, refetch }
}
