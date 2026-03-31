import { useTasks, useUpdateTask, useDeleteTask } from '@/api/hooks'
import { DataTable, type Column } from '@/components/DataTable'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Filter, CheckCircle, Plus, Pencil, Trash2, ArchiveRestore } from 'lucide-react'

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const params: Record<string, string> = {}
  if (showArchived) {
    params.status = 'Cancelled'
  } else if (statusFilter) {
    params.status = statusFilter
  }

  const { data: tasks = [], isLoading } = useTasks(params)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const markComplete = async (e: React.MouseEvent, task: any) => {
    e.stopPropagation()
    await updateTask.mutateAsync({ id: task.id, data: { ...task, status: 'Completed', completedDate: new Date().toISOString().split('T')[0] } })
  }

  const handleRestore = (e: React.MouseEvent, t: any) => {
    e.stopPropagation()
    if (window.confirm(`Restore "${t.title}"?`)) {
      updateTask.mutate({ id: t.id, data: { ...t, status: 'NotStarted' } })
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    if (window.confirm(`Archive "${title}"? This can be undone from the Archived view.`)) {
      deleteTask.mutate(id)
    }
  }

  const taskColumns: Column<any>[] = [
    {
      key: 'checkbox',
      header: '',
      hidden: showArchived,
      render: (t) => t.status !== 'Completed' && t.status !== 'Cancelled' ? (
        <button onClick={(e) => markComplete(e, t)} className="p-1 rounded hover:bg-green-500/20 text-[var(--color-muted-foreground)] hover:text-green-400 transition-colors" title="Mark complete">
          <CheckCircle className="w-4 h-4" />
        </button>
      ) : null,
    },
    { key: 'title', header: 'Task', sortable: true, className: 'font-medium' },
    { key: 'tripName', header: 'Trip', sortable: true },
    { key: 'taskType', header: 'Type', sortable: true },
    { key: 'ownerName', header: 'Owner', sortable: true },
    { key: 'dueDate', header: 'Due', type: 'date', sortable: true },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'High' || t.priority === 'Urgent' ? 'badge-overdue' : 'badge-info'}`}>{t.priority}</span>,
    },
    { key: 'status', header: 'Status', type: 'badge', sortable: true },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <div className="flex items-center gap-1">
          <Link to={`/tasks/${t.id}/edit`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors inline-block" title="Edit">
            <Pencil className="w-4 h-4" />
          </Link>
          {showArchived ? (
            <button onClick={(e) => handleRestore(e, t)}
              className="p-1.5 rounded hover:bg-green-500/20 text-[var(--color-muted-foreground)] hover:text-green-400 transition-colors" title="Restore">
              <ArchiveRestore className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={(e) => handleDelete(e, t.id, t.title)}
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
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        {!showArchived && (
          <Link to="/tasks/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary)]/90 transition-all shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> New Task
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
        {!showArchived && (
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
        )}
      </div>

      <DataTable
        data={tasks}
        columns={taskColumns}
        keyField="id"
        sortable
        loading={isLoading}
        emptyMessage="No tasks found"
      />
    </div>
  )
}
