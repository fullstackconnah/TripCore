import { useStaff, useDeleteStaff, useUpdateStaff } from '@/api/hooks'
import { DataTable, type Column } from '@/components/DataTable'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ArchiveRestore } from 'lucide-react'
import { useState } from 'react'

export default function StaffPage() {
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = { isActive: showArchived ? 'false' : 'true' }
  const { data: staff = [], isLoading } = useStaff(params)
  const deleteStaff = useDeleteStaff()
  const updateStaff = useUpdateStaff()

  const handleRestore = (e: React.MouseEvent, s: any) => {
    e.stopPropagation()
    if (window.confirm(`Restore "${s.fullName}"?`)) {
      updateStaff.mutate({ id: s.id, data: { ...s, isActive: true } })
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (window.confirm(`Archive "${name}"? This can be undone from the Archived view.`)) {
      deleteStaff.mutate(id)
    }
  }

  const staffColumns: Column<any>[] = [
    { key: 'fullName', header: 'Name', sortable: true, className: 'font-medium' },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'region', header: 'Region', sortable: true },
    { key: 'isDriverEligible', header: 'Driver', type: 'boolean', align: 'center' },
    { key: 'isFirstAidQualified', header: 'First Aid', type: 'boolean', align: 'center' },
    { key: 'isMedicationCompetent', header: 'Meds', type: 'boolean', align: 'center' },
    { key: 'isManualHandlingCompetent', header: 'Manual', type: 'boolean', align: 'center' },
    { key: 'isOvernightEligible', header: 'Overnight', type: 'boolean', align: 'center' },
    { key: 'status', header: 'Status', sortable: true, render: (s) => <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{s.isActive ? 'Active' : 'Inactive'}</span> },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center gap-1">
          <Link to={`/staff/${s.id}/edit`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors inline-block" title="Edit">
            <Pencil className="w-4 h-4" />
          </Link>
          {showArchived ? (
            <button onClick={(e) => handleRestore(e, s)}
              className="p-1.5 rounded hover:bg-green-500/20 text-[var(--color-muted-foreground)] hover:text-green-400 transition-colors" title="Restore">
              <ArchiveRestore className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={(e) => handleDelete(e, s.id, s.fullName)}
              className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-muted-foreground)] hover:text-red-400 transition-colors" title="Archive">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{staff.length} staff members</p>
        </div>
        {!showArchived && (
          <Link to="/staff/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 transition-all shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> New Staff
          </Link>
        )}
      </div>

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

      <DataTable
        data={staff}
        columns={staffColumns}
        keyField="id"
        sortable
        loading={isLoading}
        emptyMessage="No staff found"
      />
    </div>
  )
}
