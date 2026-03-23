import { useTrips, useUpdateTrip, useTrip, useStaff, useEventTemplates } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, CheckCircle2, Pencil, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

type Tab = 'active' | 'completed'

const activeStatuses = ['Draft', 'Planning', 'OpenForBookings', 'Confirmed', 'InProgress']

const inputClass = 'w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all'
const labelClass = 'block text-xs font-medium text-[#43493a] mb-1'

function buildEditForm(t: any) {
  return {
    tripName: t.tripName || '',
    tripCode: t.tripCode || '',
    eventTemplateId: t.eventTemplateId || '',
    destination: t.destination || '',
    region: t.region || '',
    startDate: t.startDate || '',
    durationDays: t.durationDays ?? 1,
    bookingCutoffDate: t.bookingCutoffDate || '',
    status: t.status || 'Draft',
    leadCoordinatorId: t.leadCoordinatorId || '',
    minParticipants: t.minParticipants ?? '',
    maxParticipants: t.maxParticipants ?? '',
    requiredWheelchairCapacity: t.requiredWheelchairCapacity ?? '',
    requiredBeds: t.requiredBeds ?? '',
    requiredBedrooms: t.requiredBedrooms ?? '',
    minStaffRequired: t.minStaffRequired ?? '',
    notes: t.notes || '',
  }
}

