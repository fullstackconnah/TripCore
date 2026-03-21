import { useParams, Link } from 'react-router-dom'
import { useTrip, useTripBookings, useTripAccommodation, useTripVehicles, useTripStaff, useTripTasks, useTripSchedule, useParticipants, useCreateBooking, useUpdateBooking, useDeleteBooking, useCancelBooking, useUpdateStaffAssignment, useDeleteStaffAssignment, useStaff, useAvailableStaff, useCreateStaffAssignment, useAccommodation, useCreateAccommodation, useCreateReservation, useUpdateReservation, useDeleteReservation, useCancelReservation, useGenerateSchedule, useDeleteScheduledActivity } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Users, Building2, Truck, UserCog, ListChecks, Calendar, AlertTriangle, Car, Plus, X, XCircle, Pencil, ExternalLink, Trash2, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import AddVehicleModal from '@/components/AddVehicleModal'
import AddActivityModal from '@/components/AddActivityModal'
import ItineraryTab from '@/components/ItineraryTab'

type Tab = 'overview' | 'bookings' | 'accommodation' | 'vehicles' | 'staff' | 'tasks' | 'activities' | 'itinerary'

export default function TripDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showAddBooking, setShowAddBooking] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [editingScheduledActivity, setEditingScheduledActivity] = useState<any>(null)
  const [addActivityDayId, setAddActivityDayId] = useState('')
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  const [deletingActivity, setDeletingActivity] = useState<any>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState('')
  const [bookingStatus, setBookingStatus] = useState('Enquiry')
  const [wheelchairRequired, setWheelchairRequired] = useState(false)
  const [highSupportRequired, setHighSupportRequired] = useState(false)
  const [nightSupportRequired, setNightSupportRequired] = useState(false)
  const [hasRestrictivePracticeFlag, setHasRestrictivePracticeFlag] = useState(false)
  const [supportRatioOverride, setSupportRatioOverride] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')

  const { data: trip, isLoading } = useTrip(id)
  const { data: bookings = [] } = useTripBookings(id)
  const { data: accommodation = [] } = useTripAccommodation(id)
  const { data: vehicles = [] } = useTripVehicles(id)
  const { data: staff = [] } = useTripStaff(id)
  const { data: tasks = [] } = useTripTasks(id)
  const { data: schedule = [] } = useTripSchedule(id)
  const { data: participants = [] } = useParticipants()
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()
  const generateSchedule = useGenerateSchedule()
  const deleteScheduledActivity = useDeleteScheduledActivity()

  // Filter out participants already booked on this trip
  const bookedParticipantIds = new Set(bookings.map((b: any) => b.participantId))
  const availableParticipants = participants.filter((p: any) => !bookedParticipantIds.has(p.id) && p.isActive)

  // Auto-populate support fields when participant changes
  useEffect(() => {
    if (!selectedParticipantId) return
    const p = participants.find((p: any) => p.id === selectedParticipantId)
    if (p) {
      setWheelchairRequired(p.wheelchairRequired ?? false)
      setHighSupportRequired(p.isHighSupport ?? false)
      setNightSupportRequired(p.requiresOvernightSupport ?? false)
      setHasRestrictivePracticeFlag(p.hasRestrictivePracticeFlag ?? false)
      setSupportRatioOverride(p.supportRatio ?? '')
    }
  }, [selectedParticipantId, participants])

  // Auto-generate trip days when activities tab is opened
  const hasTriedGenerate = useRef(false)
  useEffect(() => {
    if (activeTab !== 'activities') { hasTriedGenerate.current = false; return }
    if (!id || !trip || schedule.length > 0 || generateSchedule.isPending || hasTriedGenerate.current) return
    hasTriedGenerate.current = true
    generateSchedule.mutate(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id, schedule.length, trip])

  const toggleActivityExpanded = (activityId: string) => {
    setExpandedActivities(prev => {
      const next = new Set(prev)
      if (next.has(activityId)) next.delete(activityId)
      else next.add(activityId)
      return next
    })
  }

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'Planned': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'Booked': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'Confirmed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'Completed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const isReadOnly = trip?.status === 'Cancelled' || trip?.status === 'Archived'

  const deleteBooking = useDeleteBooking()
  const cancelBooking = useCancelBooking()
  const [deletingBooking, setDeletingBooking] = useState<any>(null)

  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})

  const updateStaffAssignment = useUpdateStaffAssignment()
  const deleteStaffAssignment = useDeleteStaffAssignment()
  const createStaffAssignment = useCreateStaffAssignment()
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [editStaffForm, setEditStaffForm] = useState<any>({})
  const [deletingStaff, setDeletingStaff] = useState<any>(null)

  // Add Staff state
  const [showAddStaff, setShowAddStaff] = useState(false)
  const { data: allStaff = [] } = useStaff()
  const { data: availableStaff = [] } = useAvailableStaff(trip?.startDate, trip?.endDate)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [staffAssignmentRole, setStaffAssignmentRole] = useState('')
  const [staffAssignmentStart, setStaffAssignmentStart] = useState('')
  const [staffAssignmentEnd, setStaffAssignmentEnd] = useState('')
  const [staffIsDriver, setStaffIsDriver] = useState(false)
  const [staffSleepoverType, setStaffSleepoverType] = useState('None')
  const [staffShiftNotes, setStaffShiftNotes] = useState('')

  // Compute availability set and already-assigned set
  const availableStaffIds = new Set(availableStaff.map((s: any) => s.id))
  const assignedStaffIds = new Set(staff.map((s: any) => s.staffId))

  const resetStaffForm = () => {
    setSelectedStaffId('')
    setStaffAssignmentRole('')
    setStaffAssignmentStart(trip?.startDate?.split('T')[0] ?? '')
    setStaffAssignmentEnd(trip?.endDate?.split('T')[0] ?? '')
    setStaffIsDriver(false)
    setStaffSleepoverType('None')
    setStaffShiftNotes('')
  }

  const handleCreateStaffAssignment = () => {
    if (!selectedStaffId || !id) return
    createStaffAssignment.mutate({
      tripInstanceId: id,
      staffId: selectedStaffId,
      assignmentRole: staffAssignmentRole || null,
      assignmentStart: staffAssignmentStart || null,
      assignmentEnd: staffAssignmentEnd || null,
      isDriver: staffIsDriver,
      sleepoverType: staffSleepoverType,
      shiftNotes: staffShiftNotes || null,
    }, {
      onSuccess: () => {
        setShowAddStaff(false)
        resetStaffForm()
      },
    })
  }

  // Accommodation state
  const { data: allAccommodation = [] } = useAccommodation()
  const createReservation = useCreateReservation()
  const createAccommodation = useCreateAccommodation()
  const deleteReservation = useDeleteReservation()
  const cancelReservation = useCancelReservation()
  const updateReservation = useUpdateReservation()
  const [showAddAccommodation, setShowAddAccommodation] = useState(false)
  const [deletingReservation, setDeletingReservation] = useState<any>(null)
  const [editingReservation, setEditingReservation] = useState<any>(null)
  const [editReservationForm, setEditReservationForm] = useState<any>({})
  const [accommForm, setAccommForm] = useState<any>({})
  const [creatingNewProperty, setCreatingNewProperty] = useState(false)
  const [newPropertyForm, setNewPropertyForm] = useState({ propertyName: '', location: '', region: '', bedroomCount: '', bedCount: '', maxCapacity: '' })

  const resetAccommForm = () => {
    setAccommForm({
      accommodationPropertyId: '',
      checkInDate: trip?.startDate?.split('T')[0] ?? '',
      checkOutDate: trip?.endDate?.split('T')[0] ?? '',
      bedroomsReserved: '',
      bedsReserved: '',
      cost: '',
      reservationStatus: 'Researching',
      comments: '',
    })
    setCreatingNewProperty(false)
    setNewPropertyForm({ propertyName: '', location: '', region: '', bedroomCount: '', bedCount: '', maxCapacity: '' })
  }

  const openEditReservation = (r: any) => {
    setEditingReservation(r)
    setEditReservationForm({
      tripInstanceId: r.tripInstanceId,
      accommodationPropertyId: r.accommodationPropertyId,
      checkInDate: r.checkInDate ?? '',
      checkOutDate: r.checkOutDate ?? '',
      bedroomsReserved: r.bedroomsReserved ?? '',
      bedsReserved: r.bedsReserved ?? '',
      cost: r.cost ?? '',
      reservationStatus: r.reservationStatus ?? 'Researching',
      comments: r.comments ?? '',
      confirmationReference: r.confirmationReference ?? '',
      dateBooked: r.dateBooked ?? '',
      dateConfirmed: r.dateConfirmed ?? '',
      cancellationReason: r.cancellationReason ?? '',
    })
  }

  const handleUpdateReservation = () => {
    if (!editingReservation) return
    updateReservation.mutate({ id: editingReservation.id, data: {
      ...editReservationForm,
      bedroomsReserved: editReservationForm.bedroomsReserved ? parseInt(editReservationForm.bedroomsReserved) : null,
      bedsReserved: editReservationForm.bedsReserved ? parseInt(editReservationForm.bedsReserved) : null,
      cost: editReservationForm.cost ? parseFloat(editReservationForm.cost) : null,
      confirmationReference: editReservationForm.confirmationReference || null,
      dateBooked: editReservationForm.dateBooked || null,
      dateConfirmed: editReservationForm.dateConfirmed || null,
      cancellationReason: editReservationForm.cancellationReason || null,
      comments: editReservationForm.comments || null,
    }}, {
      onSuccess: () => setEditingReservation(null),
    })
  }

  const submitReservation = (propertyId: string) => {
    if (!id) return
    createReservation.mutate({
      tripInstanceId: id,
      accommodationPropertyId: propertyId,
      checkInDate: accommForm.checkInDate,
      checkOutDate: accommForm.checkOutDate,
      bedroomsReserved: accommForm.bedroomsReserved ? parseInt(accommForm.bedroomsReserved) : null,
      bedsReserved: accommForm.bedsReserved ? parseInt(accommForm.bedsReserved) : null,
      cost: accommForm.cost ? parseFloat(accommForm.cost) : null,
      reservationStatus: accommForm.reservationStatus,
      comments: accommForm.comments || null,
    }, {
      onSuccess: () => {
        setShowAddAccommodation(false)
        resetAccommForm()
      },
    })
  }

  const handleCreateReservation = () => {
    if (!id) return
    if (creatingNewProperty) {
      if (!newPropertyForm.propertyName) return
      createAccommodation.mutate({
        propertyName: newPropertyForm.propertyName,
        location: newPropertyForm.location || null,
        region: newPropertyForm.region || null,
        bedroomCount: newPropertyForm.bedroomCount ? parseInt(newPropertyForm.bedroomCount) : null,
        bedCount: newPropertyForm.bedCount ? parseInt(newPropertyForm.bedCount) : null,
        maxCapacity: newPropertyForm.maxCapacity ? parseInt(newPropertyForm.maxCapacity) : null,
        isActive: true,
      }, {
        onSuccess: (res: any) => {
          const newId = res.data?.id
          if (newId) submitReservation(newId)
        },
      })
    } else {
      if (!accommForm.accommodationPropertyId) return
      submitReservation(accommForm.accommodationPropertyId)
    }
  }

  // Accommodation coverage check
  const getAccommodationCoverage = () => {
    if (!trip?.startDate || !trip?.endDate) return null
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const totalNights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (totalNights <= 0) return null

    const activeReservations = accommodation.filter((r: any) =>
      !['Cancelled', 'Unavailable'].includes(r.reservationStatus)
    )

    // Track which nights are covered (night = day you check in)
    const coveredNights = new Set<string>()
    for (const r of activeReservations) {
      const ci = new Date(r.checkInDate)
      const co = new Date(r.checkOutDate)
      const d = new Date(ci)
      while (d < co) {
        coveredNights.add(d.toISOString().split('T')[0])
        d.setDate(d.getDate() + 1)
      }
    }

    // Check each night of the trip (not including last day — that's checkout)
    const uncoveredNights: string[] = []
    const d = new Date(start)
    for (let i = 0; i < totalNights; i++) {
      const key = d.toISOString().split('T')[0]
      if (!coveredNights.has(key)) uncoveredNights.push(key)
      d.setDate(d.getDate() + 1)
    }

    return { totalNights, coveredNights: totalNights - uncoveredNights.length, uncoveredNights, allCovered: uncoveredNights.length === 0 }
  }

  const openEditStaffModal = (s: any) => {
    setEditingStaff(s)
    setEditStaffForm({
      tripInstanceId: s.tripInstanceId,
      staffId: s.staffId,
      assignmentRole: s.assignmentRole ?? '',
      assignmentStart: s.assignmentStart ?? '',
      assignmentEnd: s.assignmentEnd ?? '',
      isDriver: s.isDriver ?? false,
      sleepoverType: s.sleepoverType ?? 'None',
      shiftNotes: s.shiftNotes ?? '',
      status: s.status ?? 'Proposed',
    })
  }

  const handleUpdateStaffAssignment = () => {
    if (!editingStaff) return
    updateStaffAssignment.mutate({ id: editingStaff.id, data: editStaffForm }, {
      onSuccess: () => setEditingStaff(null),
    })
  }

  const openEditModal = (booking: any) => {
    setEditingBooking(booking)
    setEditForm({
      tripInstanceId: booking.tripInstanceId,
      participantId: booking.participantId,
      bookingStatus: booking.bookingStatus ?? 'Enquiry',
      wheelchairRequired: booking.wheelchairRequired ?? false,
      highSupportRequired: booking.highSupportRequired ?? false,
      nightSupportRequired: booking.nightSupportRequired ?? false,
      hasRestrictivePracticeFlag: booking.hasRestrictivePracticeFlag ?? false,
      supportRatioOverride: booking.supportRatioOverride ?? '',
      bookingNotes: booking.bookingNotes ?? '',
    })
  }

  const handleUpdateBooking = () => {
    if (!editingBooking) return
    updateBooking.mutate({ id: editingBooking.id, data: {
      ...editForm,
      supportRatioOverride: editForm.supportRatioOverride || null,
    }}, {
      onSuccess: () => setEditingBooking(null),
    })
  }

  const resetForm = () => {
    setSelectedParticipantId('')
    setBookingStatus('Enquiry')
    setWheelchairRequired(false)
    setHighSupportRequired(false)
    setNightSupportRequired(false)
    setHasRestrictivePracticeFlag(false)
    setSupportRatioOverride('')
    setBookingNotes('')
  }

  const handleCreateBooking = () => {
    if (!selectedParticipantId || !id) return
    createBooking.mutate({
      tripInstanceId: id,
      participantId: selectedParticipantId,
      bookingStatus,
      wheelchairRequired,
      highSupportRequired,
      nightSupportRequired,
      hasRestrictivePracticeFlag,
      ...(supportRatioOverride ? { supportRatioOverride } : {}),
      ...(bookingNotes ? { bookingNotes } : {}),
    }, {
      onSuccess: () => {
        setShowAddBooking(false)
        resetForm()
      },
    })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading trip...</div>
  if (!trip) return <div className="text-center py-12">Trip not found</div>

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Calendar },
    { key: 'bookings', label: 'Bookings', icon: Users, count: bookings.length },
    { key: 'accommodation', label: 'Accommodation', icon: Building2, count: accommodation.length },
    { key: 'vehicles', label: 'Vehicles', icon: Truck, count: vehicles.length },
    { key: 'staff', label: 'Staff', icon: UserCog, count: staff.length },
    { key: 'tasks', label: 'Tasks', icon: ListChecks, count: tasks.length },
    { key: 'activities', label: 'Activities', icon: Calendar, count: schedule.reduce((sum: number, d: any) => sum + (d.scheduledActivities?.length || 0), 0) },
    { key: 'itinerary', label: 'Itinerary', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/trips" className="mt-1 p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{trip.tripName}</h1>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(trip.status)}`}>{trip.status}</span>
            {trip.tripCode && <span className="text-sm font-mono text-[var(--color-muted-foreground)]">{trip.tripCode}</span>}
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {trip.destination || 'TBD'} · {formatDateAu(trip.startDate)} — {formatDateAu(trip.endDate)} · {trip.durationDays} days
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Participants', value: `${trip.currentParticipantCount}/${trip.maxParticipants || '—'}`, warn: trip.maxParticipants && trip.currentParticipantCount >= trip.maxParticipants },
          { label: 'Waitlist', value: trip.waitlistCount, warn: trip.waitlistCount > 0 },
          { label: 'High Support', value: trip.highSupportCount, warn: trip.highSupportCount > 0 },
          { label: 'Wheelchair', value: trip.wheelchairCount },
          { label: 'Staff', value: trip.staffAssignedCount, warn: trip.minStaffRequired && trip.staffAssignedCount < trip.minStaffRequired },
          { label: 'Overnight', value: trip.overnightSupportCount },
          { label: 'Tasks', value: trip.outstandingTaskCount, warn: trip.outstandingTaskCount > 0 },
        ].map(s => (
          <div key={s.label} className="bg-[var(--color-card)] rounded-lg p-3 border border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-muted-foreground)]">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.warn ? 'text-[var(--color-warning)]' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && <span className="ml-1 text-xs bg-[var(--color-accent)] px-1.5 py-0.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
              <h3 className="font-semibold">Trip Details</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Event Template</span><span>{trip.eventTemplateName || '—'}</span>
                <span className="text-[var(--color-muted-foreground)]">Region</span><span>{trip.region || '—'}</span>
                <span className="text-[var(--color-muted-foreground)]">OOP Due Date</span><span>{formatDateAu(trip.oopDueDate)}</span>
                <span className="text-[var(--color-muted-foreground)]">Booking Cutoff</span><span>{formatDateAu(trip.bookingCutoffDate)}</span>
                <span className="text-[var(--color-muted-foreground)]">Lead Coordinator</span><span>{trip.leadCoordinatorName || '—'}</span>
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
              {trip.notes && (
                <div>
                  <p className="text-[var(--color-muted-foreground)] text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-line">{trip.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {bookings.length}{trip.maxParticipants ? `/${trip.maxParticipants}` : ''} spots filled
              </p>
              <button onClick={() => setShowAddBooking(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Participant
              </button>
            </div>

            {/* Add Booking Modal */}
            {showAddBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowAddBooking(false); resetForm() }}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Participant to Trip</h3>
                    <button onClick={() => { setShowAddBooking(false); resetForm() }} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Participant Select */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Participant *</label>
                      <select value={selectedParticipantId} onChange={e => setSelectedParticipantId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        <option value="">Select a participant...</option>
                        {availableParticipants.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.fullName}</option>
                        ))}
                      </select>
                      {availableParticipants.length === 0 && (
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">All active participants are already booked on this trip.</p>
                      )}
                    </div>

                    {/* Booking Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Status</label>
                      <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        {['Enquiry', 'Held', 'Confirmed', 'Waitlist'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Support Overrides */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Support Requirements</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={wheelchairRequired} onChange={e => setWheelchairRequired(e.target.checked)}
                            className="rounded border-[var(--color-border)]" />
                          Wheelchair
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={highSupportRequired} onChange={e => setHighSupportRequired(e.target.checked)}
                            className="rounded border-[var(--color-border)]" />
                          High Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={nightSupportRequired} onChange={e => setNightSupportRequired(e.target.checked)}
                            className="rounded border-[var(--color-border)]" />
                          Night Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={hasRestrictivePracticeFlag} onChange={e => setHasRestrictivePracticeFlag(e.target.checked)}
                            className="rounded border-[var(--color-border)]" />
                          Restrictive Practice
                        </label>
                      </div>
                    </div>

                    {/* Support Ratio Override */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Support Ratio Override</label>
                      <select value={supportRatioOverride} onChange={e => setSupportRatioOverride(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        <option value="">No override</option>
                        {[['OneToOne','1:1'],['OneToTwo','1:2'],['OneToThree','1:3'],['OneToFour','1:4'],['OneToFive','1:5'],['TwoToOne','2:1'],['SharedSupport','Shared'],['Other','Other']].map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Notes</label>
                      <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {createBooking.isError && (
                      <p className="text-sm text-[var(--color-destructive)]">Failed to create booking. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => { setShowAddBooking(false); resetForm() }}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleCreateBooking} disabled={!selectedParticipantId || createBooking.isPending}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {createBooking.isPending ? 'Adding...' : 'Add Booking'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-accent)]">
                  <tr>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Participant</th>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Date</th>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Ratio</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">🦽</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">High</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Night</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                      <td className="p-3 font-medium">{b.participantName || '—'}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(b.bookingStatus)}`}>{b.bookingStatus}</span></td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{formatDateAu(b.bookingDate)}</td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{({ OneToOne: '1:1', OneToTwo: '1:2', OneToThree: '1:3', OneToFour: '1:4', OneToFive: '1:5', TwoToOne: '2:1', SharedSupport: 'Shared', Other: 'Other' }[b.supportRatioOverride as string]) || '—'}</td>
                      <td className="p-3 text-center">{b.wheelchairRequired ? '✅' : ''}</td>
                      <td className="p-3 text-center">{b.highSupportRequired ? '✅' : ''}</td>
                      <td className="p-3 text-center">{b.nightSupportRequired ? '✅' : ''}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {b.actionRequired && <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />}
                          <button onClick={() => openEditModal(b)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors" title="Edit booking">
                            <Pencil className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                          </button>
                          <Link to={`/participants/${b.participantId}`} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors" title="View participant">
                            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                          </Link>
                          <button onClick={() => setDeletingBooking(b)} className="p-1 rounded hover:bg-[var(--color-destructive)]/10 transition-colors" title="Remove from trip">
                            <Trash2 className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-[var(--color-muted-foreground)]">No bookings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Staffing Summary */}
            {bookings.length > 0 && (() => {
              const ratioToStaff: Record<string, number> = { OneToOne: 1, OneToTwo: 0.5, OneToThree: 1/3, OneToFour: 0.25, OneToFive: 0.2, TwoToOne: 2, SharedSupport: 0.25 }
              const ratioLabels: Record<string, string> = { OneToOne: '1:1', OneToTwo: '1:2', OneToThree: '1:3', OneToFour: '1:4', OneToFive: '1:5', TwoToOne: '2:1', SharedSupport: 'Shared' }
              const activeBookings = bookings.filter((b: any) => !['Cancelled', 'NoLongerAttending'].includes(b.bookingStatus))
              const rawTotal = activeBookings.reduce((sum: number, b: any) => sum + (ratioToStaff[b.supportRatioOverride] ?? 0), 0)
              const rounded = Math.ceil(rawTotal)
              const noRatioCount = activeBookings.filter((b: any) => !b.supportRatioOverride || !(b.supportRatioOverride in ratioToStaff)).length
              const assigned = trip.staffAssignedCount ?? 0
              const isStaffed = assigned >= rounded
              const gap = rounded - rawTotal
              let suggestion = ''
              if (gap > 0 && gap < 1) {
                const under = Object.entries(ratioToStaff).filter(([, v]) => v <= gap + 0.01).sort(([, a], [, b]) => b - a)
                if (under.length > 0) {
                  const exact = Math.abs(under[0][1] - gap) < 0.01
                  suggestion = exact
                    ? `Add a ${ratioLabels[under[0][0]]} participant to fill staff capacity`
                    : `Capacity for up to a ${ratioLabels[under[0][0]]} participant before needing another staff`
                }
              }
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-3">
                    <p className="text-xs text-[var(--color-muted-foreground)]">Staff Required</p>
                    <p className="text-xl font-bold mt-1">{rounded} <span className="text-sm font-normal text-[var(--color-muted-foreground)]">({rawTotal.toFixed(2)})</span></p>
                    {noRatioCount > 0 && <p className="text-xs text-[var(--color-warning)] mt-1">{noRatioCount} participant{noRatioCount > 1 ? 's' : ''} without ratio</p>}
                  </div>
                  <div className={`rounded-lg border p-3 ${isStaffed ? 'bg-[var(--color-success,#22c55e)]/10 border-[var(--color-success,#22c55e)]/30' : 'bg-[var(--color-destructive)]/10 border-[var(--color-destructive)]/30'}`}>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Staff Assigned</p>
                    <p className={`text-xl font-bold mt-1 ${isStaffed ? 'text-[var(--color-success,#22c55e)]' : 'text-[var(--color-destructive)]'}`}>
                      {assigned}/{rounded}
                    </p>
                    <p className={`text-xs mt-1 ${isStaffed ? 'text-[var(--color-success,#22c55e)]' : 'text-[var(--color-destructive)]'}`}>
                      {isStaffed ? 'Fully staffed' : `Need ${rounded - assigned} more`}
                    </p>
                  </div>
                  <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-3">
                    <p className="text-xs text-[var(--color-muted-foreground)]">Capacity</p>
                    {suggestion
                      ? <p className="text-sm mt-1">{suggestion}</p>
                      : <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{gap === 0 ? 'At exact capacity — next participant adds a staff' : 'No spare capacity'}</p>
                    }
                  </div>
                </div>
              )
            })()}

            {/* Edit Booking Modal */}
            {editingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingBooking(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Booking — {editingBooking.participantName}</h3>
                    <button onClick={() => setEditingBooking(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Booking Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Status</label>
                      <select value={editForm.bookingStatus} onChange={e => setEditForm({ ...editForm, bookingStatus: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        {['Enquiry', 'Held', 'Confirmed', 'Waitlist', 'Cancelled', 'Completed', 'NoLongerAttending'].map(s => (
                          <option key={s} value={s}>{s === 'NoLongerAttending' ? 'No Longer Attending' : s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Support Requirements */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Support Requirements</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.wheelchairRequired} onChange={e => setEditForm({ ...editForm, wheelchairRequired: e.target.checked })}
                            className="rounded border-[var(--color-border)]" />
                          Wheelchair
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.highSupportRequired} onChange={e => setEditForm({ ...editForm, highSupportRequired: e.target.checked })}
                            className="rounded border-[var(--color-border)]" />
                          High Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.nightSupportRequired} onChange={e => setEditForm({ ...editForm, nightSupportRequired: e.target.checked })}
                            className="rounded border-[var(--color-border)]" />
                          Night Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.hasRestrictivePracticeFlag} onChange={e => setEditForm({ ...editForm, hasRestrictivePracticeFlag: e.target.checked })}
                            className="rounded border-[var(--color-border)]" />
                          Restrictive Practice
                        </label>
                      </div>
                    </div>

                    {/* Support Ratio Override */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Support Ratio Override</label>
                      <select value={editForm.supportRatioOverride} onChange={e => setEditForm({ ...editForm, supportRatioOverride: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        <option value="">No override</option>
                        {[['OneToOne','1:1'],['OneToTwo','1:2'],['OneToThree','1:3'],['OneToFour','1:4'],['OneToFive','1:5'],['TwoToOne','2:1'],['SharedSupport','Shared'],['Other','Other']].map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Notes</label>
                      <textarea value={editForm.bookingNotes} onChange={e => setEditForm({ ...editForm, bookingNotes: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {updateBooking.isError && (
                      <p className="text-sm text-[var(--color-destructive)]">Failed to update booking. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditingBooking(null)}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateBooking} disabled={updateBooking.isPending}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {updateBooking.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete/Cancel Booking Confirmation */}
            {deletingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingBooking(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Remove Participant</h3>
                    <button onClick={() => setDeletingBooking(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    What would you like to do with <span className="font-medium text-[var(--color-foreground)]">{deletingBooking.participantName}</span>'s booking?
                  </p>
                  {(deleteBooking.isError || cancelBooking.isError) && (
                    <p className="text-sm text-[var(--color-destructive)] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => cancelBooking.mutate({ id: deletingBooking.id, data: deletingBooking }, { onSuccess: () => setDeletingBooking(null) })}
                      disabled={cancelBooking.isPending || deleteBooking.isPending}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 text-sm font-medium hover:bg-[var(--color-warning)]/20 transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Cancel booking</span>
                      <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">Mark as cancelled — keeps the record for history</span>
                    </button>
                    <button
                      onClick={() => deleteBooking.mutate(deletingBooking.id, { onSuccess: () => setDeletingBooking(null) })}
                      disabled={deleteBooking.isPending || cancelBooking.isPending}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/10 text-sm font-medium hover:bg-[var(--color-destructive)]/20 transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Delete permanently</span>
                      <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">Remove completely from the trip — cannot be undone</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'accommodation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-muted-foreground)]">{accommodation.length} reservation{accommodation.length !== 1 ? 's' : ''}</p>
              <button onClick={() => { resetAccommForm(); setShowAddAccommodation(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Add Accommodation
              </button>
            </div>

            {/* Stay Timeline */}
            {trip?.startDate && trip?.endDate && (() => {
              const tripStart = new Date(trip.startDate)
              const tripEnd = new Date(trip.endDate)
              const totalDays = Math.max(1, Math.round((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)))
              const coverage = getAccommodationCoverage()
              const activeRes = accommodation.filter((r: any) => !['Cancelled', 'Unavailable'].includes(r.reservationStatus))

              // Build day labels
              const days: { date: Date; label: string; covered: boolean }[] = []
              for (let i = 0; i <= totalDays; i++) {
                const d = new Date(tripStart)
                d.setDate(d.getDate() + i)
                const key = d.toISOString().split('T')[0]
                const isCovered = i < totalDays ? !coverage?.uncoveredNights.includes(key) : true // last day is checkout
                days.push({ date: d, label: d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }), covered: isCovered })
              }

              return (
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Stay Timeline</h3>
                    {coverage && (
                      <span className={`text-xs font-medium ${coverage.allCovered ? 'text-[var(--color-success,#22c55e)]' : 'text-[var(--color-destructive)]'}`}>
                        {coverage.allCovered ? `All ${coverage.totalNights} nights covered` : `${coverage.coveredNights}/${coverage.totalNights} nights covered`}
                      </span>
                    )}
                  </div>

                  {/* Day headers */}
                  <div className="flex gap-0">
                    {days.map((day, i) => (
                      <div key={i} className="flex-1 text-center">
                        <p className="text-[10px] text-[var(--color-muted-foreground)] truncate">{day.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Night cells row */}
                  <div className="flex gap-0.5 mt-1 mb-2">
                    {days.slice(0, -1).map((day, i) => {
                      const key = day.date.toISOString().split('T')[0]
                      const isMissing = coverage?.uncoveredNights.includes(key)
                      return (
                        <div key={i} className={`flex-1 h-2 rounded-sm ${isMissing ? 'bg-[var(--color-destructive)]/40' : 'bg-[var(--color-success,#22c55e)]/40'}`}
                          title={`${day.label}: ${isMissing ? 'No accommodation' : 'Covered'}`} />
                      )
                    })}
                  </div>

                  {/* Reservation bars */}
                  {activeRes.map((r: any) => {
                    const ci = new Date(r.checkInDate)
                    const co = new Date(r.checkOutDate)
                    const startOffset = Math.max(0, (ci.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24))
                    const endOffset = Math.min(totalDays, (co.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24))
                    const leftPct = (startOffset / totalDays) * 100
                    const widthPct = ((endOffset - startOffset) / totalDays) * 100
                    if (widthPct <= 0) return null
                    return (
                      <div key={r.id} className="relative h-6 mt-1">
                        <div className="absolute h-full rounded bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center px-2 overflow-hidden"
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
                          <span className="text-[10px] font-medium text-[var(--color-primary)] truncate">{r.propertyName}</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Missing nights warning */}
                  {coverage && !coverage.allCovered && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-destructive)] shrink-0" />
                      <p className="text-xs text-[var(--color-destructive)]">
                        Missing: {coverage.uncoveredNights.map((d: string) => {
                          const dt = new Date(d)
                          return dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
                        }).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Reservation Cards */}
            {accommodation.length === 0 ? (
              <p className="text-[var(--color-muted-foreground)]">No accommodation reservations</p>
            ) : (
              <div className="space-y-3">
                {accommodation.map((r: any) => {
                  const property = allAccommodation.find((a: any) => a.id === r.accommodationPropertyId)
                  const nights = r.checkInDate && r.checkOutDate
                    ? Math.round((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const costPerNight = nights && r.cost ? (r.cost / nights).toFixed(2) : null

                  return (
                    <div key={r.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{r.propertyName}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(r.reservationStatus)}`}>{r.reservationStatus}</span>
                            {r.hasOverlapConflict && <span className="badge-conflict text-xs px-2 py-0.5 rounded-full">Conflict</span>}
                          </div>
                          {property?.location && (
                            <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{property.location}{property.region ? ` · ${property.region}` : ''}</p>
                          )}
                          {property && (property.address || property.suburb) && (
                            <p className="text-xs text-[var(--color-muted-foreground)]">{[property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEditReservation(r)} className="p-1.5 rounded hover:bg-[var(--color-accent)] transition-colors" title="Edit reservation">
                            <Pencil className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                          </button>
                          <Link to={`/accommodation/${r.accommodationPropertyId}`} className="p-1.5 rounded hover:bg-[var(--color-accent)] transition-colors" title="View property details">
                            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                          </Link>
                          <button onClick={() => setDeletingReservation(r)} className="p-1.5 rounded hover:bg-[var(--color-destructive)]/10 transition-colors" title="Remove reservation">
                            <Trash2 className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]" />
                          </button>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4 text-sm">
                        <div>
                          <p className="text-xs text-[var(--color-muted-foreground)]">Check-in</p>
                          <p className="font-medium">{formatDateAu(r.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-muted-foreground)]">Check-out</p>
                          <p className="font-medium">{formatDateAu(r.checkOutDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-muted-foreground)]">Nights</p>
                          <p className="font-medium">{nights ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-muted-foreground)]">Cost</p>
                          <p className="font-medium">{r.cost ? `$${r.cost}` : '—'}{costPerNight ? ` ($${costPerNight}/night)` : ''}</p>
                        </div>
                        {(r.bedroomsReserved || property?.bedroomCount) && (
                          <div>
                            <p className="text-xs text-[var(--color-muted-foreground)]">Bedrooms</p>
                            <p className="font-medium">{r.bedroomsReserved ?? '—'}{property?.bedroomCount ? ` / ${property.bedroomCount} available` : ''}</p>
                          </div>
                        )}
                        {(r.bedsReserved || property?.bedCount) && (
                          <div>
                            <p className="text-xs text-[var(--color-muted-foreground)]">Beds</p>
                            <p className="font-medium">{r.bedsReserved ?? '—'}{property?.bedCount ? ` / ${property.bedCount} available` : ''}</p>
                          </div>
                        )}
                        {property?.maxCapacity && (
                          <div>
                            <p className="text-xs text-[var(--color-muted-foreground)]">Max Capacity</p>
                            <p className="font-medium">{property.maxCapacity}</p>
                          </div>
                        )}
                        {r.confirmationReference && (
                          <div>
                            <p className="text-xs text-[var(--color-muted-foreground)]">Confirmation Ref</p>
                            <p className="font-medium">{r.confirmationReference}</p>
                          </div>
                        )}
                      </div>

                      {/* Property tags */}
                      {property && (property.isWheelchairAccessible || property.isFullyModified || property.isSemiModified) && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {property.isWheelchairAccessible && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Wheelchair Accessible</span>}
                          {property.isFullyModified && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Fully Modified</span>}
                          {property.isSemiModified && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Semi Modified</span>}
                        </div>
                      )}

                      {/* Notes */}
                      {r.comments && (
                        <p className="text-sm text-[var(--color-muted-foreground)] mt-3 pt-3 border-t border-[var(--color-border)]">{r.comments}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add Accommodation Modal */}
            {showAddAccommodation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddAccommodation(false)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Accommodation</h3>
                    <button onClick={() => setShowAddAccommodation(false)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Property Select or Create */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">Property</label>
                        <button type="button" onClick={() => { setCreatingNewProperty(!creatingNewProperty); setAccommForm({ ...accommForm, accommodationPropertyId: '' }) }}
                          className="text-xs text-[var(--color-primary)] hover:underline">
                          {creatingNewProperty ? 'Select existing' : '+ Create new'}
                        </button>
                      </div>
                      {creatingNewProperty ? (
                        <div className="space-y-3 p-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-accent)]/30">
                          <div>
                            <label className="block text-xs font-medium mb-1">Property Name *</label>
                            <input type="text" value={newPropertyForm.propertyName} onChange={e => setNewPropertyForm({ ...newPropertyForm, propertyName: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                              placeholder="e.g. Beach House Resort" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Location</label>
                              <input type="text" value={newPropertyForm.location} onChange={e => setNewPropertyForm({ ...newPropertyForm, location: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                                placeholder="e.g. Gold Coast, QLD" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Region</label>
                              <input type="text" value={newPropertyForm.region} onChange={e => setNewPropertyForm({ ...newPropertyForm, region: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                                placeholder="e.g. South East QLD" />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Bedrooms</label>
                              <input type="number" min="0" value={newPropertyForm.bedroomCount} onChange={e => setNewPropertyForm({ ...newPropertyForm, bedroomCount: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Beds</label>
                              <input type="number" min="0" value={newPropertyForm.bedCount} onChange={e => setNewPropertyForm({ ...newPropertyForm, bedCount: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Max Capacity</label>
                              <input type="number" min="0" value={newPropertyForm.maxCapacity} onChange={e => setNewPropertyForm({ ...newPropertyForm, maxCapacity: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <select value={accommForm.accommodationPropertyId} onChange={e => setAccommForm({ ...accommForm, accommodationPropertyId: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                          <option value="">Select property...</option>
                          {allAccommodation.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.propertyName} — {a.location || 'No location'}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-in</label>
                        <input type="date" value={accommForm.checkInDate} onChange={e => setAccommForm({ ...accommForm, checkInDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-out</label>
                        <input type="date" value={accommForm.checkOutDate} onChange={e => setAccommForm({ ...accommForm, checkOutDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                    </div>

                    {/* Bedrooms / Beds */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Bedrooms</label>
                        <input type="number" min="0" value={accommForm.bedroomsReserved} onChange={e => setAccommForm({ ...accommForm, bedroomsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" placeholder="Optional" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Beds</label>
                        <input type="number" min="0" value={accommForm.bedsReserved} onChange={e => setAccommForm({ ...accommForm, bedsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" placeholder="Optional" />
                      </div>
                    </div>

                    {/* Cost */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <input type="number" min="0" step="0.01" value={accommForm.cost} onChange={e => setAccommForm({ ...accommForm, cost: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" placeholder="Optional" />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={accommForm.reservationStatus} onChange={e => setAccommForm({ ...accommForm, reservationStatus: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        {['Researching', 'Requested', 'Booked', 'Confirmed', 'Cancelled', 'Unavailable'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Comments</label>
                      <textarea value={accommForm.comments} onChange={e => setAccommForm({ ...accommForm, comments: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {(createReservation.isError || createAccommodation.isError) && (
                      <p className="text-sm text-[var(--color-destructive)]">Failed to add reservation. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowAddAccommodation(false)}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleCreateReservation}
                        disabled={creatingNewProperty ? !newPropertyForm.propertyName || createAccommodation.isPending || createReservation.isPending : !accommForm.accommodationPropertyId || createReservation.isPending}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {createAccommodation.isPending || createReservation.isPending ? 'Adding...' : 'Add Reservation'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Reservation Modal */}
            {editingReservation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingReservation(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Reservation — {editingReservation.propertyName}</h3>
                    <button onClick={() => setEditingReservation(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Property */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Property</label>
                      <select value={editReservationForm.accommodationPropertyId} onChange={e => setEditReservationForm({ ...editReservationForm, accommodationPropertyId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        {allAccommodation.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.propertyName} — {a.location || 'No location'}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-in</label>
                        <input type="date" value={editReservationForm.checkInDate} onChange={e => setEditReservationForm({ ...editReservationForm, checkInDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-out</label>
                        <input type="date" value={editReservationForm.checkOutDate} onChange={e => setEditReservationForm({ ...editReservationForm, checkOutDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                    </div>

                    {/* Bedrooms / Beds / Cost */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Bedrooms</label>
                        <input type="number" min="0" value={editReservationForm.bedroomsReserved} onChange={e => setEditReservationForm({ ...editReservationForm, bedroomsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Beds</label>
                        <input type="number" min="0" value={editReservationForm.bedsReserved} onChange={e => setEditReservationForm({ ...editReservationForm, bedsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost</label>
                        <input type="number" min="0" step="0.01" value={editReservationForm.cost} onChange={e => setEditReservationForm({ ...editReservationForm, cost: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={editReservationForm.reservationStatus} onChange={e => setEditReservationForm({ ...editReservationForm, reservationStatus: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        {['Researching', 'Requested', 'Booked', 'Confirmed', 'Cancelled', 'Unavailable'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Confirmation Reference */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Confirmation Reference</label>
                      <input type="text" value={editReservationForm.confirmationReference} onChange={e => setEditReservationForm({ ...editReservationForm, confirmationReference: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                        placeholder="e.g. booking ref number" />
                    </div>

                    {/* Date Booked / Date Confirmed */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date Booked</label>
                        <input type="date" value={editReservationForm.dateBooked} onChange={e => setEditReservationForm({ ...editReservationForm, dateBooked: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date Confirmed</label>
                        <input type="date" value={editReservationForm.dateConfirmed} onChange={e => setEditReservationForm({ ...editReservationForm, dateConfirmed: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Comments</label>
                      <textarea value={editReservationForm.comments} onChange={e => setEditReservationForm({ ...editReservationForm, comments: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Cancellation Reason (only show if cancelled) */}
                    {editReservationForm.reservationStatus === 'Cancelled' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Cancellation Reason</label>
                        <input type="text" value={editReservationForm.cancellationReason} onChange={e => setEditReservationForm({ ...editReservationForm, cancellationReason: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                          placeholder="Reason for cancellation..." />
                      </div>
                    )}

                    {/* Error */}
                    {updateReservation.isError && (
                      <p className="text-sm text-[var(--color-destructive)]">Failed to update reservation. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditingReservation(null)}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateReservation} disabled={updateReservation.isPending}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {updateReservation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete/Cancel Reservation Confirmation */}
            {deletingReservation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingReservation(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Remove Reservation</h3>
                    <button onClick={() => setDeletingReservation(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    What would you like to do with the reservation at <span className="font-medium text-[var(--color-foreground)]">{deletingReservation.propertyName}</span>?
                  </p>
                  {(deleteReservation.isError || cancelReservation.isError) && (
                    <p className="text-sm text-[var(--color-destructive)] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => cancelReservation.mutate({ id: deletingReservation.id, data: deletingReservation }, { onSuccess: () => setDeletingReservation(null) })}
                      disabled={cancelReservation.isPending || deleteReservation.isPending}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 text-sm font-medium hover:bg-[var(--color-warning)]/20 transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Cancel reservation</span>
                      <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">Mark as cancelled — keeps the record for history</span>
                    </button>
                    <button
                      onClick={() => deleteReservation.mutate(deletingReservation.id, { onSuccess: () => setDeletingReservation(null) })}
                      disabled={deleteReservation.isPending || cancelReservation.isPending}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/10 text-sm font-medium hover:bg-[var(--color-destructive)]/20 transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Delete permanently</span>
                      <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">Remove completely — cannot be undone</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {/* Driver summary header */}
            {(() => {
              const tripDrivers = (staff as any[]).filter((s: any) => s.isDriver)
              const needed = (vehicles as any[]).length  // 1 driver required per vehicle
              const assigned = tripDrivers.length
              const shortfall = needed - assigned
              return (
                <div className="flex items-center justify-between gap-4">
                  {needed === 0 ? (
                    <span className="text-sm text-[var(--color-muted-foreground)] italic">No vehicles assigned yet</span>
                  ) : assigned === 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]">
                        <XCircle className="w-4 h-4" />
                        <span>0 / {needed}</span>
                      </div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">No drivers assigned to this trip yet</span>
                    </div>
                  ) : assigned < needed ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{assigned} / {needed} · need {shortfall} more</span>
                      </div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {tripDrivers.map((s: any) => s.staffName).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-success,#22c55e)]/10 text-[var(--color-success,#22c55e)]">
                        <Car className="w-4 h-4" />
                        <span>{assigned} / {needed}</span>
                      </div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {tripDrivers.map((s: any) => s.staffName).join(', ')}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowAddVehicle(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" /> Add Vehicle
                  </button>
                </div>
              )
            })()}

            {/* Vehicle cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {(vehicles as any[]).length === 0 ? null : (vehicles as any[]).map((v: any) => (
                <div key={v.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{v.vehicleName}</h4>
                      <p className="text-sm text-[var(--color-muted-foreground)]">{v.registration || 'No rego'}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(v.status)}`}>{v.status}</span>
                      {v.hasOverlapConflict && <span className="badge-conflict text-xs px-2 py-0.5 rounded-full">⚠ Conflict</span>}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                    <p>{v.vehicleType} · {v.totalSeats} seats{v.wheelchairPositions ? ` · ♿ ${v.wheelchairPositions}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Vehicle Modal */}
            {showAddVehicle && id && (
              <AddVehicleModal
                tripInstanceId={id}
                assignedVehicleIds={new Set((vehicles as any[]).map((v: any) => v.vehicleId))}
                onClose={() => setShowAddVehicle(false)}
              />
            )}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-4">
            {/* Staffing summary */}
            {(() => {
              const ratioToStaff: Record<string, number> = { OneToOne: 1, OneToTwo: 0.5, OneToThree: 1/3, OneToFour: 0.25, OneToFive: 0.2, TwoToOne: 2, SharedSupport: 0.25 }
              const activeBookings = bookings.filter((b: any) => !['Cancelled', 'NoLongerAttending'].includes(b.bookingStatus))
              const rawTotal = activeBookings.reduce((sum: number, b: any) => sum + (ratioToStaff[b.supportRatioOverride] ?? 0), 0)
              const required = Math.ceil(rawTotal)
              const assigned = staff.filter((s: any) => s.status !== 'Cancelled').length
              const isStaffed = assigned >= required
              return (
                <div className="flex items-center justify-between gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isStaffed
                    ? 'bg-[var(--color-success,#22c55e)]/10 text-[var(--color-success,#22c55e)]'
                    : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'}`}>
                    <span>{assigned}/{required} staff</span>
                    <span className="text-xs font-normal">({rawTotal.toFixed(2)} required from ratios)</span>
                    {!isStaffed && <span className="text-xs">— need {required - assigned} more</span>}
                  </div>
                  <button onClick={() => { resetStaffForm(); setShowAddStaff(true) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" /> Add Staff
                  </button>
                </div>
              )
            })()}

            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-accent)]">
                  <tr>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Staff</th>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Role</th>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Dates</th>
                    <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Driver</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Sleepover</th>
                    <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {staff.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                      <td className="p-3 font-medium">{s.staffName}</td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{s.assignmentRole || '—'}</td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{formatDateAu(s.assignmentStart)} — {formatDateAu(s.assignmentEnd)}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>{s.status}</span></td>
                      <td className="p-3 text-center">{s.isDriver ? '✅' : ''}</td>
                      <td className="p-3 text-center text-xs">{s.sleepoverType !== 'None' ? s.sleepoverType : ''}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {s.hasConflict && <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />}
                          <button onClick={() => openEditStaffModal(s)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors" title="Edit assignment">
                            <Pencil className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                          </button>
                          <button onClick={() => setDeletingStaff(s)} className="p-1 rounded hover:bg-[var(--color-destructive)]/10 transition-colors" title="Remove from trip">
                            <Trash2 className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-[var(--color-muted-foreground)]">No staff assigned yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit Staff Assignment Modal */}
            {editingStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingStaff(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Assignment — {editingStaff.staffName}</h3>
                    <button onClick={() => setEditingStaff(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Assignment Role */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignment Role</label>
                      <input type="text" value={editStaffForm.assignmentRole} onChange={e => setEditStaffForm({ ...editStaffForm, assignmentRole: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                        placeholder="e.g. Support Worker" />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={editStaffForm.status} onChange={e => setEditStaffForm({ ...editStaffForm, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        {['Proposed', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Assignment Start</label>
                        <input type="date" value={editStaffForm.assignmentStart} onChange={e => setEditStaffForm({ ...editStaffForm, assignmentStart: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Assignment End</label>
                        <input type="date" value={editStaffForm.assignmentEnd} onChange={e => setEditStaffForm({ ...editStaffForm, assignmentEnd: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                    </div>

                    {/* Is Driver */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={editStaffForm.isDriver} onChange={e => setEditStaffForm({ ...editStaffForm, isDriver: e.target.checked })}
                          className="rounded border-[var(--color-border)]" />
                        Is Driver
                      </label>
                    </div>

                    {/* Sleepover Type */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Sleepover Type</label>
                      <select value={editStaffForm.sleepoverType} onChange={e => setEditStaffForm({ ...editStaffForm, sleepoverType: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        <option value="None">None</option>
                        <option value="ActiveNight">Active Night</option>
                        <option value="PassiveNight">Passive Night</option>
                        <option value="Sleepover">Sleepover</option>
                      </select>
                    </div>

                    {/* Shift Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Shift Notes</label>
                      <textarea value={editStaffForm.shiftNotes} onChange={e => setEditStaffForm({ ...editStaffForm, shiftNotes: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {updateStaffAssignment.isError && (
                      <p className="text-sm text-[var(--color-destructive)]">Failed to update assignment. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditingStaff(null)}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateStaffAssignment} disabled={updateStaffAssignment.isPending}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {updateStaffAssignment.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Staff Modal */}
            {showAddStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddStaff(false)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Staff to Trip</h3>
                    <button onClick={() => setShowAddStaff(false)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Staff Select */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Staff Member</label>
                      <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        <option value="">Select staff...</option>
                        {allStaff
                          .filter((s: any) => !assignedStaffIds.has(s.id))
                          .map((s: any) => {
                            const isAvailable = availableStaffIds.has(s.id)
                            return (
                              <option key={s.id} value={s.id}>
                                {s.fullName}{!isAvailable ? ' (Unavailable)' : ''}
                              </option>
                            )
                          })}
                      </select>
                      {selectedStaffId && !availableStaffIds.has(selectedStaffId) && (
                        <p className="text-xs text-[var(--color-warning)] mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> This staff member has a scheduling conflict for the trip dates
                        </p>
                      )}
                    </div>

                    {/* Assignment Role */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignment Role</label>
                      <input type="text" value={staffAssignmentRole} onChange={e => setStaffAssignmentRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                        placeholder="e.g. Support Worker" />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input type="date" value={staffAssignmentStart} onChange={e => setStaffAssignmentStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input type="date" value={staffAssignmentEnd} onChange={e => setStaffAssignmentEnd(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" />
                      </div>
                    </div>

                    {/* Is Driver */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={staffIsDriver} onChange={e => setStaffIsDriver(e.target.checked)}
                          className="rounded border-[var(--color-border)]" />
                        Is Driver
                      </label>
                    </div>

                    {/* Sleepover Type */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Sleepover Type</label>
                      <select value={staffSleepoverType} onChange={e => setStaffSleepoverType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                        <option value="None">None</option>
                        <option value="ActiveNight">Active Night</option>
                        <option value="PassiveNight">Passive Night</option>
                        <option value="Sleepover">Sleepover</option>
                      </select>
                    </div>

                    {/* Shift Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Shift Notes</label>
                      <textarea value={staffShiftNotes} onChange={e => setStaffShiftNotes(e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {createStaffAssignment.isError && (
                      <p className="text-sm text-[var(--color-destructive)]">Failed to add staff. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowAddStaff(false)}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleCreateStaffAssignment} disabled={!selectedStaffId || createStaffAssignment.isPending}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {createStaffAssignment.isPending ? 'Adding...' : 'Add Staff'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete/Cancel Staff Assignment Confirmation */}
            {deletingStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingStaff(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Remove Staff</h3>
                    <button onClick={() => setDeletingStaff(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    What would you like to do with <span className="font-medium text-[var(--color-foreground)]">{deletingStaff.staffName}</span>'s assignment?
                  </p>
                  {(updateStaffAssignment.isError || deleteStaffAssignment.isError) && (
                    <p className="text-sm text-[var(--color-destructive)] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => updateStaffAssignment.mutate({ id: deletingStaff.id, data: { ...deletingStaff, status: 'Cancelled' } }, { onSuccess: () => setDeletingStaff(null) })}
                      disabled={updateStaffAssignment.isPending || deleteStaffAssignment.isPending}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 text-sm font-medium hover:bg-[var(--color-warning)]/20 transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Cancel assignment</span>
                      <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">Mark as cancelled — keeps the record for history</span>
                    </button>
                    <button
                      onClick={() => deleteStaffAssignment.mutate(deletingStaff.id, { onSuccess: () => setDeletingStaff(null) })}
                      disabled={deleteStaffAssignment.isPending || updateStaffAssignment.isPending}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/10 text-sm font-medium hover:bg-[var(--color-destructive)]/20 transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Delete permanently</span>
                      <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">Remove completely from the trip — cannot be undone</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-accent)]">
                <tr>
                  <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Task</th>
                  <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Type</th>
                  <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Owner</th>
                  <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Due</th>
                  <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Priority</th>
                  <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {tasks.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">{t.taskType}</td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">{t.ownerName || 'Unassigned'}</td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">{formatDateAu(t.dueDate)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'High' || t.priority === 'Urgent' ? 'badge-overdue' : 'badge-info'}`}>{t.priority}</span></td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(t.status)}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-4">
            {schedule.length === 0 ? (
              <div className="text-[var(--color-muted-foreground)]">
                {generateSchedule.isPending ? (
                  <p>Generating schedule...</p>
                ) : generateSchedule.isError ? (
                  <div className="space-y-2">
                    <p className="text-[var(--color-destructive)]">Failed to generate schedule. The server may need a database update.</p>
                    <button onClick={() => { hasTriedGenerate.current = false; id && generateSchedule.mutate(id) }}
                      className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90">
                      Retry
                    </button>
                  </div>
                ) : (
                  <p>No schedule available. Check that the trip has dates configured.</p>
                )}
              </div>
            ) : schedule.map((day: any) => (
              <div key={day.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                      D{day.dayNumber}
                    </span>
                    <div>
                      <h4 className="font-semibold">{day.dayTitle || `Day ${day.dayNumber}`}</h4>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateAu(day.date)}</p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button onClick={() => { setAddActivityDayId(day.id); setShowAddActivity(true) }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90">
                      <Plus className="w-3.5 h-3.5" /> Add Activity
                    </button>
                  )}
                </div>

                {day.scheduledActivities?.length > 0 ? (
                  <div className="space-y-2">
                    {day.scheduledActivities.map((a: any) => {
                      const isExpanded = expandedActivities.has(a.id)
                      return (
                        <div key={a.id} className="border border-[var(--color-border)] rounded-lg">
                          <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleActivityExpanded(a.id)}>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{a.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusColor(a.status)}`}>{a.status}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)] mt-0.5">
                                {a.startTime && <span>{a.startTime}{a.endTime && ` – ${a.endTime}`}</span>}
                                {a.location && <span>{a.location}</span>}
                                {a.bookingReference && <span>Ref: {a.bookingReference}</span>}
                              </div>
                            </div>
                            {!isReadOnly && (
                              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setEditingScheduledActivity(a); setAddActivityDayId(a.tripDayId); setShowAddActivity(true) }}
                                  className="p-1.5 hover:bg-[var(--color-accent)] rounded-lg" title="Edit">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeletingActivity(a)}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="px-3 pb-3 pt-0 border-t border-[var(--color-border)] ml-7 space-y-2 text-sm">
                              {a.category && <div><span className="text-[var(--color-muted-foreground)]">Category:</span> {a.category}</div>}
                              {a.estimatedCost != null && <div><span className="text-[var(--color-muted-foreground)]">Est. Cost:</span> ${Number(a.estimatedCost).toFixed(2)}</div>}
                              {a.providerName && <div><span className="text-[var(--color-muted-foreground)]">Provider:</span> {a.providerName}</div>}
                              {a.providerPhone && <div><span className="text-[var(--color-muted-foreground)]">Phone:</span> {a.providerPhone}</div>}
                              {a.providerEmail && <div><span className="text-[var(--color-muted-foreground)]">Email:</span> {a.providerEmail}</div>}
                              {a.providerWebsite && /^https?:\/\//i.test(a.providerWebsite) && (
                                <div><span className="text-[var(--color-muted-foreground)]">Website:</span>{' '}
                                  <a href={a.providerWebsite} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
                                    {a.providerWebsite} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                              {a.accessibilityNotes && <div><span className="text-[var(--color-muted-foreground)]">Accessibility:</span> {a.accessibilityNotes}</div>}
                              {a.notes && <div><span className="text-[var(--color-muted-foreground)]">Notes:</span> {a.notes}</div>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-muted-foreground)] italic">No activities scheduled</p>
                )}
              </div>
            ))}

            {showAddActivity && (
              <AddActivityModal
                tripDayId={addActivityDayId}
                editingActivity={editingScheduledActivity}
                eventTemplateId={trip?.eventTemplateId}
                onClose={() => { setShowAddActivity(false); setEditingScheduledActivity(null); setAddActivityDayId('') }}
              />
            )}

            {deletingActivity && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingActivity(null)}>
                <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Delete Activity</h3>
                    <button onClick={() => setDeletingActivity(null)} className="p-1 rounded hover:bg-[var(--color-accent)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Are you sure you want to delete <span className="font-medium text-[var(--color-foreground)]">{deletingActivity.title}</span>? This cannot be undone.
                  </p>
                  {deleteScheduledActivity.isError && (
                    <p className="text-sm text-[var(--color-destructive)] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setDeletingActivity(null)}
                      className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-accent)]">
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteScheduledActivity.mutate(deletingActivity.id, { onSuccess: () => setDeletingActivity(null) })}
                      disabled={deleteScheduledActivity.isPending}
                      className="px-4 py-2 text-sm rounded-lg bg-[var(--color-destructive)] text-white hover:opacity-90 disabled:opacity-50">
                      {deleteScheduledActivity.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'itinerary' && id && (
          <ItineraryTab tripId={id} />
        )}
      </div>
    </div>
  )
}
