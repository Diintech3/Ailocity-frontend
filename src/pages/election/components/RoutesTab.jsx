import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Navigation, Shield, Pencil, Trash2, Eye, X, CheckCircle2, AlertCircle, MapPin, Check, RotateCcw, Settings, User } from 'lucide-react'
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../../lib/api'
import 'leaflet/dist/leaflet.css'

// Custom Leaflet Markers Setup
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF7A00" width="30" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
const customIcon = L.divIcon({
  html: iconSvg,
  className: 'custom-leaflet-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Sub-component to capture clicks on Leaflet map inside Add/Edit modal
function MapClickHandler({ onMapClick, readOnly }) {
  useMapEvents({
    click(e) {
      if (readOnly) return
      onMapClick(e.latlng)
    },
  })
  return null
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
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
          <button type="button" onClick={() => { setOpen(false); onView() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Eye size={14} /> View Map Path
          </button>
          <button type="button" onClick={() => { setOpen(false); onEdit() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Pencil size={14} /> Edit Route
          </button>
          <button type="button" onClick={() => { setOpen(false); onAssign() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#FF7A00] hover:bg-orange-50/50">
            <User size={14} /> Assign Volunteer
          </button>
          <button type="button" onClick={() => { setOpen(false); onDelete() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function RoutesTab({ token }) {
  const [routes, setRoutes] = useState([])
  const [volunteers, setVolunteers] = useState([])
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
      const [rteRes, volRes] = await Promise.all([
        api('/api/election-campaign/routes', { token }),
        api('/api/election-campaign/volunteers', { token })
      ])
      setRoutes(rteRes.routes || [])
      setVolunteers(volRes.volunteers || [])
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
        ward: '',
        boothNumber: '',
        description: '',
        status: 'active',
        assignedVolunteerId: '',
        points: []
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
    if (!confirm('Are you sure you want to delete this route?')) return
    try {
      await api(`/api/election-campaign/routes/${id}`, { method: 'DELETE', token })
      setRoutes(prev => prev.filter(r => r.id !== id))
      showSuccess('Route deleted successfully')
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!modal) return
    const { mode, form, item } = modal

    if (mode !== 'assign') {
      if (!form.name?.trim()) {
        alert('Route name is required')
        return
      }

      if (!form.points || form.points.length < 2) {
        alert('Please click on the map to define at least 2 path points for this route.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (mode === 'assign') {
        // Sync Route Assignment only
        await api('/api/election-campaign/routes/assign', {
          method: 'POST',
          token,
          body: {
            volunteerId: form.assignedVolunteerId || '',
            routeId: item.id
          }
        })
        showSuccess('Volunteer assigned successfully')
      } else {
        let savedRoute = null
        if (mode === 'add') {
          const res = await api('/api/election-campaign/routes', {
            method: 'POST',
            token,
            body: form
          })
          savedRoute = res.route
          setRoutes(prev => [...prev, savedRoute])
          showSuccess('Route added successfully')
        } else {
          const res = await api(`/api/election-campaign/routes/${item.id}`, {
            method: 'PATCH',
            token,
            body: form
          })
          savedRoute = res.route
          setRoutes(prev => prev.map(r => r.id === item.id ? savedRoute : r))
          showSuccess('Route updated successfully')
        }

        // Sync Volunteer Assignment if changed
        if (form.assignedVolunteerId !== (item?.assignedVolunteerId || '')) {
          await api('/api/election-campaign/routes/assign', {
            method: 'POST',
            token,
            body: {
              volunteerId: form.assignedVolunteerId,
              routeId: savedRoute.id
            }
          })
        }
      }

      // Reload data to ensure everything is synced
      await loadData()
      setModal(null)
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMapClick = (latlng) => {
    if (modal.mode === 'view' || modal.mode === 'assign') return
    const newPt = { lat: latlng.lat, lng: latlng.lng }
    setModal(prev => ({
      ...prev,
      form: {
        ...prev.form,
        points: [...(prev.form.points || []), newPt]
      }
    }))
  }

  const clearPoints = () => {
    setModal(prev => ({
      ...prev,
      form: { ...prev.form, points: [] }
    }))
  }

  const generateLucknowPath = () => {
    const startLat = 26.8467 + (Math.random() - 0.5) * 0.02
    const startLng = 80.9462 + (Math.random() - 0.5) * 0.02
    const pts = [
      { lat: startLat, lng: startLng },
      { lat: startLat + 0.003, lng: startLng + 0.004 },
      { lat: startLat + 0.005, lng: startLng - 0.002 },
      { lat: startLat + 0.008, lng: startLng + 0.003 },
    ]
    setModal(prev => ({
      ...prev,
      form: { ...prev.form, points: pts }
    }))
  }

  const getVolunteerName = (volId) => {
    if (!volId) return 'Not Assigned'
    const vol = volunteers.find(v => v.id === volId)
    return vol ? vol.name : 'Unknown'
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
          <h3 className="text-base font-bold text-slate-800">Route Assignment & Management</h3>
          <p className="text-xs text-slate-400 font-medium">Create campaign routes by plotting points on the map and assign volunteers.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
        >
          <Plus size={16} />
          Create Route
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center bg-white border border-slate-100 rounded-2xl py-16 shadow-sm">
          <Navigation size={48} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-800 font-bold text-base">No routes defined</h4>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Create routes and assign them to your field volunteers.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-visible shadow-sm">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                <th className="px-4 py-3 rounded-tl-2xl w-[22%]">Route Name</th>
                <th className="px-4 py-3 w-[12%]">Ward</th>
                <th className="px-4 py-3 w-[15%]">Booth No.</th>
                <th className="px-4 py-3 w-[15%]">Stops/Points</th>
                <th className="px-4 py-3 w-[22%]">Assigned Volunteer</th>
                <th className="px-4 py-3 w-[10%]">Status</th>
                <th className="px-4 py-3 rounded-tr-2xl text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {routes.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className={`px-4 py-3 font-bold text-slate-800 ${idx === routes.length - 1 ? 'rounded-bl-2xl' : ''}`}>
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.ward || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.boothNumber || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="font-semibold text-[#FF7A00]">{r.points?.length || 0} stops</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {r.assignedVolunteerId ? (
                      <span className="text-slate-800 font-bold flex items-center gap-1">
                        <Check size={14} className="text-emerald-500" /> {getVolunteerName(r.assignedVolunteerId)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      r.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right ${idx === routes.length - 1 ? 'rounded-br-2xl' : ''}`}>
                    <ActionsDropdown
                      onView={() => openView(r)}
                      onEdit={() => openEdit(r)}
                      onAssign={() => openAssign(r)}
                      onDelete={() => handleDelete(r.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit / View / Assign Route Map Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-slate-900 text-lg font-bold">
                {modal.mode === 'view' ? 'View Route Path' : modal.mode === 'assign' ? 'Assign Volunteer to Route' : modal.mode === 'edit' ? 'Edit Route Path' : 'Create Route & Plot Path'}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              {/* Form Sidebar */}
              <form onSubmit={handleSubmit} className="w-full md:w-80 border-r border-slate-100 p-6 space-y-4 overflow-y-auto flex-shrink-0">
                {modal.mode === 'assign' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Select a volunteer to walk <strong>{modal.form.name}</strong>:</p>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Volunteer</label>
                      <select
                        value={modal.form.assignedVolunteerId || ''}
                        onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, assignedVolunteerId: e.target.value } }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                      >
                        <option value="">Unassigned</option>
                        {volunteers.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.mobile || 'No Mobile'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Route Name</label>
                      <input
                        type="text"
                        required
                        disabled={modal.mode === 'view'}
                        placeholder="Route 101, ward 15 etc."
                        value={modal.form.name || ''}
                        onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ward</label>
                        <input
                          type="text"
                          disabled={modal.mode === 'view'}
                          placeholder="Ward ID"
                          value={modal.form.ward || ''}
                          onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, ward: e.target.value } }))}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Booth No.</label>
                        <input
                          type="text"
                          disabled={modal.mode === 'view'}
                          placeholder="Booth no."
                          value={modal.form.boothNumber || ''}
                          onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, boothNumber: e.target.value } }))}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        rows={2}
                        disabled={modal.mode === 'view'}
                        placeholder="Details about route limits"
                        value={modal.form.description || ''}
                        onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, description: e.target.value } }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Volunteer</label>
                      <select
                        disabled={modal.mode === 'view'}
                        value={modal.form.assignedVolunteerId || ''}
                        onChange={e => setModal(prev => ({ ...prev, form: { ...prev.form, assignedVolunteerId: e.target.value } }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                      >
                        <option value="">Unassigned</option>
                        {volunteers.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.mobile || 'No Mobile'})</option>
                        ))}
                      </select>
                    </div>
                    <div>
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

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">PLOTTED PATH</span>
                        <span className="font-bold text-[#FF7A00]">{modal.form.points?.length || 0} coordinates</span>
                      </div>
                      {modal.mode !== 'view' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={clearPoints}
                            className="flex items-center justify-center gap-1 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <RotateCcw size={12} /> Clear Path
                          </button>
                          <button
                            type="button"
                            onClick={generateLucknowPath}
                            className="py-1.5 bg-orange-50 rounded-lg text-xs font-semibold text-[#FF7A00] hover:bg-orange-100"
                          >
                            Mock Path
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {modal.mode !== 'view' && (
                  <div className="pt-4 flex gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF7A00] to-[#FFB000]"
                    >
                      {submitting ? 'Saving...' : modal.mode === 'assign' ? 'Assign Route' : 'Save'}
                    </button>
                  </div>
                )}
              </form>

              {/* Map Canvas */}
              <div className="flex-1 bg-slate-50 relative h-full">
                {modal.mode !== 'view' && modal.mode !== 'assign' && (
                  <div className="absolute top-3 left-12 z-20 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-md font-medium">
                    📌 Map click karke route stops add karein (Line automatically ban jayegi).
                  </div>
                )}
                
                <MapContainer center={[26.8467, 80.9462]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <MapClickHandler onMapClick={handleMapClick} readOnly={modal.mode === 'view' || modal.mode === 'assign'} />
                  
                  {/* Route Polyline Path */}
                  {modal.form.points && modal.form.points.length > 0 && (
                    <>
                      <Polyline
                        positions={modal.form.points.map(p => [p.lat, p.lng])}
                        color="#FFFFFF"
                        weight={8}
                        opacity={1.0}
                      />
                      <Polyline
                        positions={modal.form.points.map(p => [p.lat, p.lng])}
                        color="#FF5500"
                        weight={4.5}
                        opacity={0.95}
                      />
                      {/* Markers for Route Stops */}
                      {modal.form.points.map((p, pIdx) => (
                        <Marker
                          key={pIdx}
                          position={[p.lat, p.lng]}
                          icon={customIcon}
                        />
                      ))}
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
