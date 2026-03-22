import { useTrips } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

type Tab = 'active' | 'completed'

const activeStatuses = ['Draft', 'Planning', 'OpenForBookings', 'Confirmed', 'InProgress']

export default function TripsPage() {
  const [tab, setTab] = useState<Tab>('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Build query params based on active tab + filters
  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter) {
    params.status = statusFilter
  } else if (tab === 'completed') {
    params.status = 'Completed'
  }

  const { data: allTrips = [], isLoading } = useTrips(params)

  // When no status filter is set on the active tab, filter out completed/cancelled/archived client-side
  const trips = tab === 'active' && !statusFilter
    ? allTrips.filter((t: any) => activeStatuses.includes(t.status))
    : allTrips

  const statusOptions = tab === 'active'
    ? [
        { value: 'Draft', label: 'Draft' },
        { value: 'Planning', label: 'Planning' },
        { value: 'OpenForBookings', label: 'Open for Bookings' },
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'InProgress', label: 'In Progress' },
      ]
    : []

  // Reset status filter when switching tabs
  const switchTab = (newTab: Tab) => {
    setTab(newTab)
    setStatusFilter('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/trips/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 shadow-md shadow-blue-500/20 transition-all">
          <Plus className="w-4 h-4" /> New Trip
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-muted)]/30 w-fit">
        <button
          onClick={() => switchTab('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'active'
              ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          Active Trips
        </button>
        <button
          onClick={() => switchTab('completed')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'completed'
              ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'completed' ? 'Search completed trips...' : 'Search trips...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]" />
        </div>
        {statusOptions.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]">
              <option value="">All Statuses</option>
              {statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Trips grid */}
      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-muted-foreground)]">
            {tab === 'completed' ? 'No completed trips yet' : 'No trips found'}
          </p>
          {tab === 'completed' && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              Trips will appear here once they are marked as completed
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((t: any) => (
            <Link key={t.id} to={`/trips/${t.id}`}
              className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold group-hover:text-[var(--color-primary)] transition-colors">{t.tripName}</h3>
                  {t.tripCode && <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{t.tripCode}</span>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
              </div>
              <div className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <p>📍 {t.destination || 'TBD'} {t.region ? `· ${t.region}` : ''}</p>
                <p>📅 {formatDateAu(t.startDate)} — {formatDateAu(t.endDate)} ({t.durationDays}d)</p>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                  <span>👤 {t.currentParticipantCount}/{t.maxParticipants || '—'}</span>
                  {t.waitlistCount > 0 && <span className="badge-pending text-xs px-2 py-0.5 rounded-full">{t.waitlistCount} waitlist</span>}
                  {t.leadCoordinatorName && <span className="text-xs">{t.leadCoordinatorName}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
