import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateIncident, useUpdateIncident, useIncident, useTrips, useStaff, useParticipants } from '@/api/hooks'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

const incidentSchema = z.object({
  tripInstanceId: z.string().min(1, 'Trip is required'),
  incidentType: z.string().min(1, 'Incident type is required'),
  severity: z.string().min(1, 'Severity is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  reportedByStaffId: z.string().min(1, 'Reporter is required'),
  incidentDateTime: z.string().min(1, 'Date/time is required'),
  location: z.string().optional(),
  participantBookingId: z.string().optional(),
  involvedParticipantId: z.string().optional(),
  involvedStaffId: z.string().optional(),
  immediateActionsTaken: z.string().optional(),
  wereEmergencyServicesCalled: z.boolean().optional(),
  emergencyServicesDetails: z.string().optional(),
  witnessNames: z.string().optional(),
  witnessStatements: z.string().optional(),
  // Edit-only fields
  status: z.string().optional(),
  qscReportingStatus: z.string().optional(),
  qscReferenceNumber: z.string().optional(),
  qscReportedAt: z.string().optional(),
  reviewedByStaffId: z.string().optional(),
  reviewNotes: z.string().optional(),
  correctiveActions: z.string().optional(),
  familyNotified: z.boolean().optional(),
  familyNotifiedAt: z.string().optional(),
  supportCoordinatorNotified: z.boolean().optional(),
  supportCoordinatorNotifiedAt: z.string().optional(),
})

type IncidentFormData = z.infer<typeof incidentSchema>

const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition-shadow'
const labelClass = 'block text-sm font-medium mb-1.5 text-[var(--color-muted-foreground)]'

export default function IncidentCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()
  const mutation = isEdit ? updateIncident : createIncident
  const { data: trips = [] } = useTrips()
  const { data: staff = [] } = useStaff()
  const { data: participants = [] } = useParticipants()
  const { data: existingIncident } = useIncident(id)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      severity: 'Medium',
      incidentType: 'Other',
      status: 'Draft',
      qscReportingStatus: 'NotRequired',
      wereEmergencyServicesCalled: false,
      familyNotified: false,
      supportCoordinatorNotified: false,
    },
  })

  const wereEmergencyCalled = useWatch({ control, name: 'wereEmergencyServicesCalled' })
  const familyNotified = useWatch({ control, name: 'familyNotified' })
  const supportCoordinatorNotified = useWatch({ control, name: 'supportCoordinatorNotified' })

  useEffect(() => {
    if (isEdit && existingIncident) {
      const i = existingIncident
      reset({
        tripInstanceId: i.tripInstanceId ?? '',
        incidentType: i.incidentType ?? 'Other',
        severity: i.severity ?? 'Medium',
        title: i.title ?? '',
        description: i.description ?? '',
        reportedByStaffId: i.reportedByStaffId ?? '',
        incidentDateTime: i.incidentDateTime ? i.incidentDateTime.slice(0, 16) : '',
        location: i.location ?? '',
        participantBookingId: i.participantBookingId ?? '',
        involvedParticipantId: i.involvedParticipantId ?? '',
        involvedStaffId: i.involvedStaffId ?? '',
        immediateActionsTaken: i.immediateActionsTaken ?? '',
        wereEmergencyServicesCalled: i.wereEmergencyServicesCalled ?? false,
        emergencyServicesDetails: i.emergencyServicesDetails ?? '',
        witnessNames: i.witnessNames ?? '',
        witnessStatements: i.witnessStatements ?? '',
        status: i.status ?? 'Draft',
        qscReportingStatus: i.qscReportingStatus ?? 'NotRequired',
        qscReferenceNumber: i.qscReferenceNumber ?? '',
        qscReportedAt: i.qscReportedAt ? i.qscReportedAt.slice(0, 16) : '',
        reviewedByStaffId: i.reviewedByStaffId ?? '',
        reviewNotes: i.reviewNotes ?? '',
        correctiveActions: i.correctiveActions ?? '',
        familyNotified: i.familyNotified ?? false,
        familyNotifiedAt: i.familyNotifiedAt ? i.familyNotifiedAt.slice(0, 16) : '',
        supportCoordinatorNotified: i.supportCoordinatorNotified ?? false,
        supportCoordinatorNotifiedAt: i.supportCoordinatorNotifiedAt ? i.supportCoordinatorNotifiedAt.slice(0, 16) : '',
      })
    }
  }, [id, isEdit, existingIncident, reset])

  const onSubmit = async (data: IncidentFormData) => {
    const payload: any = { ...data }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    }
    // Ensure booleans stay booleans
    payload.wereEmergencyServicesCalled = data.wereEmergencyServicesCalled ?? false
    payload.familyNotified = data.familyNotified ?? false
    payload.supportCoordinatorNotified = data.supportCoordinatorNotified ?? false

    try {
      if (isEdit) {
        const res = await updateIncident.mutateAsync({ id, data: payload })
        if (res.success) navigate('/incidents')
      } else {
        const res = await createIncident.mutateAsync(payload)
        if (res.success) navigate('/incidents')
      }
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/incidents" className="p-2 rounded-lg hover:bg-[var(--color-accent)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">{isEdit ? 'Edit Incident Report' : 'Report New Incident'}</h1>
      </div>

      {mutation.isError && (
        <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm border border-[var(--color-destructive)]/20">
          Failed to {isEdit ? 'update' : 'create'} incident report. Please check your input and try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
        {/* Incident Details */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Incident Details</h3>

          <div>
            <label className={labelClass}>Title *</label>
            <input {...register('title')} className={inputClass} placeholder="Brief incident summary" autoFocus />
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
            <label className={labelClass}>Incident Type *</label>
            <select {...register('incidentType')} className={inputClass}>
              <option value="Injury">Injury</option>
              <option value="Illness">Illness</option>
              <option value="MedicationError">Medication Error</option>
              <option value="BehaviourOfConcern">Behaviour of Concern</option>
              <option value="RestrictivePracticeUse">Restrictive Practice Use</option>
              <option value="PropertyDamage">Property Damage</option>
              <option value="MissingPerson">Missing Person</option>
              <option value="Abuse">Abuse</option>
              <option value="Neglect">Neglect</option>
              <option value="Death">Death</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Severity *</label>
            <select {...register('severity')} className={inputClass}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Date & Time *</label>
            <input type="datetime-local" {...register('incidentDateTime')} className={inputClass} />
            {errors.incidentDateTime && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.incidentDateTime.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input {...register('location')} className={inputClass} placeholder="Where the incident occurred" />
          </div>
        </div>

        {/* People Involved */}
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">People Involved</h3>

          <div>
            <label className={labelClass}>Reported By *</label>
            <select {...register('reportedByStaffId')} className={inputClass}>
              <option value="">Select staff member...</option>
              {staff.map((s: any) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
            {errors.reportedByStaffId && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.reportedByStaffId.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Involved Participant</label>
            <select {...register('involvedParticipantId')} className={inputClass}>
              <option value="">None</option>
              {participants.map((p: any) => (
                <option key={p.id} value={p.id}>{p.fullName || `${p.firstName} ${p.lastName}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Involved Staff Member</label>
            <select {...register('involvedStaffId')} className={inputClass}>
              <option value="">None</option>
              {staff.map((s: any) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* What Happened */}
        <div className="md:col-span-2 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">What Happened</h3>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea {...register('description')} rows={5} className={inputClass} placeholder="Detailed description of the incident..." />
            {errors.description && <p className="text-xs text-[var(--color-destructive)] mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Immediate Actions Taken</label>
            <textarea {...register('immediateActionsTaken')} rows={3} className={inputClass} placeholder="What was done immediately in response..." />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" {...register('wereEmergencyServicesCalled')} id="emergencyServices" className="w-4 h-4 rounded border-[var(--color-border)]" />
            <label htmlFor="emergencyServices" className="text-sm font-medium text-[var(--color-muted-foreground)]">Were Emergency Services Called?</label>
          </div>

          {wereEmergencyCalled && (
            <div>
              <label className={labelClass}>Emergency Services Details</label>
              <textarea {...register('emergencyServicesDetails')} rows={2} className={inputClass} placeholder="Which services, response details..." />
            </div>
          )}
        </div>

        {/* Witnesses */}
        <div className="md:col-span-2 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">Witnesses</h3>

          <div>
            <label className={labelClass}>Witness Names</label>
            <input {...register('witnessNames')} className={inputClass} placeholder="Names of witnesses (comma-separated)" />
          </div>

          <div>
            <label className={labelClass}>Witness Statements</label>
            <textarea {...register('witnessStatements')} rows={3} className={inputClass} placeholder="Summary of witness accounts..." />
          </div>
        </div>

        {/* Review & Compliance (edit only) */}
        {isEdit && (
          <div className="md:col-span-2 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
            <h3 className="font-semibold">Review & Compliance</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select {...register('status')} className={inputClass}>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="UnderReview">Under Review</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>QSC Reporting Status</label>
                <select {...register('qscReportingStatus')} className={inputClass}>
                  <option value="NotRequired">Not Required</option>
                  <option value="Required">Required</option>
                  <option value="ReportedWithin24h">Reported Within 24h</option>
                  <option value="ReportedLate">Reported Late</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>QSC Reference Number</label>
                <input {...register('qscReferenceNumber')} className={inputClass} placeholder="QSC reference #" />
              </div>

              <div>
                <label className={labelClass}>QSC Reported At</label>
                <input type="datetime-local" {...register('qscReportedAt')} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Reviewed By</label>
                <select {...register('reviewedByStaffId')} className={inputClass}>
                  <option value="">Not reviewed</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Review Notes</label>
              <textarea {...register('reviewNotes')} rows={3} className={inputClass} placeholder="Notes from the reviewer..." />
            </div>

            <div>
              <label className={labelClass}>Corrective Actions</label>
              <textarea {...register('correctiveActions')} rows={3} className={inputClass} placeholder="Actions to prevent recurrence..." />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" {...register('familyNotified')} id="familyNotified" className="w-4 h-4 rounded border-[var(--color-border)]" />
                  <label htmlFor="familyNotified" className="text-sm font-medium text-[var(--color-muted-foreground)]">Family Notified</label>
                </div>
                {familyNotified && (
                  <div>
                    <label className={labelClass}>Family Notified At</label>
                    <input type="datetime-local" {...register('familyNotifiedAt')} className={inputClass} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" {...register('supportCoordinatorNotified')} id="scNotified" className="w-4 h-4 rounded border-[var(--color-border)]" />
                  <label htmlFor="scNotified" className="text-sm font-medium text-[var(--color-muted-foreground)]">Support Coordinator Notified</label>
                </div>
                {supportCoordinatorNotified && (
                  <div>
                    <label className={labelClass}>Support Coordinator Notified At</label>
                    <input type="datetime-local" {...register('supportCoordinatorNotifiedAt')} className={inputClass} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/incidents" className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20">
            {mutation.isPending ? (isEdit ? 'Saving...' : 'Submitting...') : (isEdit ? 'Save Changes' : 'Submit Incident Report')}
          </button>
        </div>
      </form>
    </div>
  )
}
