import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:block shrink-0">
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar overlay — always mounted, visibility controlled by state */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          sidebarOpen ? '' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        {/* Slide-in panel */}
        <div
          className={`fixed inset-y-0 left-0 w-60 max-w-[85vw] bg-card border-r shadow-xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Stockr</h1>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster richColors />
    </div>
  )
}
