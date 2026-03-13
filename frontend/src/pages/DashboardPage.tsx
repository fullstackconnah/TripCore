import { useDashboard } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Map, Users, ListChecks, AlertTriangle, Building2, Truck, UserCog, ArrowRight } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color = 'text-[var(--color-foreground)]', subValue }: { icon: any; label: string; value: number | string; color?: string; subValue?: string }) {
  return (
    <div className="bg-[var(--color-card)] rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{subValue}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading dashboard...</div>

  const d = data || { upcomingTripCount: 0, activeParticipantCount: 0, outstandingTaskCount: 0, overdueTaskCount: 0, conflictCount: 0, tripsMissingAccommodation: 0, tripsMissingVehicles: 0, tripsMissingStaff: 0, upcomingTrips: [], overdueTasks: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">TripCore Management Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Map} label="Upcoming Trips" value={d.upcomingTripCount} />
        <StatCard icon={Users} label="Active Participants" value={d.activeParticipantCount} />
        <StatCard icon={ListChecks} label="Outstanding Tasks" value={d.outstandingTaskCount} color={d.outstandingTaskCount > 0 ? 'text-[var(--color-warning)]' : ''} />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={d.overdueTaskCount} color={d.overdueTaskCount > 0 ? 'text-[var(--color-destructive)]' : ''} />
      </div>

      {/* Alerts row */}
      {(d.conflictCount > 0 || d.tripsMissingAccommodation > 0 || d.tripsMissingVehicles > 0 || d.tripsMissingStaff > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {d.conflictCount > 0 && <StatCard icon={AlertTriangle} label="Conflicts" value={d.conflictCount} color="text-[var(--color-destructive)]" />}
          {d.tripsMissingAccommodation > 0 && <StatCard icon={Building2} label="Missing Accommodation" value={d.tripsMissingAccommodation} color="text-[var(--color-warning)]" />}
          {d.tripsMissingVehicles > 0 && <StatCard icon={Truck} label="Missing Vehicles" value={d.tripsMissingVehicles} color="text-[var(--color-warning)]" />}
          {d.tripsMissingStaff > 0 && <StatCard icon={UserCog} label="Missing Staff" value={d.tripsMissingStaff} color="text-[var(--color-warning)]" />}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h2 className="font-semibold">Upcoming Trips</h2>
            <Link to="/trips" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {d.upcomingTrips.length === 0 ? (
              <p className="p-5 text-sm text-[var(--color-muted-foreground)]">No upcoming trips</p>
            ) : d.upcomingTrips.slice(0, 5).map((t: any) => (
              <Link key={t.id} to={`/trips/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-[var(--color-accent)]/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{t.tripName}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {formatDateAu(t.startDate)} — {t.destination || 'TBD'} · {t.currentParticipantCount}/{t.maxParticipants || '—'} participants
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h2 className="font-semibold">Overdue Tasks</h2>
            <Link to="/tasks" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {d.overdueTasks.length === 0 ? (
              <p className="p-5 text-sm text-[var(--color-muted-foreground)]">No overdue tasks 🎉</p>
            ) : d.overdueTasks.slice(0, 5).map((t: any) => (
              <div key={t.id} className="p-4 hover:bg-[var(--color-accent)]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{t.title}</p>
                  <span className="badge-overdue text-xs px-2 py-0.5 rounded-full">{t.priority}</span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  {t.tripName} · Due: {formatDateAu(t.dueDate)} · {t.ownerName || 'Unassigned'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
