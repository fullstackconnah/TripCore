import { useIncidents, useUpdateIncident, useDeleteIncident, useOverdueQscIncidents } from '@/api/hooks'
import { Link } from 'react-router-dom'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { useState } from 'react'
import { Filter, Plus, Pencil, Trash2, ArchiveRestore, AlertTriangle } from 'lucide-react'

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'Low': return 'badge-info'
    case 'Medium': return 'badge-pending'
    case 'High': return 'badge-overdue'
    case 'Critical': return 'badge-overdue'
    default: return 'badge-info'
  }
}

function getQscBadge(qscStatus: string, isOverdue: boolean) {
  if (qscStatus === 'NotRequired') return null
  if (isOverdue) return 'badge-overdue animate-pulse'
  if (qscStatus === 'ReportedWithin24h') return 'badge-confirmed'
  if (qscStatus === 'ReportedLate') return 'badge-pending'
  if (qscStatus === 'Required' || qscStatus === 'Pending') return 'badge-overdue'
  return 'badge-info'
}

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = {}
  if (showArchived) {
    params.status = 'Closed'
  } else {
    if (statusFilter) params.status = statusFilter
    if (severityFilter) params.severity = severityFilter
  }

  const { data: incidents = [], isLoading } = useIncidents(params)
  const updateIncident = useUpdateIncident()
  const deleteIncident = useDeleteIncident()
  const { data: overdueQsc = [] } = useOverdueQscIncidents()

  const handleRestore = (e: React.MouseEvent, incident: any) => {
    e.stopPropagation()
    if (window.confirm(`Restore "${incident.title}"?`)) {
      updateIncident.mutate({ id: incident.id, data: { ...incident, status: 'Draft', isActive: true } })
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    if (window.confirm(`Archive "${title}"? This can be undone from the Archived view.`)) {
      deleteIncident.mutate(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incident Reports</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</p>
        </div>
        {!showArchived && (
          <Link to="/incidents/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 transition-all shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Report Incident
          </Link>
        )}
      </div>

      {/* QSC Overdue Alert Banner */}
      {!showArchived && overdueQsc.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">{overdueQsc.length} incident{overdueQsc.length !== 1 ? 's' : ''} require QSC reporting — 24-hour deadline exceeded</p>
            <p className="text-xs mt-0.5 opacity-80">NDIS Quality and Safeguards Commission requires reportable incidents to be escalated within 24 hours.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
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
        {!showArchived && (
          <>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]">
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="UnderReview">Under Review</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="relative">
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]">
                <option value="">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </>
        )}
      </div>

      {isLoading ? <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div> : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Title</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Trip</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Type</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Severity</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Reported By</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Date</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">QSC</th>
                <th className="w-20 p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {incidents.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-[var(--color-muted-foreground)]">No incidents found</td></tr>
              ) : incidents.map((i: any) => (
                <tr key={i.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                  <td className="p-3 font-medium">{i.title}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{i.tripName || '\u2014'}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{i.incidentType}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(i.severity)}`}>{i.severity}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(i.status)}`}>{i.status}</span></td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{i.reportedByName || '\u2014'}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{formatDateAu(i.incidentDateTime)}</td>
                  <td className="p-3">
                    {i.qscReportingStatus === 'NotRequired' ? (
                      <span className="text-[var(--color-muted-foreground)]">{'\u2014'}</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getQscBadge(i.qscReportingStatus, i.isOverdue24h)}`}>
                        {i.isOverdue24h ? 'OVERDUE' : i.qscReportingStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/incidents/${i.id}/edit`} className="p-1.5 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors inline-block" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      {showArchived ? (
                        <button onClick={(e) => handleRestore(e, i)}
                          className="p-1.5 rounded hover:bg-green-500/20 text-[var(--color-muted-foreground)] hover:text-green-400 transition-colors" title="Restore">
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={(e) => handleDelete(e, i.id, i.title)}
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
