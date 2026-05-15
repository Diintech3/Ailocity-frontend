import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { CATEGORY_MAP } from './constants'

const COLORS = ['#FF7A00','#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B','#06B6D4','#EC4899']
const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500'

export default function FolderForm({ form, setForm, onSubmit, onClose, saving, title }) {
  const [customCats, setCustomCats]     = useState([])   // user-added categories
  const [customSubs, setCustomSubs]     = useState({})   // user-added subcategories per category
  const [newCat, setNewCat]             = useState('')
  const [showNewCat, setShowNewCat]     = useState(false)
  const [newSub, setNewSub]             = useState('')
  const [showNewSub, setShowNewSub]     = useState(false)

  const allCategories = [...Object.keys(CATEGORY_MAP), ...customCats]
  const allSubs = form.category
    ? [...(CATEGORY_MAP[form.category] || []), ...(customSubs[form.category] || [])]
    : []

  const addCategory = () => {
    const val = newCat.trim()
    if (!val || allCategories.includes(val)) return
    setCustomCats(p => [...p, val])
    setForm(p => ({ ...p, category: val, subCategory: '' }))
    setNewCat('')
    setShowNewCat(false)
  }

  const addSubCategory = () => {
    const val = newSub.trim()
    if (!val || !form.category) return
    setCustomSubs(p => ({ ...p, [form.category]: [...(p[form.category] || []), val] }))
    setForm(p => ({ ...p, subCategory: val }))
    setNewSub('')
    setShowNewSub(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">

          {/* Folder Name */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Folder Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Real Estate Leads" className={inp} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => {
                if (e.target.value === '__add__') { setShowNewCat(true); return }
                setForm(p => ({ ...p, category: e.target.value, subCategory: '' }))
                setShowNewSub(false)
              }}
              className={inp}
            >
              <option value="">Select category (optional)</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__add__">➕ Add new category…</option>
            </select>

            {/* Inline new category input */}
            {showNewCat && (
              <div className="flex gap-2 mt-2">
                <input
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="New category name"
                  className="flex-1 border border-orange-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                  autoFocus
                />
                <button type="button" onClick={addCategory} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600">
                  <Plus size={14} />
                </button>
                <button type="button" onClick={() => { setShowNewCat(false); setNewCat('') }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Sub Category */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Sub Category</label>
            <select
              value={form.subCategory}
              onChange={e => {
                if (e.target.value === '__add__') { setShowNewSub(true); return }
                setForm(p => ({ ...p, subCategory: e.target.value }))
              }}
              className={inp}
              disabled={!form.category}
            >
              <option value="">Select sub category (optional)</option>
              {allSubs.map(s => <option key={s} value={s}>{s}</option>)}
              {form.category && <option value="__add__">➕ Add new sub category…</option>}
            </select>

            {/* Inline new subcategory input */}
            {showNewSub && (
              <div className="flex gap-2 mt-2">
                <input
                  value={newSub}
                  onChange={e => setNewSub(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubCategory())}
                  placeholder="New sub category name"
                  className="flex-1 border border-orange-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                  autoFocus
                />
                <button type="button" onClick={addSubCategory} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600">
                  <Plus size={14} />
                </button>
                <button type="button" onClick={() => { setShowNewSub(false); setNewSub('') }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
