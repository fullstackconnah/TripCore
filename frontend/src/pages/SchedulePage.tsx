import React, { useState } from 'react'
import {
  CalendarRange, Users, Truck, ChevronDown, ChevronRight,
  Car, Shield, Pill, HandMetal, Moon, X, UserPlus, Plus, Trash2,
  Filter, Download, CheckCircle, AlertTriangle
} from 'lucide-react'
import {
  useScheduleOverview, useCreateStaffAssignment, useCreateVehicleAssignment, useDeleteStaffAssignment,
  useCreateStaffAvailability, useUpdateStaffAvailability, useDeleteStaffAvailability,
} from '../api/hooks'
import { useQueryClient } from '@tanstack/react-query'

// ── Status Pill Styles ──

const statusStyles: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  Available:   { bg: 'bg-[var(--color-surface-container)]', dot: 'bg-[#c3c9b5]', text: 'text-[var(--color-muted-foreground)]', label: 'Available' },
  Unavailable: { bg: 'bg-[#ffdad6]/50', dot: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', label: 'Unavailable' },
  Assigned:    { bg: 'bg-[var(--color-primary-fixed)]/25', dot: 'bg-[var(--color-primary)]', text: 'text-[var(--color-primary)]', label: 'Assigned' },
  Conflict:    { bg: 'bg-[#ffdad6]/50', dot: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', label: 'Conflict' },
  Maintenance: { bg: 'bg-[var(--color-secondary-container)]/40', dot: 'bg-[var(--color-secondary)]', text: 'text-[var(--color-secondary)]', label: 'Maintenance' },
}

function StatusBadge({ status, role, clickable, onClick, onUnassign }: {
  status: string
  role?: string
  clickable?: boolean
  onClick?: () => void
  onUnassign?: () => void
}) {
  const s = statusStyles[status] || statusStyles.Available
  const isUnassignable = !!(onUnassign && status === 'Assigned')
  const [justUnassigned, setJustUnassigned] = useState(false)

  const handleUnassign = () => {
    setJustUnassigned(true)
    setTimeout(() => {
      onUnassign?.()
      setJustUnassigned(false)
    }, 1000)
  }

  if (justUnassigned) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary-fixed)]/25 text-[var(--color-primary)] text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
        <span>Unassigned</span>
      </div>
    )
  }

  if (clickable) {
    return (
      <div
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-container)] text-[var(--color-muted-foreground)] text-xs font-medium cursor-pointer hover:bg-[var(--color-primary-fixed)]/20 hover:text-[var(--color-primary)] transition-all group"
        title="Click to assign"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#c3c9b5] group-hover:bg-[var(--color-primary)] flex-shrink-0 transition-colors" />
        <span>Available</span>
        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  if (isUnassignable) {
    return (
      <div
        onClick={handleUnassign}
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all bg-[var(--color-primary-fixed)]/25 text-[var(--color-primary)] hover:bg-rose-100 hover:text-rose-600"
        title="Click to unassign"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] group-hover:bg-rose-500 flex-shrink-0 transition-colors" />
        <span className="text-xs font-medium group-hover:hidden">{s.label}</span>
        {role && <span className="text-[10px] opacity-75 group-hover:hidden">{role}</span>}
        <span className="hidden group-hover:inline text-xs font-medium">Unassign</span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg} ${s.text} text-xs font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      <span>{s.label}</span>
      {role && <span className="text-[10px] opacity-75">· {role}</span>}
    </div>
  )
}

function QualBadge({ active, icon: Icon, title }: { active: boolean; icon: React.ElementType; title: string }) {
  if (!active) return null
  return (
    <span title={title} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-primary-fixed)]/30 text-[var(--color-primary)]">
      <Icon className="w-2.5 h-2.5" />
    </span>
  )
}

function TripStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: 'bg-[var(--color-surface-container)] text-[var(--color-muted-foreground)]',
    Planning: 'bg-[var(--color-secondary-container)]/60 text-[var(--color-secondary)]',
    OpenForBookings: 'bg-[var(--color-primary-fixed)]/30 text-[var(--color-primary)]',
    WaitlistOnly: 'bg-amber-100 text-amber-700',
    Confirmed: 'bg-[var(--color-primary-fixed)] text-[#0f2000]',
    InProgress: 'bg-[#ffd7ef]/60 text-[#8e337b]',
    Completed: 'bg-[var(--color-surface-container)] text-[var(--color-muted-foreground)]',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${styles[status] || 'bg-[var(--color-surface-container)] text-[var(--color-muted-foreground)]'}`}>
      {status.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

function toDateInput(dt: string) { return dt.slice(0, 10) }
function toStartDt(d: string) { return d + 'T00:00:00' }
function toEndDt(d: string) { return d + 'T23:59:59' }

const availTypeColors: Record<string, string> = {
  Available:   'text-emerald-600 bg-emerald-50',
  Unavailable: 'text-[#ba1a1a] bg-[#ffdad6]/60',
  Leave:       'text-[#ba1a1a] bg-[#ffdad6]/60',
  Training:    'text-[#8e337b] bg-[#ffd7ef]/60',
  Preferred:   'text-[var(--color-secondary)] bg-[var(--color-secondary-container)]/40',
  Tentative:   'text-amber-700 bg-amber-50',
}

// ── Availability Editor ──

interface AvailabilityEditorProps {
  staffId: string
  availability: any[]
}

function AvailabilityEditor({ staffId, availability }: AvailabilityEditorProps) {
  const createAvail = useCreateStaffAvailability()
  const updateAvail = useUpdateStaffAvailability()
  const deleteAvail = useDeleteStaffAvailability()

  const [edits, setEdits] = useState<Record<string, { startDate: string; endDate: string; notes: string }>>({})
  const [adding, setAdding] = useState<{ startDate: string; endDate: string; notes: string } | null>(null)

  function getEdit(a: any) {
    return edits[a.id] ?? {
      startDate: toDateInput(a.startDateTime),
      endDate: toDateInput(a.endDateTime),
      notes: a.notes ?? '',
    }
  }

  function isDirty(a: any) {
    const e = edits[a.id]
    if (!e) return false
    return (
      e.startDate !== toDateInput(a.startDateTime) ||
      e.endDate !== toDateInput(a.endDateTime) ||
      e.notes !== (a.notes ?? '')
    )
  }

  function patchEdit(id: string, patch: Partial<{ startDate: string; endDate: string; notes: string }>, base: any) {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { startDate: toDateInput(base.startDateTime), endDate: toDateInput(base.endDateTime), notes: base.notes ?? '' }),
        ...patch,
      },
    }))
  }

  function handleSave(a: any) {
    const e = getEdit(a)
    if (!e.startDate || !e.endDate || e.endDate < e.startDate) return
    updateAvail.mutate({
      id: a.id,
      data: {
        staffId,
        startDateTime: toStartDt(e.startDate),
        endDateTime: toEndDt(e.endDate),
        availabilityType: a.availabilityType,
        isRecurring: a.isRecurring ?? false,
        recurrenceNotes: a.recurrenceNotes ?? undefined,
        notes: e.notes || undefined,
      },
    }, {
      onSuccess: () => setEdits(prev => { const next = { ...prev }; delete next[a.id]; return next }),
    })
  }

  function handleDelete(id: string) {
    deleteAvail.mutate(id, {
      onSuccess: () => setEdits(prev => { const next = { ...prev }; delete next[id]; return next }),
    })
  }

  function handleAdd() {
    if (!adding || !adding.startDate || !adding.endDate || adding.endDate < adding.startDate) return
    createAvail.mutate({
      staffId,
      startDateTime: toStartDt(adding.startDate),
      endDateTime: toEndDt(adding.endDate),
      availabilityType: 'Leave',
      isRecurring: false,
      notes: adding.notes || undefined,
    }, { onSuccess: () => setAdding(null) })
  }

  const dateInputClass = 'px-2 py-1 rounded-lg bg-[var(--color-surface-container-low)] border-none outline-none text-xs focus:ring-2 focus:ring-[var(--color-primary)]/30'
  const notesInputClass = 'flex-1 px-2 py-1 rounded-lg bg-[var(--color-surface-container-low)] border-none outline-none text-xs focus:ring-2 focus:ring-[var(--color-primary)]/30'

  return (
    <div className="pl-8 py-3">
      <p className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-3 uppercase tracking-wide">Availability Records</p>
      <div className="space-y-2">
        {availability.length === 0 && !adding && (
          <p className="text-xs text-[var(--color-muted-foreground)] italic py-1">No availability records</p>
        )}
        {availability.map((a: any) => {
          const e = getEdit(a)
          const dirty = isDirty(a)
          const colorClass = availTypeColors[a.availabilityType] ?? 'text-[var(--color-muted-foreground)] bg-[var(--color-surface-container)]'
          return (
            <div key={a.id} className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold min-w-[72px] text-center ${colorClass}`}>
                {a.availabilityType}
              </span>
              <input type="date" value={e.startDate}
                onChange={ev => patchEdit(a.id, { startDate: ev.target.value }, a)}
                className={dateInputClass}
              />
              <span className="text-[var(--color-muted-foreground)]">—</span>
              <input type="date" value={e.endDate}
                onChange={ev => patchEdit(a.id, { endDate: ev.target.value }, a)}
                className={dateInputClass}
              />
              <input type="text" value={e.notes} placeholder="Notes…"
                onChange={ev => patchEdit(a.id, { notes: ev.target.value }, a)}
                className={notesInputClass}
              />
              {dirty && (
                <button
                  onClick={() => handleSave(a)}
                  disabled={updateAvail.isPending}
                  className="px-3 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Save
                </button>
              )}
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deleteAvail.isPending}
                title="Delete"
                className="p-1 rounded-full hover:bg-[#ffdad6]/60 text-[var(--color-muted-foreground)] hover:text-[#ba1a1a] transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )
        })}
        {!adding && (
          <button
            onClick={() => setAdding({ startDate: '', endDate: '', notes: '' })}
            className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 mt-2"
          >
            <Plus className="w-3 h-3" /> Add Leave
          </button>
        )}
        {adding && (
          <div className="flex items-center gap-2 text-xs border-t border-[var(--color-surface-container)] pt-2 mt-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold min-w-[72px] text-center text-[#ba1a1a] bg-[#ffdad6]/60">
              Leave
            </span>
            <input type="date" value={adding.startDate}
              onChange={e => setAdding(prev => prev ? { ...prev, startDate: e.target.value } : null)}
              className={dateInputClass}
            />
            <span className="text-[var(--color-muted-foreground)]">—</span>
            <input type="date" value={adding.endDate}
              onChange={e => setAdding(prev => prev ? { ...prev, endDate: e.target.value } : null)}
              className={dateInputClass}
            />
            <input type="text" value={adding.notes} placeholder="Notes…"
              onChange={e => setAdding(prev => prev ? { ...prev, notes: e.target.value } : null)}
              className={notesInputClass}
            />
            <button
              onClick={handleAdd}
              disabled={!adding.startDate || !adding.endDate || adding.endDate < adding.startDate || createAvail.isPending}
              className="px-3 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {createAvail.isPending ? '…' : 'Save'}
            </button>
            <button
              onClick={() => setAdding(null)}
              className="px-3 py-0.5 rounded-full bg-[var(--color-surface-container)] text-[10px] hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-foreground)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(195,201,181,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary-fixed)]/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <h3 className="font-display font-bold text-base">Assign Staff</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--color-surface-container)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[var(--color-surface-container-low)] rounded-[1rem] p-4 space-y-1">
            <div className="text-sm font-bold">{staff.fullName}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">→ {trip.tripName}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)} ({trip.durationDays} days)
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1.5">Assignment Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[var(--color-surface-container-low)] border-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
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
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1.5">Sleepover Type</label>
            <select
              value={sleepoverType}
              onChange={e => setSleepoverType(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-full bg-[var(--color-surface-container-low)] border-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            >
              <option value={0}>None</option>
              <option value={1}>Active Night</option>
              <option value={2}>Passive Night</option>
              <option value={3}>Sleepover</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDriver}
              onChange={e => setIsDriver(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <span className="text-sm font-medium">Assigned as driver</span>
            {staff.isDriverEligible
              ? <span className="text-[10px] text-[var(--color-primary)] font-semibold">(eligible)</span>
              : <span className="text-[10px] text-[#ba1a1a] font-semibold">(not eligible)</span>
            }
          </label>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1.5">Shift Notes (optional)</label>
            <textarea
              value={shiftNotes}
              onChange={e => setShiftNotes(e.target.value)}
              rows={2}
              placeholder="E.g. arrive evening before, depart early last day..."
              className="w-full px-4 py-2.5 rounded-[1rem] bg-[var(--color-surface-container-low)] border-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full bg-[var(--color-surface-container)] text-sm font-semibold hover:bg-[var(--color-surface-container-high)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#396200] to-[#4d7c0f] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(195,201,181,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-secondary-container)]/60 flex items-center justify-center">
              <Truck className="w-4 h-4 text-[var(--color-secondary)]" />
            </div>
            <h3 className="font-display font-bold text-base">Assign Vehicle</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--color-surface-container)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[var(--color-surface-container-low)] rounded-[1rem] p-4 space-y-1">
            <div className="text-sm font-bold">{vehicle.vehicleName}</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {vehicle.registration || '—'} · {vehicle.totalSeats} seats
              {vehicle.wheelchairPositions > 0 && ` · ${vehicle.wheelchairPositions} wheelchair`}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              → {trip.tripName} ({formatDate(trip.startDate)} — {formatDate(trip.endDate)})
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1.5">Assigned Driver (optional)</label>
            <select
              value={driverStaffId}
              onChange={e => setDriverStaffId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[var(--color-surface-container-low)] border-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            >
              <option value="">— No driver selected —</option>
              {eligibleDrivers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] block mb-1.5">Comments (optional)</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={2}
              placeholder="E.g. pickup from depot, needs fuel..."
              className="w-full px-4 py-2.5 rounded-[1rem] bg-[var(--color-surface-container-low)] border-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full bg-[var(--color-surface-container)] text-sm font-semibold hover:bg-[var(--color-surface-container-high)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#396200] to-[#4d7c0f] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {isLoading ? 'Assigning...' : 'Assign Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Trip column accent colors (cycling) ──

const tripAccentText = [
  'text-[var(--color-primary)]',
  'text-[var(--color-secondary)]',
  'text-[#8e337b]',
  'text-amber-700',
]

// ── Main Page ──

export default function SchedulePage() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useScheduleOverview()
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set())
  const [sectionStaff, setSectionStaff] = useState(true)
  const [sectionVehicles, setSectionVehicles] = useState(true)

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
      <div className="bg-white rounded-[2rem] p-8 text-center">
        <p className="text-[var(--color-muted-foreground)]">Failed to load schedule overview.</p>
      </div>
    )
  }

  const { trips, staff, vehicles } = data
  const tripCount = trips?.length || 0

  // Resource health stats
  const staffAssigned = staff?.filter((s: any) => s.tripStatuses?.some((ts: any) => ts.status === 'Assigned')).length || 0
  const vehiclesAssigned = vehicles?.filter((v: any) => v.tripStatuses?.some((ts: any) => ts.status === 'Assigned')).length || 0
  const conflictsCount = [
    ...(staff?.flatMap((s: any) => s.tripStatuses || []) || []),
    ...(vehicles?.flatMap((v: any) => v.tripStatuses || []) || []),
  ].filter((ts: any) => ts.status === 'Conflict').length

  const totalResources = (staff?.length || 0) + (vehicles?.length || 0)
  const utilization = totalResources > 0
    ? Math.round(((staffAssigned + vehiclesAssigned) / totalResources) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[var(--color-primary)] tracking-tight leading-none mb-1">
            Schedule Overview
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] font-medium">
            Staff and vehicle assignment across active trips · Click{' '}
            <span className="font-semibold text-[var(--color-primary)]">Available</span> to assign
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--color-surface-container)] p-1 rounded-full">
            <button className="px-5 py-2 bg-white rounded-full text-sm font-bold shadow-sm text-[var(--color-foreground)]">
              Grid View
            </button>
            <button className="px-5 py-2 text-[var(--color-muted-foreground)] text-sm font-medium hover:text-[var(--color-foreground)] transition-colors">
              Timeline
            </button>
          </div>
          <button className="p-2.5 bg-[var(--color-surface-container-low)] rounded-full hover:bg-[var(--color-surface-container)] transition-colors text-[var(--color-muted-foreground)]">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2.5 bg-[var(--color-surface-container-low)] rounded-full hover:bg-[var(--color-surface-container)] transition-colors text-[var(--color-muted-foreground)]">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Active Trips count */}
        <div className="col-span-12 md:col-span-4 bg-[var(--color-primary-container)] p-5 rounded-[1.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-75 mb-2">Active Trips</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-extrabold leading-none">{tripCount}</span>
              <span className="text-base opacity-70">Trips</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{staff?.length || 0} Staff</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{vehicles?.length || 0} Vehicles</span>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/15 transition-colors" />
        </div>

        {/* Resource Health */}
        <div className="col-span-12 md:col-span-8 bg-[var(--color-surface-container-low)] p-5 rounded-[1.5rem] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-display font-bold text-[var(--color-secondary)]">Resource Health</h3>
            <span className="text-[var(--color-primary)] font-bold text-sm">{utilization}% Utilization</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white p-3 rounded-[0.75rem]">
              <p className="text-xs text-[var(--color-muted-foreground)] font-bold uppercase mb-1 tracking-wide">Staff</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-[var(--color-foreground)]">{staffAssigned}/{staff?.length || 0}</span>
                <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-[0.75rem]">
              <p className="text-xs text-[var(--color-muted-foreground)] font-bold uppercase mb-1 tracking-wide">Vehicles</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-[var(--color-foreground)]">{vehiclesAssigned}/{vehicles?.length || 0}</span>
                <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-[0.75rem]">
              <p className="text-xs text-[var(--color-muted-foreground)] font-bold uppercase mb-1 tracking-wide">Conflicts</p>
              <div className="flex justify-between items-center">
                <span className={`text-xl font-bold ${conflictsCount > 0 ? 'text-[#ba1a1a]' : 'text-[var(--color-foreground)]'}`}>
                  {String(conflictsCount).padStart(2, '0')}
                </span>
                {conflictsCount > 0
                  ? <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                  : <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {tripCount === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center">
          <CalendarRange className="w-12 h-12 text-[var(--color-muted-foreground)] mx-auto mb-4 opacity-40" />
          <p className="text-lg font-display font-bold">No trips scheduled</p>
          <p className="text-[var(--color-muted-foreground)] mt-1">Create a trip first to see the schedule overview.</p>
        </div>
      ) : (
        /* ── Schedule Grid Table ── */
        <div className="bg-white rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${220 + tripCount * 160}px` }}>
              {/* Trip column headers */}
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-surface-container)' }}>
                  <th className="sticky left-0 z-20 bg-white text-left px-4 py-3 min-w-[200px]">
                    <span className="text-[10px] font-bold text-[var(--color-muted-foreground)] uppercase tracking-widest">Resources</span>
                  </th>
                  {trips.map((trip: any, idx: number) => (
                    <th key={trip.id} className="px-4 py-3 text-left min-w-[150px]">
                      <div className="space-y-1">
                        <div className={`text-sm font-display font-bold ${tripAccentText[idx % tripAccentText.length]}`}>
                          {trip.tripName}
                        </div>
                        <div className="text-xs font-medium text-[var(--color-muted-foreground)]">
                          {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                        </div>
                        <TripStatusBadge status={trip.status} />
                        <div className="text-[10px] text-[var(--color-muted-foreground)]">
                          {trip.staffAssignedCount}/{trip.minStaffRequired ?? '?'} staff · {trip.currentParticipantCount}/{trip.maxParticipants ?? '?'} pax
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* ── Staff Section Header ── */}
                <tr className="bg-[var(--color-surface-container-low)]">
                  <td
                    colSpan={tripCount + 1}
                    className="px-6 py-3 cursor-pointer select-none"
                    onClick={() => setSectionStaff(!sectionStaff)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary-fixed)]/30 flex items-center justify-center">
                        {sectionStaff
                          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        }
                      </div>
                      <Users className="w-4 h-4 text-[var(--color-primary)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                        Staff — {staff?.length || 0}
                      </span>
                    </div>
                  </td>
                </tr>

                {sectionStaff && staff?.map((s: any) => (
                  <React.Fragment key={s.id}>
                    <tr
                      className="hover:bg-[var(--color-surface-container-low)]/60 transition-colors"
                      style={{ borderBottom: '1px solid var(--color-surface-container)' }}
                    >
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 min-w-[200px]">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleStaff(s.id)}
                        >
                          <div className="w-7 h-7 rounded-full bg-[var(--color-secondary-container)]/60 flex items-center justify-center flex-shrink-0">
                            <Users className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              {expandedStaff.has(s.id)
                                ? <ChevronDown className="w-3 h-3 text-[var(--color-muted-foreground)] flex-shrink-0" />
                                : <ChevronRight className="w-3 h-3 text-[var(--color-muted-foreground)] flex-shrink-0" />
                              }
                              <span className="text-xs font-bold truncate">{s.fullName}</span>
                            </div>
                            <div className="text-[10px] text-[var(--color-muted-foreground)] pl-4">
                              {s.role?.replace(/([A-Z])/g, ' $1').trim()}{s.region ? ` · ${s.region}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1 pl-9">
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
                          <td key={ts.tripId} className="px-3 py-2.5">
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
                      <tr
                        key={`${s.id}-detail`}
                        style={{ borderBottom: '1px solid var(--color-surface-container)' }}
                        className="bg-[var(--color-surface-container-low)]/40"
                      >
                        <td colSpan={tripCount + 1}>
                          <AvailabilityEditor staffId={s.id} availability={s.availability} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {/* ── Vehicle Section Header ── */}
                <tr className="bg-[var(--color-surface-container-low)]">
                  <td
                    colSpan={tripCount + 1}
                    className="px-6 py-3 cursor-pointer select-none"
                    onClick={() => setSectionVehicles(!sectionVehicles)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-secondary-container)]/60 flex items-center justify-center">
                        {sectionVehicles
                          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                          : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                        }
                      </div>
                      <Truck className="w-4 h-4 text-[var(--color-secondary)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                        Vehicles — {vehicles?.length || 0}
                      </span>
                    </div>
                  </td>
                </tr>

                {sectionVehicles && vehicles?.map((v: any) => (
                  <tr
                    key={v.id}
                    className="hover:bg-[var(--color-surface-container-low)]/60 transition-colors last:border-b-0"
                    style={{ borderBottom: '1px solid var(--color-surface-container)' }}
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-secondary-container)]/40 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{v.vehicleName}</div>
                          <div className="text-[10px] text-[var(--color-muted-foreground)]">
                            {v.registration || '—'} · {v.vehicleType?.replace(/([A-Z])/g, ' $1').trim()} · {v.totalSeats} seats
                            {v.wheelchairPositions > 0 && ` · ${v.wheelchairPositions} ♿`}
                          </div>
                        </div>
                      </div>
                    </td>
                    {v.tripStatuses?.map((ts: any, idx: number) => {
                      const trip = trips[idx]
                      const isAvailable = ts.status === 'Available'
                      return (
                        <td key={ts.tripId} className="px-3 py-2.5">
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

      {/* ── Assignment Modals ── */}
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
