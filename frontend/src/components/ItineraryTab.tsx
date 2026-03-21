import { useTripItinerary } from '@/api/hooks'
import { formatDateAu } from '@/lib/utils'
import { MapPin, Clock, Users, Car, Building2, UserCog, DollarSign, FileDown, Calendar, Phone, Mail, Shield, Utensils, Camera, Bus, Compass, Palette, Dumbbell, Star } from 'lucide-react'
import { useState } from 'react'
import { generateItineraryPdf } from './ItineraryPdf'

interface TripAdminData {
  eventTemplateName?: string
  oopDueDate?: string
  bookingCutoffDate?: string
  minParticipants?: number
  minStaffRequired?: number
  requiredWheelchairCapacity?: number
  requiredBeds?: number
  requiredBedrooms?: number
}

interface ItineraryTabProps {
  tripId: string
  trip?: TripAdminData
}

const categoryConfig: Record<string, { icon: typeof Star; color: string; bg: string }> = {
  Leisure: { icon: Star, color: '#60a5fa', bg: '#1e3a5f' },
  Dining: { icon: Utensils, color: '#f59e0b', bg: '#78350f' },
  Transport: { icon: Bus, color: '#a78bfa', bg: '#4c1d95' },
  Sightseeing: { icon: Camera, color: '#34d399', bg: '#064e3b' },
  Adventure: { icon: Compass, color: '#f87171', bg: '#991b1b' },
  Cultural: { icon: Palette, color: '#fb923c', bg: '#9a3412' },
  Sport: { icon: Dumbbell, color: '#2dd4bf', bg: '#115e59' },
  Other: { icon: Star, color: '#94a3b8', bg: '#374151' },
}

function getCategoryStyle(category: string | null) {
  return categoryConfig[category ?? 'Other'] ?? categoryConfig.Other
}

