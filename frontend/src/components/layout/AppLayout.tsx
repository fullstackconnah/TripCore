import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Map, CalendarRange, Users, Building2, Truck, UserCog,
  ListChecks, Settings, LogOut, Menu, X, ClipboardList, AlertTriangle
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trips', icon: Map, label: 'Trips' },
  { to: '/schedule', icon: CalendarRange, label: 'Schedule' },
  { to: '/participants', icon: Users, label: 'Participants' },
  { to: '/accommodation', icon: Building2, label: 'Accommodation' },
  { to: '/vehicles', icon: Truck, label: 'Vehicles' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/tasks', icon: ListChecks, label: 'Tasks' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/bookings', icon: ClipboardList, label: 'Bookings' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('tripcore_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('tripcore_token')
    localStorage.removeItem('tripcore_user')
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[var(--color-sidebar)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 h-16 px-6 border-b border-[var(--color-border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Map className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">TripCore</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-foreground)]'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--color-border)]">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-foreground)] w-full transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-accent)]" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.fullName || 'Admin'}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{user.role || 'Administrator'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
              {(user.fullName || 'A').charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
