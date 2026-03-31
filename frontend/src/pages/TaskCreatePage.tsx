import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateTask, useUpdateTask, useTrips, useStaff } from '@/api/hooks'
import { apiClient } from '@/api/client'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

const taskSchema = z.object({
  tripInstanceId: z.string().min(1, 'Trip is required'),
  taskType: z.string().min(1, 'Task type is required'),
  title: z.string().min(1, 'Title is required'),
  ownerId: z.string().optional(),
  priority: z.string().min(1),
  dueDate: z.string().optional(),
  status: z.string().optional(),
  completedDate: z.string().optional(),
  notes: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'

export default function TaskCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const mutation = isEdit ? updateTask : createTask
  const { data: trips = [] } = useTrips()
  const { data: staff = [] } = useStaff()

  // For edit mode, we load the task from the tasks list since there's no single-task endpoint
  // We'll pass task data via navigation state instead

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'Medium',
      taskType: 'Other',
      status: 'NotStarted',
    },
  })

  // For edit mode: load task data from tasks list
  useEffect(() => {
    if (isEdit) {
      // Fetch tasks and find the one we need
      const fetchTask = async () => {
        try {
          const res = await apiClient.get(`/tasks?status=`)
          const tasks = res.data?.data ?? []
          const task = tasks.find((t: any) => t.id === id)
          if (task) {
            reset({
              tripInstanceId: task.tripInstanceId ?? '',
              taskType: task.taskType ?? 'Other',
              title: task.title ?? '',
              ownerId: task.ownerId ?? '',
              priority: task.priority ?? 'Medium',
              dueDate: task.dueDate ?? '',
              status: task.status ?? 'NotStarted',
              completedDate: task.completedDate ?? '',
              notes: task.notes ?? '',
            })
          }
        } catch {
          // ignore
        }
      }
      fetchTask()
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: TaskFormData) => {
    const payload: any = { ...data }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    try {
      if (isEdit) {
        const res = await updateTask.mutateAsync({ id, data: payload })
        if (res.success) navigate('/tasks')
      } else {
        const res = await createTask.mutateAsync(payload)
        if (res.success) navigate('/tasks')
      }
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/tasks" className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">{isEdit ? 'Edit Task' : 'New Task'}</h1>
      </div>

      {mutation.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to {isEdit ? 'update' : 'create'} task. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Task Details */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Task Details</h3>

          <div>
            <label className={labelClass}>Title *</label>
            <input {...register('title')} className={inputClass} placeholder="e.g. Confirm accommodation booking" autoFocus />
            {errors.title && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Trip *</label>
            <select {...register('tripInstanceId')} className={inputClass}>
              <option value="">Select a trip...</option>
              {trips.map((t: any) => (
                <option key={t.id} value={t.id}>{t.tripName}</option>
              ))}
            </select>
            {errors.tripInstanceId && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.tripInstanceId.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Task Type *</label>
            <select {...register('taskType')} className={inputClass}>
              <option value="AccommodationRequest">Accommodation Request</option>
              <option value="AccommodationConfirmation">Accommodation Confirmation</option>
              <option value="VehicleRequest">Vehicle Request</option>
              <option value="VehicleConfirmation">Vehicle Confirmation</option>
              <option value="ParticipantConfirmation">Participant Confirmation</option>
              <option value="FamilyContact">Family Contact</option>
              <option value="InvoiceOop">Invoice / OOP</option>
              <option value="StaffingAllocation">Staffing Allocation</option>
              <option value="RiskReview">Risk Review</option>
              <option value="MedicationCheck">Medication Check</option>
              <option value="PreDeparture">Pre-Departure</option>
              <option value="PostTrip">Post-Trip</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea {...register('notes')} rows={3} className={inputClass} placeholder="Any additional details..." />
          </div>
        </div>

        {/* Assignment & Priority */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Assignment & Priority</h3>

          <div>
            <label className={labelClass}>Owner</label>
            <select {...register('ownerId')} className={inputClass}>
              <option value="">Unassigned</option>
              {staff.map((s: any) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Priority *</label>
            <select {...register('priority')} className={inputClass}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" {...register('dueDate')} className={inputClass} />
          </div>

          {isEdit && (
            <>
              <div>
                <label className={labelClass}>Status</label>
                <select {...register('status')} className={inputClass}>
                  <option value="NotStarted">Not Started</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Completed Date</label>
                <input type="date" {...register('completedDate')} className={inputClass} />
              </div>
            </>
          )}
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/tasks" className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {mutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      </form>
    </div>
  )
}
