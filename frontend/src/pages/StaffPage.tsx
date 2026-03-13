import { useStaff } from '@/api/hooks'

export default function StaffPage() {
  const { data: staff = [], isLoading } = useStaff()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Staff</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{staff.length} staff members</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
