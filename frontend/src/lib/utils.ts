import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskNdisNumber(ndis: string | null | undefined): string {
  if (!ndis) return '—'
  return '••••••••' + ndis.slice(-1)
}

export function formatDateAu(date: string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (['confirmed', 'completed', 'available'].includes(s)) return 'badge-confirmed'
  if (['draft', 'proposed'].includes(s)) return 'badge-draft'
  if (['cancelled', 'unavailable', 'nolongerattending'].includes(s)) return 'badge-cancelled'
  if (['overdue'].includes(s)) return 'badge-overdue'
  if (['conflict'].includes(s)) return 'badge-conflict'
  return 'badge-pending'
}
