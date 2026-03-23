import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateVehicle, useUpdateVehicle, useVehicleDetail } from '@/api/hooks'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

const vehicleSchema = z.object({
  vehicleName: z.string().min(1, 'Vehicle name is required'),
  registration: z.string().optional(),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  totalSeats: z.string().min(1, 'Total seats is required'),
  wheelchairPositions: z.string(),
  rampHoistDetails: z.string().optional(),
  driverRequirements: z.string().optional(),
  isInternal: z.boolean().optional(),
  serviceDueDate: z.string().optional(),
  registrationDueDate: z.string().optional(),
  notes: z.string().optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'
const checkboxWrapperClass = 'flex items-center gap-3 py-1'
const checkboxLabelClass = 'text-sm text-[var(--color-foreground)]'

export default function VehicleCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const { data: existing, isLoading: isLoadingExisting } = useVehicleDetail(isEdit ? id : undefined)
  const mutation = isEdit ? updateVehicle : createVehicle

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleType: 'Van',
      totalSeats: '0',
      wheelchairPositions: '0',
      isInternal: true,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        vehicleName: existing.vehicleName ?? '',
        registration: existing.registration ?? '',
        vehicleType: existing.vehicleType ?? 'Van',
        totalSeats: String(existing.totalSeats ?? 0),
        wheelchairPositions: String(existing.wheelchairPositions ?? 0),
        rampHoistDetails: existing.rampHoistDetails ?? '',
        driverRequirements: existing.driverRequirements ?? '',
        isInternal: existing.isInternal ?? true,
        serviceDueDate: existing.serviceDueDate ?? '',
        registrationDueDate: existing.registrationDueDate ?? '',
        notes: existing.notes ?? '',
      })
    }
  }, [existing, reset])

  const onSubmit = async (data: VehicleFormData) => {
    const payload: any = { ...data }
    payload.totalSeats = Number(payload.totalSeats) || 0
    payload.wheelchairPositions = Number(payload.wheelchairPositions) || 0
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    try {
      if (isEdit) {
        const res = await updateVehicle.mutateAsync({ id, data: { ...payload, isActive: existing?.isActive ?? true } })
        if (res.success) navigate('/vehicles')
      } else {
        const res = await createVehicle.mutateAsync(payload)
        if (res.success) navigate('/vehicles')
      }
    } catch {
      // error handled by mutation state
    }
  }

  if (isEdit && isLoadingExisting) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/vehicles" className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">{isEdit ? 'Edit Vehicle' : 'New Vehicle'}</h1>
      </div>

      {mutation.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to {isEdit ? 'update' : 'create'} vehicle. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Vehicle Information */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Vehicle Information</h3>

          <div>
            <label className={labelClass}>Vehicle Name *</label>
            <input {...register('vehicleName')} className={inputClass} placeholder="e.g. Blue Van 1" autoFocus />
            {errors.vehicleName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.vehicleName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Registration</label>
            <input {...register('registration')} className={inputClass} placeholder="e.g. ABC-123" />
          </div>

          <div>
            <label className={labelClass}>Vehicle Type *</label>
            <select {...register('vehicleType')} className={inputClass}>
              <option value="Car">Car</option>
              <option value="Van">Van</option>
              <option value="Bus">Bus</option>
              <option value="MiniBus">Mini Bus</option>
              <option value="AccessibleVan">Accessible Van</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('isInternal')} id="isInternal" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="isInternal" className={checkboxLabelClass}>Internal Vehicle</label>
          </div>
        </div>

        {/* Capacity & Accessibility */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Capacity & Accessibility</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Total Seats *</label>
              <input type="number" min="0" {...register('totalSeats')} className={inputClass} />
              {errors.totalSeats && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.totalSeats.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Wheelchair Positions</label>
              <input type="number" min="0" {...register('wheelchairPositions')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Ramp / Hoist Details</label>
            <textarea {...register('rampHoistDetails')} rows={2} className={inputClass} placeholder="Ramp or hoist specifications..." />
          </div>

          <div>
            <label className={labelClass}>Driver Requirements</label>
            <textarea {...register('driverRequirements')} rows={2} className={inputClass} placeholder="e.g. LR licence required" />
          </div>
        </div>

        {/* Dates & Notes */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4 md:col-span-2">
          <h3 className="font-semibold">Service & Notes</h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Service Due Date</label>
              <input type="date" {...register('serviceDueDate')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Registration Due Date</label>
              <input type="date" {...register('registrationDueDate')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea {...register('notes')} rows={3} className={inputClass} placeholder="Any additional notes..." />
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/vehicles" className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {mutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Vehicle')}
          </button>
        </div>
      </form>
    </div>
  )
}
