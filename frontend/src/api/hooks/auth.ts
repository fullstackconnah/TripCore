import { useMutation } from '@tanstack/react-query'
import { apiPostRaw } from '../client'
import type { LoginDto, AuthResponseDto } from '../types'

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginDto) => apiPostRaw<AuthResponseDto>('/auth/login', data),
  })
}
