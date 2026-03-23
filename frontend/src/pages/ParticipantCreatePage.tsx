import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateParticipant, useUpdateParticipant, useParticipant } from '@/api/hooks'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

const participantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  ndisNumber: z.string().optional(),
  planType: z.string().min(1),
  region: z.string().optional(),
  fundingOrganisation: z.string().optional(),
  isRepeatClient: z.boolean().optional(),
  wheelchairRequired: z.boolean().optional(),
  isHighSupport: z.boolean().optional(),
  requiresOvernightSupport: z.boolean().optional(),
  hasRestrictivePracticeFlag: z.boolean().optional(),
  supportRatio: z.string().min(1),
  mobilityNotes: z.string().optional(),
  equipmentRequirements: z.string().optional(),
  transportRequirements: z.string().optional(),
  medicalSummary: z.string().optional(),
  behaviourRiskSummary: z.string().optional(),
  notes: z.string().optional(),
})

type ParticipantFormData = z.infer<typeof participantSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'
const checkboxWrapperClass = 'flex items-center gap-3 py-1'
const checkboxLabelClass = 'text-sm text-[var(--color-foreground)]'

export default function ParticipantCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const createParticipant = useCreateParticipant()
  const updateParticipant = useUpdateParticipant()
  const { data: existing, isLoading: isLoadingExisting } = useParticipant(isEdit ? id : undefined)
  const mutation = isEdit ? updateParticipant : createParticipant

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      planType: 'SelfManaged',
      supportRatio: 'SharedSupport',
      isRepeatClient: false,
      wheelchairRequired: false,
      isHighSupport: false,
      requiresOvernightSupport: false,
      hasRestrictivePracticeFlag: false,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        firstName: existing.firstName ?? '',
        lastName: existing.lastName ?? '',
        preferredName: existing.preferredName ?? '',
        dateOfBirth: existing.dateOfBirth ? existing.dateOfBirth.split('T')[0] : '',
        ndisNumber: existing.ndisNumber ?? '',
        planType: existing.planType ?? 'SelfManaged',
        region: existing.region ?? '',
        fundingOrganisation: existing.fundingOrganisation ?? '',
        isRepeatClient: existing.isRepeatClient ?? false,
        wheelchairRequired: existing.wheelchairRequired ?? false,
        isHighSupport: existing.isHighSupport ?? false,
        requiresOvernightSupport: existing.requiresOvernightSupport ?? false,
        hasRestrictivePracticeFlag: existing.hasRestrictivePracticeFlag ?? false,
        supportRatio: existing.supportRatio ?? 'SharedSupport',
        mobilityNotes: existing.mobilityNotes ?? '',
        equipmentRequirements: existing.equipmentRequirements ?? '',
        transportRequirements: existing.transportRequirements ?? '',
        medicalSummary: existing.medicalSummary ?? '',
        behaviourRiskSummary: existing.behaviourRiskSummary ?? '',
        notes: existing.notes ?? '',
      })
    }
  }, [existing, reset])

  const onSubmit = async (data: ParticipantFormData) => {
    const payload: any = { ...data }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    try {
      if (isEdit) {
        const res = await updateParticipant.mutateAsync({ id, data: { ...payload, isActive: existing?.isActive ?? true } })
        if (res.success) navigate(`/participants/${id}`)
      } else {
        const res = await createParticipant.mutateAsync(payload)
        if (res.success && res.data?.id) navigate(`/participants/${res.data.id}`)
      }
    } catch {
      // error handled by mutation state
    }
  }

  if (isEdit && isLoadingExisting) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={isEdit ? `/participants/${id}` : '/participants'} className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">{isEdit ? 'Edit Participant' : 'Create New Participant'}</h1>
      </div>

      {mutation.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to {isEdit ? 'update' : 'create'} participant. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Personal Information</h3>

          <div>
            <label className={labelClass}>First Name *</label>
            <input {...register('firstName')} className={inputClass} placeholder="e.g. John" autoFocus />
            {errors.firstName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Last Name *</label>
            <input {...register('lastName')} className={inputClass} placeholder="e.g. Smith" />
            {errors.lastName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Preferred Name</label>
            <input {...register('preferredName')} className={inputClass} placeholder="e.g. Johnny" />
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" {...register('dateOfBirth')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>NDIS Number</label>
            <input {...register('ndisNumber')} className={inputClass} placeholder="e.g. 431234567" />
          </div>
        </div>

        {/* Plan & Region */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Plan & Region</h3>

          <div>
            <label className={labelClass}>Plan Type *</label>
            <select {...register('planType')} className={inputClass}>
              <option value="SelfManaged">Self Managed</option>
              <option value="PlanManaged">Plan Managed</option>
              <option value="AgencyManaged">Agency Managed</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Region</label>
            <input {...register('region')} className={inputClass} placeholder="e.g. QLD" />
          </div>

          <div>
            <label className={labelClass}>Funding Organisation</label>
            <input {...register('fundingOrganisation')} className={inputClass} placeholder="e.g. Plan Partners" />
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('isRepeatClient')} id="isRepeatClient" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="isRepeatClient" className={checkboxLabelClass}>Repeat Client</label>
          </div>
        </div>

        {/* Support Needs */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Support Needs</h3>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('wheelchairRequired')} id="wheelchairRequired" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="wheelchairRequired" className={checkboxLabelClass}>Wheelchair Required</label>
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('isHighSupport')} id="isHighSupport" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="isHighSupport" className={checkboxLabelClass}>High Support</label>
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('requiresOvernightSupport')} id="requiresOvernightSupport" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="requiresOvernightSupport" className={checkboxLabelClass}>Requires Overnight Support</label>
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('hasRestrictivePracticeFlag')} id="hasRestrictivePracticeFlag" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="hasRestrictivePracticeFlag" className={checkboxLabelClass}>Restrictive Practice Flag</label>
          </div>

          <div>
            <label className={labelClass}>Support Ratio *</label>
            <select {...register('supportRatio')} className={inputClass}>
              <option value="SharedSupport">Shared Support</option>
              <option value="OneToOne">1:1</option>
              <option value="OneToTwo">1:2</option>
              <option value="TwoToOne">2:1</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Notes & Requirements */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Notes & Requirements</h3>

          <div>
            <label className={labelClass}>Mobility Notes</label>
            <textarea {...register('mobilityNotes')} rows={2} className={inputClass} placeholder="Any mobility considerations..." />
          </div>

          <div>
            <label className={labelClass}>Equipment Requirements</label>
            <textarea {...register('equipmentRequirements')} rows={2} className={inputClass} placeholder="Required equipment..." />
          </div>

          <div>
            <label className={labelClass}>Transport Requirements</label>
            <textarea {...register('transportRequirements')} rows={2} className={inputClass} placeholder="Transport needs..." />
          </div>

          <div>
            <label className={labelClass}>Medical Summary</label>
            <textarea {...register('medicalSummary')} rows={2} className={inputClass} placeholder="Medical information..." />
          </div>

          <div>
            <label className={labelClass}>Behaviour Risk Summary</label>
            <textarea {...register('behaviourRiskSummary')} rows={2} className={inputClass} placeholder="Behaviour risk notes..." />
          </div>

          <div>
            <label className={labelClass}>General Notes</label>
            <textarea {...register('notes')} rows={2} className={inputClass} placeholder="Any additional notes..." />
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/participants" className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {mutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Participant')}
          </button>
        </div>
      </form>
    </div>
  )
}
