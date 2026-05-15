import { useState } from 'react'
import { Save } from 'lucide-react'

export default function Settings({ me, token, api }) {
  const [profile, setProfile] = useState({
    businessName: me?.businessName || '',
    fullName: me?.fullName || '',
    email: me?.email || '',
    mobile: me?.mobile || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/business/profile', { token, method: 'PATCH', body: profile })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your PM account settings</p>
      </div>

      <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Profile Information</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['businessName', 'Business Name'],
            ['fullName', 'Full Name'],
            ['email', 'Email'],
            ['mobile', 'Mobile'],
          ].map(([k, l]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-slate-700 mb-1">{l}</label>
              <input
                value={profile[k]}
                onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved!</span>}
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Account Info</h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3">
          {[
            ['App', me?.appName || 'Ailocity PM'],
            ['Status', me?.status || '—'],
            ['KYC', me?.kyc || 'pending'],
          ].map(([l, v]) => (
            <div key={l} className="bg-slate-50 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-400">{l}</p>
              <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
