import { useState, useEffect, useRef } from 'react'
import { Plus, X, Settings2, Eye, Pencil, Trash2 } from 'lucide-react'

const BLANK = { name: '', client: '', budget: '', startDate: '', endDate: '', status: 'active', notes: '' }

const STATUS_COLORS = {
  active:    'bg-emerald-100 text-emerald-700',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value || '—'}</p>
    </div>
  )
}

function ProjectForm({ form, setForm, onSubmit, onClose, saving, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">
          {[['name','Project Name',true],['client','Client Name',false],['budget','Budget',false]].map(([k,l,req]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-slate-700 mb-1">{l}{req && <span className="text-red-500"> *</span>}</label>
              <input value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} required={req} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[['startDate','Start Date'],['endDate','End Date']].map(([k,l]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-slate-700 mb-1">{l}</label>
                <input type="date" value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
              {['active','paused','completed','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({...p,notes:e.target.value}))} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
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

function ActionMenu({ onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Settings2 size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-lg z-30 py-1">
          <button onClick={() => { onView(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Eye size={14} className="text-blue-500" /> View
          </button>
          <button onClick={() => { onEdit(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Pencil size={14} className="text-orange-500" /> Edit
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { onDelete(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function Projects({ token, api }) {
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  // modals: 'create' | 'edit' | 'view' | 'delete' | null
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(BLANK)

  useEffect(() => {
    api('/api/pm/projects', { token })
      .then(res => setProjects(res.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const closeModal = () => { setModal(null); setSelected(null); setForm(BLANK) }

  const openEdit = (p) => { setSelected(p); setForm({ name: p.name, client: p.client || '', budget: p.budget || '', startDate: p.startDate || '', endDate: p.endDate || '', status: p.status || 'active', notes: p.notes || '' }); setModal('edit') }
  const openView = (p) => { setSelected(p); setModal('view') }
  const openDelete = (p) => { setSelected(p); setModal('delete') }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await api('/api/pm/projects', { token, method: 'POST', body: form })
      setProjects(p => [res.project, ...p])
      closeModal()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await api(`/api/pm/projects/${selected.id}`, { token, method: 'PUT', body: form })
      setProjects(p => p.map(x => x.id === selected.id ? res.project : x))
      closeModal()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api(`/api/pm/projects/${selected.id}`, { token, method: 'DELETE' })
      setProjects(p => p.filter(x => x.id !== selected.id))
      closeModal()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
        <button onClick={() => setModal('create')} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{['Name','Client','Budget','Start','End','Status','Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">{loading ? 'Loading…' : 'No projects yet'}</td></tr>
            ) : projects.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.client || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.budget ? `₹${p.budget}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.startDate || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.endDate || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[p.status] || STATUS_COLORS.active}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <ActionMenu onView={() => openView(p)} onEdit={() => openEdit(p)} onDelete={() => openDelete(p)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modal === 'create' && <ProjectForm form={form} setForm={setForm} onSubmit={handleCreate} onClose={closeModal} saving={saving} title="New Project" />}

      {/* Edit Modal */}
      {modal === 'edit' && <ProjectForm form={form} setForm={setForm} onSubmit={handleEdit} onClose={closeModal} saving={saving} title="Edit Project" />}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Project Details</h3>
              <button onClick={closeModal}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Project Name" value={selected.name} />
                <Field label="Client" value={selected.client} />
                <Field label="Budget" value={selected.budget ? `₹${selected.budget}` : null} />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Status</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[selected.status] || STATUS_COLORS.active}`}>{selected.status}</span>
                </div>
                <Field label="Start Date" value={selected.startDate} />
                <Field label="End Date" value={selected.endDate} />
              </div>
              {selected.notes && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Notes</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{selected.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => { closeModal(); setTimeout(() => openEdit(selected), 50) }} className="rounded-lg border border-orange-300 px-4 py-1.5 text-sm text-orange-600 hover:bg-orange-50 inline-flex items-center gap-1.5">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={closeModal} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Delete Project</h3>
              <button onClick={closeModal}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Are you sure?</p>
                  <p className="text-xs text-slate-500">This will permanently delete <span className="font-semibold text-slate-700">"{selected.name}"</span>.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700">Cancel</button>
                <button onClick={handleDelete} className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-1.5 text-sm font-medium text-white">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
