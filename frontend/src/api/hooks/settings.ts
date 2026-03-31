import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetWithDefault, apiPutRaw, apiClient } from '../client'
import type { AppSettingsDto, UpdateAppSettingsDto, ApiResponse, TenantDto, TenantUserDto } from '../types'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      apiGetWithDefault<AppSettingsDto>('/settings', { qualificationWarningDays: 30 }),
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateAppSettingsDto) => apiPutRaw<AppSettingsDto>('/settings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => apiClient.get<ApiResponse<TenantDto[]>>('/admin/tenants').then(r => r.data),
  })
}

export function useAdminTenantUsers(tenantId: string | null) {
  return useQuery({
    queryKey: ['admin-tenant-users', tenantId],
    queryFn: () =>
      apiClient
        .get<ApiResponse<TenantUserDto[]>>(`/admin/tenants/${tenantId}/users`)
        .then(r => r.data),
    enabled: !!tenantId,
  })
}
