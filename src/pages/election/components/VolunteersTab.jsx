import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Users, Shield, Pencil, Trash2, Eye, X, CheckCircle2, AlertCircle, Phone, Mail, Award, MapPin, Settings } from 'lucide-react'
import { api } from '../../../lib/api'

// Status Badge Component
function StatusBadge({ status }) {
  const active = status === 'active'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status || '—'}
    </span>
  )
}

// Gear actions dropdown
function ActionsDropdown({ onView, onEdit, onAssign, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF7A00] hover:bg-orange-50 transition-colors"
        title="Actions"
      >
        <Settings size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-40 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
          <button type="button" onClick={() => { setOpen(false); onView() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Eye size={14} /> View Details
          </button>
          <button type="button" onClick={() => { setOpen(false); onEdit() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Pencil size={14} /> Edit details
          </button>
          <button type="button" onClick={() => { setOpen(false); onAssign() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#FF7A00] hover:bg-orange-50/50">
            <MapPin size={14} /> Assign Route
          </button>
          <button type="button" onClick={() => { setOpen(false); onDelete() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function VolunteersTab({ token }) {
  const [volunteers, setVolunteers] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState(null) // { mode: 'add'|'edit'|'view'|'assign', form: {...}, item: null }

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3500)
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [volRes, rteRes] = await Promise.all([
        api('/api/election-campaign/volunteers', { token }),
        api('/api/election-campaign/routes', { token })
      ])
      setVolunteers(volRes.volunteers || [])
      setRoutes(rteRes.routes || [])
    } catch (err) {
      setError(err.message || 'Failed to load campaign data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openAdd = () => {
    setModal({
      mode: 'add',
      form: {
        name: '',
        mobile: '',
        email: '',
        politicalParty: 'Ailocity Party',
        vidhanSabha: '',
        boothNumber: '',
        status: 'active',
        assignedRouteId: '',
      },
      item: null
    })
  }

  const openEdit = (item) => {
    setModal({ mode: 'edit', form: { ...item }, item })
  }

  const openAssign = (item) => {
    setModal({ mode: 'assign', form: { ...item }, item })
  }

  const openView = (item) => {
    setModal({ mode: 'view', form: { ...item }, item })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this volunteer?')) return
    try {
      await api(`/api/election-campaign/volunteers/${id}`, { method: 'DELETE', token })
      setVolunteers(prev => prev.filter(v => v.id !== id))
      showSuccess('Volunteer deleted successfully')
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!modal) return
    const { mode, form, item } = modal
    
    if (mode !== 'assign' && !form.name?.trim()) {
      alert('Volunteer name is required')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'add') {
        const res = await api('/api/election-campaign/volunteers', {
          method: 'POST',
          token,
          body: form
        })
        const created = res.volunteer
        setVolunteers(prev => [...prev, created])
        // Sync route assignment if set
        if (form.assignedRouteId) {
          await api('/api/election-campaign/routes/assign', {
            method: 'POST',
            token,
            body: { volunteerId: created.id, routeId: form.assignedRouteId }
          })
        }
        showSuccess('Volunteer added successfully')
      } else {
        // Mode: 'edit' or 'assign'
        await api('/api/election-campaign/routes/assign', {
          method: 'POST',
          token,
          body: { volunteerId: item.id, routeId: form.assignedRouteId || '' }
        })

        if (mode === 'edit') {
          await api(`/api/election-campaign/volunteers/${item.id}`, {
            method: 'PATCH',
            token,
            body: form
          })
        }
        showSuccess(mode === 'assign' ? 'Route assigned successfully' : 'Volunteer updated successfully')
      }
      await loadData()
      setModal(null)
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const getRouteName = (routeId) => {
    if (!routeId) return 'Not Assigned'
    const route = routes.find(r => r.id === routeId)
    return route ? route.name : 'Unknown Route'
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-800 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          {error}
          <button type="button" onClick={() => setError('')} className="ml-auto text-xs font-bold uppercase text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800">Ailocity Volunteers</h3>
          <p className="text-xs text-slate-400 font-medium">Manage on-field volunteers and survey assignment settings.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
        >
          <Plus size={16} />
          Add Volunteer
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
        </div>
      ) : volunteers.length === 0 ? (
        <div className="text-center bg-white border border-slate-100 rounded-2xl py-16 shadow-sm">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-800 font-bold text-base">No volunteers registered</h4>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Add your campaign field executives and assign them routes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-visible shadow-sm">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                <th className="px-4 py-3 rounded-tl-2xl w-[20%]">Name</th>
                <th className="px-4 py-3 w-[15%]">Mobile</th>
                <th className="px-4 py-3 w-[15%]">Party</th>
                <th className="px-4 py-3 w-[15%]">Booth No.</th>
                <th className="px-4 py-3 w-[20%]">Assigned Route</th>
                <th className="px-4 py-3 w-[10%]">Status</th>
                <th className="px-4 py-3 rounded-tr-2xl text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {volunteers.map((v, idx) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className={`px-4 py-3 font-bold text-slate-800 ${idx === volunteers.length - 1 ? 'rounded-bl-2xl' : ''}`}>
                    {v.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.mobile || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-semibold">
                      {v.politicalParty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.boothNumber || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {v.assignedRouteId ? (
                      <span className="text-[#FF7A00] flex items-center gap-1">
                        <MapPin size={12} /> {getRouteName(v.assignedRouteId)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not Assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className={`px-4 py-3 text-right ${idx === volunteers.length - 1 ? 'rounded-br-2xl' : ''}`}>
                    <ActionsDropdown
                      onView={() => openView(v)}
                      onEdit={() => openEdit(v)}
                      onAssign={() => openAssign(v)}
                      onDelete={() => handleDelete(v.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit / View / Assign Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-slate-900 text-lg font-bold">
                {modal.mode === 'view' ? 'Volunteer Details' : modal.mode === 'assign' ? 'Assign Route' : modal.mode === 'edit' ? 'Edit Volunteer' : 'Add New Volunteer'}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {modal.mode === 'assign' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Select a route to assign to volunteer <strong>{modal.form.name}</strong>:</p>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Route</label>
                    <select
                      value={modal.form.assignedRouteId || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, assignedRouteId: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                    >
                      <option value="">Not Assigned</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.ward || 'No Ward'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      disabled={modal.mode === 'view'}
                      placeholder="Enter name"
                      value={modal.form.name || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      disabled={modal.mode === 'view'}
                      placeholder="Mobile number"
                      value={modal.form.mobile || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, mobile: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      disabled={modal.mode === 'view'}
                      placeholder="Email address"
                      value={modal.form.email || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, email: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Political Party</label>
                    <input
                      type="text"
                      disabled={modal.mode === 'view'}
                      placeholder="Political Party"
                      value={modal.form.politicalParty || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, politicalParty: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vidhan Sabha</label>
                    <input
                      type="text"
                      disabled={modal.mode === 'view'}
                      placeholder="Vidhan Sabha name"
                      value={modal.form.vidhanSabha || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, vidhanSabha: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Booth Number</label>
                    <input
                      type="text"
                      disabled={modal.mode === 'view'}
                      placeholder="Booth number"
                      value={modal.form.boothNumber || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, boothNumber: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Route</label>
                    <select
                      disabled={modal.mode === 'view'}
                      value={modal.form.assignedRouteId || ''}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, assignedRouteId: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                    >
                      <option value="">Not Assigned</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.ward || 'No Ward'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                      disabled={modal.mode === 'view'}
                      value={modal.form.status || 'active'}
                      onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, status: e.target.value } }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              {modal.mode === 'view' && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-400 font-medium">
                  <p>Registered: {new Date(modal.form.createdAt).toLocaleString()}</p>
                  <p>Last Modified: {new Date(modal.form.updatedAt).toLocaleString()}</p>
                  <p>Last Known Location: Lat: {modal.form.lastKnownLocation?.lat?.toFixed(5) || '—'}, Lng: {modal.form.lastKnownLocation?.lng?.toFixed(5) || '—'}</p>
                </div>
              )}

              {modal.mode !== 'view' && (
                <div className="pt-4 flex justify-end gap-3 flex-shrink-0 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:shadow-lg transition-all duration-200"
                  >
                    {submitting ? 'Saving...' : modal.mode === 'assign' ? 'Assign Route' : 'Save'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
