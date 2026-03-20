import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateAccommodation, useUpdateAccommodation, useAccommodationDetail } from '@/api/hooks'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

const accommodationSchema = z.object({
  propertyName: z.string().min(1, 'Property name is required'),
  providerOwner: z.string().optional(),
  location: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  isFullyModified: z.boolean().optional(),
  isSemiModified: z.boolean().optional(),
  isWheelchairAccessible: z.boolean().optional(),
  accessibilityNotes: z.string().optional(),
  bedroomCount: z.string().optional(),
  bedCount: z.string().optional(),
  maxCapacity: z.string().optional(),
  beddingConfiguration: z.string().optional(),
  hoistBathroomNotes: z.string().optional(),
  generalNotes: z.string().optional(),
})

type AccommodationFormData = z.infer<typeof accommodationSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'
const checkboxWrapperClass = 'flex items-center gap-3 py-1'
const checkboxLabelClass = 'text-sm text-[var(--color-foreground)]'

export default function AccommodationCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const createAccommodation = useCreateAccommodation()
  const updateAccommodation = useUpdateAccommodation()
  const { data: existing, isLoading: isLoadingExisting } = useAccommodationDetail(isEdit ? id : undefined)
  const mutation = isEdit ? updateAccommodation : createAccommodation

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccommodationFormData>({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      isFullyModified: false,
      isSemiModified: false,
      isWheelchairAccessible: false,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        propertyName: existing.propertyName ?? '',
        providerOwner: existing.providerOwner ?? '',
        location: existing.location ?? '',
        region: existing.region ?? '',
        address: existing.address ?? '',
        suburb: existing.suburb ?? '',
        state: existing.state ?? '',
        postcode: existing.postcode ?? '',
        contactPerson: existing.contactPerson ?? '',
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        mobile: existing.mobile ?? '',
        website: existing.website ?? '',
        isFullyModified: existing.isFullyModified ?? false,
        isSemiModified: existing.isSemiModified ?? false,
        isWheelchairAccessible: existing.isWheelchairAccessible ?? false,
        accessibilityNotes: existing.accessibilityNotes ?? '',
        bedroomCount: existing.bedroomCount ?? '',
        bedCount: existing.bedCount ?? '',
        maxCapacity: existing.maxCapacity ?? '',
        beddingConfiguration: existing.beddingConfiguration ?? '',
        hoistBathroomNotes: existing.hoistBathroomNotes ?? '',
        generalNotes: existing.generalNotes ?? '',
      })
    }
  }, [existing, reset])

  const onSubmit = async (data: AccommodationFormData) => {
    const payload: any = { ...data }
    // Convert numeric string fields
    for (const numField of ['bedroomCount', 'bedCount', 'maxCapacity']) {
      payload[numField] = payload[numField] ? Number(payload[numField]) : null
    }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    try {
      if (isEdit) {
        const res = await updateAccommodation.mutateAsync({ id, data: { ...payload, isActive: existing?.isActive ?? true } })
        if (res.success) navigate(`/accommodation/${id}`)
      } else {
        const res = await createAccommodation.mutateAsync(payload)
        if (res.success && res.data?.id) navigate(`/accommodation/${res.data.id}`)
      }
    } catch {
      // error handled by mutation state
    }
  }

  if (isEdit && isLoadingExisting) return <div className="flex items-center justify-center h-64 text-[var(--color-muted-foreground)]">Loading...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={isEdit ? `/accommodation/${id}` : '/accommodation'} className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Accommodation' : 'New Accommodation'}</h1>
      </div>

      {mutation.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to {isEdit ? 'update' : 'create'} accommodation. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Property Information */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Property Information</h3>

          <div>
            <label className={labelClass}>Property Name *</label>
            <input {...register('propertyName')} className={inputClass} placeholder="e.g. Sunrise Beach House" autoFocus />
            {errors.propertyName && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.propertyName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Provider / Owner</label>
            <input {...register('providerOwner')} className={inputClass} placeholder="e.g. Coastal Properties" />
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input {...register('location')} className={inputClass} placeholder="e.g. Gold Coast" />
          </div>

          <div>
            <label className={labelClass}>Region</label>
            <input {...register('region')} className={inputClass} placeholder="e.g. South East QLD" />
          </div>
        </div>

        {/* Address & Contact */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Address & Contact</h3>

          <div>
            <label className={labelClass}>Address</label>
            <input {...register('address')} className={inputClass} placeholder="e.g. 123 Ocean Drive" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Suburb</label>
              <input {...register('suburb')} className={inputClass} placeholder="e.g. Surfers Paradise" />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input {...register('state')} className={inputClass} placeholder="e.g. QLD" />
            </div>
            <div>
              <label className={labelClass}>Postcode</label>
              <input {...register('postcode')} className={inputClass} placeholder="e.g. 4217" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Contact Person</label>
            <input {...register('contactPerson')} className={inputClass} placeholder="e.g. Jane Smith" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" {...register('email')} className={inputClass} placeholder="e.g. jane@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input {...register('phone')} className={inputClass} placeholder="e.g. 07 1234 5678" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mobile</label>
              <input {...register('mobile')} className={inputClass} placeholder="e.g. 0412 345 678" />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input {...register('website')} className={inputClass} placeholder="e.g. https://..." />
            </div>
          </div>
        </div>

        {/* Capacity & Accessibility */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Capacity & Accessibility</h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Bedrooms</label>
              <input type="number" min="0" {...register('bedroomCount')} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Beds</label>
              <input type="number" min="0" {...register('bedCount')} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Max Capacity</label>
              <input type="number" min="0" {...register('maxCapacity')} className={inputClass} placeholder="0" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bedding Configuration</label>
            <input {...register('beddingConfiguration')} className={inputClass} placeholder="e.g. 2 queen, 4 single" />
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('isWheelchairAccessible')} id="isWheelchairAccessible" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="isWheelchairAccessible" className={checkboxLabelClass}>Wheelchair Accessible</label>
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('isFullyModified')} id="isFullyModified" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="isFullyModified" className={checkboxLabelClass}>Fully Modified</label>
          </div>

          <div className={checkboxWrapperClass}>
            <input type="checkbox" {...register('isSemiModified')} id="isSemiModified" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="isSemiModified" className={checkboxLabelClass}>Semi Modified</label>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Notes</h3>

          <div>
            <label className={labelClass}>Accessibility Notes</label>
            <textarea {...register('accessibilityNotes')} rows={2} className={inputClass} placeholder="Accessibility details..." />
          </div>

          <div>
            <label className={labelClass}>Hoist / Bathroom Notes</label>
            <textarea {...register('hoistBathroomNotes')} rows={2} className={inputClass} placeholder="Hoist or bathroom details..." />
          </div>

          <div>
            <label className={labelClass}>General Notes</label>
            <textarea {...register('generalNotes')} rows={3} className={inputClass} placeholder="Any additional notes..." />
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to={isEdit ? `/accommodation/${id}` : '/accommodation'} className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {mutation.isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Accommodation')}
          </button>
        </div>
      </form>
    </div>
  )
}
