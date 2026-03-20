import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateStaff, useUpdateStaff, useStaffDetail } from '@/api/hooks'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

const staffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().optional(),
  mobile: z.string().optional(),
  region: z.string().optional(),
  isDriverEligible: z.boolean().optional(),
  isFirstAidQualified: z.boolean().optional(),
  isMedicationCompetent: z.boolean().optional(),
  isManualHandlingCompetent: z.boolean().optional(),
  isOvernightEligible: z.boolean().optional(),
  notes: z.string().optional(),
})

type StaffFormData = z.infer<typeof staffSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'
const checkboxWrapperClass = 'flex items-center gap-3 py-1'
const checkboxLabelClass = 'text-sm text-[var(--color-foreground)]'

export default function StaffCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const { data: existing, isLoading: isLoadingExisting } = useStaffDetail(isEdit ? id : undefined)
  const mutation = isEdit ? updateStaff : createStaff

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: 'SupportWorker',
      isDriverEligible: false,
      isFirstAidQualified: false,
      isMedicationCompetent: false,
      isManualHandlingCompetent: false,
      isOvernightEligible: false,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        firstName: existing.firstName ?? '',
        lastName: existing.lastName ?? '',
        role: existing.role ?? 'SupportWorker',
        email: existing.email ?? '',
        mobile: existing.mobile ?? '',
        region: existing.region ?? '',
        isDriverEligible: existing.isDriverEligible ?? false,
        isFirstAidQualified: existing.isFirstAidQualified ?? false,
        isMedicationCompetent: existing.isMedicationCompetent ?? false,
        isManualHandlingCompetent: existing.isManualHandlingCompetent ?? false,
        isOvernightEligible: existing.isOvernightEligible ?? false,
        notes: existing.notes ?? '',
      })
    }
  }, [existing, reset])

  const onSubmit = async (data: StaffFormData) => {
    const payload: any = { ...data }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    try {
      if (isEdit) {
        const res = await updateStaff.mutateAsync({ id, data: { ...payload, isActive: existing?.isActive ?? true } })
        if (res.success) navigate('/staff')
      } else {
        const res = await createStaff.mutateAsync(payload)
        if (res.success) navigate('/staff')
      }
    } catch {
      // error handled by mutation state
    }
  }

  if (isEdit && isLoadingExisting) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/staff" className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Staff Member' : 'New Staff Member'}</h1>
      </div>

      {mutation.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to {isEdit ? 'update' : 'create'} staff member. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Personal Information</h3>

          <div>
            <label className={labelClass}>First Name *</label>
            <input {...register('firstName')} className={inputClass} placeholder="e.g. Sarah" autoFocus />
            {errors.firstName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Last Name *</label>
            <input {...register('lastName')} className={inputClass} placeholder="e.g. Mitchell" />
            {errors.lastName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Role *</label>
            <select {...register('role')} className={inputClass}>
              <option value="SupportWorker">Support Worker</option>
              <option value="SeniorSupportWorker">Senior Support Worker</option>
              <option value="Coordinator">Coordinator</option>
              <option value="TeamLeader">Team Leader</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Region</label>
            <input {...register('region')} className={inputClass} placeholder="e.g. South East QLD" />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Contact</h3>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" {...register('email')} className={inputClass} placeholder="e.g. sarah@tripcore.com.au" />
          </div>

          <div>
            <label className={labelClass}>Mobile</label>
            <input {...register('mobile')} className={inputClass} placeholder="e.g. 0412 345 678" />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea {...register('notes')} rows={4} className={inputClass} placeholder="Any additional notes..." />
          </div>
        </div>

        {/* Qualifications */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4 md:col-span-2">
          <h3 className="font-semibold">Qualifications & Eligibility</h3>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className={checkboxWrapperClass}>
              <input type="checkbox" {...register('isDriverEligible')} id="isDriverEligible" className="w-4 h-4 rounded border-[var(--color-border)]" />
              <label htmlFor="isDriverEligible" className={checkboxLabelClass}>Driver Eligible</label>
            </div>

            <div className={checkboxWrapperClass}>
              <input type="checkbox" {...register('isFirstAidQualified')} id="isFirstAidQualified" className="w-4 h-4 rounded border-[var(--color-border)]" />
              <label htmlFor="isFirstAidQualified" className={checkboxLabelClass}>First Aid Qualified</label>
            </div>

            <div className={checkboxWrapperClass}>
              <input type="checkbox" {...register('isMedicationCompetent')} id="isMedicationCompetent" className="w-4 h-4 rounded border-[var(--color-border)]" />
              <label htmlFor="isMedicationCompetent" className={checkboxLabelClass}>Medication Competent</label>
            </div>

            <div className={checkboxWrapperClass}>
              <input type="checkbox" {...register('isManualHandlingCompetent')} id="isManualHandlingCompetent" className="w-4 h-4 rounded border-[var(--color-border)]" />
              <label htmlFor="isManualHandlingCompetent" className={checkboxLabelClass}>Manual Handling Competent</label>
            </div>

            <div className={checkboxWrapperClass}>
              <input type="checkbox" {...register('isOvernightEligible')} id="isOvernightEligible" className="w-4 h-4 rounded border-[var(--color-border)]" />
              <label htmlFor="isOvernightEligible" className={checkboxLabelClass}>Overnight Eligible</label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/staff" className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {mutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Staff Member')}
          </button>
        </div>
      </form>
    </div>
  )
}
