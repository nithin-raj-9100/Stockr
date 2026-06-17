import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="w-60 min-h-screen bg-card border-r flex flex-col">
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-semibold tracking-tight">Inventory</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t">
        <ThemeToggle />
      </div>
    </aside>
  )
}
