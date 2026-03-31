export interface TenantDto {
  id: string
  name: string
  emailDomain: string
  isActive: boolean
  createdAt: string
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
