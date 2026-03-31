export interface TenantDto {
  id: string
  name: string
  emailDomain: string
  isActive: boolean
  createdAt: string
}

export interface TenantUserDto {
  id: string
  fullName: string
  role: string
  isActive: boolean
}

export interface CreateTenantDto {
  name: string
  emailDomain: string
}

export interface UpdateTenantDto {
  name: string
  emailDomain: string
  isActive: boolean
}
