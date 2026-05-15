import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const AD_PLATFORMS = ['Meta', 'Google', 'Print Media', 'Display']

const BLANK = { title: '', platform: 'Meta', budget: '', startDate: '', endDate: '', status: 'draft', targetAudience: '', adType: '', notes: '' }
const STATUS_COLORS = { draft: 'bg-amber-100 text-amber-700', active: 'bg-emerald-100 text-emerald-700', paused: 'bg-slate-200 text-slate-700', completed: 'bg-blue-100 text-blue-700' }

export default function Ads({ token, api }) {
  const [activePlatform, setActivePlatform] = useState('Meta')
  const [ads, setAds] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...BLANK, platform: 'Meta' })
  const [saving, setSaving] = useState(false)

  const filtered = ads.filter(a => a.platform === activePlatform)

  const openModal = () => {
    setForm({ ...BLANK, platform: activePlatform })
    setModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await api('/api/pm/ads', { token, method: 'POST', body: form })
      setAds(p => [res.ad, ...p])
      setModal(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete?')) return
    try {
      await api(`/api/pm/ads/${id}`, { token, method: 'DELETE' })
      setAds(p => p.filter(x => x.id !== id))
    } catch { /* ignore */ }
  }

  const platformIcons = {
    'Meta': '📘',
    'Google': '🔍',
    'Print Media': '🗞️',
    'Display': '🖥️',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Ads</h2>
        <button onClick={openModal} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white">
          <Plus size={16} /> New Ad
        </button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {AD_PLATFORMS.map(p => (
          <button key={p} onClick={() => setActivePlatform(p)}
            className={`rounded-xl p-4 text-left transition-all border-2 ${
              activePlatform === p
                ? 'border-orange-500 bg-orange-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
            }`}>
            <p className="text-2xl mb-2">{platformIcons[p]}</p>
            <p className={`text-sm font-semibold ${activePlatform === p ? 'text-orange-600' : 'text-slate-700'}`}>{p}</p>
            <p className={`text-2xl font-bold mt-1 ${activePlatform === p ? 'text-orange-500' : 'text-slate-900'}`}>{ads.filter(a => a.platform === p).length}</p>
            <p className="text-xs text-slate-400 mt-0.5">ads</p>
          </button>
        ))}
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FFB000]" />
          <p className="text-sm font-semibold text-slate-800">{activePlatform} Ads</p>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} total</span>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{['Title', 'Ad Type', 'Budget', 'Start', 'End', 'Status', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">No {activePlatform} ads yet</td></tr>}
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{a.title}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.adType || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.budget || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.startDate || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.endDate || '—'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>{a.status}</span></td>
                <td className="px-4 py-3"><button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">New Ad — {form.platform}</h3>
              <button onClick={() => setModal(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <form onSubmit={save} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
                <select value={form.platform} onChange={e => setForm(p => ({...p,platform:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                  {AD_PLATFORMS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ad Title <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ad Type</label>
                  <input value={form.adType} onChange={e => setForm(p => ({...p,adType:e.target.value}))} placeholder="Image, Video…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Budget</label>
                  <input value={form.budget} onChange={e => setForm(p => ({...p,budget:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Audience</label>
                <input value={form.targetAudience} onChange={e => setForm(p => ({...p,targetAudience:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({...p,status:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                  {['draft','active','paused','completed'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
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