export default function TripsPage() {
  const [tab, setTab] = useState<Tab>('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingTripId, setEditingTripId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const formInitialized = useRef(false)

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter) {
    params.status = statusFilter
  } else if (tab === 'completed') {
    params.status = 'Completed'
  }

  const { data: allTrips = [], isLoading } = useTrips(params)
  const { data: tripDetail } = useTrip(editingTripId ?? undefined)
  const updateTrip = useUpdateTrip()
  const { data: staffList = [] } = useStaff()
  const { data: templates = [] } = useEventTemplates()

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

  const switchTab = (newTab: Tab) => {
    setTab(newTab)
    setStatusFilter('')
  }

  // Populate edit form once when trip detail loads
  useEffect(() => {
    if (!editingTripId) {
      formInitialized.current = false
      return
    }
    if (tripDetail?.id === editingTripId && !formInitialized.current) {
      formInitialized.current = true
      setEditForm(buildEditForm(tripDetail))
    }
  }, [editingTripId, tripDetail?.id])

  const handleOpenEdit = (tripId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    formInitialized.current = false
    setEditForm(null)
    setEditingTripId(tripId)
  }

  const handleCloseEdit = () => {
    setEditingTripId(null)
    setEditForm(null)
    formInitialized.current = false
  }

  const handleSaveEdit = () => {
    if (!editingTripId || !editForm) return
    const payload = { ...editForm }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    for (const key of ['minParticipants', 'maxParticipants', 'requiredWheelchairCapacity', 'requiredBeds', 'requiredBedrooms', 'minStaffRequired']) {
      if (!payload[key] && payload[key] !== 0) payload[key] = null
    }
    updateTrip.mutate({ id: editingTripId, data: payload }, { onSuccess: handleCloseEdit })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#1b1c1a]">Trips</h1>
          <p className="text-sm text-[#43493a] mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/trips/new"
          className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-[#396200] to-[#4d7c0f] text-white text-sm font-bold shadow-lg shadow-[#396200]/20 hover:opacity-90 transition-all flex-shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Trip</span><span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-full bg-[#efeeea] w-fit">
        <button
          onClick={() => switchTab('active')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === 'active'
              ? 'bg-white text-[#1b1c1a] shadow-sm'
              : 'text-[#43493a] hover:text-[#1b1c1a]'
          }`}
        >
          Active Trips
        </button>
        <button
          onClick={() => switchTab('completed')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === 'completed'
              ? 'bg-white text-[#1b1c1a] shadow-sm'
              : 'text-[#43493a] hover:text-[#1b1c1a]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <div className="relative flex-1 min-w-0 md:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#43493a]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'completed' ? 'Search completed trips...' : 'Search trips...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
        </div>
        {statusOptions.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#43493a]" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-2xl bg-[#f5f3ef] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
        <div className="text-center py-12 text-[#43493a]">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#43493a]">
            {tab === 'completed' ? 'No completed trips yet' : 'No trips found'}
          </p>
          {tab === 'completed' && (
            <p className="text-xs text-[#43493a] mt-1">
              Trips will appear here once they are marked as completed
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((t: any) => (
            <div key={t.id} className="bg-white rounded-2xl p-5 hover:shadow-[0_24px_32px_-12px_rgba(27,28,26,0.08)] transition-all group relative">
              <Link to={`/trips/${t.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-semibold group-hover:text-[#396200] transition-colors truncate">{t.tripName}</h3>
                    {t.tripCode && <span className="text-xs text-[#43493a] font-mono">{t.tripCode}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-[#43493a]">
                  <p>📍 {t.destination || 'TBD'} {t.region ? `· ${t.region}` : ''}</p>
                  <p>📅 {formatDateAu(t.startDate)} — {formatDateAu(t.endDate)} ({t.durationDays}d)</p>
                  <div className="flex items-center justify-between pt-2">
                    <span>👤 {t.currentParticipantCount}/{t.maxParticipants || '—'}</span>
                    {t.waitlistCount > 0 && <span className="badge-pending text-xs px-2 py-0.5 rounded-full">{t.waitlistCount} waitlist</span>}
                    {t.leadCoordinatorName && <span className="text-xs">{t.leadCoordinatorName}</span>}
                  </div>
                </div>
              </Link>
              {/* Edit button — outside the Link to avoid nested interactive elements */}
              <button
                onClick={e => handleOpenEdit(t.id, e)}
                title="Edit trip"
                className="absolute top-4 right-[4.5rem] p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#f5f3ef] transition-all"
              >
                <Pencil className="w-3.5 h-3.5 text-[#43493a]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleCloseEdit}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_32px_64px_-16px_rgba(27,28,26,0.2)] mx-2" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(195,201,181,0.2)]">
              <div>
                <h2 className="text-lg font-bold text-[#1b1c1a]">Edit Trip</h2>
                {!editForm && <p className="text-xs text-[#43493a] mt-0.5">Loading trip details…</p>}
              </div>
              <button onClick={handleCloseEdit} className="p-2 rounded-full hover:bg-[#f5f3ef] transition-colors">
                <X className="w-4 h-4 text-[#43493a]" />
              </button>
            </div>

            {/* Modal body */}
            {editForm ? (
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* Basic Info */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Basic Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Trip Name *</label>
                      <input value={editForm.tripName} onChange={e => setEditForm({ ...editForm, tripName: e.target.value })}
                        className={inputClass} placeholder="e.g. Beach Getaway 2026" />
                    </div>
                    <div>
                      <label className={labelClass}>Trip Code</label>
                      <input value={editForm.tripCode} onChange={e => setEditForm({ ...editForm, tripCode: e.target.value })}
                        className={inputClass} placeholder="e.g. BG-2026-01" />
                    </div>
                    <div>
                      <label className={labelClass}>Event Template</label>
                      <select value={editForm.eventTemplateId} onChange={e => setEditForm({ ...editForm, eventTemplateId: e.target.value })}
                        className={inputClass}>
                        <option value="">None</option>
                        {templates.map((t: any) => <option key={t.id} value={t.id}>{t.templateName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Destination</label>
                      <input value={editForm.destination} onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
                        className={inputClass} placeholder="e.g. Gold Coast" />
                    </div>
                    <div>
                      <label className={labelClass}>Region</label>
                      <input value={editForm.region} onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                        className={inputClass} placeholder="e.g. QLD" />
                    </div>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Dates & Status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start Date *</label>
                      <input type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Duration (Days)</label>
                      <input type="number" min={1} value={editForm.durationDays} onChange={e => setEditForm({ ...editForm, durationDays: Number(e.target.value) })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Booking Cutoff</label>
                      <input type="date" value={editForm.bookingCutoffDate} onChange={e => setEditForm({ ...editForm, bookingCutoffDate: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className={inputClass}>
                        {['Draft', 'Planning', 'OpenForBookings', 'Confirmed', 'InProgress', 'Completed', 'Cancelled', 'Archived'].map(s => (
                          <option key={s} value={s}>{s === 'OpenForBookings' ? 'Open For Bookings' : s === 'InProgress' ? 'In Progress' : s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Lead Coordinator</label>
                      <select value={editForm.leadCoordinatorId} onChange={e => setEditForm({ ...editForm, leadCoordinatorId: e.target.value })}
                        className={inputClass}>
                        <option value="">None</option>
                        {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Capacity & Requirements</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Min Participants</label>
                      <input type="number" min={0} value={editForm.minParticipants} onChange={e => setEditForm({ ...editForm, minParticipants: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Max Participants</label>
                      <input type="number" min={0} value={editForm.maxParticipants} onChange={e => setEditForm({ ...editForm, maxParticipants: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Wheelchair Capacity</label>
                      <input type="number" min={0} value={editForm.requiredWheelchairCapacity} onChange={e => setEditForm({ ...editForm, requiredWheelchairCapacity: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Required Beds</label>
                      <input type="number" min={0} value={editForm.requiredBeds} onChange={e => setEditForm({ ...editForm, requiredBeds: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Required Bedrooms</label>
                      <input type="number" min={0} value={editForm.requiredBedrooms} onChange={e => setEditForm({ ...editForm, requiredBedrooms: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Min Staff Required</label>
                      <input type="number" min={0} value={editForm.minStaffRequired} onChange={e => setEditForm({ ...editForm, minStaffRequired: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Notes</p>
                  <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3} className={inputClass} placeholder="Any additional notes..." />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12 text-[#43493a] text-sm">
                Loading trip details…
              </div>
            )}

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(195,201,181,0.2)]">
              <button onClick={handleCloseEdit}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-[#43493a] hover:bg-[#f5f3ef] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm || updateTrip.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-br from-[#396200] to-[#4d7c0f] text-white shadow-lg shadow-[#396200]/20 hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {updateTrip.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
