import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// Generic API response type
interface ApiResponse<T> {
  success: boolean
  data: T | null
  message?: string | null
  errors?: string[] | null
}

// ─── Payment Status ───────────────────────────────────────────
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  NotInvoiced: 'Not Invoiced',
  InvoiceSent: 'Invoice Sent',
  Partial:     'Partial',
  Paid:        'Paid',
  Overdue:     'Overdue',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  NotInvoiced: 'bg-neutral-100 text-neutral-600',
  InvoiceSent: 'bg-blue-100 text-blue-700',
  Partial:     'bg-amber-100 text-amber-700',
  Paid:        'bg-green-100 text-green-700',
  Overdue:     'bg-red-100 text-red-700',
}

export const PAYMENT_STATUS_ITEMS = [
  { value: 'NotInvoiced', label: 'Not Invoiced' },
  { value: 'InvoiceSent', label: 'Invoice Sent' },
  { value: 'Partial',     label: 'Partial' },
  { value: 'Paid',        label: 'Paid' },
  { value: 'Overdue',     label: 'Overdue' },
]

// ── Query hooks ──────────────────────────────────────────────

export function useTrips(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/trips', { params }).then(r => r.data.data ?? []),
  })
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/trips/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useTripBookings(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-bookings', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/bookings`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripAccommodation(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-accommodation', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/accommodation`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripVehicles(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-vehicles', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/vehicles`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripStaff(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-staff', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/staff`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripTasks(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-tasks', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/tasks`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripSchedule(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-schedule', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/schedule`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripDocuments(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-documents', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/documents`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useTripItinerary(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-itinerary', tripId],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/trips/${tripId}/itinerary`).then(r => r.data.data),
    enabled: !!tripId,
  })
}

export function useParticipants(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['participants', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/participants', { params }).then(r => r.data.data ?? []),
  })
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: ['participant', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/participants/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useParticipantBookings(id: string | undefined) {
  return useQuery({
    queryKey: ['participant-bookings', id],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/participants/${id}/bookings`).then(r => r.data.data ?? []),
    enabled: !!id,
  })
}

export function useSupportProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['support-profile', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/participants/${id}/support-profile`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useAccommodation(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['accommodation', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/accommodation', { params }).then(r => r.data.data ?? []),
  })
}

export function useCreateAccommodation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/accommodation', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accommodation'] }),
  })
}

export function useUpdateAccommodation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/accommodation/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['accommodation'] }); qc.invalidateQueries({ queryKey: ['accommodation-detail', vars.id] }) },
  })
}

export function useAccommodationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['accommodation-detail', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/accommodation/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useVehicles(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/vehicles', { params }).then(r => r.data.data ?? []),
  })
}

export function useVehicleDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['vehicle-detail', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/vehicles/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useStaff(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/staff', { params }).then(r => r.data.data ?? []),
  })
}

export function useStaffDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['staff-detail', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/staff/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useAvailableStaff(startDate: string | undefined, endDate: string | undefined) {
  return useQuery({
    queryKey: ['staff-available', startDate, endDate],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/staff/available', { params: { startDate, endDate } }).then(r => r.data.data ?? []),
    enabled: !!startDate && !!endDate,
  })
}

export function useStaffAvailability(id: string | undefined) {
  return useQuery({
    queryKey: ['staff-availability', id],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/staff/${id}/availability`).then(r => r.data.data ?? []),
    enabled: !!id,
  })
}

export function useTasks(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/tasks', { params }).then(r => r.data.data ?? []),
  })
}

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/activities').then(r => r.data.data ?? []),
  })
}

export function useEventTemplates() {
  return useQuery({
    queryKey: ['event-templates'],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/event-templates').then(r => r.data.data ?? []),
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<ApiResponse<any>>('/dashboard/summary').then(r => r.data.data),
  })
}

export function useBookings(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/bookings', { params }).then(r => r.data.data ?? []),
  })
}

// ── Mutation hooks ───────────────────────────────────────────

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/trips', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useUpdateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/trips/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['trips'] }); qc.invalidateQueries({ queryKey: ['trip', vars.id] }) },
  })
}

export function usePatchTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/trips/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['trips'] }); qc.invalidateQueries({ queryKey: ['trip', vars.id] }) },
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/bookings', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trips'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/bookings/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trips'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }); qc.invalidateQueries({ queryKey: ['participant-bookings'] }) },
  })
}

export function usePatchBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/bookings/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trip'] }); qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useDeleteBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/bookings/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trips'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/bookings/${id}`, { ...data, bookingStatus: 'Cancelled' }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
  })
}

export function useCreateParticipant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/participants', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants'] }),
  })
}

export function useUpdateParticipant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/participants/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['participants'] }); qc.invalidateQueries({ queryKey: ['participant', vars.id] }) },
  })
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/reservations', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-accommodation'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/reservations/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-accommodation'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useDeleteReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reservations/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-accommodation'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useCancelReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/reservations/${id}`, { ...data, reservationStatus: 'Cancelled' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-accommodation'] }),
  })
}

export function useCreateStaffAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/staff-assignments', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-staff'] }); qc.invalidateQueries({ queryKey: ['trip'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useUpdateStaffAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/staff-assignments/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-staff'] }); qc.invalidateQueries({ queryKey: ['trip'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useDeleteStaffAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/staff-assignments/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-staff'] }); qc.invalidateQueries({ queryKey: ['trip'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useCreateVehicleAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/vehicle-assignments', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-vehicles'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/vehicles', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/vehicles/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['vehicles'] }); qc.invalidateQueries({ queryKey: ['vehicle-detail', vars.id] }) },
  })
}

