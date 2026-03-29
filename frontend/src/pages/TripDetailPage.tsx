import { useParams, Link } from 'react-router-dom'
import { useTrip, useTripBookings, useTripAccommodation, useTripVehicles, useTripStaff, useTripTasks, useTripSchedule, useTripClaims, useGenerateClaim, useDeleteClaim, useUpdateClaim, useParticipants, useCreateBooking, useUpdateBooking, usePatchBooking, useDeleteBooking, useCancelBooking, useUpdateStaffAssignment, useDeleteStaffAssignment, useStaff, useAvailableStaff, useCreateStaffAssignment, useAccommodation, useCreateAccommodation, useCreateReservation, useUpdateReservation, useDeleteReservation, useCancelReservation, useGenerateSchedule, useDeleteScheduledActivity, useUpdateTrip, useEventTemplates, PAYMENT_STATUS_ITEMS, PAYMENT_STATUS_COLORS } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Users, Building2, Truck, UserCog, ListChecks, Calendar, AlertTriangle, Car, Plus, X, XCircle, Pencil, ExternalLink, Trash2, ChevronDown, ChevronRight, ClipboardList, FileText } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import AddVehicleModal from '@/components/AddVehicleModal'
import AddActivityModal from '@/components/AddActivityModal'
import ItineraryTab from '@/components/ItineraryTab'
import { Dropdown } from '@/components/Dropdown'

type Tab = 'overview' | 'bookings' | 'accommodation' | 'vehicles' | 'staff' | 'tasks' | 'activities' | 'claims'

const CLAIM_STATUS_ITEMS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'PartiallyPaid', label: 'Partially Paid' },
]

const CLAIM_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Submitted: 'bg-blue-100 text-blue-700',
  Paid: 'bg-[#bff285] text-[#294800]',
  Rejected: 'bg-red-100 text-red-700',
  PartiallyPaid: 'bg-amber-100 text-amber-700',
}

