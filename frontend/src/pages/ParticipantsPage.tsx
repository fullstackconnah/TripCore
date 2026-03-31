import { useParticipants, useDeleteParticipant, useUpdateParticipant } from '@/api/hooks'
import { maskNdisNumber } from '@/lib/utils'
import { DataTable, type Column } from '@/components/DataTable'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, ArchiveRestore } from 'lucide-react'
import { useState } from 'react'

export default function ParticipantsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = { isActive: showArchived ? 'false' : 'true' }
  if (search) params.search = search

  const { data: participants = [], isLoading } = useParticipants(params)
  const deleteParticipant = useDeleteParticipant()
  const updateParticipant = useUpdateParticipant()

  const handleRestore = (e: React.MouseEvent, p: any) => {
    e.stopPropagation()
    if (window.confirm(`Restore "${p.fullName}"?`)) {
      updateParticipant.mutate({ id: p.id, data: { ...p, isActive: true } })
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (window.confirm(`Archive "${name}"? This can be undone from the Archived view.`)) {
      deleteParticipant.mutate(id)
    }
  }

  const participantColumns: Column<any>[] = [
    { key: 'fullName', header: 'Name', sortable: true, className: 'font-medium' },
    { key: 'ndisNumber', header: 'NDIS Number', render: (p) => <span className="font-mono text-xs text-[var(--color-muted-foreground)]">{maskNdisNumber(p.maskedNdisNumber || p.ndisNumber)}</span> },
    { key: 'planType', header: 'Plan Type' },
    { key: 'region', header: 'Region', sortable: true },
    { key: 'wheelchairRequired', header: '\u{1F9BD}', type: 'boolean', align: 'center' },
    { key: 'isHighSupport', header: 'High', type: 'boolean', align: 'center' },
    { key: 'supportRatio', header: 'Support Ratio' },
    { key: 'isRepeatClient', header: 'Repeat', type: 'boolean', align: 'center' },
    { key: 'status', header: 'Status', sortable: true, render: (p) => <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{p.isActive ? 'Active' : 'Inactive'}</span> },
    {
      key: 'actions',
      header: '',
      render: (p) => showArchived ? (
        <button onClick={(e) => handleRestore(e, p)}
          className="p-1.5 rounded hover:bg-green-500/20 text-[var(--color-muted-foreground)] hover:text-green-400 transition-colors" title="Restore">
          <ArchiveRestore className="w-4 h-4" />
        </button>
      ) : (
        <button onClick={(e) => handleDelete(e, p.id, p.fullName)}
          className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-muted-foreground)] hover:text-red-400 transition-colors" title="Archive">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

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

      <DataTable
        data={participants}
        columns={participantColumns}
        keyField="id"
        sortable
        onRowClick={(p: any) => navigate(`/participants/${p.id}`)}
        loading={isLoading}
        emptyMessage="No participants found"
      />
    </div>
  )
}
