import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStaff, useSettings, useUpdateStaff } from '@/api/hooks'

type QualStatus = 'expired' | 'expiring' | 'no-date'
type FilterTab = 'all' | 'expired' | 'expiring' | 'no-date'

interface QualRow {
  key: string
  staffId: string
  staffName: string
  qualification: string
  fieldKey: string
  expiryDate: string | null
  daysUntilExpiry: number | null
  status: QualStatus
}

const QUALS = [
  { label: 'First Aid', flag: 'isFirstAidQualified', field: 'firstAidExpiryDate' },
  { label: 'Driver Licence', flag: 'isDriverEligible', field: 'driverLicenceExpiryDate' },
  { label: 'Manual Handling', flag: 'isManualHandlingCompetent', field: 'manualHandlingExpiryDate' },
  { label: 'Medication Competency', flag: 'isMedicationCompetent', field: 'medicationCompetencyExpiryDate' },
] as const

function buildRows(staff: any[], warningDays: number): QualRow[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rows: QualRow[] = []

  for (const s of staff) {
    for (const q of QUALS) {
      if (!s[q.flag]) continue
      const expiryDate = s[q.field] as string | null
      if (!expiryDate) {
        rows.push({
          key: `${s.id}-${q.field}`, staffId: s.id, staffName: s.fullName,
          qualification: q.label, fieldKey: q.field,
          expiryDate: null, daysUntilExpiry: null, status: 'no-date',
        })
        continue
      }
      const expiry = new Date(expiryDate + 'T00:00:00')
      expiry.setHours(0, 0, 0, 0)
      const diff = Math.floor((expiry.getTime() - today.getTime()) / 86400000)
      if (diff < 0) {
        rows.push({
          key: `${s.id}-${q.field}`, staffId: s.id, staffName: s.fullName,
          qualification: q.label, fieldKey: q.field,
          expiryDate, daysUntilExpiry: diff, status: 'expired',
        })
      } else if (diff <= warningDays) {
        rows.push({
          key: `${s.id}-${q.field}`, staffId: s.id, staffName: s.fullName,
          qualification: q.label, fieldKey: q.field,
          expiryDate, daysUntilExpiry: diff, status: 'expiring',
        })
      }
      // Beyond warningDays: not shown
    }
  }

  // Sort: expired first, then by days remaining ascending, then no-date last
  rows.sort((a, b) => {
    if (a.status === 'expired' && b.status !== 'expired') return -1
    if (a.status !== 'expired' && b.status === 'expired') return 1
    if (a.daysUntilExpiry === null) return 1
    if (b.daysUntilExpiry === null) return -1
    return a.daysUntilExpiry - b.daysUntilExpiry
  })
  return rows
}

function getStatusBadge(row: QualRow): { label: string; cls: string } {
  if (row.status === 'expired') return { label: 'EXPIRED', cls: 'badge-cancelled' }
  if (row.status === 'no-date') return { label: 'No date set', cls: 'badge-draft' }
  const days = row.daysUntilExpiry!
  const label = days === 0 ? 'Expires today' : `${days} day${days === 1 ? '' : 's'}`
  return { label, cls: 'badge-pending' }
}

export default function QualificationsPage() {
  const { data: settings } = useSettings()
  const { data: allStaff = [], isLoading } = useStaff({ isActive: 'true' })
  const updateStaff = useUpdateStaff()

  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const warningDays = settings?.qualificationWarningDays ?? 30
  const rows = buildRows(allStaff, warningDays)
  const filteredRows = filterTab === 'all' ? rows : rows.filter(r => r.status === filterTab)

  const counts = {
    all: rows.length,
    expired: rows.filter(r => r.status === 'expired').length,
    expiring: rows.filter(r => r.status === 'expiring').length,
    'no-date': rows.filter(r => r.status === 'no-date').length,
  }

  function handleEdit(row: QualRow) {
    setEditingKey(row.key)
    setEditValue(row.expiryDate ?? '')
    setSaveError(null)
  }

  function handleSave(row: QualRow) {
    const s = allStaff.find((m: any) => m.id === row.staffId)
    if (!s) return

    const payload = {
      firstName: s.firstName,
      lastName: s.lastName,
      role: s.role,
      email: s.email,
      mobile: s.mobile,
      region: s.region,
      isDriverEligible: s.isDriverEligible,
      isFirstAidQualified: s.isFirstAidQualified,
      isMedicationCompetent: s.isMedicationCompetent,
      isManualHandlingCompetent: s.isManualHandlingCompetent,
      isOvernightEligible: s.isOvernightEligible,
      isActive: s.isActive,
      notes: s.notes,
      firstAidExpiryDate: s.firstAidExpiryDate,
      driverLicenceExpiryDate: s.driverLicenceExpiryDate,
      manualHandlingExpiryDate: s.manualHandlingExpiryDate,
      medicationCompetencyExpiryDate: s.medicationCompetencyExpiryDate,
      [row.fieldKey]: editValue || null,
    }

    updateStaff.mutate({ id: row.staffId, data: payload }, {
      onSuccess: () => { setEditingKey(null); setSaveError(null) },
      onError: () => setSaveError('Failed to save. Please try again.'),
    })
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All Issues (${counts.all})` },
    { key: 'expired', label: `Expired (${counts.expired})` },
    { key: 'expiring', label: `Expiring Soon (${counts.expiring})` },
    { key: 'no-date', label: `No Date Set (${counts['no-date']})` },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Staff Qualification Expiry</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Warning window: {warningDays} days —{' '}
          <Link to="/settings" className="text-[var(--color-primary)] hover:underline">
            change in Settings
          </Link>
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-4 border-b border-[var(--color-border)] overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilterTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              filterTab === t.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredRows.length === 0 ? (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-3xl mb-3">✓</p>
          <p className="font-semibold text-[var(--color-foreground)]">All qualifications are current</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            No issues found within the {warningDays}-day warning window
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="text-left p-4 font-medium text-[var(--color-muted-foreground)]">Staff</th>
                <th className="text-left p-4 font-medium text-[var(--color-muted-foreground)]">Qualification</th>
                <th className="text-left p-4 font-medium text-[var(--color-muted-foreground)]">Expiry Date</th>
                <th className="text-left p-4 font-medium text-[var(--color-muted-foreground)]">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredRows.map(row => {
                const isEditing = editingKey === row.key
                const badge = getStatusBadge(row)
                return (
                  <tr key={row.key}
                    className={`hover:bg-[var(--color-accent)]/50 transition-colors ${
                      row.status === 'expired'
                        ? 'bg-[#ffdad6]/10'
                        : row.status === 'expiring'
                        ? 'bg-[#fef3c7]/10'
                        : ''
                    }`}>
                    <td className="p-4 font-medium">{row.staffName}</td>
                    <td className="p-4 text-[var(--color-muted-foreground)]">{row.qualification}</td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="date"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          />
                          {saveError && (
                            <p className="text-xs text-[#ba1a1a]">{saveError}</p>
                          )}
                        </div>
                      ) : (
                        <span>{row.expiryDate ?? '—'}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => handleSave(row)}
                            disabled={updateStaff.isPending}
                            className="text-xs font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50"
                          >
                            {updateStaff.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditingKey(null); setSaveError(null) }}
                            className="text-xs text-[var(--color-muted-foreground)] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
