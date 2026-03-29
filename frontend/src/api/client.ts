import axios from 'axios'
import type { ApiResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// JWT interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tripcore_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const viewingTenantId = localStorage.getItem('tripcore_viewing_tenant')
  if (viewingTenantId) {
    config.headers['X-View-As-Tenant'] = viewingTenantId
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tripcore_token')
      localStorage.removeItem('tripcore_user')
      localStorage.removeItem('tripcore_viewing_tenant')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Typed API helpers ─────────────────────────────────────────

export async function apiGet<T>(url: string, params?: Record<string, any>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params })
  return response.data.data as T
}

export async function apiGetWithDefault<T>(url: string, defaultValue: T, params?: Record<string, any>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params })
  return response.data.data ?? defaultValue
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data)
  return response.data.data as T
}

export async function apiPostRaw<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data)
  return response.data
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data)
  return response.data.data as T
}

export async function apiPutRaw<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, data)
  return response.data
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data)
  return response.data.data as T
}

export async function apiPatchRaw<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data)
  return response.data
}

export async function apiDelete(url: string): Promise<void> {
  await apiClient.delete(url)
}

export async function apiDeleteRaw<T>(url: string): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url)
  return response.data
}
