import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, Map, CalendarRange, Users, Building2, Truck, UserCog,
  ListChecks, Settings, LogOut, Menu, X, ClipboardList, AlertTriangle, Plus
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', msIcon: 'dashboard' },
  { to: '/trips', icon: Map, label: 'Trips', msIcon: 'map' },
  { to: '/schedule', icon: CalendarRange, label: 'Schedule', msIcon: 'calendar_month' },
  { to: '/participants', icon: Users, label: 'Participants', msIcon: 'group' },
  { to: '/accommodation', icon: Building2, label: 'Accommodation', msIcon: 'home_work' },
  { to: '/vehicles', icon: Truck, label: 'Vehicles', msIcon: 'directions_car' },
  { to: '/staff', icon: UserCog, label: 'Staff', msIcon: 'manage_accounts' },
  { to: '/tasks', icon: ListChecks, label: 'Tasks', msIcon: 'checklist' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents', msIcon: 'emergency' },
  { to: '/bookings', icon: ClipboardList, label: 'Bookings', msIcon: 'description' },
  { to: '/settings', icon: Settings, label: 'Settings', msIcon: 'settings' },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('tripcore_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('tripcore_token')
    localStorage.removeItem('tripcore_user')
    window.location.href = '/login'
  }

  const initial = (user.fullName || 'A').charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#fbf9f5]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-[#f5f3ef] pt-20 pb-6 px-4 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-xl bg-[#396200] flex items-center justify-center shadow-lg shadow-[#396200]/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>map</span>
            </div>
            <div>
              <span className="font-extrabold text-[#396200] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Trip Planner</span>
              <p className="text-[10px] text-[#43493a] opacity-70 leading-none mt-0.5">NDIS Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, msIcon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-[#396200] font-bold bg-white/60'
                    : 'text-[#515f74] hover:text-[#396200] hover:bg-white/40'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{msIcon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* New Trip CTA */}
        <Link to="/trips/new"
          className="mx-4 mt-4 py-3 px-4 flex items-center justify-center gap-2 bg-gradient-to-br from-[#396200] to-[#4d7c0f] text-white rounded-full font-bold shadow-lg shadow-[#396200]/20 hover:scale-[0.98] transition-all text-sm">
          <Plus className="w-4 h-4" />
          New Trip
        </Link>

        {/* Bottom */}
        <div className="mt-4 pt-4 space-y-1">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#515f74] hover:bg-white/40 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#fbf9f5]/80 backdrop-blur-xl shadow-[0_24px_32px_-12px_rgba(27,28,26,0.04)]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-xl hover:bg-[#efeeea] transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="hidden md:flex items-center bg-[#f5f3ef] rounded-full px-4 py-2 gap-3 min-w-[280px]">
                <span className="material-symbols-outlined text-[#43493a]" style={{ fontSize: '18px' }}>search</span>
                <input
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#43493a]/60 text-[#1b1c1a]"
                  placeholder="Search trips, participants..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-[#efeeea] transition-colors">
                <span className="material-symbols-outlined text-[#396200]" style={{ fontSize: '22px' }}>notifications</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#396200] to-[#4d7c0f] flex items-center justify-center text-white font-bold text-sm shadow-md">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fbf9f5]/90 backdrop-blur-xl shadow-[0_-8px_24px_-4px_rgba(27,28,26,0.04)] px-6 py-3 flex justify-around items-center z-50">
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#396200]' : 'text-[#515f74]'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>dashboard</span>
          <span className="text-[10px] font-medium">Dashboard</span>
        </NavLink>
        <NavLink to="/trips" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#396200]' : 'text-[#515f74]'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>map</span>
          <span className="text-[10px] font-medium">Trips</span>
        </NavLink>
        <Link to="/trips/new" className="relative -top-5">
          <div className="w-14 h-14 bg-[#396200] text-white rounded-full shadow-2xl shadow-[#396200]/40 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
        </Link>
        <NavLink to="/participants" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#396200]' : 'text-[#515f74]'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>group</span>
          <span className="text-[10px] font-medium">People</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#396200]' : 'text-[#515f74]'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
          <span className="text-[10px] font-medium">Settings</span>
        </NavLink>
      </nav>
    </div>
  )
}
