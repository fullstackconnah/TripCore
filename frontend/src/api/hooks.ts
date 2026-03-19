import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// Generic API response type
interface ApiResponse<T> {
  success: boolean
  data: T | null
  message?: string | null
  errors?: string[] | null
}

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

export function useAccommodationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['accommodation-detail', id],
    queryFn: () => apiClient.get<ApiResponse<any>>(`/accommodation/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/vehicles').then(r => r.data.data ?? []),
  })
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => apiClient.get<ApiResponse<any[]>>('/staff').then(r => r.data.data ?? []),
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

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/bookings', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
  })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/bookings/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
  })
}

export function useDeleteBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/bookings/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['trip-bookings'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-accommodation'] }),
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/reservations/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-accommodation'] }),
  })
}

export function useDeleteReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reservations/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-accommodation'] }),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-staff'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
  })
}

export function useUpdateStaffAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/staff-assignments/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-staff'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
  })
}

export function useDeleteStaffAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/staff-assignments/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip-staff'] }); qc.invalidateQueries({ queryKey: ['trip'] }) },
  })
}

export function useCreateVehicleAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/vehicle-assignments', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-vehicles'] }),
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/vehicles', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
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

export function useLogin() {
  return useMutation({
    mutationFn: (data: { username: string; password: string }) => apiClient.post('/auth/login', data).then(r => r.data),
  })
}

export function useGenerateSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tripId: string) => apiClient.post(`/trips/${tripId}/schedule/generate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-schedule'] }),
  })
}

export function useScheduleOverview(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['schedule-overview', params],
    queryFn: () => apiClient.get<ApiResponse<any>>('/schedule', { params }).then(r => r.data.data),
  })
}
