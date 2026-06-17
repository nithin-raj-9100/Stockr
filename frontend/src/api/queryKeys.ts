export const queryKeys = {
  customers: ['customers'] as const,
  products: ['products'] as const,
  orders: ['orders'] as const,
  dashboardStats: ['dashboardStats'] as const,
  order: (id?: string) => ['order', id] as const,
}
