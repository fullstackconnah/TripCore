import { useEventTemplates, useActivities, useSettings, useUpdateSettings, useProviderSettings, useUpsertProviderSettings, useSupportCatalogue, usePublicHolidays, useCreatePublicHoliday, useDeletePublicHoliday, useSyncHolidays } from '@/api/hooks'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Pencil } from 'lucide-react'
import TemplateFormPanel from '@/components/TemplateFormPanel'
import type { EventTemplateDto } from '@/api/types'
import type { AxiosError } from 'axios'

function QualificationSettingsTab() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [warningDays, setWarningDays] = useState<number>(30)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setWarningDays(settings.qualificationWarningDays)
  }, [settings])

  function handleSave() {
    updateSettings.mutate({ qualificationWarningDays: warningDays }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="font-semibold text-[var(--color-foreground)] mb-1">Qualification Warning Window</h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          Staff qualifications expiring within this window will appear as warnings on the
          Qualifications page and Dashboard.
        </p>
        <select
          value={warningDays}
          onChange={e => setWarningDays(Number(e.target.value))}
          className="w-full border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {[7, 14, 30, 60, 90].map(d => (
            <option key={d} value={d}>{d} days</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={updateSettings.isPending}
        className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {updateSettings.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'templates' | 'activities' | 'qualifications' | 'provider' | 'catalogue' | 'holidays'>('templates')
  const { data: templates = [] } = useEventTemplates()
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EventTemplateDto | undefined>(undefined)
  const { data: activities = [] } = useActivities()

  const tabs = [
    { key: 'templates' as const, label: 'Event Templates' },
    { key: 'activities' as const, label: 'Activity Library' },
    { key: 'qualifications' as const, label: 'Qualification Warnings' },
    { key: 'provider' as const, label: 'Provider Settings' },
    { key: 'catalogue' as const, label: 'Support Catalogue' },
    { key: 'holidays' as const, label: 'Public Holidays' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Manage event templates, activity library, and qualification settings
        </p>
      </div>

      <div className="flex gap-4 border-b border-[var(--color-border)]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingTemplate(undefined); setPanelOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              + New Template
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {templates.filter((t) => t.isActive).map((t) => (
              <div key={t.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{t.eventName}</h3>
                    <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{t.eventCode}</span>
                  </div>
                  <button
                    onClick={() => { setEditingTemplate(t); setPanelOpen(true) }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--color-accent)] transition-all"
                    title="Edit template"
                  >
                    <Pencil className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  </button>
                </div>
                <div className="text-sm text-[var(--color-muted-foreground)] space-y-1">
                  <p className="flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none">location_on</span> {t.defaultDestination || '—'} · {t.defaultRegion || '—'}</p>
                  {t.standardDurationDays && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none">schedule</span> {t.standardDurationDays} days</p>}
                  {t.preferredTimeOfYear && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-base leading-none">calendar_today</span> {t.preferredTimeOfYear}</p>}
                </div>
              </div>
            ))}
          </div>

          <TemplateFormPanel
            isOpen={panelOpen}
            onClose={() => { setPanelOpen(false); setEditingTemplate(undefined) }}
            template={editingTemplate}
          />
        </div>
      )}

      {tab === 'activities' && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Activity</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Category</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Location</th>
                <th className="text-left p-3 font-medium text-[var(--color-muted-foreground)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {activities.map((a: any) => (
                <tr key={a.id} className="hover:bg-[var(--color-accent)]/50 transition-colors">
                  <td className="p-3 font-medium">{a.activityName}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{a.category}</td>
                  <td className="p-3 text-[var(--color-muted-foreground)]">{a.location || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'qualifications' && <QualificationSettingsTab />}
      {tab === 'provider' && <ProviderSettingsTab />}
      {tab === 'catalogue' && <SupportCatalogueTab />}
      {tab === 'holidays' && <PublicHolidaysTab />}
    </div>
  )
}

function ProviderSettingsTab() {
  const { data: settings } = useProviderSettings()
  const upsert = useUpsertProviderSettings()
  const [form, setForm] = useState<any>({})
  const [init, setInit] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (settings && !init) { setForm(settings); setInit(true) }

  const inputClass = 'w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all'
  const labelClass = 'block text-xs font-medium text-[#43493a] mb-1'

  const f = (field: string) => ({
    value: form[field] ?? '',
    onChange: (e: any) => setForm((p: any) => ({ ...p, [field]: e.target.value })),
    className: inputClass,
  })

  function handleSave() {
    setError(null)
    upsert.mutate(form, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) },
      onError: (err: any) => {
        const status = err?.response?.status
        const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message
        if (status === 403) setError('Admin role is required to update provider settings. Ask an Admin to make this change.')
        else if (status === 400) setError(msg || 'Validation failed — check Registration Number, ABN, Organisation Name and Address are filled in.')
        else setError(msg || 'Failed to save. Please try again.')
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-semibold text-[#1b1c1a] mb-1">Organisation Details</h2>
        <p className="text-sm text-[#43493a] mb-4">Used on NDIS claims, BPR CSV files, and invoices.</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Registration Number</label><input {...f('registrationNumber')} /></div>
          <div><label className={labelClass}>ABN</label><input {...f('abn')} /></div>
          <div className="col-span-2"><label className={labelClass}>Organisation Name</label><input {...f('organisationName')} /></div>
          <div className="col-span-2"><label className={labelClass}>Address</label><input {...f('address')} /></div>
          <div>
            <label className={labelClass}>State</label>
            <select
              value={form.state ?? 'VIC'}
              onChange={e => setForm((p: any) => ({ ...p, state: e.target.value }))}
              className={inputClass}
            >
              {['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.gstRegistered ?? false} onChange={e => setForm((p: any) => ({ ...p, gstRegistered: e.target.checked }))} className="w-4 h-4 accent-[#396200]" id="gst" />
            <label htmlFor="gst" className="text-sm text-[#43493a]">GST Registered</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.isPaceProvider ?? false} onChange={e => setForm((p: any) => ({ ...p, isPaceProvider: e.target.checked }))} className="w-4 h-4 accent-[#396200]" id="pace" />
            <label htmlFor="pace" className="text-sm text-[#43493a]">PACE Provider <span className="text-xs text-[#43493a]/60">(16-col BPR CSV)</span></label>
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-[#1b1c1a] mb-4">Bank Details</h2>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={labelClass}>Account Name</label><input {...f('bankAccountName')} /></div>
          <div><label className={labelClass}>BSB</label><input {...f('bsb')} /></div>
          <div><label className={labelClass}>Account Number</label><input {...f('accountNumber')} /></div>
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-[#1b1c1a] mb-2">Invoice Footer Notes</h2>
        <textarea {...f('invoiceFooterNotes')} rows={3} className={inputClass + ' resize-none'} placeholder="e.g. All services delivered in accordance with the NDIS Code of Conduct..." />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}
      <button onClick={handleSave} disabled={upsert.isPending} className="px-6 py-2.5 bg-[#396200] text-white rounded-full font-semibold text-sm hover:bg-[#294800] transition-all disabled:opacity-50">
        {upsert.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}

function SupportCatalogueTab() {
  const { data: groups = [] } = useSupportCatalogue()
  const [importing, setImporting] = useState(false)
  const [previewStep, setPreviewStep] = useState<'upload' | 'preview' | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [version, setVersion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const qc = useQueryClient()

  const allItems = (groups as any[]).flatMap((g: any) => g.items ?? [])

  const dayTypeColor = (dt: string) => {
    switch(dt) {
      case 'Weekday': return 'bg-blue-100 text-blue-700'
      case 'Saturday': return 'bg-amber-100 text-amber-700'
      case 'Sunday': return 'bg-orange-100 text-orange-700'
      case 'PublicHoliday': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await apiClient.post('/support-catalogue/import/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPreview(data.data)
      setVersion(data.data?.detectedVersion || '')
      setPreviewStep('preview')
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleConfirm() {
    if (!preview) return
    setConfirming(true)
    try {
      await apiClient.post('/support-catalogue/import/confirm', { catalogueVersion: version, rows: preview.rows })
      qc.invalidateQueries({ queryKey: ['support-catalogue'] })
      setPreviewStep(null)
      setPreview(null)
      setImporting(false)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Confirm failed')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[#1b1c1a]">Support Catalogue</h2>
          <p className="text-sm text-[#43493a]">NDIS price limits for Category 04 — Group Access.</p>
        </div>
        <button onClick={() => { setImporting(true); setPreviewStep('upload') }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] transition-all">
          Import Catalogue
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f3ef]">
              <tr>
                {['Item Number', 'Description', 'Day Type', 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA', 'Remote', 'V.Remote', 'Effective From'].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-[#43493a] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3ef]">
              {allItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="p-3 font-mono text-xs">{item.itemNumber}</td>
                  <td className="p-3 text-[#43493a]">{item.description}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${dayTypeColor(item.dayType)}`}>{item.dayType}</span></td>
                  <td className="p-3 text-right">${item.priceLimit_ACT?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_NSW?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_NT?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_QLD?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_SA?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_TAS?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_VIC?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_WA?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_Remote?.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.priceLimit_VeryRemote?.toFixed(2)}</td>
                  <td className="p-3 text-xs text-[#43493a]">{item.effectiveFrom}</td>
                </tr>
              ))}
              {allItems.length === 0 && (
                <tr><td colSpan={14} className="p-6 text-center text-[#43493a]">No catalogue items. Import the NDIS Support Catalogue XLSX.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import modal */}
      {importing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1b1c1a]">Import NDIS Support Catalogue</h3>
              <button onClick={() => { setImporting(false); setPreviewStep(null); setPreview(null) }} className="text-[#43493a] hover:text-[#1b1c1a]">✕</button>
            </div>

            {previewStep === 'upload' && (
              <div className="space-y-4">
                <p className="text-sm text-[#43493a]">Upload the NDIA Support Catalogue .xlsx file to preview changes.</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#c3c9b6] rounded-2xl p-8 cursor-pointer hover:border-[#396200] transition-colors">
                  <span className="text-[#43493a] text-sm mb-2">{uploading ? 'Uploading...' : 'Drop .xlsx here or click to browse'}</span>
                  <input type="file" accept=".xlsx" onChange={handleUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            )}

            {previewStep === 'preview' && preview && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#f5f3ef] rounded-xl p-3"><p className="text-xs text-[#43493a]">New items</p><p className="text-xl font-bold text-[#396200]">{preview.itemsToAdd}</p></div>
                  <div className="bg-[#f5f3ef] rounded-xl p-3"><p className="text-xs text-[#43493a]">Updated</p><p className="text-xl font-bold text-amber-600">{(preview.rows ?? []).filter((r: any) => r.priceChanged).length}</p></div>
                  <div className="bg-[#f5f3ef] rounded-xl p-3"><p className="text-xs text-[#43493a]">To deactivate</p><p className="text-xl font-bold text-red-500">{preview.itemsToDeactivate}</p></div>
                </div>
                {(preview.warnings ?? []).length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                    {preview.warnings.map((w: string, i: number) => <p key={i}>&#9888; {w}</p>)}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#43493a] mb-1">Catalogue Version</label>
                  <input value={version} onChange={e => setVersion(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setPreviewStep('upload')} className="px-4 py-2 rounded-full border border-[#c3c9b6] text-sm text-[#43493a] hover:bg-[#f5f3ef]">Back</button>
                  <button onClick={handleConfirm} disabled={confirming} className="px-4 py-2 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] disabled:opacity-50">
                    {confirming ? 'Importing...' : 'Confirm Import'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PublicHolidaysTab() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [state, setState] = useState('VIC')
  const { data: holidays = [] } = usePublicHolidays(year, state)
  const createHoliday = useCreatePublicHoliday()
  const deleteHoliday = useDeletePublicHoliday()
  const syncHolidays = useSyncHolidays()
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ date: '', name: '', state: 'VIC' })
  const [showSyncAdvanced, setShowSyncAdvanced] = useState(false)
  const [syncFromYear, setSyncFromYear] = useState<number | undefined>(undefined)
  const [syncToYear, setSyncToYear] = useState<number | undefined>(undefined)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  const inputClass = 'px-3 py-2 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all'

  function handleAdd() {
    createHoliday.mutate(newForm, {
      onSuccess: () => { setAdding(false); setNewForm({ date: '', name: '', state: 'VIC' }) }
    })
  }

  function handleSync() {
    setSyncMessage(null)
    syncHolidays.mutate(
      { fromYear: syncFromYear, toYear: syncToYear },
      {
        onSuccess: (result) => {
          const errSuffix = result.errors?.length > 0 ? ` (${result.errors.length} error${result.errors.length > 1 ? 's' : ''} — check server logs)` : ''
          setSyncMessage({ type: result.errors?.length > 0 ? 'warning' : 'success', text: `Sync complete: ${result.holidaysAdded} added, ${result.holidaysUpdated} updated${errSuffix}` })
          setTimeout(() => setSyncMessage(null), 4000)
        },
        onError: (error: Error) => {
          const err = error as AxiosError<{ message?: string }>
          const msg = err?.response?.data?.message || err?.message || 'Sync failed. Please try again.'
          setSyncMessage({ type: 'error', text: msg })
        },
      }
    )
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)
  const states = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-[#1b1c1a]">Public Holidays</h2>
          <p className="text-sm text-[#43493a]">Used to determine NDIS public holiday rates on claims.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={inputClass}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={state} onChange={e => setState(e.target.value)} className={inputClass}>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] transition-all">
            + Add Holiday
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f5f3ef]">
            <tr>
              {['Date', 'Name', 'State', ''].map(h => (
                <th key={h} className="text-left p-3 text-xs font-medium text-[#43493a]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3ef]">
            {adding && (
              <tr className="bg-[#fbf9f5]">
                <td className="p-3"><input type="date" value={newForm.date} onChange={e => setNewForm(p => ({ ...p, date: e.target.value }))} className={inputClass + ' w-full'} /></td>
                <td className="p-3"><input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} placeholder="Holiday name" className={inputClass + ' w-full'} /></td>
                <td className="p-3">
                  <select value={newForm.state} onChange={e => setNewForm(p => ({ ...p, state: e.target.value }))} className={inputClass}>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={handleAdd} disabled={createHoliday.isPending} className="px-3 py-1.5 rounded-full bg-[#396200] text-white text-xs font-medium hover:bg-[#294800] disabled:opacity-50">Save</button>
                    <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-full border border-[#c3c9b6] text-xs text-[#43493a] hover:bg-[#f5f3ef]">Cancel</button>
                  </div>
                </td>
              </tr>
            )}
            {(holidays as any[]).map((h: any) => (
              <tr key={h.id} className="hover:bg-[#fbf9f5] transition-colors">
                <td className="p-3 font-medium text-[#1b1c1a]">{h.date}</td>
                <td className="p-3 text-[#43493a]">{h.name}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#43493a]">{h.state || 'All'}</span></td>
                <td className="p-3">
                  <button onClick={() => deleteHoliday.mutate(h.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {(holidays as any[]).length === 0 && !adding && (
              <tr><td colSpan={4} className="p-6 text-center text-[#43493a]">No holidays found for {year} in {state}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Holiday Sync */}
      <div className="pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncHolidays.isPending}
            className="px-4 py-2 rounded-full bg-[#396200] text-white text-sm font-medium hover:bg-[#294800] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncHolidays.isPending ? 'Syncing...' : 'Sync Holidays'}
          </button>
          <button
            type="button"
            onClick={() => setShowSyncAdvanced(v => !v)}
            className="text-sm text-[#43493a] hover:text-[#1b1c1a] underline"
          >
            {showSyncAdvanced ? 'Hide advanced' : 'Advanced'}
          </button>
        </div>

        {showSyncAdvanced && (
          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm text-[#43493a]">From year</label>
            <input
              type="number"
              value={syncFromYear ?? ''}
              onChange={e => setSyncFromYear(e.target.value ? Number(e.target.value) : undefined)}
              placeholder={String(new Date().getFullYear())}
              className="w-24 px-3 py-1.5 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
            />
            <label className="text-sm text-[#43493a]">To year</label>
            <input
              type="number"
              value={syncToYear ?? ''}
              onChange={e => setSyncToYear(e.target.value ? Number(e.target.value) : undefined)}
              placeholder={String(new Date().getFullYear() + 1)}
              className="w-24 px-3 py-1.5 rounded-2xl bg-[#f5f3ef] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#396200]/30 transition-all"
            />
          </div>
        )}

        {syncMessage && (
          <div className={`mt-3 px-4 py-2.5 rounded-2xl text-sm ${
            syncMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : syncMessage.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {syncMessage.text}
          </div>
        )}
      </div>
    </div>
  )
}
