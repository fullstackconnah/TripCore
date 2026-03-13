import axios from 'axios'

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
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tripcore_token')
      localStorage.removeItem('tripcore_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
