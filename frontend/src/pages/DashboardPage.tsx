import { useDashboard } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Map, Users, ListChecks, AlertTriangle, Building2, Truck, UserCog, ArrowRight, ShieldAlert } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color = 'text-[#1b1c1a]', subValue }: { icon: any; label: string; value: number | string; color?: string; subValue?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 hover:shadow-[0_24px_32px_-12px_rgba(27,28,26,0.08)] transition-all animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-[#396200]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#396200]" />
        </div>
        <span className="text-sm text-[#43493a]">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-xs text-[#43493a] mt-1">{subValue}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#43493a]">Loading dashboard...</div>

  const d = data || { upcomingTripCount: 0, activeParticipantCount: 0, outstandingTaskCount: 0, overdueTaskCount: 0, conflictCount: 0, tripsMissingAccommodation: 0, tripsMissingVehicles: 0, tripsMissingStaff: 0, openIncidentCount: 0, qscOverdueCount: 0, upcomingTrips: [], overdueTasks: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1b1c1a]">Dashboard</h1>
        <p className="text-sm text-[#43493a] mt-1">TripCore Management Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Map} label="Upcoming Trips" value={d.upcomingTripCount} />
        <StatCard icon={Users} label="Active Participants" value={d.activeParticipantCount} />
        <StatCard icon={ListChecks} label="Outstanding Tasks" value={d.outstandingTaskCount} color={d.outstandingTaskCount > 0 ? 'text-[#f59e0b]' : 'text-[#1b1c1a]'} />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={d.overdueTaskCount} color={d.overdueTaskCount > 0 ? 'text-[#ba1a1a]' : 'text-[#1b1c1a]'} />
      </div>

      {/* Incident stats */}
      {(d.openIncidentCount > 0 || d.qscOverdueCount > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {d.openIncidentCount > 0 && <StatCard icon={ShieldAlert} label="Open Incidents" value={d.openIncidentCount} color="text-[#f59e0b]" subValue="Require attention" />}
          {d.qscOverdueCount > 0 && <StatCard icon={AlertTriangle} label="QSC Overdue" value={d.qscOverdueCount} color="text-[#ba1a1a]" subValue="24-hour deadline exceeded" />}
        </div>
      )}

      {/* Alerts row */}
      {(d.conflictCount > 0 || d.tripsMissingAccommodation > 0 || d.tripsMissingVehicles > 0 || d.tripsMissingStaff > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {d.conflictCount > 0 && <StatCard icon={AlertTriangle} label="Conflicts" value={d.conflictCount} color="text-[#ba1a1a]" />}
          {d.tripsMissingAccommodation > 0 && <StatCard icon={Building2} label="Missing Accommodation" value={d.tripsMissingAccommodation} color="text-[#f59e0b]" />}
          {d.tripsMissingVehicles > 0 && <StatCard icon={Truck} label="Missing Vehicles" value={d.tripsMissingVehicles} color="text-[#f59e0b]" />}
          {d.tripsMissingStaff > 0 && <StatCard icon={UserCog} label="Missing Staff" value={d.tripsMissingStaff} color="text-[#f59e0b]" />}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_24px_32px_-12px_rgba(27,28,26,0.04)]">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-semibold text-[#1b1c1a]">Upcoming Trips</h2>
            <Link to="/trips" className="text-sm text-[#396200] font-medium hover:opacity-70 transition-opacity flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-3 pb-3 space-y-1">
            {d.upcomingTrips.length === 0 ? (
              <p className="px-2 py-4 text-sm text-[#43493a]">No upcoming trips</p>
            ) : d.upcomingTrips.slice(0, 5).map((t: any) => (
              <Link key={t.id} to={`/trips/${t.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f3ef] transition-colors">
                <div>
                  <p className="font-medium text-sm text-[#1b1c1a]">{t.tripName}</p>
                  <p className="text-xs text-[#43493a]">
                    {formatDateAu(t.startDate)} — {t.destination || 'TBD'} · {t.currentParticipantCount}/{t.maxParticipants || '—'} participants
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_24px_32px_-12px_rgba(27,28,26,0.04)]">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-semibold text-[#1b1c1a]">Overdue Tasks</h2>
            <Link to="/tasks" className="text-sm text-[#396200] font-medium hover:opacity-70 transition-opacity flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-3 pb-3 space-y-1">
            {d.overdueTasks.length === 0 ? (
              <p className="px-2 py-4 text-sm text-[#43493a]">No overdue tasks</p>
            ) : d.overdueTasks.slice(0, 5).map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl hover:bg-[#f5f3ef] transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-[#1b1c1a]">{t.title}</p>
                  <span className="badge-overdue text-xs px-2 py-0.5 rounded-full">{t.priority}</span>
                </div>
                <p className="text-xs text-[#43493a] mt-1">
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
