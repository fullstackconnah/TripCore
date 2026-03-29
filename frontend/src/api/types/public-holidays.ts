export interface PublicHolidayDto {
  id: string
  date: string
  name: string
  state: string | null
}

export interface CreatePublicHolidayDto {
  date: string
  name: string
  state?: string
}