function formatTime(time: string | null | undefined) {
  if (!time) return null
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m}${ampm}`
}

function parseLocalDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDayName(date: string) {
  return parseLocalDate(date).toLocaleDateString('en-AU', { weekday: 'long' })
}

function formatDateLong(date: string) {
  return parseLocalDate(date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const activityStatusStyle: Record<string, string> = {
  Planned: 'bg-[#374151] text-[#d1d5db]',
  Booked: 'bg-[#92400e] text-[#fef3c7]',
  Confirmed: 'bg-[#166534] text-[#bbf7d0]',
  Completed: 'bg-[#1e3a5f] text-[#bfdbfe]',
  Cancelled: 'bg-[#991b1b] text-[#fecaca]',
}

export default function ItineraryTab({ tripId, trip }: ItineraryTabProps) {
  const { data: itinerary, isLoading, isError } = useTripItinerary(tripId)
  const [exporting, setExporting] = useState(false)

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading itinerary...</div>
  if (isError || !itinerary) return <div className="text-center py-12 text-[var(--color-muted-foreground)]">Unable to load itinerary. Make sure the trip has dates and a generated schedule.</div>

  const handleExport = async (version: 'staff' | 'participant') => {
    setExporting(true)
    try {
      await generateItineraryPdf(itinerary, version)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Export buttons */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => handleExport('staff')}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <FileDown className="w-4 h-4" />
          Export Staff Version
        </button>
        <button
          onClick={() => handleExport('participant')}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity border border-[var(--color-border)]"
        >
          <FileDown className="w-4 h-4" />
          Export Participant Version
        </button>
      </div>

      {/* Overview Hero Card */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#1e293b] rounded-2xl border border-[var(--color-border)] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-1">Trip Overview</p>
              <h2 className="text-2xl font-bold">{itinerary.tripName}</h2>
              <div className="flex items-center gap-2 mt-2 text-[var(--color-muted-foreground)]">
                <MapPin className="w-4 h-4" />
                <span>{itinerary.destination || 'Destination TBD'}</span>
                {itinerary.region && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]">{itinerary.region}</span>}
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                {formatDateLong(itinerary.startDate)} — {formatDateLong(itinerary.endDate)}
              </p>
            </div>
            {itinerary.tripCode && (
              <span className="font-mono text-sm bg-[var(--color-accent)] px-3 py-1.5 rounded-lg">{itinerary.tripCode}</span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { icon: Calendar, label: 'Duration', value: `${itinerary.durationDays} days` },
              { icon: Users, label: 'Participants', value: itinerary.participantCount },
              { icon: UserCog, label: 'Staff', value: itinerary.staffCount },
              { icon: DollarSign, label: 'Est. Cost', value: `$${Number(itinerary.totalEstimatedCost).toLocaleString('en-AU', { minimumFractionDigits: 2 })}` },
            ].map(s => (
              <div key={s.label} className="bg-black/20 rounded-xl p-3 text-center">
                <s.icon className="w-4 h-4 mx-auto text-[var(--color-primary)] mb-1" />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{s.label}</p>
              </div>
            ))}
          </div>

          {itinerary.notes && (
            <p className="text-sm text-[var(--color-muted-foreground)] mt-4 border-t border-white/10 pt-4">{itinerary.notes}</p>
          )}
        </div>
      </div>

      {/* Admin details (from trip data) */}
      {trip && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
            <h3 className="font-semibold">Trip Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Event Template</span><span>{trip.eventTemplateName || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Region</span><span>{itinerary.region || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">OOP Due Date</span><span>{trip.oopDueDate ? formatDateAu(trip.oopDueDate) : '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Booking Cutoff</span><span>{trip.bookingCutoffDate ? formatDateAu(trip.bookingCutoffDate) : '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Lead Coordinator</span><span>{itinerary.leadCoordinatorName || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Min Participants</span><span>{trip.minParticipants || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Min Staff</span><span>{trip.minStaffRequired || '—'}</span>
            </div>
          </div>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
            <h3 className="font-semibold">Requirements</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Wheelchair Capacity</span><span>{trip.requiredWheelchairCapacity || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Required Beds</span><span>{trip.requiredBeds || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Required Bedrooms</span><span>{trip.requiredBedrooms || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Info panels row */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Accommodation */}
        {itinerary.accommodation.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-semibold">Accommodation</h3>
            </div>
            <div className="space-y-3">
              {itinerary.accommodation.map((a: any, i: number) => (
                <div key={i} className="border border-[var(--color-border)] rounded-lg p-3 space-y-1">
                  <p className="font-medium text-sm">{a.propertyName}</p>
                  {(a.address || a.suburb) && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {[a.address, a.suburb, a.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <span>{formatDateAu(a.checkInDate)} → {formatDateAu(a.checkOutDate)}</span>
                    {a.bedroomsReserved && <span>{a.bedroomsReserved} bed{a.bedroomsReserved > 1 ? 'rooms' : 'room'}</span>}
                  </div>
                  {a.confirmationReference && (
                    <p className="text-xs"><span className="text-[var(--color-muted-foreground)]">Ref:</span> {a.confirmationReference}</p>
                  )}
                  {a.phone && (
                    <p className="text-xs flex items-center gap-1 text-[var(--color-muted-foreground)]">
                      <Phone className="w-3 h-3" /> {a.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicles */}
        {itinerary.vehicles.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-semibold">Vehicles</h3>
            </div>
            <div className="space-y-3">
              {itinerary.vehicles.map((v: any, i: number) => (
                <div key={i} className="border border-[var(--color-border)] rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{v.vehicleName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]">{v.vehicleType}</span>
                  </div>
                  {v.registration && <p className="text-xs font-mono text-[var(--color-muted-foreground)]">{v.registration}</p>}
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <span>{v.totalSeats} seats</span>
                    {v.wheelchairPositions > 0 && <span>♿ {v.wheelchairPositions} position{v.wheelchairPositions > 1 ? 's' : ''}</span>}
                    {v.driverName && <span>Driver: {v.driverName}</span>}
                  </div>
                  {v.pickupTravelNotes && (
                    <p className="text-xs text-[var(--color-muted-foreground)] italic">{v.pickupTravelNotes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff */}
        {itinerary.staff.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCog className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-semibold">Staff Roster</h3>
            </div>
            <div className="space-y-2">
              {itinerary.staff.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 border border-[var(--color-border)] rounded-lg p-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs shrink-0">
                    {s.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] flex-wrap">
                      <span>{s.role}</span>
                      <span>·</span>
                      <span>{formatDateAu(s.assignmentStart)} – {formatDateAu(s.assignmentEnd)}</span>
                      {s.isDriver && <span className="text-[var(--color-primary)]">🚗 Driver</span>}
                    </div>
                    {(s.mobile || s.email) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-muted-foreground)]">
                        {s.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.mobile}</span>}
                        {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Participants */}
      {itinerary.participants.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-semibold">Participants ({itinerary.participants.length})</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {itinerary.participants.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 border border-[var(--color-border)] rounded-lg p-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold shrink-0">
                  {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.wheelchairRequired && <span title="Wheelchair required" className="text-xs">♿</span>}
                    {p.highSupportRequired && <span title="High support"><Shield className="w-3 h-3 text-[var(--color-warning)]" /></span>}
                    {p.nightSupportRequired && <span title="Overnight support" className="text-xs">🌙</span>}
                    {p.supportRatio && <span className="text-xs text-[var(--color-muted-foreground)]">{p.supportRatio.replace(/([A-Z])/g, ' $1').trim()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day-by-day timeline */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
          Day-by-Day Schedule
        </h3>

        <div className="relative">
          {/* Timeline connector line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--color-border)] hidden md:block" />

          <div className="space-y-4">
            {itinerary.days.map((day: any) => (
              <div key={day.dayNumber} className="relative md:pl-14">
                {/* Day number badge on timeline */}
                <div className="hidden md:flex absolute left-0 top-5 w-10 h-10 rounded-full bg-[var(--color-primary)] items-center justify-center text-white font-bold text-sm z-10 shadow-lg shadow-[var(--color-primary)]/20">
                  {day.dayNumber}
                </div>

                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                  {/* Day header */}
                  <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent px-5 py-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <span className="md:hidden w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xs">{day.dayNumber}</span>
                      <div>
                        <h4 className="font-semibold">{day.dayTitle || `Day ${day.dayNumber}`}</h4>
                        <p className="text-sm text-[var(--color-muted-foreground)]">{formatDayName(day.date)} · {formatDateAu(day.date)}</p>
                      </div>
                    </div>
                    {day.dayNotes && <p className="text-sm text-[var(--color-muted-foreground)] mt-2 ml-11 md:ml-0">{day.dayNotes}</p>}
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Accommodation events */}
                    {day.accommodationEvents?.map((ae: any, i: number) => (
                      <div key={`ae-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-[#1a2744] border border-[var(--color-primary)]/20">
                        <Building2 className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                        <div>
                          <p className="text-sm font-medium">
                            <span className="text-[var(--color-primary)]">{ae.eventType}</span> — {ae.propertyName}
                          </p>
                          {ae.address && <p className="text-xs text-[var(--color-muted-foreground)]">{ae.address}</p>}
                          {ae.confirmationReference && <p className="text-xs text-[var(--color-muted-foreground)]">Ref: {ae.confirmationReference}</p>}
                        </div>
                      </div>
                    ))}

                    {/* Staff on duty */}
                    {day.staffOnDuty?.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] flex-wrap">
                        <UserCog className="w-3.5 h-3.5" />
                        <span className="font-medium">Staff:</span>
                        {day.staffOnDuty.map((name: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Activities */}
                    {day.activities?.length > 0 ? (
                      <div className="space-y-2">
                        {day.activities.map((activity: any, i: number) => {
                          const cat = getCategoryStyle(activity.category)
                          const CatIcon = cat.icon
                          return (
                            <div key={i} className="flex gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]/30 transition-colors">
                              <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                                <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{activity.title}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${activityStatusStyle[activity.status] || activityStatusStyle.Planned}`}>
                                    {activity.status}
                                  </span>
                                  {activity.category && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>
                                      {activity.category}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)] mt-1 flex-wrap">
                                  {(activity.startTime || activity.endTime) && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(activity.startTime)}{activity.endTime && ` – ${formatTime(activity.endTime)}`}
                                    </span>
                                  )}
                                  {activity.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {activity.location}
                                    </span>
                                  )}
                                  {activity.estimatedCost != null && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" /> ${Number(activity.estimatedCost).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {activity.providerName && (
                                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                                    Provider: {activity.providerName}
                                    {activity.providerPhone && ` · ${activity.providerPhone}`}
                                  </p>
                                )}
                                {activity.bookingReference && (
                                  <p className="text-xs text-[var(--color-muted-foreground)]">Ref: {activity.bookingReference}</p>
                                )}
                                {activity.accessibilityNotes && (
                                  <p className="text-xs text-[var(--color-warning)] mt-1">♿ {activity.accessibilityNotes}</p>
                                )}
                                {activity.notes && (
                                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1 italic">{activity.notes}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      !day.accommodationEvents?.length && (
                        <p className="text-sm text-[var(--color-muted-foreground)] italic py-2">No activities scheduled</p>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {itinerary.days.length === 0 && (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No schedule has been generated yet.</p>
          <p className="text-sm mt-1">Go to the Activities tab to generate the day-by-day schedule first.</p>
        </div>
      )}
    </div>
  )
}
