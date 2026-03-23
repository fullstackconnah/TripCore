import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateTrip, useStaff, useEventTemplates } from '@/api/hooks'
import { ArrowLeft } from 'lucide-react'

const tripSchema = z.object({
  tripName: z.string().min(1, 'Trip name is required'),
  tripCode: z.string().optional(),
  eventTemplateId: z.string().optional(),
  destination: z.string().optional(),
  region: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  durationDays: z.coerce.number().min(1, 'Duration must be at least 1'),
  bookingCutoffDate: z.string().optional(),
  status: z.string().optional(),
  leadCoordinatorId: z.string().optional(),
  minParticipants: z.coerce.number().optional(),
  maxParticipants: z.coerce.number().optional(),
  requiredWheelchairCapacity: z.coerce.number().optional(),
  requiredBeds: z.coerce.number().optional(),
  requiredBedrooms: z.coerce.number().optional(),
  minStaffRequired: z.coerce.number().optional(),
  notes: z.string().optional(),
})

type TripFormData = z.infer<typeof tripSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'

export default function TripCreatePage() {
  const navigate = useNavigate()
  const createTrip = useCreateTrip()
  const { data: staffList = [] } = useStaff()
  const { data: templates = [] } = useEventTemplates()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<z.input<typeof tripSchema>, any, TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: { durationDays: 1, status: 'Draft' },
  })

  const onTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value
    setValue('eventTemplateId', templateId)
    if (!templateId) return
    const tpl = templates.find((t: any) => String(t.id) === templateId)
    if (tpl) {
      if (tpl.defaultDestination) setValue('destination', tpl.defaultDestination)
      if (tpl.defaultRegion) setValue('region', tpl.defaultRegion)
      if (tpl.defaultDurationDays) setValue('durationDays', tpl.defaultDurationDays)
    }
  }

  const onSubmit = async (data: TripFormData) => {
    const payload: any = { ...data }
    // Convert empty strings to null for optional fields
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    // Ensure numbers that are 0/NaN become null
    for (const key of ['minParticipants', 'maxParticipants', 'requiredWheelchairCapacity', 'requiredBeds', 'requiredBedrooms', 'minStaffRequired']) {
      if (!payload[key]) payload[key] = null
    }
    try {
      const res = await createTrip.mutateAsync(payload)
      if (res.success && res.data?.id) {
        navigate(`/trips/${res.data.id}`)
      }
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/trips" className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">Create New Trip</h1>
      </div>

      {createTrip.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to create trip. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Trip Details */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Trip Details</h3>

          <div>
            <label className={labelClass}>Trip Name *</label>
            <input {...register('tripName')} className={inputClass} placeholder="e.g. Beach Getaway 2026" autoFocus />
            {errors.tripName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.tripName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Trip Code</label>
            <input {...register('tripCode')} className={inputClass} placeholder="e.g. BG-2026-01" />
          </div>

          <div>
            <label className={labelClass}>Event Template</label>
            <select {...register('eventTemplateId')} onChange={onTemplateChange} className={inputClass}>
              <option value="">None</option>
              {templates.map((t: any) => <option key={t.id} value={t.id}>{t.templateName}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Destination</label>
            <input {...register('destination')} className={inputClass} placeholder="e.g. Gold Coast" />
          </div>

          <div>
            <label className={labelClass}>Region</label>
            <input {...register('region')} className={inputClass} placeholder="e.g. QLD" />
          </div>
        </div>

        {/* Dates */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Dates</h3>

          <div>
            <label className={labelClass}>Start Date *</label>
            <input type="date" {...register('startDate')} className={inputClass} />
            {errors.startDate && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.startDate.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Duration (Days) *</label>
            <input type="number" min={1} {...register('durationDays')} className={inputClass} />
            {errors.durationDays && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.durationDays.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Booking Cutoff Date</label>
            <input type="date" {...register('bookingCutoffDate')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select {...register('status')} className={inputClass}>
              <option value="Draft">Draft</option>
              <option value="Planning">Planning</option>
              <option value="OpenForBookings">Open For Bookings</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Lead Coordinator</label>
            <select {...register('leadCoordinatorId')} className={inputClass}>
              <option value="">None</option>
              {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
        </div>

        {/* Capacity & Requirements */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Capacity & Requirements</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Min Participants</label>
              <input type="number" min={0} {...register('minParticipants')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Max Participants</label>
              <input type="number" min={0} {...register('maxParticipants')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Wheelchair Capacity</label>
            <input type="number" min={0} {...register('requiredWheelchairCapacity')} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Required Beds</label>
              <input type="number" min={0} {...register('requiredBeds')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Required Bedrooms</label>
              <input type="number" min={0} {...register('requiredBedrooms')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Min Staff Required</label>
            <input type="number" min={0} {...register('minStaffRequired')} className={inputClass} />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Notes</h3>
          <textarea {...register('notes')} rows={6} className={inputClass} placeholder="Any additional notes..." />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/trips" className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={createTrip.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {createTrip.isPending ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  )
}
