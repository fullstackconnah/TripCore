import { useVehicles } from '@/api/hooks'
import { formatDateAu } from '@/lib/utils'

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading } = useVehicles()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{vehicles.length} vehicles</p>
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
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{v.isActive ? 'Active' : 'Inactive'}</span>
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
