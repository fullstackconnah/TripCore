import { useStaff, useDeleteStaff } from '@/api/hooks'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function StaffPage() {
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = { isActive: showArchived ? 'false' : 'true' }
  const { data: staff = [], isLoading } = useStaff(params)
  const deleteStaff = useDeleteStaff()

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (window.confirm(`Archive "${name}"? This can be undone from the Archived view.`)) {
      deleteStaff.mutate(id)
    }
  }

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

      {isLoading ? <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div> : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Name</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Role</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Region</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Driver</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">First Aid</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Meds</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Manual</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Overnight</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                <th className="w-20 p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {staff.map((s: any) => (
                <tr key={s.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                  <td className="p-3 font-medium">{s.fullName}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{s.role}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{s.region || '—'}</td>
                  <td className="p-3 text-center">{s.isDriverEligible ? '✅' : ''}</td>
                  <td className="p-3 text-center">{s.isFirstAidQualified ? '✅' : ''}</td>
                  <td className="p-3 text-center">{s.isMedicationCompetent ? '✅' : ''}</td>
                  <td className="p-3 text-center">{s.isManualHandlingCompetent ? '✅' : ''}</td>
                  <td className="p-3 text-center">{s.isOvernightEligible ? '✅' : ''}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/staff/${s.id}/edit`} className="p-1.5 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors inline-block" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      {!showArchived && (
                        <button onClick={(e) => handleDelete(e, s.id, s.fullName)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-muted-foreground)] hover:text-red-400 transition-colors" title="Archive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
