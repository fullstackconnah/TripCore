import { useParams, Link } from 'react-router-dom'
import { useParticipant, useParticipantBookings, useSupportProfile } from '@/api/hooks'
import { formatDateAu, maskNdisNumber } from '@/lib/utils'
import { DataTable } from '@/components/DataTable'
import { ArrowLeft, Users, Shield, ClipboardList, Pencil } from 'lucide-react'
import { useState } from 'react'

export default function ParticipantDetailPage() {
  const { id } = useParams()
  const [tab, setTab] = useState<'details' | 'bookings' | 'support'>('details')
  const { data: p, isLoading } = useParticipant(id)
  const { data: bookings = [] } = useParticipantBookings(id)
  const { data: supportProfile } = useSupportProfile(id)

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading...</div>
  if (!p) return <div className="text-center py-12">Participant not found</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <Link to="/participants" className="mt-1 p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{p.fullName}</h1>
            <span className={`text-xs px-3 py-1 rounded-full ${p.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{p.region || 'No region'} · {p.planType} · Support Ratio: {p.supportRatio}</p>
        </div>
        <Link to={`/participants/${id}/edit`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 transition-all shadow-md shadow-blue-500/20">
          <Pencil className="w-4 h-4" /> Edit
        </Link>
      </div>

      <div className="flex gap-4 border-b border-[var(--color-border)]">
        {[{ key: 'details' as const, label: 'Details', icon: Users }, { key: 'bookings' as const, label: 'Bookings', icon: ClipboardList }, { key: 'support' as const, label: 'Support Profile', icon: Shield }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted-foreground)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
            <h3 className="font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-[var(--color-muted-foreground)]">NDIS Number</span><span className="font-mono">{p.ndisNumber ? maskNdisNumber(p.maskedNdisNumber || p.ndisNumber) : '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Date of Birth</span><span>{formatDateAu(p.dateOfBirth)}</span>
              <span className="text-[var(--color-muted-foreground)]">Funding Org</span><span>{p.fundingOrganisation || '—'}</span>
              <span className="text-[var(--color-muted-foreground)]">Repeat Client</span><span>{p.isRepeatClient ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
            <h3 className="font-semibold">Support Needs</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Wheelchair</span><span>{p.wheelchairRequired ? <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none text-[var(--color-primary)]">check_circle</span> Yes</span> : 'No'}</span>
              <span className="text-[var(--color-muted-foreground)]">High Support</span><span>{p.isHighSupport ? <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none text-[var(--color-primary)]">check_circle</span> Yes</span> : 'No'}</span>
              <span className="text-[var(--color-muted-foreground)]">Overnight Support</span><span>{p.requiresOvernightSupport ? <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none text-[var(--color-primary)]">check_circle</span> Yes</span> : 'No'}</span>
              <span className="text-[var(--color-muted-foreground)]">Restrictive Practice</span><span>{p.hasRestrictivePracticeFlag ? <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none text-amber-500">warning</span> Yes</span> : 'No'}</span>
            </div>
          </div>
          {(p.mobilityNotes || p.transportRequirements || p.equipmentRequirements || p.notes) && (
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-3 md:col-span-2">
              <h3 className="font-semibold">Notes</h3>
              <div className="text-sm space-y-2 text-[var(--color-muted-foreground)]">
                {p.mobilityNotes && <p><strong>Mobility:</strong> {p.mobilityNotes}</p>}
                {p.transportRequirements && <p><strong>Transport:</strong> {p.transportRequirements}</p>}
                {p.equipmentRequirements && <p><strong>Equipment:</strong> {p.equipmentRequirements}</p>}
                {p.notes && <p><strong>General:</strong> {p.notes}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <DataTable
          data={bookings}
          keyField="id"
          columns={[
            {
              key: 'tripName',
              header: 'Trip',
              render: (b: any) => (
                <Link to={`/trips/${b.tripInstanceId}`} className="font-medium hover:text-[var(--color-primary)]">
                  {b.tripName || 'Trip'}
                </Link>
              ),
            },
            { key: 'bookingStatus', header: 'Status', type: 'badge' },
            { key: 'bookingDate', header: 'Date', type: 'date' },
          ]}
          emptyMessage="No bookings"
        />
      )}

      {tab === 'support' && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
          {!supportProfile ? (
            <p className="text-[var(--color-muted-foreground)]">No support profile recorded</p>
          ) : (
            <div className="space-y-4 text-sm">
              {[
                { label: 'Communication Notes', value: supportProfile.communicationNotes },
                { label: 'Behaviour Support', value: supportProfile.behaviourSupportNotes },
                { label: 'Restrictive Practice Details', value: supportProfile.restrictivePracticeDetails },
                { label: 'Manual Handling', value: supportProfile.manualHandlingNotes },
                { label: 'Medication & Health', value: supportProfile.medicationHealthSummary },
                { label: 'Emergency Considerations', value: supportProfile.emergencyConsiderations },
                { label: 'Travel-Specific', value: supportProfile.travelSpecificNotes },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <p className="font-medium text-[var(--color-muted-foreground)] mb-1">{f.label}</p>
                  <p className="whitespace-pre-line">{f.value}</p>
                </div>
              ))}
              {supportProfile.reviewDate && <p className="text-xs text-[var(--color-muted-foreground)]">Review Date: {formatDateAu(supportProfile.reviewDate)}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
