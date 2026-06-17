export interface Product {
  id: number
  name: string
  sku: string
  price: number
  quantity_in_stock: number
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
}

export interface Order {
  id: number
  customer_id: number
  total_amount: number
  status: string
  created_at: string
  items: OrderItem[]
}

export interface OrderSummary {
  id: number
  customer_id: number
  total_amount: number
  status: string
  created_at: string
}

export interface LowStockProduct {
  id: number
  name: string
  sku: string
  quantity_in_stock: number
}

export interface DashboardStats {
  total_products: number
  total_customers: number
  total_orders: number
  low_stock_products: LowStockProduct[]
}
