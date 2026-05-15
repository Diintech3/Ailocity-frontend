import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const BLANK = { name: '', type: 'digital', platform: '', budget: '', startDate: '', endDate: '', status: 'draft', objective: '', notes: '' }
const STATUS_COLORS = { draft: 'bg-amber-100 text-amber-700', active: 'bg-emerald-100 text-emerald-700', paused: 'bg-slate-200 text-slate-700', completed: 'bg-blue-100 text-blue-700' }

export default function Campaign({ token, api }) {
  const [campaigns, setCampaigns] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await api('/api/pm/campaigns', { token, method: 'POST', body: form })
      setCampaigns(p => [res.campaign, ...p])
      setModal(false)
      setForm(BLANK)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete?')) return
    try {
      await api(`/api/pm/campaigns/${id}`, { token, method: 'DELETE' })
      setCampaigns(p => p.filter(x => x.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Campaigns</h2>
        <button onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{['Name', 'Type', 'Platform', 'Budget', 'Start', 'End', 'Status', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.length === 0 && <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">No campaigns yet</td></tr>}
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600 capitalize">{c.type}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.platform || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.budget || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.startDate || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.endDate || '—'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span></td>
                <td className="px-4 py-3"><button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">New Campaign</h3>
              <button onClick={() => setModal(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <form onSubmit={save} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Campaign Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p,type:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                    {['digital','print','display','social','email'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
                  <input value={form.platform} onChange={e => setForm(p => ({...p,platform:e.target.value}))} placeholder="Meta, Google…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Budget</label>
                  <input value={form.budget} onChange={e => setForm(p => ({...p,budget:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({...p,status:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                    {['draft','active','paused','completed'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({...p,startDate:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({...p,endDate:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Objective</label>
                <input value={form.objective} onChange={e => setForm(p => ({...p,objective:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
