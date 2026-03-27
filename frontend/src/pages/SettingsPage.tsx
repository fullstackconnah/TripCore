import { useEventTemplates, useActivities, useSettings, useUpdateSettings } from '@/api/hooks'
import { useState, useEffect } from 'react'

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
  const [tab, setTab] = useState<'templates' | 'activities' | 'qualifications'>('templates')
  const { data: templates = [] } = useEventTemplates()
  const { data: activities = [] } = useActivities()

  const tabs = [
    { key: 'templates' as const, label: 'Event Templates' },
    { key: 'activities' as const, label: 'Activity Library' },
    { key: 'qualifications' as const, label: 'Qualification Warnings' },
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
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{t.eventName}</h3>
                  <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{t.eventCode}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-[var(--color-muted-foreground)] space-y-1">
                <p>📍 {t.defaultDestination || '—'} · {t.defaultRegion || '—'}</p>
                {t.standardDurationDays && <p>⏱ {t.standardDurationDays} days</p>}
                {t.preferredTimeOfYear && <p>📅 {t.preferredTimeOfYear}</p>}
              </div>
            </div>
          ))}
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
    </div>
  )
}
