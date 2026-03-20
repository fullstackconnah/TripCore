import { useVehicles, useDeleteVehicle } from '@/api/hooks'
import { Link } from 'react-router-dom'
import { formatDateAu } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function VehiclesPage() {
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = { isActive: showArchived ? 'false' : 'true' }
  const { data: vehicles = [], isLoading } = useVehicles(params)
  const deleteVehicle = useDeleteVehicle()

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (window.confirm(`Archive "${name}"? This can be undone from the Archived view.`)) {
      deleteVehicle.mutate(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{vehicles.length} vehicles</p>
        </div>
        {!showArchived && (
          <Link to="/vehicles/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 transition-all shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> New Vehicle
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v: any) => (
            <div key={v.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{v.vehicleName}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] font-mono">{v.registration || 'No rego'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{v.isActive ? 'Active' : 'Inactive'}</span>
                  <Link to={`/vehicles/${v.id}/edit`} className="p-1.5 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors" title="Edit" onClick={e => e.stopPropagation()}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                  {!showArchived && (
                    <button onClick={(e) => handleDelete(e, v.id, v.vehicleName)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-muted-foreground)] hover:text-red-400 transition-colors" title="Archive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
                <p>🚐 {v.vehicleType} · {v.isInternal ? 'Internal' : 'External'}</p>
                <div className="flex gap-4">
                  <span>💺 {v.totalSeats} seats</span>
                  <span>♿ {v.wheelchairPositions} positions</span>
                </div>
                {(v.serviceDueDate || v.registrationDueDate) && (
                  <div className="pt-2 border-t border-[var(--color-border)] text-xs">
                    {v.serviceDueDate && <p>Service due: {formatDateAu(v.serviceDueDate)}</p>}
                    {v.registrationDueDate && <p>Rego due: {formatDateAu(v.registrationDueDate)}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