function ClaimsTabContent({ tripId, claims }: { tripId: string; claims: any[] }) {
  const generateClaim = useGenerateClaim()
  const deleteClaim = useDeleteClaim()
  const updateClaim = useUpdateClaim()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDelete(claimId: string) {
    if (!confirm('Delete this claim? This cannot be undone.')) return
    deleteClaim.mutate(claimId, {
      onError: (err: any) => setError(err?.response?.data?.errors?.[0] || err?.response?.data?.message || 'Failed to delete claim.'),
    })
  }

  function handleGenerate() {
    setError(null)
    setGenerating(true)
    generateClaim.mutate(tripId, {
      onSuccess: () => setGenerating(false),
      onError: (err: any) => {
        setGenerating(false)
        setError(err?.response?.data?.errors?.[0] || err?.response?.data?.message || 'Failed to generate claim. Check provider settings and confirm the trip has confirmed bookings.')
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#1b1c1a]">NDIS Claims</h2>
        <button
          onClick={handleGenerate}
          disabled={generating || generateClaim.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] transition-all disabled:opacity-50"
        >
          {generating || generateClaim.isPending ? 'Generating...' : '+ Generate Claim'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {claims.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-[#43493a]">
          No claims yet. Generate a claim once the trip is complete.
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f3ef]">
              <tr>
                {['Reference', 'Status', 'Total Amount', 'Created', 'Submitted', ''].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-[#43493a]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3ef]">
              {claims.map((c: any) => (
                <tr key={c.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="p-3 font-medium font-mono text-sm">{c.claimReference}</td>
                  <td className="p-3">
                    <Dropdown
                      variant="pill"
                      value={c.status}
                      onChange={val => updateClaim.mutate({ claimId: c.id, data: { status: val } })}
                      colorClass={CLAIM_STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}
                      items={CLAIM_STATUS_ITEMS}
                    />
                  </td>
                  <td className="p-3 font-medium">${c.totalAmount?.toFixed(2)}</td>
                  <td className="p-3 text-[#43493a]">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-AU') : '—'}</td>
                  <td className="p-3 text-[#43493a]">{c.submittedDate ? new Date(c.submittedDate).toLocaleDateString('en-AU') : '—'}</td>
                  <td className="p-3 flex items-center gap-3">
                    <Link to={`/claims/${c.id}`} className="text-xs text-[#396200] hover:underline">View</Link>
                    {c.status !== 'Submitted' && c.status !== 'Paid' && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-500 hover:underline"
                      >Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function TripDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')  // 'overview' now renders ItineraryTab
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
  const [insuranceProvider, setInsuranceProvider] = useState('')
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('')
  const [insuranceCoverageStart, setInsuranceCoverageStart] = useState('')
  const [insuranceCoverageEnd, setInsuranceCoverageEnd] = useState('')
  const [insuranceStatus, setInsuranceStatus] = useState('None')

  const { data: trip, isLoading } = useTrip(id)
  const { data: bookings = [] } = useTripBookings(id)
  const { data: accommodation = [] } = useTripAccommodation(id)
  const { data: vehicles = [] } = useTripVehicles(id)
  const { data: staff = [] } = useTripStaff(id)
  const { data: tasks = [] } = useTripTasks(id)
  const { data: schedule = [] } = useTripSchedule(id)
  const { data: claims = [] } = useTripClaims(id)
  const { data: participants = [] } = useParticipants()
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()
  const patchBooking = usePatchBooking()
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
      case 'Planned': return 'bg-[#e4e2de] text-[#43493a]'
      case 'Booked': return 'bg-[#fef3c7] text-[#92400e]'
      case 'Confirmed': return 'bg-[#bbf37c] text-[#0f2000]'
      case 'Completed': return 'bg-[#d5e3fc] text-[#0d1c2e]'
      case 'Cancelled': return 'bg-[#ffdad6] text-[#93000a]'
      default: return 'bg-[#e4e2de] text-[#43493a]'
    }
  }

  const isReadOnly = trip?.status === 'Cancelled' || trip?.status === 'Archived'

  // Edit Trip modal state
  const [showEditTrip, setShowEditTrip] = useState(false)
  const [tripEditForm, setTripEditForm] = useState<any>(null)
  const tripFormInitialized = useRef(false)
  const updateTrip = useUpdateTrip()
  const { data: templates = [] } = useEventTemplates()

  useEffect(() => {
    if (!showEditTrip || !trip) return
    if (!tripFormInitialized.current) {
      tripFormInitialized.current = true
      setTripEditForm({
        tripName: trip.tripName || '',
        tripCode: trip.tripCode || '',
        eventTemplateId: trip.eventTemplateId || '',
        destination: trip.destination || '',
        region: trip.region || '',
        startDate: trip.startDate?.split('T')[0] || '',
        durationDays: trip.durationDays ?? 1,
        bookingCutoffDate: trip.bookingCutoffDate?.split('T')[0] || '',
        status: trip.status || 'Draft',
        leadCoordinatorId: trip.leadCoordinatorId || '',
        minParticipants: trip.minParticipants ?? '',
        maxParticipants: trip.maxParticipants ?? '',
        requiredWheelchairCapacity: trip.requiredWheelchairCapacity ?? '',
        requiredBeds: trip.requiredBeds ?? '',
        requiredBedrooms: trip.requiredBedrooms ?? '',
        minStaffRequired: trip.minStaffRequired ?? '',
        notes: trip.notes || '',
      })
    }
  }, [showEditTrip, trip])

  const handleOpenTripEdit = () => {
    tripFormInitialized.current = false
    setTripEditForm(null)
    setShowEditTrip(true)
  }

  const handleCloseTripEdit = () => {
    setShowEditTrip(false)
    setTripEditForm(null)
    tripFormInitialized.current = false
  }

  const handleSaveTripEdit = () => {
    if (!id || !tripEditForm) return
    const payload = { ...tripEditForm }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    for (const key of ['minParticipants', 'maxParticipants', 'requiredWheelchairCapacity', 'requiredBeds', 'requiredBedrooms', 'minStaffRequired']) {
      if (!payload[key] && payload[key] !== 0) payload[key] = null
    }
    updateTrip.mutate({ id, data: payload }, { onSuccess: handleCloseTripEdit })
  }

  const deleteBooking = useDeleteBooking()
  const cancelBooking = useCancelBooking()
  const [deletingBooking, setDeletingBooking] = useState<any>(null)

  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [editForm, setEditForm] = useState<{
    bookingStatus: string
    supportRatioOverride: string
    wheelchairRequired: boolean
    highSupportRequired: boolean
    nightSupportRequired: boolean
    hasRestrictivePracticeFlag: boolean
    bookingNotes: string
    insuranceStatus: string
    insuranceProvider: string
    insurancePolicyNumber: string
    insuranceCoverageStart: string
    insuranceCoverageEnd: string
    [key: string]: unknown
  }>({
    bookingStatus: '',
    supportRatioOverride: '',
    wheelchairRequired: false,
    highSupportRequired: false,
    nightSupportRequired: false,
    hasRestrictivePracticeFlag: false,
    bookingNotes: '',
    insuranceStatus: 'None',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceCoverageStart: '',
    insuranceCoverageEnd: '',
  })

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
  const accommodationCoverage = useMemo(() => {
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
  }, [accommodation, trip?.startDate, trip?.endDate])

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
      insuranceProvider: booking.insuranceProvider || '',
      insurancePolicyNumber: booking.insurancePolicyNumber || '',
      insuranceCoverageStart: booking.insuranceCoverageStart || '',
      insuranceCoverageEnd: booking.insuranceCoverageEnd || '',
      insuranceStatus: booking.insuranceStatus || 'None',
    })
  }

  const handleUpdateBooking = () => {
    if (!editingBooking) return
    updateBooking.mutate({ id: editingBooking.id, data: {
      ...editForm,
      supportRatioOverride: editForm.supportRatioOverride || null,
      insuranceStatus: editForm.insuranceStatus,
      insuranceProvider: editForm.insuranceProvider || null,
      insurancePolicyNumber: editForm.insurancePolicyNumber || null,
      insuranceCoverageStart: editForm.insuranceCoverageStart || null,
      insuranceCoverageEnd: editForm.insuranceCoverageEnd || null,
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
    setInsuranceProvider('')
    setInsurancePolicyNumber('')
    setInsuranceCoverageStart('')
    setInsuranceCoverageEnd('')
    setInsuranceStatus('None')
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
      insuranceStatus,
      ...(insuranceProvider ? { insuranceProvider } : {}),
      ...(insurancePolicyNumber ? { insurancePolicyNumber } : {}),
      ...(insuranceCoverageStart ? { insuranceCoverageStart } : {}),
      ...(insuranceCoverageEnd ? { insuranceCoverageEnd } : {}),
    }, {
      onSuccess: () => {
        setShowAddBooking(false)
        resetForm()
      },
    })
  }

  if (!id) return null
  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#43493a]">Loading trip...</div>
  if (!trip) return <div className="text-center py-12">Trip not found</div>

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: ClipboardList },
    { key: 'bookings', label: 'Bookings', icon: Users, count: bookings.length },
    { key: 'accommodation', label: 'Accommodation', icon: Building2, count: accommodation.length },
    { key: 'vehicles', label: 'Vehicles', icon: Truck, count: vehicles.length },
    { key: 'staff', label: 'Staff', icon: UserCog, count: staff.length },
    { key: 'tasks', label: 'Tasks', icon: ListChecks, count: tasks.length },
    { key: 'activities', label: 'Activities', icon: Calendar, count: schedule.reduce((sum: number, d: any) => sum + (d.scheduledActivities?.length || 0), 0) },
    { key: 'claims', label: 'Claims', icon: FileText, count: claims.length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wider uppercase ${getStatusColor(trip.status)}`}>
              {trip.status}
            </span>
            {trip.destination && (
              <span className="text-[#43493a] text-sm flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                {trip.destination}
              </span>
            )}
            {trip.tripCode && (
              <span className="text-xs font-mono text-[#515f74] bg-[#efeeea] px-2 py-0.5 rounded-full">{trip.tripCode}</span>
            )}
          </div>
          <h1 className="text-[3.5rem] font-extrabold text-[#1b1c1a] leading-tight tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {trip.tripName}
          </h1>
          <p className="text-[#43493a] font-medium flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
            {formatDateAu(trip.startDate)} — {formatDateAu(trip.endDate)} ({trip.durationDays} days)
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link to="/trips" className="px-5 py-2.5 bg-[#efeeea] text-[#1b1c1a] rounded-full font-bold hover:opacity-90 transition-all flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={handleOpenTripEdit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-[#396200] to-[#4d7c0f] text-white text-sm font-bold shadow-lg shadow-[#396200]/20 hover:opacity-90 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit Trip
          </button>
        </div>
      </section>

      {/* Quick Metrics Bento */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Participants */}
        <div className="bg-[#f5f3ef] p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#396200] text-4xl">groups</span>
            {(trip.waitlistCount ?? 0) > 0
              ? <span className="text-xs font-bold text-[#92400e] px-2 py-1 bg-[#fef3c7] rounded-full">Waitlist</span>
              : <span className="text-xs font-bold text-[#396200] px-2 py-1 bg-[#bbf37c] rounded-full">Active</span>
            }
          </div>
          <div>
            <p className="text-sm text-[#43493a] font-medium">Participants / Staff</p>
            <h4 className="text-2xl font-bold text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {trip.currentParticipantCount} / {trip.staffAssignedCount}
            </h4>
          </div>
        </div>

        {/* Tasks / Outstanding */}
        <div className="bg-[#f5f3ef] p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#515f74] text-4xl">checklist</span>
            {(trip.outstandingTaskCount ?? 0) > 0
              ? <span className="text-xs font-bold text-[#ba1a1a] px-2 py-1 bg-[#ffdad6] rounded-full">Action Needed</span>
              : <span className="text-xs font-bold text-[#396200] px-2 py-1 bg-[#bbf37c] rounded-full">On Track</span>
            }
          </div>
          <div>
            <p className="text-sm text-[#43493a] font-medium">Outstanding Tasks</p>
            <h4 className="text-2xl font-bold text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {trip.outstandingTaskCount ?? 0}
            </h4>
          </div>
        </div>

        {/* Support needs */}
        <div className="bg-[#f5f3ef] p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#515f74] text-4xl">accessible</span>
            <span className="text-xs font-bold text-[#43493a] px-2 py-1 bg-[#e4e2de] rounded-full">{trip.wheelchairCount ?? 0} WC</span>
          </div>
          <div>
            <p className="text-sm text-[#43493a] font-medium">High Support / Overnight</p>
            <h4 className="text-2xl font-bold text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {trip.highSupportCount ?? 0} / {trip.overnightSupportCount ?? 0}
            </h4>
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-[#f5f3ef] p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[#ba1a1a] text-4xl">health_and_safety</span>
            {(trip.insuranceOutstandingCount ?? 0) > 0
              ? <span className="text-xs font-bold text-[#ba1a1a] px-2 py-1 bg-[#ffdad6] rounded-full">Outstanding</span>
              : <span className="text-xs font-bold text-[#396200] px-2 py-1 bg-[#bbf37c] rounded-full">Covered</span>
            }
          </div>
          <div>
            <p className="text-sm text-[#43493a] font-medium">Insurance Status</p>
            <h4 className="text-2xl font-bold text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {trip.insuranceConfirmedCount ?? 0}/{(trip.insuranceConfirmedCount ?? 0) + (trip.insuranceOutstandingCount ?? 0)}
            </h4>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#396200] text-white shadow-md shadow-[#396200]/20'
                : 'text-[#43493a] hover:bg-[#efeeea]'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#efeeea] text-[#43493a]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && id && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left: Itinerary Timeline 7/12 */}
            <div className="lg:col-span-7">
              <ItineraryTab tripId={id} trip={trip} />
            </div>

            {/* Right: Coordination Cards 5/12 */}
            <div className="lg:col-span-5 space-y-6">
              {/* Accommodation Card */}
              {accommodation.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_24px_32px_-12px_rgba(27,28,26,0.04)]">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-[#396200]" style={{ fontSize: '20px' }}>home_work</span>
                          <h3 className="text-lg font-bold text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Accommodation</h3>
                        </div>
                        <p className="text-sm text-[#43493a]">{accommodation[0]?.propertyName}</p>
                      </div>
                      <span className="material-symbols-outlined text-[#396200]" style={{ fontSize: '20px' }}>verified</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {accommodation[0]?.bedroomsReserved && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#515f74]" style={{ fontSize: '16px' }}>king_bed</span>
                          <span className="text-xs font-medium text-[#1b1c1a]">{accommodation[0].bedroomsReserved} Bedrooms</span>
                        </div>
                      )}
                      {accommodation[0]?.reservationStatus && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#515f74]" style={{ fontSize: '16px' }}>event_available</span>
                          <span className="text-xs font-medium text-[#1b1c1a]">{accommodation[0].reservationStatus}</span>
                        </div>
                      )}
                    </div>
                    {accommodation.length > 1 && (
                      <p className="text-xs text-[#43493a] italic">+{accommodation.length - 1} more property reserved</p>
                    )}
                  </div>
                </div>
              )}

              {/* The Team */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>The Team</h3>
                  <button className="text-[#396200] text-sm font-bold hover:opacity-70 transition-opacity" onClick={() => setActiveTab('bookings')}>
                    Manage All
                  </button>
                </div>

                {/* Participants */}
                {bookings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#43493a] uppercase tracking-widest px-1">Participants</p>
                    <div className="bg-white rounded-2xl shadow-[0_24px_32px_-12px_rgba(27,28,26,0.04)] overflow-hidden">
                      <div className="p-2 space-y-1">
                      {bookings.slice(0, 4).map((b: any) => (
                        <div key={b.id} className="p-3 flex items-center gap-3 rounded-xl hover:bg-[#f5f3ef] transition-colors">
                          <div className="w-10 h-10 rounded-full bg-[#efeeea] flex items-center justify-center font-bold text-sm text-[#396200]">
                            {(b.participantName || 'P').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[#1b1c1a] truncate">{b.participantName}</p>
                            <p className="text-[10px] text-[#43493a]">
                              {[b.highSupportRequired && 'High Support', b.wheelchairRequired && 'Wheelchair', b.nightSupportRequired && 'Night Support'].filter(Boolean).join(' · ') || b.bookingStatus}
                            </p>
                          </div>
                          {b.highSupportRequired && (
                            <span className="material-symbols-outlined text-[#8e337b]" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                          )}
                        </div>
                      ))}
                      </div>
                      {bookings.length > 4 && (
                        <div className="px-3 py-2 text-xs text-[#43493a] italic cursor-pointer hover:bg-[#f5f3ef] rounded-xl transition-colors" onClick={() => setActiveTab('bookings')}>
                          +{bookings.length - 4} more participants
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment summary */}
                {bookings.length > 0 && (() => {
                  const counts: Record<string, number> = {}
                  for (const b of bookings) {
                    const s = (b.paymentStatus as string) || 'NotInvoiced'
                    counts[s] = (counts[s] ?? 0) + 1
                  }
                  const entries = PAYMENT_STATUS_ITEMS
                    .map(item => ({ ...item, count: counts[item.value] ?? 0 }))
                    .filter(e => e.count > 0)
                  if (entries.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#43493a] uppercase tracking-widest px-1">Payment</p>
                      <div className="flex flex-wrap gap-2 px-1">
                        {entries.map(({ value, label, count }) => (
                          <span
                            key={value}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[value]}`}
                          >
                            {count} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Staff */}
                {staff.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#43493a] uppercase tracking-widest px-1">Staff Roster</p>
                    <div className="space-y-2">
                      {staff.slice(0, 3).map((s: any, i: number) => (
                        <div key={s.id} className={`bg-[#f5f3ef] p-4 rounded-xl flex items-center justify-between ${i === 0 ? 'ring-2 ring-[#396200]/20' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#396200]/10 flex items-center justify-center text-[#396200] font-bold text-xs">
                              {(s.staffName || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#1b1c1a]">{s.staffName}</p>
                              <p className="text-[10px] text-[#43493a]">{s.assignmentRole || (s.isDriver ? 'Driver' : 'Support Worker')}</p>
                            </div>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                            <span className="material-symbols-outlined text-[#43493a]" style={{ fontSize: '16px' }}>call</span>
                          </button>
                        </div>
                      ))}
                      {staff.length > 3 && (
                        <p className="text-xs text-[#43493a] italic text-center cursor-pointer hover:opacity-70" onClick={() => setActiveTab('staff')}>
                          +{staff.length - 3} more staff assigned
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Fleet */}
              {vehicles.length > 0 && (
                <div className="bg-[#eae8e4] p-5 rounded-2xl space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-[#1b1c1a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="material-symbols-outlined text-[#515f74]" style={{ fontSize: '20px' }}>local_shipping</span>
                    Fleet Manifest
                  </h3>
                  <div className="space-y-3">
                    {vehicles.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-[#e4e2de] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#43493a]" style={{ fontSize: '20px' }}>airport_shuttle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1b1c1a] truncate">{v.vehicleName || `${v.make} ${v.model}`}</p>
                          <p className="text-[10px] text-[#43493a]">
                            {[v.wheelchairCapacity && `${v.wheelchairCapacity} WC`, v.capacity && `${v.capacity} seats`].filter(Boolean).join(' · ') || 'Vehicle'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#43493a]">
                {bookings.length}{trip.maxParticipants ? `/${trip.maxParticipants}` : ''} spots filled
              </p>
              <button onClick={() => setShowAddBooking(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#396200] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Participant
              </button>
            </div>

            {/* Add Booking Modal */}
            {showAddBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowAddBooking(false); resetForm() }}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Participant to Trip</h3>
                    <button onClick={() => { setShowAddBooking(false); resetForm() }} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Participant Select */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Participant *</label>
                      <select value={selectedParticipantId} onChange={e => setSelectedParticipantId(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
                        <option value="">Select a participant...</option>
                        {availableParticipants.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.fullName}</option>
                        ))}
                      </select>
                      {availableParticipants.length === 0 && (
                        <p className="text-xs text-[#43493a] mt-1">All active participants are already booked on this trip.</p>
                      )}
                    </div>

                    {/* Booking Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Status</label>
                      <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          Wheelchair
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={highSupportRequired} onChange={e => setHighSupportRequired(e.target.checked)}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          High Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={nightSupportRequired} onChange={e => setNightSupportRequired(e.target.checked)}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          Night Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={hasRestrictivePracticeFlag} onChange={e => setHasRestrictivePracticeFlag(e.target.checked)}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          Restrictive Practice
                        </label>
                      </div>
                    </div>

                    {/* Support Ratio Override */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Support Ratio Override</label>
                      <select value={supportRatioOverride} onChange={e => setSupportRatioOverride(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Insurance */}
                    <div className="border-t border-[rgba(195,201,181,0.15)] pt-4 mt-2">
                      <label className="block text-sm font-medium mb-3">Travel Insurance</label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[#43493a] mb-1">Status</label>
                          <select value={insuranceStatus} onChange={e => setInsuranceStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
                            {['None', 'Pending', 'Confirmed', 'Expired', 'Cancelled'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        {insuranceStatus !== 'None' && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Provider</label>
                                <input type="text" value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                                  placeholder="e.g. Allianz" />
                              </div>
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Policy Number</label>
                                <input type="text" value={insurancePolicyNumber} onChange={e => setInsurancePolicyNumber(e.target.value)}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                                  placeholder="e.g. POL-12345" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Coverage Start</label>
                                <input type="date" value={insuranceCoverageStart} onChange={e => setInsuranceCoverageStart(e.target.value)}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                              </div>
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Coverage End</label>
                                <input type="date" value={insuranceCoverageEnd} onChange={e => setInsuranceCoverageEnd(e.target.value)}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Error */}
                    {createBooking.isError && (
                      <p className="text-sm text-[#ba1a1a]">Failed to create booking. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => { setShowAddBooking(false); resetForm() }}
                        className="px-4 py-2 rounded-2xl bg-[#f5f3ef] text-sm hover:bg-[#efeeea] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleCreateBooking} disabled={!selectedParticipantId || createBooking.isPending}
                        className="px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {createBooking.isPending ? 'Adding...' : 'Add Booking'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#efeeea]">
                  <tr>
                    <th className="text-left p-3 font-medium text-[#43493a]">Participant</th>
                    <th className="text-left p-3 font-medium text-[#43493a]">Status</th>
                    <th className="text-left p-3 font-medium text-[#43493a]">Date</th>
                    <th className="text-left p-3 font-medium text-[#43493a]">Ratio</th>
                    <th className="text-center p-3 font-medium text-[#43493a]"><span className="material-symbols-outlined text-base leading-none">accessible</span></th>
                    <th className="text-center p-3 font-medium text-[#43493a]">High</th>
                    <th className="text-center p-3 font-medium text-[#43493a]">Night</th>
                    <th className="text-center p-3 font-medium text-[#43493a]">Insurance</th>
                    <th className="text-center p-3 font-medium text-[#43493a]">Payment</th>
                    <th className="text-center p-3 font-medium text-[#43493a]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efeeea]">
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-[#efeeea]/50 transition-colors">
                      <td className="p-3 font-medium">{b.participantName || '—'}</td>
                      <td className="p-3">
                        <Dropdown
                          variant="pill"
                          value={b.bookingStatus}
                          onChange={val => patchBooking.mutate({ id: b.id, data: { bookingStatus: val } })}
                          colorClass={getStatusColor(b.bookingStatus)}
                          items={[
                            { value: 'Enquiry', label: 'Enquiry' },
                            { value: 'Held', label: 'Held' },
                            { value: 'Confirmed', label: 'Confirmed' },
                            { value: 'Waitlist', label: 'Waitlist' },
                            { value: 'Cancelled', label: 'Cancelled' },
                            { value: 'Completed', label: 'Completed' },
                            { value: 'NoLongerAttending', label: 'No Longer Attending' },
                          ]}
                        />
                      </td>
                      <td className="p-3 text-[#43493a]">{formatDateAu(b.bookingDate)}</td>
                      <td className="p-3 text-[#43493a]">{({ OneToOne: '1:1', OneToTwo: '1:2', OneToThree: '1:3', OneToFour: '1:4', OneToFive: '1:5', TwoToOne: '2:1', SharedSupport: 'Shared', Other: 'Other' }[b.supportRatioOverride as string]) || '—'}</td>
                      <td className="p-3 text-center">{b.wheelchairRequired ? '✅' : ''}</td>
                      <td className="p-3 text-center">{b.highSupportRequired ? '✅' : ''}</td>
                      <td className="p-3 text-center">{b.nightSupportRequired ? '✅' : ''}</td>
                      <td className="p-3 text-center">
                        <Dropdown
                          variant="pill"
                          value={b.insuranceStatus || 'None'}
                          onChange={val => patchBooking.mutate({ id: b.id, data: { insuranceStatus: val } })}
                          colorClass={getStatusColor(b.insuranceStatus || 'none')}
                          items={[
                            { value: 'None', label: 'None' },
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Confirmed', label: 'Confirmed' },
                            { value: 'Expired', label: 'Expired' },
                            { value: 'Cancelled', label: 'Cancelled' },
                          ]}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Dropdown
                          variant="pill"
                          value={b.paymentStatus || 'NotInvoiced'}
                          onChange={val => patchBooking.mutate({ id: b.id, data: { paymentStatus: val } })}
                          colorClass={PAYMENT_STATUS_COLORS[b.paymentStatus || 'NotInvoiced'] ?? 'bg-neutral-100 text-neutral-600'}
                          items={PAYMENT_STATUS_ITEMS}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {b.actionRequired && <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />}
                          <button onClick={() => openEditModal(b)} className="p-1 rounded hover:bg-[#efeeea] transition-colors" title="Edit booking">
                            <Pencil className="w-3.5 h-3.5 text-[#43493a]" />
                          </button>
                          <Link to={`/participants/${b.participantId}`} className="p-1 rounded hover:bg-[#efeeea] transition-colors" title="View participant">
                            <ExternalLink className="w-3.5 h-3.5 text-[#43493a]" />
                          </Link>
                          <button onClick={() => setDeletingBooking(b)} className="p-1 rounded hover:bg-[#ffdad6]/60 transition-colors" title="Remove from trip">
                            <Trash2 className="w-3.5 h-3.5 text-[#43493a] hover:text-[#ba1a1a]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={10} className="p-6 text-center text-[#43493a]">No bookings yet</td></tr>
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
                  <div className="bg-[#f5f3ef] rounded-2xl p-3">
                    <p className="text-xs text-[#43493a]">Staff Required</p>
                    <p className="text-xl font-bold mt-1">{rounded} <span className="text-sm font-normal text-[#43493a]">({rawTotal.toFixed(2)})</span></p>
                    {noRatioCount > 0 && <p className="text-xs text-[#f59e0b] mt-1">{noRatioCount} participant{noRatioCount > 1 ? 's' : ''} without ratio</p>}
                  </div>
                  <div className={`rounded-2xl p-3 ${isStaffed ? 'bg-[#bbf37c]/30' : 'bg-[#ffdad6]/60'}`}>
                    <p className="text-xs text-[#43493a]">Staff Assigned</p>
                    <p className={`text-xl font-bold mt-1 ${isStaffed ? 'text-[#396200]' : 'text-[#ba1a1a]'}`}>
                      {assigned}/{rounded}
                    </p>
                    <p className={`text-xs mt-1 ${isStaffed ? 'text-[#396200]' : 'text-[#ba1a1a]'}`}>
                      {isStaffed ? 'Fully staffed' : `Need ${rounded - assigned} more`}
                    </p>
                  </div>
                  <div className="bg-[#f5f3ef] rounded-2xl p-3">
                    <p className="text-xs text-[#43493a]">Capacity</p>
                    {suggestion
                      ? <p className="text-sm mt-1">{suggestion}</p>
                      : <p className="text-sm text-[#43493a] mt-1">{gap === 0 ? 'At exact capacity — next participant adds a staff' : 'No spare capacity'}</p>
                    }
                  </div>
                </div>
              )
            })()}

            {/* Edit Booking Modal */}
            {editingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingBooking(null)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Booking — {editingBooking.participantName}</h3>
                    <button onClick={() => setEditingBooking(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Booking Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Status</label>
                      <Dropdown
                        variant="form"
                        value={editForm.bookingStatus}
                        onChange={val => setEditForm({ ...editForm, bookingStatus: val })}
                        items={[
                          { value: 'Enquiry', label: 'Enquiry' },
                          { value: 'Held', label: 'Held' },
                          { value: 'Confirmed', label: 'Confirmed' },
                          { value: 'Waitlist', label: 'Waitlist' },
                          { value: 'Cancelled', label: 'Cancelled' },
                          { value: 'Completed', label: 'Completed' },
                          { value: 'NoLongerAttending', label: 'No Longer Attending' },
                        ]}
                      />
                    </div>

                    {/* Support Requirements */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Support Requirements</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.wheelchairRequired} onChange={e => setEditForm({ ...editForm, wheelchairRequired: e.target.checked })}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          Wheelchair
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.highSupportRequired} onChange={e => setEditForm({ ...editForm, highSupportRequired: e.target.checked })}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          High Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.nightSupportRequired} onChange={e => setEditForm({ ...editForm, nightSupportRequired: e.target.checked })}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          Night Support
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.hasRestrictivePracticeFlag} onChange={e => setEditForm({ ...editForm, hasRestrictivePracticeFlag: e.target.checked })}
                            className="rounded border-[rgba(195,201,181,0.15)]" />
                          Restrictive Practice
                        </label>
                      </div>
                    </div>

                    {/* Support Ratio Override */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Support Ratio Override</label>
                      <Dropdown
                        variant="form"
                        value={editForm.supportRatioOverride}
                        onChange={val => setEditForm({ ...editForm, supportRatioOverride: val })}
                        label="No override"
                        items={[
                          { value: '', label: 'No override' },
                          { value: 'OneToOne', label: '1:1' },
                          { value: 'OneToTwo', label: '1:2' },
                          { value: 'OneToThree', label: '1:3' },
                          { value: 'OneToFour', label: '1:4' },
                          { value: 'OneToFive', label: '1:5' },
                          { value: 'TwoToOne', label: '2:1' },
                          { value: 'SharedSupport', label: 'Shared' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Booking Notes</label>
                      <textarea value={editForm.bookingNotes} onChange={e => setEditForm({ ...editForm, bookingNotes: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Insurance */}
                    <div className="border-t border-[rgba(195,201,181,0.15)] pt-4 mt-2">
                      <label className="block text-sm font-medium mb-3">Travel Insurance</label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[#43493a] mb-1">Status</label>
                          <Dropdown
                            variant="form"
                            value={editForm.insuranceStatus}
                            onChange={val => setEditForm({ ...editForm, insuranceStatus: val })}
                            items={[
                              { value: 'None', label: 'None' },
                              { value: 'Pending', label: 'Pending' },
                              { value: 'Confirmed', label: 'Confirmed' },
                              { value: 'Expired', label: 'Expired' },
                              { value: 'Cancelled', label: 'Cancelled' },
                            ]}
                          />
                        </div>
                        {editForm.insuranceStatus !== 'None' && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Provider</label>
                                <input type="text" value={editForm.insuranceProvider} onChange={e => setEditForm({ ...editForm, insuranceProvider: e.target.value })}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                                  placeholder="e.g. Allianz" />
                              </div>
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Policy Number</label>
                                <input type="text" value={editForm.insurancePolicyNumber} onChange={e => setEditForm({ ...editForm, insurancePolicyNumber: e.target.value })}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                                  placeholder="e.g. POL-12345" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Coverage Start</label>
                                <input type="date" value={editForm.insuranceCoverageStart} onChange={e => setEditForm({ ...editForm, insuranceCoverageStart: e.target.value })}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                              </div>
                              <div>
                                <label className="block text-xs text-[#43493a] mb-1">Coverage End</label>
                                <input type="date" value={editForm.insuranceCoverageEnd} onChange={e => setEditForm({ ...editForm, insuranceCoverageEnd: e.target.value })}
                                  className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Error */}
                    {updateBooking.isError && (
                      <p className="text-sm text-[#ba1a1a]">Failed to update booking. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditingBooking(null)}
                        className="px-4 py-2 rounded-2xl bg-[#f5f3ef] text-sm hover:bg-[#efeeea] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateBooking} disabled={updateBooking.isPending}
                        className="px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Remove Participant</h3>
                    <button onClick={() => setDeletingBooking(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[#43493a]">
                    What would you like to do with <span className="font-medium text-[#1b1c1a]">{deletingBooking.participantName}</span>'s booking?
                  </p>
                  {(deleteBooking.isError || cancelBooking.isError) && (
                    <p className="text-sm text-[#ba1a1a] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => cancelBooking.mutate({ id: deletingBooking.id, data: deletingBooking }, { onSuccess: () => setDeletingBooking(null) })}
                      disabled={cancelBooking.isPending || deleteBooking.isPending}
                      className="w-full px-4 py-2 rounded-2xl bg-[#fef3c7]/60 text-sm font-medium hover:bg-[#fef3c7] transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Cancel booking</span>
                      <span className="block text-xs text-[#43493a] mt-0.5">Mark as cancelled — keeps the record for history</span>
                    </button>
                    <button
                      onClick={() => deleteBooking.mutate(deletingBooking.id, { onSuccess: () => setDeletingBooking(null) })}
                      disabled={deleteBooking.isPending || cancelBooking.isPending}
                      className="w-full px-4 py-2 rounded-2xl bg-[#ffdad6]/60 text-sm font-medium hover:bg-[#ffdad6] transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Delete permanently</span>
                      <span className="block text-xs text-[#43493a] mt-0.5">Remove completely from the trip — cannot be undone</span>
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
              <p className="text-sm text-[#43493a]">{accommodation.length} reservation{accommodation.length !== 1 ? 's' : ''}</p>
              <button onClick={() => { resetAccommForm(); setShowAddAccommodation(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Add Accommodation
              </button>
            </div>

            {/* Stay Timeline */}
            {trip?.startDate && trip?.endDate && (() => {
              const tripStart = new Date(trip.startDate)
              const tripEnd = new Date(trip.endDate)
              const totalDays = Math.max(1, Math.round((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)))
              const coverage = accommodationCoverage
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
                <div className="bg-white rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Stay Timeline</h3>
                    {coverage && (
                      <span className={`text-xs font-medium ${coverage.allCovered ? 'text-[#396200]' : 'text-[#ba1a1a]'}`}>
                        {coverage.allCovered ? `All ${coverage.totalNights} nights covered` : `${coverage.coveredNights}/${coverage.totalNights} nights covered`}
                      </span>
                    )}
                  </div>

                  {/* Day headers */}
                  <div className="flex gap-0">
                    {days.map((day, i) => (
                      <div key={i} className="flex-1 text-center">
                        <p className="text-[10px] text-[#43493a] truncate">{day.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Night cells row */}
                  <div className="flex gap-0.5 mt-1 mb-2">
                    {days.slice(0, -1).map((day, i) => {
                      const key = day.date.toISOString().split('T')[0]
                      const isMissing = coverage?.uncoveredNights.includes(key)
                      return (
                        <div key={i} className={`flex-1 h-2 rounded-sm ${isMissing ? 'bg-[#ffdad6]/70' : 'bg-[#bbf37c]/50'}`}
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
                        <div className="absolute h-full rounded bg-[#396200]/20 border border-[#396200]/40 flex items-center px-2 overflow-hidden"
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
                          <span className="text-[10px] font-medium text-[#396200] truncate">{r.propertyName}</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Missing nights warning */}
                  {coverage && !coverage.allCovered && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[rgba(195,201,181,0.15)]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                      <p className="text-xs text-[#ba1a1a]">
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
              <p className="text-[#43493a]">No accommodation reservations</p>
            ) : (
              <div className="space-y-3">
                {accommodation.map((r: any) => {
                  const property = allAccommodation.find((a: any) => a.id === r.accommodationPropertyId)
                  const nights = r.checkInDate && r.checkOutDate
                    ? Math.round((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const costPerNight = nights && r.cost ? (r.cost / nights).toFixed(2) : null

                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{r.propertyName}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(r.reservationStatus)}`}>{r.reservationStatus}</span>
                            {r.hasOverlapConflict && <span className="badge-conflict text-xs px-2 py-0.5 rounded-full">Conflict</span>}
                          </div>
                          {property?.location && (
                            <p className="text-sm text-[#43493a] mt-0.5">{property.location}{property.region ? ` · ${property.region}` : ''}</p>
                          )}
                          {property && (property.address || property.suburb) && (
                            <p className="text-xs text-[#43493a]">{[property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEditReservation(r)} className="p-1.5 rounded hover:bg-[#efeeea] transition-colors" title="Edit reservation">
                            <Pencil className="w-3.5 h-3.5 text-[#43493a]" />
                          </button>
                          <Link to={`/accommodation/${r.accommodationPropertyId}`} className="p-1.5 rounded hover:bg-[#efeeea] transition-colors" title="View property details">
                            <ExternalLink className="w-3.5 h-3.5 text-[#43493a]" />
                          </Link>
                          <button onClick={() => setDeletingReservation(r)} className="p-1.5 rounded hover:bg-[#ffdad6]/60 transition-colors" title="Remove reservation">
                            <Trash2 className="w-3.5 h-3.5 text-[#43493a] hover:text-[#ba1a1a]" />
                          </button>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4 text-sm">
                        <div>
                          <p className="text-xs text-[#43493a]">Check-in</p>
                          <p className="font-medium">{formatDateAu(r.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#43493a]">Check-out</p>
                          <p className="font-medium">{formatDateAu(r.checkOutDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#43493a]">Nights</p>
                          <p className="font-medium">{nights ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#43493a]">Cost</p>
                          <p className="font-medium">{r.cost ? `$${r.cost}` : '—'}{costPerNight ? ` ($${costPerNight}/night)` : ''}</p>
                        </div>
                        {(r.bedroomsReserved || property?.bedroomCount) && (
                          <div>
                            <p className="text-xs text-[#43493a]">Bedrooms</p>
                            <p className="font-medium">{r.bedroomsReserved ?? '—'}{property?.bedroomCount ? ` / ${property.bedroomCount} available` : ''}</p>
                          </div>
                        )}
                        {(r.bedsReserved || property?.bedCount) && (
                          <div>
                            <p className="text-xs text-[#43493a]">Beds</p>
                            <p className="font-medium">{r.bedsReserved ?? '—'}{property?.bedCount ? ` / ${property.bedCount} available` : ''}</p>
                          </div>
                        )}
                        {property?.maxCapacity && (
                          <div>
                            <p className="text-xs text-[#43493a]">Max Capacity</p>
                            <p className="font-medium">{property.maxCapacity}</p>
                          </div>
                        )}
                        {r.confirmationReference && (
                          <div>
                            <p className="text-xs text-[#43493a]">Confirmation Ref</p>
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
                        <p className="text-sm text-[#43493a] mt-3 pt-3 border-t border-[rgba(195,201,181,0.15)]">{r.comments}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add Accommodation Modal */}
            {showAddAccommodation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddAccommodation(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Accommodation</h3>
                    <button onClick={() => setShowAddAccommodation(false)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Property Select or Create */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">Property</label>
                        <button type="button" onClick={() => { setCreatingNewProperty(!creatingNewProperty); setAccommForm({ ...accommForm, accommodationPropertyId: '' }) }}
                          className="text-xs text-[#396200] hover:underline">
                          {creatingNewProperty ? 'Select existing' : '+ Create new'}
                        </button>
                      </div>
                      {creatingNewProperty ? (
                        <div className="space-y-3 p-3 rounded-2xl bg-[#efeeea]/30">
                          <div>
                            <label className="block text-xs font-medium mb-1">Property Name *</label>
                            <input type="text" value={newPropertyForm.propertyName} onChange={e => setNewPropertyForm({ ...newPropertyForm, propertyName: e.target.value })}
                              className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                              placeholder="e.g. Beach House Resort" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Location</label>
                              <input type="text" value={newPropertyForm.location} onChange={e => setNewPropertyForm({ ...newPropertyForm, location: e.target.value })}
                                className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                                placeholder="e.g. Gold Coast, QLD" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Region</label>
                              <input type="text" value={newPropertyForm.region} onChange={e => setNewPropertyForm({ ...newPropertyForm, region: e.target.value })}
                                className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                                placeholder="e.g. South East QLD" />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Bedrooms</label>
                              <input type="number" min="0" value={newPropertyForm.bedroomCount} onChange={e => setNewPropertyForm({ ...newPropertyForm, bedroomCount: e.target.value })}
                                className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Beds</label>
                              <input type="number" min="0" value={newPropertyForm.bedCount} onChange={e => setNewPropertyForm({ ...newPropertyForm, bedCount: e.target.value })}
                                className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Max Capacity</label>
                              <input type="number" min="0" value={newPropertyForm.maxCapacity} onChange={e => setNewPropertyForm({ ...newPropertyForm, maxCapacity: e.target.value })}
                                className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <select value={accommForm.accommodationPropertyId} onChange={e => setAccommForm({ ...accommForm, accommodationPropertyId: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-out</label>
                        <input type="date" value={accommForm.checkOutDate} onChange={e => setAccommForm({ ...accommForm, checkOutDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                    </div>

                    {/* Bedrooms / Beds */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Bedrooms</label>
                        <input type="number" min="0" value={accommForm.bedroomsReserved} onChange={e => setAccommForm({ ...accommForm, bedroomsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm" placeholder="Optional" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Beds</label>
                        <input type="number" min="0" value={accommForm.bedsReserved} onChange={e => setAccommForm({ ...accommForm, bedsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm" placeholder="Optional" />
                      </div>
                    </div>

                    {/* Cost */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <input type="number" min="0" step="0.01" value={accommForm.cost} onChange={e => setAccommForm({ ...accommForm, cost: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm" placeholder="Optional" />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={accommForm.reservationStatus} onChange={e => setAccommForm({ ...accommForm, reservationStatus: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
                        {['Researching', 'Requested', 'Booked', 'Confirmed', 'Cancelled', 'Unavailable'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Comments</label>
                      <textarea value={accommForm.comments} onChange={e => setAccommForm({ ...accommForm, comments: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {(createReservation.isError || createAccommodation.isError) && (
                      <p className="text-sm text-[#ba1a1a]">Failed to add reservation. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowAddAccommodation(false)}
                        className="px-4 py-2 rounded-2xl bg-[#f5f3ef] text-sm hover:bg-[#efeeea] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleCreateReservation}
                        disabled={creatingNewProperty ? !newPropertyForm.propertyName || createAccommodation.isPending || createReservation.isPending : !accommForm.accommodationPropertyId || createReservation.isPending}
                        className="px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Reservation — {editingReservation.propertyName}</h3>
                    <button onClick={() => setEditingReservation(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Property */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Property</label>
                      <select value={editReservationForm.accommodationPropertyId} onChange={e => setEditReservationForm({ ...editReservationForm, accommodationPropertyId: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-out</label>
                        <input type="date" value={editReservationForm.checkOutDate} onChange={e => setEditReservationForm({ ...editReservationForm, checkOutDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                    </div>

                    {/* Bedrooms / Beds / Cost */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Bedrooms</label>
                        <input type="number" min="0" value={editReservationForm.bedroomsReserved} onChange={e => setEditReservationForm({ ...editReservationForm, bedroomsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Beds</label>
                        <input type="number" min="0" value={editReservationForm.bedsReserved} onChange={e => setEditReservationForm({ ...editReservationForm, bedsReserved: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost</label>
                        <input type="number" min="0" step="0.01" value={editReservationForm.cost} onChange={e => setEditReservationForm({ ...editReservationForm, cost: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={editReservationForm.reservationStatus} onChange={e => setEditReservationForm({ ...editReservationForm, reservationStatus: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
                        {['Researching', 'Requested', 'Booked', 'Confirmed', 'Cancelled', 'Unavailable'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Confirmation Reference */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Confirmation Reference</label>
                      <input type="text" value={editReservationForm.confirmationReference} onChange={e => setEditReservationForm({ ...editReservationForm, confirmationReference: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                        placeholder="e.g. booking ref number" />
                    </div>

                    {/* Date Booked / Date Confirmed */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date Booked</label>
                        <input type="date" value={editReservationForm.dateBooked} onChange={e => setEditReservationForm({ ...editReservationForm, dateBooked: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date Confirmed</label>
                        <input type="date" value={editReservationForm.dateConfirmed} onChange={e => setEditReservationForm({ ...editReservationForm, dateConfirmed: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Comments</label>
                      <textarea value={editReservationForm.comments} onChange={e => setEditReservationForm({ ...editReservationForm, comments: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Cancellation Reason (only show if cancelled) */}
                    {editReservationForm.reservationStatus === 'Cancelled' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Cancellation Reason</label>
                        <input type="text" value={editReservationForm.cancellationReason} onChange={e => setEditReservationForm({ ...editReservationForm, cancellationReason: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                          placeholder="Reason for cancellation..." />
                      </div>
                    )}

                    {/* Error */}
                    {updateReservation.isError && (
                      <p className="text-sm text-[#ba1a1a]">Failed to update reservation. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditingReservation(null)}
                        className="px-4 py-2 rounded-2xl bg-[#f5f3ef] text-sm hover:bg-[#efeeea] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateReservation} disabled={updateReservation.isPending}
                        className="px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Remove Reservation</h3>
                    <button onClick={() => setDeletingReservation(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[#43493a]">
                    What would you like to do with the reservation at <span className="font-medium text-[#1b1c1a]">{deletingReservation.propertyName}</span>?
                  </p>
                  {(deleteReservation.isError || cancelReservation.isError) && (
                    <p className="text-sm text-[#ba1a1a] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => cancelReservation.mutate({ id: deletingReservation.id, data: deletingReservation }, { onSuccess: () => setDeletingReservation(null) })}
                      disabled={cancelReservation.isPending || deleteReservation.isPending}
                      className="w-full px-4 py-2 rounded-2xl bg-[#fef3c7]/60 text-sm font-medium hover:bg-[#fef3c7] transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Cancel reservation</span>
                      <span className="block text-xs text-[#43493a] mt-0.5">Mark as cancelled — keeps the record for history</span>
                    </button>
                    <button
                      onClick={() => deleteReservation.mutate(deletingReservation.id, { onSuccess: () => setDeletingReservation(null) })}
                      disabled={deleteReservation.isPending || cancelReservation.isPending}
                      className="w-full px-4 py-2 rounded-2xl bg-[#ffdad6]/60 text-sm font-medium hover:bg-[#ffdad6] transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Delete permanently</span>
                      <span className="block text-xs text-[#43493a] mt-0.5">Remove completely — cannot be undone</span>
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
                    <span className="text-sm text-[#43493a] italic">No vehicles assigned yet</span>
                  ) : assigned === 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#ffdad6]/60 text-[#ba1a1a]">
                        <XCircle className="w-4 h-4" />
                        <span>0 / {needed}</span>
                      </div>
                      <span className="text-xs text-[#43493a]">No drivers assigned to this trip yet</span>
                    </div>
                  ) : assigned < needed ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{assigned} / {needed} · need {shortfall} more</span>
                      </div>
                      <span className="text-xs text-[#43493a]">
                        {tripDrivers.map((s: any) => s.staffName).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#bbf37c]/30 text-[#396200]">
                        <Car className="w-4 h-4" />
                        <span>{assigned} / {needed}</span>
                      </div>
                      <span className="text-xs text-[#43493a]">
                        {tripDrivers.map((s: any) => s.staffName).join(', ')}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowAddVehicle(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" /> Add Vehicle
                  </button>
                </div>
              )
            })()}

            {/* Vehicle cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {(vehicles as any[]).length === 0 ? null : (vehicles as any[]).map((v: any) => (
                <div key={v.id} className="bg-white rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{v.vehicleName}</h4>
                      <p className="text-sm text-[#43493a]">{v.registration || 'No rego'}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(v.status)}`}>{v.status}</span>
                      {v.hasOverlapConflict && <span className="badge-conflict text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"><span className="material-symbols-outlined text-xs leading-none">warning</span> Conflict</span>}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-[#43493a]">
                    <p className="flex items-center gap-1">{v.vehicleType} · {v.totalSeats} seats{v.wheelchairPositions ? <> · <span className="material-symbols-outlined text-sm leading-none">accessible</span> {v.wheelchairPositions}</> : ''}</p>
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
                    ? 'bg-[#bbf37c]/30 text-[#396200]'
                    : 'bg-[#ffdad6]/60 text-[#ba1a1a]'}`}>
                    <span>{assigned}/{required} staff</span>
                    <span className="text-xs font-normal">({rawTotal.toFixed(2)} required from ratios)</span>
                    {!isStaffed && <span className="text-xs">— need {required - assigned} more</span>}
                  </div>
                  <button onClick={() => { resetStaffForm(); setShowAddStaff(true) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" /> Add Staff
                  </button>
                </div>
              )
            })()}

            <div className="bg-white rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#efeeea]">
                  <tr>
                    <th className="text-left p-3 font-medium text-[#43493a]">Staff</th>
                    <th className="text-left p-3 font-medium text-[#43493a]">Role</th>
                    <th className="text-left p-3 font-medium text-[#43493a]">Dates</th>
                    <th className="text-left p-3 font-medium text-[#43493a]">Status</th>
                    <th className="text-center p-3 font-medium text-[#43493a]">Driver</th>
                    <th className="text-center p-3 font-medium text-[#43493a]">Sleepover</th>
                    <th className="text-center p-3 font-medium text-[#43493a]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efeeea]">
                  {staff.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#efeeea]/50 transition-colors">
                      <td className="p-3 font-medium">{s.staffName}</td>
                      <td className="p-3 text-[#43493a]">{s.assignmentRole || '—'}</td>
                      <td className="p-3 text-[#43493a]">{formatDateAu(s.assignmentStart)} — {formatDateAu(s.assignmentEnd)}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>{s.status}</span></td>
                      <td className="p-3 text-center">{s.isDriver ? '✅' : ''}</td>
                      <td className="p-3 text-center text-xs">{s.sleepoverType !== 'None' ? s.sleepoverType : ''}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {s.hasConflict && <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />}
                          <button onClick={() => openEditStaffModal(s)} className="p-1 rounded hover:bg-[#efeeea] transition-colors" title="Edit assignment">
                            <Pencil className="w-3.5 h-3.5 text-[#43493a]" />
                          </button>
                          <button onClick={() => setDeletingStaff(s)} className="p-1 rounded hover:bg-[#ffdad6]/60 transition-colors" title="Remove from trip">
                            <Trash2 className="w-3.5 h-3.5 text-[#43493a] hover:text-[#ba1a1a]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-[#43493a]">No staff assigned yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit Staff Assignment Modal */}
            {editingStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingStaff(null)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Assignment — {editingStaff.staffName}</h3>
                    <button onClick={() => setEditingStaff(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Assignment Role */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignment Role</label>
                      <input type="text" value={editStaffForm.assignmentRole} onChange={e => setEditStaffForm({ ...editStaffForm, assignmentRole: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                        placeholder="e.g. Support Worker" />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={editStaffForm.status} onChange={e => setEditStaffForm({ ...editStaffForm, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Assignment End</label>
                        <input type="date" value={editStaffForm.assignmentEnd} onChange={e => setEditStaffForm({ ...editStaffForm, assignmentEnd: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                    </div>

                    {/* Is Driver */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={editStaffForm.isDriver} onChange={e => setEditStaffForm({ ...editStaffForm, isDriver: e.target.checked })}
                          className="rounded border-[rgba(195,201,181,0.15)]" />
                        Is Driver
                      </label>
                    </div>

                    {/* Sleepover Type */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Sleepover Type</label>
                      <select value={editStaffForm.sleepoverType} onChange={e => setEditStaffForm({ ...editStaffForm, sleepoverType: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {updateStaffAssignment.isError && (
                      <p className="text-sm text-[#ba1a1a]">Failed to update assignment. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setEditingStaff(null)}
                        className="px-4 py-2 rounded-2xl bg-[#f5f3ef] text-sm hover:bg-[#efeeea] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateStaffAssignment} disabled={updateStaffAssignment.isPending}
                        className="px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Staff to Trip</h3>
                    <button onClick={() => setShowAddStaff(false)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Staff Select */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Staff Member</label>
                      <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                        <p className="text-xs text-[#f59e0b] mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> This staff member has a scheduling conflict for the trip dates
                        </p>
                      )}
                    </div>

                    {/* Assignment Role */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignment Role</label>
                      <input type="text" value={staffAssignmentRole} onChange={e => setStaffAssignmentRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm"
                        placeholder="e.g. Support Worker" />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input type="date" value={staffAssignmentStart} onChange={e => setStaffAssignmentStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input type="date" value={staffAssignmentEnd} onChange={e => setStaffAssignmentEnd(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                      </div>
                    </div>

                    {/* Is Driver */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={staffIsDriver} onChange={e => setStaffIsDriver(e.target.checked)}
                          className="rounded border-[rgba(195,201,181,0.15)]" />
                        Is Driver
                      </label>
                    </div>

                    {/* Sleepover Type */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Sleepover Type</label>
                      <select value={staffSleepoverType} onChange={e => setStaffSleepoverType(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all">
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
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Error */}
                    {createStaffAssignment.isError && (
                      <p className="text-sm text-[#ba1a1a]">Failed to add staff. Please try again.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setShowAddStaff(false)}
                        className="px-4 py-2 rounded-2xl bg-[#f5f3ef] text-sm hover:bg-[#efeeea] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleCreateStaffAssignment} disabled={!selectedStaffId || createStaffAssignment.isPending}
                        className="px-4 py-2 rounded-lg bg-[#396200] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Remove Staff</h3>
                    <button onClick={() => setDeletingStaff(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[#43493a]">
                    What would you like to do with <span className="font-medium text-[#1b1c1a]">{deletingStaff.staffName}</span>'s assignment?
                  </p>
                  {(updateStaffAssignment.isError || deleteStaffAssignment.isError) && (
                    <p className="text-sm text-[#ba1a1a] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => updateStaffAssignment.mutate({ id: deletingStaff.id, data: { ...deletingStaff, status: 'Cancelled' } }, { onSuccess: () => setDeletingStaff(null) })}
                      disabled={updateStaffAssignment.isPending || deleteStaffAssignment.isPending}
                      className="w-full px-4 py-2 rounded-2xl bg-[#fef3c7]/60 text-sm font-medium hover:bg-[#fef3c7] transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Cancel assignment</span>
                      <span className="block text-xs text-[#43493a] mt-0.5">Mark as cancelled — keeps the record for history</span>
                    </button>
                    <button
                      onClick={() => deleteStaffAssignment.mutate(deletingStaff.id, { onSuccess: () => setDeletingStaff(null) })}
                      disabled={deleteStaffAssignment.isPending || updateStaffAssignment.isPending}
                      className="w-full px-4 py-2 rounded-2xl bg-[#ffdad6]/60 text-sm font-medium hover:bg-[#ffdad6] transition-colors disabled:opacity-50 text-left">
                      <span className="font-semibold">Delete permanently</span>
                      <span className="block text-xs text-[#43493a] mt-0.5">Remove completely from the trip — cannot be undone</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#efeeea]">
                <tr>
                  <th className="text-left p-3 font-medium text-[#43493a]">Task</th>
                  <th className="text-left p-3 font-medium text-[#43493a]">Type</th>
                  <th className="text-left p-3 font-medium text-[#43493a]">Owner</th>
                  <th className="text-left p-3 font-medium text-[#43493a]">Due</th>
                  <th className="text-left p-3 font-medium text-[#43493a]">Priority</th>
                  <th className="text-left p-3 font-medium text-[#43493a]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeeea]">
                {tasks.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#efeeea]/50 transition-colors">
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3 text-[#43493a]">{t.taskType}</td>
                    <td className="p-3 text-[#43493a]">{t.ownerName || 'Unassigned'}</td>
                    <td className="p-3 text-[#43493a]">{formatDateAu(t.dueDate)}</td>
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
              <div className="text-[#43493a]">
                {generateSchedule.isPending ? (
                  <p>Generating schedule...</p>
                ) : generateSchedule.isError ? (
                  <div className="space-y-2">
                    <p className="text-[#ba1a1a]">Failed to generate schedule. The server may need a database update.</p>
                    <button onClick={() => { hasTriedGenerate.current = false; id && generateSchedule.mutate(id) }}
                      className="px-3 py-1.5 text-sm bg-[#396200] text-white rounded-lg hover:opacity-90">
                      Retry
                    </button>
                  </div>
                ) : (
                  <p>No schedule available. Check that the trip has dates configured.</p>
                )}
              </div>
            ) : schedule.map((day: any) => (
              <div key={day.id} className="bg-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-[#396200]/10 flex items-center justify-center text-[#396200] font-bold text-sm">
                      D{day.dayNumber}
                    </span>
                    <div>
                      <h4 className="font-semibold">{day.dayTitle || `Day ${day.dayNumber}`}</h4>
                      <p className="text-xs text-[#43493a]">{formatDateAu(day.date)}</p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button onClick={() => { setAddActivityDayId(day.id); setShowAddActivity(true) }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#396200] text-white rounded-lg hover:opacity-90">
                      <Plus className="w-3.5 h-3.5" /> Add Activity
                    </button>
                  )}
                </div>

                {day.scheduledActivities?.length > 0 ? (
                  <div className="space-y-2">
                    {day.scheduledActivities.map((a: any) => {
                      const isExpanded = expandedActivities.has(a.id)
                      return (
                        <div key={a.id} className="bg-[#f5f3ef] rounded-2xl">
                          <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleActivityExpanded(a.id)}>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[#43493a] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#43493a] shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{a.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusColor(a.status)}`}>{a.status}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#43493a] mt-0.5">
                                {a.startTime && <span>{a.startTime}{a.endTime && ` – ${a.endTime}`}</span>}
                                {a.location && <span>{a.location}</span>}
                                {a.bookingReference && <span>Ref: {a.bookingReference}</span>}
                              </div>
                            </div>
                            {!isReadOnly && (
                              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setEditingScheduledActivity(a); setAddActivityDayId(a.tripDayId); setShowAddActivity(true) }}
                                  className="p-1.5 hover:bg-[#efeeea] rounded-lg" title="Edit">
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
                            <div className="px-3 pb-3 pt-0 border-t border-[rgba(195,201,181,0.15)] ml-7 space-y-2 text-sm">
                              {a.category && <div><span className="text-[#43493a]">Category:</span> {a.category}</div>}
                              {a.estimatedCost != null && <div><span className="text-[#43493a]">Est. Cost:</span> ${Number(a.estimatedCost).toFixed(2)}</div>}
                              {a.providerName && <div><span className="text-[#43493a]">Provider:</span> {a.providerName}</div>}
                              {a.providerPhone && <div><span className="text-[#43493a]">Phone:</span> {a.providerPhone}</div>}
                              {a.providerEmail && <div><span className="text-[#43493a]">Email:</span> {a.providerEmail}</div>}
                              {a.providerWebsite && /^https?:\/\//i.test(a.providerWebsite) && (
                                <div><span className="text-[#43493a]">Website:</span>{' '}
                                  <a href={a.providerWebsite} target="_blank" rel="noopener noreferrer" className="text-[#396200] hover:underline inline-flex items-center gap-1">
                                    {a.providerWebsite} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                              {a.accessibilityNotes && <div><span className="text-[#43493a]">Accessibility:</span> {a.accessibilityNotes}</div>}
                              {a.notes && <div><span className="text-[#43493a]">Notes:</span> {a.notes}</div>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#43493a] italic">No activities scheduled</p>
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
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_32px_-12px_rgba(27,28,26,0.12)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Delete Activity</h3>
                    <button onClick={() => setDeletingActivity(null)} className="p-1 rounded hover:bg-[#efeeea] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[#43493a]">
                    Are you sure you want to delete <span className="font-medium text-[#1b1c1a]">{deletingActivity.title}</span>? This cannot be undone.
                  </p>
                  {deleteScheduledActivity.isError && (
                    <p className="text-sm text-[#ba1a1a] mt-3">Something went wrong. Please try again.</p>
                  )}
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setDeletingActivity(null)}
                      className="px-4 py-2 text-sm rounded-2xl bg-[#f5f3ef] hover:bg-[#efeeea]">
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteScheduledActivity.mutate(deletingActivity.id, { onSuccess: () => setDeletingActivity(null) })}
                      disabled={deleteScheduledActivity.isPending}
                      className="px-4 py-2 text-sm rounded-full bg-[#ba1a1a] text-white hover:opacity-90 disabled:opacity-50">
                      {deleteScheduledActivity.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'claims' && (
          <ClaimsTabContent tripId={id!} claims={claims} />
        )}

      </div>

      {/* Edit Trip Modal */}
      {showEditTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleCloseTripEdit}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_32px_64px_-16px_rgba(27,28,26,0.2)]" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(195,201,181,0.2)]">
              <div>
                <h2 className="text-lg font-bold text-[#1b1c1a]">Edit Trip</h2>
                {!tripEditForm && <p className="text-xs text-[#43493a] mt-0.5">Loading trip details…</p>}
              </div>
              <button onClick={handleCloseTripEdit} className="p-2 rounded-full hover:bg-[#f5f3ef] transition-colors">
                <X className="w-4 h-4 text-[#43493a]" />
              </button>
            </div>

            {/* Modal body */}
            {tripEditForm ? (
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* Basic Info */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Basic Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Trip Name *</label>
                      <input value={tripEditForm.tripName} onChange={e => setTripEditForm({ ...tripEditForm, tripName: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" placeholder="e.g. Beach Getaway 2026" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Trip Code</label>
                      <input value={tripEditForm.tripCode} onChange={e => setTripEditForm({ ...tripEditForm, tripCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" placeholder="e.g. BG-2026-01" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Event Template</label>
                      <Dropdown
                        variant="form"
                        value={tripEditForm.eventTemplateId}
                        onChange={val => setTripEditForm({ ...tripEditForm, eventTemplateId: val })}
                        label="None"
                        items={[
                          { value: '', label: 'None' },
                          ...templates.map((t: any) => ({ value: String(t.id), label: t.templateName })),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Destination</label>
                      <input value={tripEditForm.destination} onChange={e => setTripEditForm({ ...tripEditForm, destination: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" placeholder="e.g. Gold Coast" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Region</label>
                      <input value={tripEditForm.region} onChange={e => setTripEditForm({ ...tripEditForm, region: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" placeholder="e.g. QLD" />
                    </div>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Dates & Status</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Start Date *</label>
                      <input type="date" value={tripEditForm.startDate} onChange={e => setTripEditForm({ ...tripEditForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Duration (Days)</label>
                      <input type="number" min={1} value={tripEditForm.durationDays} onChange={e => setTripEditForm({ ...tripEditForm, durationDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Booking Cutoff</label>
                      <input type="date" value={tripEditForm.bookingCutoffDate} onChange={e => setTripEditForm({ ...tripEditForm, bookingCutoffDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Status</label>
                      <Dropdown
                        variant="form"
                        value={tripEditForm.status}
                        onChange={val => setTripEditForm({ ...tripEditForm, status: val })}
                        items={[
                          { value: 'Draft', label: 'Draft' },
                          { value: 'Planning', label: 'Planning' },
                          { value: 'OpenForBookings', label: 'Open For Bookings' },
                          { value: 'Confirmed', label: 'Confirmed' },
                          { value: 'InProgress', label: 'In Progress' },
                          { value: 'Completed', label: 'Completed' },
                          { value: 'Cancelled', label: 'Cancelled' },
                          { value: 'Archived', label: 'Archived' },
                        ]}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Lead Coordinator</label>
                      <Dropdown
                        variant="form"
                        value={tripEditForm.leadCoordinatorId}
                        onChange={val => setTripEditForm({ ...tripEditForm, leadCoordinatorId: val })}
                        label="None"
                        items={[
                          { value: '', label: 'None' },
                          ...allStaff.map((s: any) => ({ value: String(s.id), label: s.fullName })),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Capacity & Requirements</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Min Participants</label>
                      <input type="number" min={0} value={tripEditForm.minParticipants} onChange={e => setTripEditForm({ ...tripEditForm, minParticipants: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Max Participants</label>
                      <input type="number" min={0} value={tripEditForm.maxParticipants} onChange={e => setTripEditForm({ ...tripEditForm, maxParticipants: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Wheelchair Capacity</label>
                      <input type="number" min={0} value={tripEditForm.requiredWheelchairCapacity} onChange={e => setTripEditForm({ ...tripEditForm, requiredWheelchairCapacity: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Required Beds</label>
                      <input type="number" min={0} value={tripEditForm.requiredBeds} onChange={e => setTripEditForm({ ...tripEditForm, requiredBeds: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Required Bedrooms</label>
                      <input type="number" min={0} value={tripEditForm.requiredBedrooms} onChange={e => setTripEditForm({ ...tripEditForm, requiredBedrooms: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#43493a] mb-1">Min Staff Required</label>
                      <input type="number" min={0} value={tripEditForm.minStaffRequired} onChange={e => setTripEditForm({ ...tripEditForm, minStaffRequired: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#396200] uppercase tracking-wider">Notes</p>
                  <textarea value={tripEditForm.notes} onChange={e => setTripEditForm({ ...tripEditForm, notes: e.target.value })}
                    rows={3} className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" placeholder="Any additional notes..." />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12 text-[#43493a] text-sm">
                Loading trip details…
              </div>
            )}

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(195,201,181,0.2)]">
              <button onClick={handleCloseTripEdit}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-[#43493a] hover:bg-[#f5f3ef] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveTripEdit}
                disabled={!tripEditForm || updateTrip.isPending}
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