export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/staff', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}

export function useUpdateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/staff/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['staff'] }); qc.invalidateQueries({ queryKey: ['staff-detail', vars.id] }) },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/tasks', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['trip-tasks'] }) },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/tasks/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['trip-tasks'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) },
  })
}

export function useDeleteParticipant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/participants/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants'] }),
  })
}

export function useDeleteAccommodation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/accommodation/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accommodation'] }),
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vehicles/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}

export function useDeleteStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/staff/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['trip-tasks'] }) },
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { username: string; password: string; email: string }) => apiClient.post('/auth/login', data).then(r => r.data),
  })
}

export function useGenerateSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tripId: string) => apiClient.post(`/trips/${tripId}/schedule/generate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-schedule'] }),
  })
}

// ── Scheduled Activity CRUD hooks ──────────────────────────

export function useCreateScheduledActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tripDayId, data }: { tripDayId: string; data: any }) =>
      apiClient.post(`/trip-days/${tripDayId}/activities`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-schedule'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useUpdateScheduledActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.put(`/scheduled-activities/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-schedule'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useDeleteScheduledActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/scheduled-activities/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-schedule'] }); qc.invalidateQueries({ queryKey: ['trip-itinerary'] }) },
  })
}

export function useScheduleOverview(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['schedule-overview', params],
    queryFn: () => apiClient.get<ApiResponse<any>>('/schedule', { params }).then(r => r.data.data),
  })
}

export function useCreateStaffAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/staff-availability', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule-overview'] })
      qc.invalidateQueries({ queryKey: ['staff-availability'] })
    },
  })
}

export function useUpdateStaffAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.put(`/staff-availability/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule-overview'] })
      qc.invalidateQueries({ queryKey: ['staff-availability'] })
    },
  })
}

export function useDeleteStaffAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/staff-availability/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule-overview'] })
      qc.invalidateQueries({ queryKey: ['staff-availability'] })
    },
  })
}

// ── Incident hooks ──────────────────────────────────────────

export function useIncidents(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/incidents', { params }).then(r => r.data.data ?? []),
  })
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/incidents/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useTripIncidents(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-incidents', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/incidents/trip/${tripId}`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useOverdueQscIncidents() {
  return useQuery({
    queryKey: ['incidents-overdue-qsc'],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/incidents/overdue-qsc').then(r => r.data.data ?? []),
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/incidents', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) },
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/incidents/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['incidents'] }); qc.invalidateQueries({ queryKey: ['incident', vars.id] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) },
  })
}

export function useDeleteIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/incidents/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<{ qualificationWarningDays: number }>>('/settings')
        .then(r => r.data.data ?? { qualificationWarningDays: 30 }),
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { qualificationWarningDays: number }) =>
      apiClient.put('/settings', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => apiClient.get('/admin/tenants').then(r => r.data),
  })
}

// ── NDIS Claiming ────────────────────────────────────────────

export function useTripClaims(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip-claims', tripId],
    queryFn: () => apiClient.get<ApiResponse<any[]>>(`/trips/${tripId}/claims`).then(r => r.data.data ?? []),
    enabled: !!tripId,
  })
}

export function useClaim(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/claims/${claimId}`).then(r => r.data.data),
    enabled: !!claimId,
  })
}

export function useGenerateClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tripId: string) => apiClient.post<ApiResponse<any>>(`/trips/${tripId}/claims`).then(r => r.data.data),
    onSuccess: (_, tripId) => { qc.invalidateQueries({ queryKey: ['trip-claims', tripId] }) },
  })
}

export function useUpdateClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, data }: { claimId: string; data: any }) =>
      apiClient.put<ApiResponse<boolean>>(`/claims/${claimId}`, data).then(r => r.data),
    onSuccess: (_, { claimId }) => { qc.invalidateQueries({ queryKey: ['claim', claimId] }) },
  })
}

export function useUpdateClaimLineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, itemId, data }: { claimId: string; itemId: string; data: any }) =>
      apiClient.patch<ApiResponse<boolean>>(`/claims/${claimId}/line-items/${itemId}`, data).then(r => r.data),
    onSuccess: (_, { claimId }) => { qc.invalidateQueries({ queryKey: ['claim', claimId] }) },
  })
}

export function useDeleteClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (claimId: string) =>
      apiClient.delete<ApiResponse<boolean>>(`/claims/${claimId}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-claims'] }) },
  })
}

export function useProviderSettings() {
  return useQuery({
    queryKey: ['provider-settings'],
    queryFn: () => apiClient.get<ApiResponse<any>>('/provider-settings').then(r => r.data.data),
  })
}

export function useUpsertProviderSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.put<ApiResponse<any>>('/provider-settings', data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['provider-settings'] }) },
  })
}

export function useSupportCatalogue() {
  return useQuery({
    queryKey: ['support-catalogue'],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/support-catalogue').then(r => r.data.data ?? []),
  })
}

export function usePublicHolidays(year?: number, state?: string) {
  return useQuery({
    queryKey: ['public-holidays', year, state],
    queryFn: () => {
      const params: Record<string, any> = {}
      if (year) params.year = year
      if (state) params.state = state
      return apiClient.get<ApiResponse<any[]>>('/public-holidays', { params }).then(r => r.data.data ?? [])
    },
  })
}

export function useCreatePublicHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post<ApiResponse<any>>('/public-holidays', data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['public-holidays'] }) },
  })
}

export function useDeletePublicHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/public-holidays/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['public-holidays'] }) },
  })
}
