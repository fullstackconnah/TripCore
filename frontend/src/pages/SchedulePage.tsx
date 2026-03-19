import { useState } from 'react'
import {
  CalendarRange, Users, Truck, ChevronDown, ChevronRight,
  Car, Shield, Pill, HandMetal, Moon, MapPin, Clock, X, UserPlus, Plus
} from 'lucide-react'
import { useScheduleOverview, useCreateStaffAssignment, useCreateVehicleAssignment, useDeleteStaffAssignment } from '../api/hooks'
import { useQueryClient } from '@tanstack/react-query'

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  Available:   { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Available' },
  Unavailable: { bg: 'bg-red-500/20',     text: 'text-red-400',     label: 'Unavailable' },
  Assigned:    { bg: 'bg-blue-500/20',    text: 'text-blue-400',    label: 'Assigned' },
  Conflict:    { bg: 'bg-amber-500/20',   text: 'text-amber-400',   label: 'Conflict' },
}

function StatusBadge({ status, role, clickable, onClick, onUnassign }: { status: string; role?: string; clickable?: boolean; onClick?: () => void; onUnassign?: () => void }) {
  const s = statusColors[status] || statusColors.Available
  const clickClass = clickable ? 'cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)]/50 hover:scale-105 transition-all' : ''
  return (
    <div
      className={`${s.bg} ${s.text} px-2 py-1 rounded text-xs font-medium text-center leading-tight ${clickClass} relative`}
      onClick={clickable ? onClick : undefined}
      title={clickable ? 'Click to assign' : undefined}
    >
      {clickable && <Plus className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />}
      <span>{s.label}</span>
      {role && <div className="text-[10px] opacity-75 mt-0.5">{role}</div>}
      {onUnassign && status === 'Assigned' && (
        <button
          onClick={e => { e.stopPropagation(); onUnassign() }}
          title="Unassign"
          className="absolute top-0.5 right-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  )
}

function QualBadge({ active, icon: Icon, title }: { active: boolean; icon: any; title: string }) {
  if (!active) return null
  return (
    <span title={title} className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
      <Icon className="w-3 h-3" />
    </span>
  )
}

function TripStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: 'bg-gray-500/20 text-gray-400',
    Planning: 'bg-purple-500/20 text-purple-400',
    OpenForBookings: 'bg-green-500/20 text-green-400',
    WaitlistOnly: 'bg-yellow-500/20 text-yellow-400',
    Confirmed: 'bg-blue-500/20 text-blue-400',
    InProgress: 'bg-orange-500/20 text-orange-400',
    Completed: 'bg-gray-500/20 text-gray-400',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

function AvailabilityDetail({ availability }: { availability: any[] }) {
  if (!availability || availability.length === 0) {
    return <p className="text-xs text-[var(--color-muted-foreground)] italic py-2 px-4">No availability records</p>
  }
  return (
    <div className="px-4 py-2 space-y-1">
      {availability.map((a: any) => {
        const typeColors: Record<string, string> = {
          Available: 'text-emerald-400', Unavailable: 'text-red-400',
          Leave: 'text-red-400', Training: 'text-purple-400',
          Preferred: 'text-blue-400', Tentative: 'text-amber-400',
        }
        const start = new Date(a.startDateTime).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
        const end = new Date(a.endDateTime).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
        return (
          <div key={a.id} className="flex items-center gap-3 text-xs">
            <span className={`font-medium min-w-[80px] ${typeColors[a.availabilityType] || 'text-gray-400'}`}>
              {a.availabilityType}
            </span>
            <Clock className="w-3 h-3 text-[var(--color-muted-foreground)]" />
            <span className="text-[var(--color-muted-foreground)]">{start} — {end}</span>
            {a.notes && <span className="text-[var(--color-muted-foreground)] italic truncate">({a.notes})</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Assignment Modals ──

interface StaffAssignModalProps {
  staff: any
  trip: any
  onClose: () => void
  onAssign: (data: any) => void
  isLoading: boolean
}

function StaffAssignModal({ staff, trip, onClose, onAssign, isLoading }: StaffAssignModalProps) {
  const [role, setRole] = useState('Support Worker')
  const [isDriver, setIsDriver] = useState(false)
  const [sleepoverType, setSleepoverType] = useState(0)
  const [shiftNotes, setShiftNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAssign({
      tripInstanceId: trip.id,
      staffId: staff.id,
      assignmentRole: role,
      assignmentStart: trip.startDate,
      assignmentEnd: trip.endDate,
      isDriver,
      sleepoverType,
      shiftNotes: shiftNotes || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-semibold">Assign Staff</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-[var(--color-sidebar)] rounded-lg p-3 space-y-1">
            <div className="text-sm font-medium">{staff.fullName}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              → {trip.tripName}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)} ({trip.durationDays} days)
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)] block mb-1.5">Assignment Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            >
              <option value="Support Worker">Support Worker</option>
              <option value="Senior Support Worker">Senior Support Worker</option>
              <option value="Lead Coordinator">Lead Coordinator</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Senior Support / Driver">Senior Support / Driver</option>
              <option value="Driver">Driver</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)] block mb-1.5">Sleepover Type</label>
            <select
              value={sleepoverType}
              onChange={e => setSleepoverType(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            >
              <option value={0}>None</option>
              <option value={1}>Active Night</option>
              <option value={2}>Passive Night</option>
              <option value={3}>Sleepover</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDriver}
              onChange={e => setIsDriver(e.target.checked)}
              className="rounded border-[var(--color-border)]"
            />
            <span className="text-sm">Assigned as driver</span>
            {staff.isDriverEligible && <span className="text-[10px] text-emerald-400">(eligible)</span>}
            {!staff.isDriverEligible && <span className="text-[10px] text-red-400">(not eligible)</span>}
          </label>

          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)] block mb-1.5">Shift Notes (optional)</label>
            <textarea
              value={shiftNotes}
              onChange={e => setShiftNotes(e.target.value)}
              rows={2}
              placeholder="E.g. arrive evening before, depart early last day..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-accent)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isLoading ? 'Assigning...' : 'Assign Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface VehicleAssignModalProps {
  vehicle: any
  trip: any
  staff: any[]
  onClose: () => void
  onAssign: (data: any) => void
  isLoading: boolean
}

function VehicleAssignModal({ vehicle, trip, staff, onClose, onAssign, isLoading }: VehicleAssignModalProps) {
  const [driverStaffId, setDriverStaffId] = useState('')
  const [comments, setComments] = useState('')

  const eligibleDrivers = staff?.filter((s: any) => s.isDriverEligible) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAssign({
      tripInstanceId: trip.id,
      vehicleId: vehicle.id,
      driverStaffId: driverStaffId || undefined,
      seatRequirement: null,
      wheelchairPositionRequirement: null,
      comments: comments || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-semibold">Assign Vehicle</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-[var(--color-sidebar)] rounded-lg p-3 space-y-1">
            <div className="text-sm font-medium">{vehicle.vehicleName}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {vehicle.registration || '—'} · {vehicle.totalSeats} seats
              {vehicle.wheelchairPositions > 0 && ` · ${vehicle.wheelchairPositions} wheelchair`}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              → {trip.tripName} ({formatDate(trip.startDate)} — {formatDate(trip.endDate)})
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)] block mb-1.5">Assigned Driver (optional)</label>
            <select
              value={driverStaffId}
              onChange={e => setDriverStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            >
              <option value="">— No driver selected —</option>
              {eligibleDrivers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)] block mb-1.5">Comments (optional)</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={2}
              placeholder="E.g. pickup from depot, needs fuel..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-accent)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isLoading ? 'Assigning...' : 'Assign Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──

export default function SchedulePage() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useScheduleOverview()
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set())
  const [sectionStaff, setSectionStaff] = useState(true)
  const [sectionVehicles, setSectionVehicles] = useState(true)

  // Modal state
  const [assignModal, setAssignModal] = useState<{
    type: 'staff' | 'vehicle'
    resource: any
    trip: any
  } | null>(null)

  const staffAssign = useCreateStaffAssignment()
  const vehicleAssign = useCreateVehicleAssignment()
  const staffUnassign = useDeleteStaffAssignment()

  const handleStaffAssign = (assignData: any) => {
    staffAssign.mutate(assignData, {
      onSuccess: () => {
        setAssignModal(null)
        queryClient.invalidateQueries({ queryKey: ['schedule-overview'] })
      },
    })
  }

  const handleVehicleAssign = (assignData: any) => {
    vehicleAssign.mutate(assignData, {
      onSuccess: () => {
        setAssignModal(null)
        queryClient.invalidateQueries({ queryKey: ['schedule-overview'] })
      },
    })
  }

  const toggleStaff = (id: string) => {
    setExpandedStaff(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--color-muted-foreground)]">Failed to load schedule overview.</p>
      </div>
    )
  }

  const { trips, staff, vehicles } = data
  const tripCount = trips?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <CalendarRange className="w-7 h-7 text-[var(--color-primary)]" />
          Schedule Overview
        </h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Staff and vehicle availability across all scheduled trips · Click <span className="text-emerald-400 font-medium">Available</span> to assign
        </p>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-[var(--color-muted-foreground)]">Legend:</span>
          {Object.entries(statusColors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${val.bg} border border-current ${val.text}`} />
              <span className="text-[var(--color-muted-foreground)]">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {tripCount === 0 ? (
        <div className="card p-12 text-center">
          <CalendarRange className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No trips scheduled</p>
          <p className="text-[var(--color-muted-foreground)] mt-1">Create a trip first to see the schedule overview.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Scrollable grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${200 + tripCount * 140}px` }}>
              {/* Trip header row */}
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="sticky left-0 z-20 bg-[var(--color-card)] text-left p-3 min-w-[200px] border-r border-[var(--color-border)]">
                    <span className="text-sm font-medium text-[var(--color-muted-foreground)]">Resource</span>
                  </th>
                  {trips.map((trip: any) => (
                    <th key={trip.id} className="p-3 text-center min-w-[140px] border-r border-[var(--color-border)] last:border-r-0">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold truncate" title={trip.tripName}>{trip.tripName}</div>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
                          <MapPin className="w-3 h-3" />
                          {trip.destination || trip.region || '—'}
                        </div>
                        <div className="text-[10px] text-[var(--color-muted-foreground)]">
                          {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                        </div>
                        <TripStatusBadge status={trip.status} />
                        <div className="text-[10px] text-[var(--color-muted-foreground)] mt-1">
                          {trip.staffAssignedCount}/{trip.minStaffRequired ?? '?'} staff · {trip.currentParticipantCount}/{trip.maxParticipants ?? '?'} pax
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* ── Staff Section ── */}
                <tr className="bg-[var(--color-sidebar)]">
                  <td
                    colSpan={tripCount + 1}
                    className="sticky left-0 z-10 p-2 cursor-pointer select-none"
                    onClick={() => setSectionStaff(!sectionStaff)}
                  >
                    <div className="flex items-center gap-2">
                      {sectionStaff ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Users className="w-4 h-4 text-[var(--color-primary)]" />
                      <span className="text-sm font-semibold">Staff ({staff?.length || 0})</span>
                    </div>
                  </td>
                </tr>

                {sectionStaff && staff?.map((s: any) => (
                  <>
                    <tr key={s.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-accent)]/30 transition-colors">
                      <td className="sticky left-0 z-10 bg-[var(--color-card)] p-3 border-r border-[var(--color-border)]">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleStaff(s.id)}
                        >
                          {expandedStaff.has(s.id)
                            ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] flex-shrink-0" />
                          }
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{s.fullName}</div>
                            <div className="text-[10px] text-[var(--color-muted-foreground)]">
                              {s.role?.replace(/([A-Z])/g, ' $1').trim()}{s.region ? ` · ${s.region}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <QualBadge active={s.isDriverEligible} icon={Car} title="Driver Eligible" />
                          <QualBadge active={s.isFirstAidQualified} icon={Shield} title="First Aid" />
                          <QualBadge active={s.isMedicationCompetent} icon={Pill} title="Medication" />
                          <QualBadge active={s.isManualHandlingCompetent} icon={HandMetal} title="Manual Handling" />
                          <QualBadge active={s.isOvernightEligible} icon={Moon} title="Overnight" />
                        </div>
                      </td>
                      {s.tripStatuses?.map((ts: any, idx: number) => {
                        const trip = trips[idx]
                        const isAvailable = ts.status === 'Available'
                        return (
                          <td key={ts.tripId} className="p-2 text-center border-r border-[var(--color-border)] last:border-r-0">
                            <StatusBadge
                              status={ts.status}
                              role={ts.assignmentRole}
                              clickable={isAvailable}
                              onClick={isAvailable ? () => setAssignModal({ type: 'staff', resource: s, trip }) : undefined}
                              onUnassign={ts.status === 'Assigned' && ts.assignmentId ? () => staffUnassign.mutate(ts.assignmentId, {
                                onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule-overview'] })
                              }) : undefined}
                            />
                          </td>
                        )
                      })}
                    </tr>
                    {expandedStaff.has(s.id) && (
                      <tr key={`${s.id}-detail`} className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)]/50">
                        <td colSpan={tripCount + 1} className="sticky left-0 z-10">
                          <div className="pl-8 py-1">
                            <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Availability Records</p>
                            <AvailabilityDetail availability={s.availability} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}

                {/* ── Vehicle Section ── */}
                <tr className="bg-[var(--color-sidebar)]">
                  <td
                    colSpan={tripCount + 1}
                    className="sticky left-0 z-10 p-2 cursor-pointer select-none"
                    onClick={() => setSectionVehicles(!sectionVehicles)}
                  >
                    <div className="flex items-center gap-2">
                      {sectionVehicles ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Truck className="w-4 h-4 text-[var(--color-primary)]" />
                      <span className="text-sm font-semibold">Vehicles ({vehicles?.length || 0})</span>
                    </div>
                  </td>
                </tr>

                {sectionVehicles && vehicles?.map((v: any) => (
                  <tr key={v.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-accent)]/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-[var(--color-card)] p-3 border-r border-[var(--color-border)]">
                      <div className="text-sm font-medium truncate">{v.vehicleName}</div>
                      <div className="text-[10px] text-[var(--color-muted-foreground)]">
                        {v.registration || '—'} · {v.vehicleType?.replace(/([A-Z])/g, ' $1').trim()} · {v.totalSeats} seats
                        {v.wheelchairPositions > 0 && ` · ${v.wheelchairPositions} ♿`}
                      </div>
                    </td>
                    {v.tripStatuses?.map((ts: any, idx: number) => {
                      const trip = trips[idx]
                      const isAvailable = ts.status === 'Available'
                      return (
                        <td key={ts.tripId} className="p-2 text-center border-r border-[var(--color-border)] last:border-r-0">
                          <StatusBadge
                            status={ts.status}
                            clickable={isAvailable}
                            onClick={isAvailable ? () => setAssignModal({ type: 'vehicle', resource: v, trip }) : undefined}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Modals */}
      {assignModal?.type === 'staff' && (
        <StaffAssignModal
          staff={assignModal.resource}
          trip={assignModal.trip}
          onClose={() => setAssignModal(null)}
          onAssign={handleStaffAssign}
          isLoading={staffAssign.isPending}
        />
      )}
      {assignModal?.type === 'vehicle' && (
        <VehicleAssignModal
          vehicle={assignModal.resource}
          trip={assignModal.trip}
          staff={staff || []}
          onClose={() => setAssignModal(null)}
          onAssign={handleVehicleAssign}
          isLoading={vehicleAssign.isPending}
        />
      )}
    </div>
  )
}
