import { useTasks, useUpdateTask } from '@/api/hooks'
import { formatDateAu, getStatusColor } from '@/lib/utils'
import { useState } from 'react'
import { Filter, CheckCircle } from 'lucide-react'

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const params: Record<string, string> = {}
  if (statusFilter) params.status = statusFilter

  const { data: tasks = [], isLoading } = useTasks(params)
  const updateTask = useUpdateTask()

  const markComplete = async (task: any) => {
    await updateTask.mutateAsync({ id: task.id, data: { ...task, status: 'Completed', completedDate: new Date().toISOString().split('T')[0] } })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]">
            <option value="">All Statuses</option>
            <option value="NotStarted">Not Started</option>
            <option value="InProgress">In Progress</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? <div className="text-center py-12 text-[var(--color-muted-foreground)]">Loading...</div> : (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="w-10 p-3"></th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Task</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Trip</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Type</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Owner</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Due</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Priority</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {tasks.map((t: any) => (
                <tr key={t.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                  <td className="p-3">
                    {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                      <button onClick={() => markComplete(t)} className="p-1 rounded hover:bg-green-500/20 text-[var(--color-muted-foreground)] hover:text-green-400 transition-colors" title="Mark complete">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="p-3 font-medium">{t.title}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{t.tripName || '—'}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{t.taskType}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{t.ownerName || 'Unassigned'}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{formatDateAu(t.dueDate)}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'High' || t.priority === 'Urgent' ? 'badge-overdue' : 'badge-info'}`}>{t.priority}</span></td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(t.status)}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
