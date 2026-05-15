import { useRef, useEffect, useState } from 'react'
import { Settings2, Eye, Pencil, Trash2, X, FolderInput } from 'lucide-react'
import { TYPE_COLORS, STATUS_COLORS, PRIORITY_COLORS } from './constants'

function LogoCell({ logoKey, name, token }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!logoKey) return
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/business/presigned-url?key=${encodeURIComponent(logoKey)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { if (d.url) setUrl(d.url) }).catch(() => {})
  }, [logoKey, token])
  if (logoKey && url)
    return <img src={url} alt="logo" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
  return (
    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
      <span className="text-orange-600 text-xs font-bold">{(name || '?').slice(0,2).toUpperCase()}</span>
    </div>
  )
}

function ActionMenu({ onView, onEdit, onDelete, onAssign }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
        <Settings2 size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-30 py-1">
          <button onClick={() => { onView(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Eye size={14} className="text-blue-500" /> View
          </button>
          <button onClick={() => { onEdit(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Pencil size={14} className="text-orange-500" /> Edit
          </button>
          <button onClick={() => { onAssign(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <FolderInput size={14} className="text-violet-500" /> Move to Folder
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

function ViewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 break-all">{value}</p>
    </div>
  )
}

export default function LeadTable({ leads, loading, search, folders, onEdit, onDelete, onAdd, onAssignFolder, folderLabel, token }) {
  const [viewItem, setViewItem]     = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [assignItem, setAssignItem] = useState(null)

  const filtered = search.trim()
    ? leads.filter(l =>
        (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.mobile || '').includes(search) ||
        (l.company || '').toLowerCase().includes(search.toLowerCase())
      )
    : leads

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-slate-800">{folderLabel}</p>
          <p className="text-xs text-slate-400">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-3 py-1.5 text-xs font-medium text-white">
          + Add Lead
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {['#', 'Logo', 'Name', 'Company', 'Mobile', 'Lead Type', 'Category', 'Folder', 'Budget', 'Status', 'Priority', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs uppercase tracking-wider text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-16 text-center text-sm text-slate-400">
                  {loading ? 'Loading…' : 'No leads here. Click "+ Add Lead" to add one.'}
                </td>
              </tr>
            ) : filtered.map((l, idx) => {
              const folder = folders.find(f => f.id === l.folderId)
              return (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <LogoCell logoKey={l.logoKey} name={l.name} token={token} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{l.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.company || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.mobile || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[l.type] || 'bg-slate-100 text-slate-600'}`}>
                      {l.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{l.category || '—'}</div>
                    {l.subCategory && <div className="text-slate-400">{l.subCategory}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {folder
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5" style={{ background: folder.color + '20', color: folder.color }}>
                          {folder.name}
                        </span>
                      : <span className="text-xs text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.budget ? `₹${l.budget}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[l.status] || 'bg-slate-100 text-slate-600'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_COLORS[l.priority] || 'bg-slate-100 text-slate-600'}`}>
                      {l.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      onView={() => setViewItem(l)}
                      onEdit={() => onEdit(l)}
                      onDelete={() => setDeleteItem(l)}
                      onAssign={() => setAssignItem(l)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewItem(null)}>
          <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900">{viewItem.name}</h3>
                <p className="text-xs text-slate-500">{viewItem.company || '—'}</p>
              </div>
              <button onClick={() => setViewItem(null)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
              {[
                ['Business Information', [['Name', viewItem.name], ['Company', viewItem.company], ['Business Type', viewItem.businessType], ['Category', viewItem.category], ['Sub Category', viewItem.subCategory], ['Website', viewItem.websiteUrl]]],
                ['Contact Details', [['Email', viewItem.email], ['Mobile', viewItem.mobile], ['Alternate Mobile', viewItem.alternateMobile]]],
                ['Documents', [['GST Number', viewItem.gstNumber], ['PAN Number', viewItem.panNumber]]],
                ['Location', [['Address', viewItem.address], ['City', viewItem.city], ['State', viewItem.state], ['Pincode', viewItem.pincode], ['Country', viewItem.country]]],
                ['Social', [['Instagram', viewItem.instagramUrl], ['Facebook', viewItem.facebookUrl], ['YouTube', viewItem.youtubeUrl]]],
                ['CRM Details', [['Lead Type', viewItem.type], ['Sub Category', viewItem.mbcSubCategory], ['Source', viewItem.source], ['Budget', viewItem.budget ? `₹${viewItem.budget}` : null], ['Requirement', viewItem.requirement], ['Status', viewItem.status], ['Priority', viewItem.priority], ['KYC', viewItem.kyc]]],
              ].map(([section, fields]) => {
                const visible = fields.filter(([, v]) => v)
                if (!visible.length) return null
                return (
                  <div key={section}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{section}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {visible.map(([l, v]) => <ViewRow key={l} label={l} value={v} />)}
                    </div>
                  </div>
                )
              })}
              {viewItem.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Notes</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{viewItem.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 flex-shrink-0">
              <button onClick={() => { setViewItem(null); onEdit(viewItem) }} className="rounded-lg border border-orange-300 px-4 py-1.5 text-sm text-orange-600 hover:bg-orange-50 inline-flex items-center gap-1.5">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => setViewItem(null)} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Folder Modal */}
      {assignItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAssignItem(null)}>
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Move to Folder</h3>
              <button onClick={() => setAssignItem(null)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs text-slate-500 mb-3">Select folder for <span className="font-semibold text-slate-700">"{assignItem.name}"</span></p>
              {/* Remove from folder */}
              {assignItem.folderId && (
                <button onClick={() => { onAssignFolder(assignItem.id, ''); setAssignItem(null) }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50">
                  <X size={14} className="text-slate-400" /> Remove from folder
                </button>
              )}
              {folders.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No folders yet. Create one first.</p>}
              {folders.map(f => (
                <button key={f.id} onClick={() => { onAssignFolder(assignItem.id, f.id); setAssignItem(null) }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    assignItem.folderId === f.id
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: f.color }} />
                  <span className="flex-1 text-left">{f.name}</span>
                  {f.category && <span className="text-xs text-slate-400">{f.category}</span>}
                  {assignItem.folderId === f.id && <span className="text-xs text-orange-500">✓ Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteItem(null)}>
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Delete Lead</h3>
              <button onClick={() => setDeleteItem(null)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Are you sure?</p>
                  <p className="text-xs text-slate-500">Permanently delete <span className="font-semibold">"{deleteItem.name}"</span>.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700">Cancel</button>
                <button onClick={() => { onDelete(deleteItem.id); setDeleteItem(null) }} className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-1.5 text-sm font-medium text-white">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
