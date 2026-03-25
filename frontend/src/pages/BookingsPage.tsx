import { useBookings } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function BookingsPage() {
  const { data: bookings = [], isLoading, isError } = useBookings()

  if (isError) return (
    <div className="p-8 text-center text-red-600">Failed to load bookings. Please refresh the page.</div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
      </div>

      {isLoading ? <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div> : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Participant</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Trip</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Booking Date</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">🦽</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">High</th>
                <th className="text-center p-3 font-medium text-[var(--color-muted-foreground)]">Night</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                  <td className="p-3"><Link to={`/participants/${b.participantId}`} className="font-medium hover:text-[var(--color-primary)]">{b.participantName || '—'}</Link></td>
                  <td className="p-3"><Link to={`/trips/${b.tripInstanceId}`} className="hover:text-[var(--color-primary)]">{b.tripName || '—'}</Link></td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(b.bookingStatus)}`}>{b.bookingStatus}</span></td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{formatDateAu(b.bookingDate)}</td>
                  <td className="p-3 text-center">{b.wheelchairRequired ? '✅' : ''}</td>
                  <td className="p-3 text-center">{b.highSupportRequired ? '✅' : ''}</td>
                  <td className="p-3 text-center">{b.nightSupportRequired ? '✅' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
