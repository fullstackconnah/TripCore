import { useParticipants, useDeleteParticipant } from '@/api/hooks'
import { maskNdisNumber } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function ParticipantsPage() {
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = { isActive: showArchived ? 'false' : 'true' }
  if (search) params.search = search

  const { data: participants = [], isLoading } = useParticipants(params)
  const deleteParticipant = useDeleteParticipant()

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Archive "${name}"? This can be undone from the Archived view.`)) {
      deleteParticipant.mutate(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{participants.length} participant{participants.length !== 1 ? 's' : ''}</p>
        </div>
        {!showArchived && (
          <Link to="/participants/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 shadow-md shadow-blue-500/20 transition-all">
            <Plus className="w-4 h-4" /> New Participant
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button onClick={() => setShowArchived(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showArchived ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]'}`}>
            Active
          </button>
          <button onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showArchived ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]'}`}>
            Archived
          </button>
        </div>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participants..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div>
      ) : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Name</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">NDIS Number</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Plan Type</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Region</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">&#x1f9bd;</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">High</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Support Ratio</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Repeat</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                {!showArchived && <th className="w-10 p-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {participants.map((p: any) => (
                <tr key={p.id} className="hover:bg-[var(--color-accent)]/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/participants/${p.id}`}>
                  <td className="p-3">
                    <Link to={`/participants/${p.id}`} className="font-medium hover:text-[var(--color-primary)]">{p.fullName}</Link>
                  </td>
                  <td className="p-3 text-[var(--color-muted-foreground)] font-mono text-xs">{maskNdisNumber(p.maskedNdisNumber || p.ndisNumber)}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{p.planType}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{p.region || '—'}</td>
                  <td className="p-3 text-center">{p.wheelchairRequired ? '✅' : ''}</td>
                  <td className="p-3 text-center">{p.isHighSupport ? '✅' : ''}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{p.supportRatio}</td>
                  <td className="p-3 text-center">{p.isRepeatClient ? '🔁' : ''}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  {!showArchived && (
                    <td className="p-3">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.fullName) }}
                        className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-muted-foreground)] hover:text-red-400 transition-colors" title="Archive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
