import { useParams, Link } from 'react-router-dom'
import { useClaim, useUpdateClaim, useUpdateClaimLineItem } from '@/api/hooks'
import { Download, Check } from 'lucide-react'
import { useState } from 'react'
import { apiClient } from '@/api/client'

const inputClass = 'w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all'

function claimStatusColor(status: string) {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-600'
    case 'Submitted': return 'bg-blue-100 text-blue-700'
    case 'Paid': return 'bg-[#bff285] text-[#294800]'
    case 'Rejected': return 'bg-red-100 text-red-700'
    case 'PartiallyPaid': return 'bg-amber-100 text-amber-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function lineItemStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-gray-100 text-gray-600'
    case 'Paid': return 'bg-[#bff285] text-[#294800]'
    case 'Rejected': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function planTypeColor(planType: string) {
  switch (planType) {
    case 'NdiaManaged': return 'bg-blue-100 text-blue-700'
    case 'PlanManaged': return 'bg-purple-100 text-purple-700'
    case 'SelfManaged': return 'bg-orange-100 text-orange-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function planTypeLabel(planType: string) {
  switch (planType) {
    case 'NdiaManaged': return 'NDIA Managed'
    case 'PlanManaged': return 'Plan Managed'
    case 'SelfManaged': return 'Self Managed'
    default: return planType
  }
}

async function downloadFile(url: string, filename: string) {
  const response = await apiClient.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: claim, isLoading } = useClaim(id)
  const updateClaim = useUpdateClaim()
  // useUpdateClaimLineItem is available for line item edits if needed
  useUpdateClaimLineItem()
  const [notes, setNotes] = useState('')
  const [notesInit, setNotesInit] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!notesInit && claim) {
    setNotes(claim.notes || '')
    setNotesInit(true)
  }

  if (isLoading) return <div className="p-8 text-[#43493a]">Loading...</div>
  if (!claim) return <div className="p-8 text-[#43493a]">Claim not found</div>

  const totalAmount = (claim.lineItems ?? []).reduce((sum: number, l: any) => sum + (l.totalAmount ?? 0), 0)

  function handleSaveNotes() {
    if (!id) return
    updateClaim.mutate({ claimId: id, data: { notes } }, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    })
  }

  function handleSubmit() {
    if (!id) return
    updateClaim.mutate({ claimId: id, data: { status: 'Submitted' } })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#43493a]">
        <Link to="/trips" className="hover:text-[#396200]">Trips</Link>
        <span>/</span>
        {claim.tripInstanceId && (
          <>
            <Link to={`/trips/${claim.tripInstanceId}`} className="hover:text-[#396200]">{claim.tripName || 'Trip'}</Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium">Claim {claim.claimReference}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1b1c1a]">Claim {claim.claimReference}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${claimStatusColor(claim.status)}`}>{claim.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadFile(`/claims/${id}/bpr-csv`, `${claim.claimReference}-bpr.csv`)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#c3c9b6] text-sm text-[#43493a] hover:bg-[#f5f3ef] transition-all"
          >
            <Download className="w-4 h-4" />
            BPR CSV
          </button>
          {claim.status === 'Draft' && (
            <button
              onClick={handleSubmit}
              disabled={updateClaim.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Mark as Submitted
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Amount', value: `$${totalAmount.toFixed(2)}` },
          { label: 'Trip', value: claim.tripName || '—' },
          { label: 'Created', value: claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-AU') : '—' },
          { label: 'Submitted', value: claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString('en-AU') : '—' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4">
            <p className="text-xs text-[#43493a] font-medium mb-1">{card.label}</p>
            <p className="text-lg font-semibold text-[#1b1c1a]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-4 space-y-2">
        <label className="block text-xs font-medium text-[#43493a]">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add claim notes..."
          className={inputClass + ' resize-none'}
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={updateClaim.isPending}
            className="px-4 py-1.5 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] transition-all disabled:opacity-50"
          >
            {saved ? 'Saved!' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f3ef] flex items-center justify-between">
          <h2 className="font-semibold text-sm text-[#43493a]">Line Items</h2>
          <span className="text-xs text-[#43493a]">{(claim.lineItems ?? []).length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f3ef]/50">
              <tr>
                {['Participant', 'Support Item', 'Day Type', 'Dates', 'Hours', 'Unit Price', 'Total', 'Status', ''].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-[#43493a] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3ef]">
              {(claim.lineItems ?? []).map((item: any) => (
                <tr key={item.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-[#1b1c1a]">{item.participantName}</p>
                    <p className="text-xs text-[#43493a] font-mono">{item.ndisNumber}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${planTypeColor(item.planType)}`}>
                      {planTypeLabel(item.planType)}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-[#43493a]">{item.supportItemCode}</td>
                  <td className="p-3 text-[#43493a]">{item.dayType}</td>
                  <td className="p-3 text-xs text-[#43493a] whitespace-nowrap">
                    {item.supportsDeliveredFrom} – {item.supportsDeliveredTo}
                  </td>
                  <td className="p-3 text-right text-[#43493a]">{item.hours}h</td>
                  <td className="p-3 text-right text-[#43493a]">${item.unitPrice?.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium text-[#1b1c1a]">${item.totalAmount?.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lineItemStatusColor(item.status)}`}>{item.status}</span>
                  </td>
                  <td className="p-3">
                    {(item.planType === 'PlanManaged' || item.planType === 'SelfManaged') && (
                      <button
                        onClick={() => downloadFile(`/claims/${id}/invoices/${item.participantBookingId}`, `invoice-${item.participantName.replace(/\s+/g, '-')}.pdf`)}
                        className="flex items-center gap-1 text-xs text-[#396200] hover:underline"
                      >
                        <Download className="w-3 h-3" />
                        Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[#f5f3ef]">
              <tr>
                <td colSpan={6} className="p-3 text-right text-sm font-medium text-[#43493a]">Total</td>
                <td className="p-3 text-right font-bold text-[#1b1c1a]">${totalAmount.toFixed(2)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
