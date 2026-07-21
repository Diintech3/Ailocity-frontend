import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, CheckCircle, Clock, Users, Navigation, Shield, FileText, X, Sparkles, Check, AlertCircle, Settings } from 'lucide-react'
import { api } from '../../../lib/api'

export default function D2DCampaignTab({ token }) {
  const [campaigns, setCampaigns] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  
  // Row Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    volunteerId: '',
    routeId: '',
    sabhaId: '',
    sabhaName: '',
  })

  // List of mock Sabhas (since Sabha Planner is not implemented yet)
  const mockSabhas = [
    { id: 'sbh_chowk', name: 'Chowk Market Assembly' },
    { id: 'sbh_hazrat', name: 'Hazratganj Park Assembly' },
    { id: 'sbh_central', name: 'Lucknow Central Meet' },
    { id: 'sbh_indira', name: 'Indira Nagar Sabha' },
  ]

  const loadData = async () => {
    try {
      setLoading(true)
      const [campRes, volRes, rteRes] = await Promise.all([
        api('/api/election-campaign/d2d-campaigns', { token }),
        api('/api/election-campaign/volunteers', { token }),
        api('/api/election-campaign/routes', { token }),
      ])
      setCampaigns(campRes.campaigns || [])
      setVolunteers(volRes.volunteers || [])
      setRoutes(rteRes.routes || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load campaign data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleOpenAdd = () => {
    setEditMode(false)
    setViewMode(false)
    setSelectedId(null)
    setForm({
      title: '',
      description: '',
      volunteerId: '',
      routeId: '',
      sabhaId: '',
      sabhaName: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (c) => {
    setEditMode(true)
    setViewMode(false)
    setSelectedId(c.id)
    setForm({
      title: c.title,
      description: c.description,
      volunteerId: c.volunteerId || '',
      routeId: c.routeId || '',
      sabhaId: c.sabhaId || '',
      sabhaName: c.sabhaName || '',
    })
    setModalOpen(true)
  }

  const handleOpenView = (c) => {
    setEditMode(false)
    setViewMode(true)
    setSelectedId(c.id)
    setForm({
      title: c.title,
      description: c.description,
      volunteerId: c.volunteerId || '',
      routeId: c.routeId || '',
      sabhaId: c.sabhaId || '',
      sabhaName: c.sabhaName || '',
    })
    setModalOpen(true)
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.volunteerId || !form.routeId) {
      alert('Please fill in Title, Description, Volunteer, and Route.')
      return
    }

    const selectedSabha = mockSabhas.find(s => s.id === form.sabhaId)

    try {
      setError('')
      if (editMode) {
        const res = await api(`/api/election-campaign/d2d-campaigns/${selectedId}`, {
          method: 'PATCH',
          token,
          body: {
            title: form.title,
            description: form.description,
            volunteerId: form.volunteerId,
            routeId: form.routeId,
            sabhaId: selectedSabha ? selectedSabha.id : '',
            sabhaName: selectedSabha ? selectedSabha.name : '',
          },
        })
        setCampaigns(prev => prev.map(c => c.id === selectedId ? res.campaign : c))
        setSuccess('D2D Campaign updated successfully!')
      } else {
        const res = await api('/api/election-campaign/d2d-campaigns', {
          method: 'POST',
          token,
          body: {
            title: form.title,
            description: form.description,
            volunteerId: form.volunteerId,
            routeId: form.routeId,
            sabhaId: selectedSabha ? selectedSabha.id : '',
            sabhaName: selectedSabha ? selectedSabha.name : '',
            status: 'active',
          },
        })
        setCampaigns(prev => [res.campaign, ...prev])
        setSuccess('D2D Campaign created successfully!')
      }
      setModalOpen(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save D2D Campaign')
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'completed' : 'active'
    try {
      await api(`/api/election-campaign/d2d-campaigns/${id}`, {
        method: 'PATCH',
        token,
        body: { status: nextStatus },
      })
      setCampaigns(prev =>
        prev.map(c => (c.id === id ? { ...c, status: nextStatus } : c))
      )
      setSuccess(`Campaign marked as ${nextStatus}!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update campaign status')
    }
  }

  const handleDeleteCampaign = async (id) => {
    if (!confirm('Are you sure you want to delete this D2D Campaign?')) return
    try {
      await api(`/api/election-campaign/d2d-campaigns/${id}`, {
        method: 'DELETE',
        token,
      })
      setCampaigns(prev => prev.filter(c => c.id !== id))
      setSuccess('Campaign deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete campaign')
    }
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.volunteerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.routeName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats
  const totalCampaigns = campaigns.length
  const activeCount = campaigns.filter(c => c.status === 'active').length
  const completedCount = campaigns.filter(c => c.status === 'completed').length
  const uniqueVolunteersCount = new Set(campaigns.map(c => c.volunteerId)).size

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-800 text-sm font-medium shadow-sm transition-all duration-300">
          <Check className="text-emerald-500 flex-shrink-0" size={18} />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm shadow-sm transition-all duration-300">
          <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
          {error}
        </div>
      )}

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF7A00]" />
            Door-to-Door (D2D) Campaigns Planner
          </h2>
          <p className="text-xs text-slate-550 mt-1">
            Create D2D surveys, assign volunteers to routes, align meetings with Sabha assemblies, and track completion.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5 transition-all flex-shrink-0"
        >
          <Plus size={14} /> New D2D Campaign
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Campaigns</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{totalCampaigns}</h3>
          <p className="text-xs text-slate-405 mt-1">Registered in system</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Campaigns</p>
          <h3 className="text-2xl font-black text-orange-655 mt-2">{activeCount}</h3>
          <p className="text-xs text-orange-500 font-medium mt-1">Live in progress</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Campaigns</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">{completedCount}</h3>
          <p className="text-xs text-emerald-650 font-medium mt-1">Goal fully achieved</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Volunteers</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{uniqueVolunteersCount}</h3>
          <p className="text-xs text-slate-550 mt-1">Deployed in campaigns</p>
        </div>
      </div>

      {/* Filter and Table Database */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
        {/* Search, Filter controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by title, volunteer, or route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/70 focus:bg-white rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-100/70 text-slate-750 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>
        </div>

        {/* Database List Table */}
        <div className="overflow-x-auto rounded-xl">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <FileText size={40} className="mx-auto text-slate-300 opacity-60" />
              <p className="text-xs text-slate-450 font-bold">No D2D campaigns found.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-800">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="px-4 py-3">Campaign Info</th>
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-4 py-3">Assigned Route</th>
                  <th className="px-4 py-3">Sabha Assembly</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredCampaigns.map(c => {
                  const statusColors = c.status === 'active' 
                    ? 'bg-orange-50 text-orange-600'
                    : 'bg-emerald-50 text-emerald-600'

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <strong className="text-sm text-slate-800 block">{c.title}</strong>
                        <span className="text-xs text-slate-450 block font-normal leading-relaxed">{c.description}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[#FF7A00] font-bold">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {c.volunteerName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-650">
                        <span className="flex items-center gap-1 font-semibold">
                          <Navigation size={12} className="text-slate-400" /> {c.routeName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {c.sabhaName ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-650 px-2.5 py-0.5 rounded-full font-bold">
                            <Shield size={10} /> {c.sabhaName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${statusColors}`}>
                          {c.status === 'active' ? (
                            <Clock size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
                          ) : (
                            <CheckCircle size={10} />
                          )}
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === c.id ? null : c.id)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-all"
                            title="Campaign settings"
                          >
                            <Settings size={15} />
                          </button>
                          {activeDropdownId === c.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                <button
                                  onClick={() => { handleOpenView(c); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-55 flex items-center gap-2 font-semibold"
                                >
                                  🔍 View Details
                                </button>
                                <button
                                  onClick={() => { handleOpenEdit(c); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-55 flex items-center gap-2 font-semibold"
                                >
                                  ✏️ Edit Campaign
                                </button>
                                <button
                                  onClick={() => { handleToggleStatus(c.id, c.status); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-55 flex items-center gap-2 font-semibold"
                                >
                                  {c.status === 'active' ? '✓ Mark Complete' : '📟 Re-activate'}
                                </button>
                                <div className="border-t border-slate-50 my-1" />
                                <button
                                  onClick={() => { handleDeleteCampaign(c.id); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                                >
                                  ❌ Delete Campaign
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Dialog Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-800">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#FF7A00]" />
                {viewMode ? 'View D2D Campaign Details' : editMode ? 'Edit D2D Campaign' : 'Create New D2D Campaign'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  disabled={viewMode}
                  placeholder="e.g. Chowk Main Market Voter Outreach"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  disabled={viewMode}
                  placeholder="Summarize the core campaign purpose and objectives..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Select Volunteer */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Volunteer</label>
                <select
                  required
                  disabled={viewMode}
                  value={form.volunteerId}
                  onChange={(e) => setForm(prev => ({ ...prev, volunteerId: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">Select Volunteer</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.politicalParty})</option>
                  ))}
                </select>
              </div>

              {/* Select Route */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Route</label>
                <select
                  required
                  disabled={viewMode}
                  value={form.routeId}
                  onChange={(e) => setForm(prev => ({ ...prev, routeId: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.ward})</option>
                  ))}
                </select>
              </div>

              {/* Select Sabha (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Align Sabha Assembly (Optional)</label>
                <select
                  disabled={viewMode}
                  value={form.sabhaId}
                  onChange={(e) => setForm(prev => ({ ...prev, sabhaId: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">None / No Sabha alignment</option>
                  {mockSabhas.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {viewMode ? 'Close' : 'Cancel'}
                </button>
                {!viewMode && (
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7A00] to-[#FFB000] shadow-md hover:brightness-110 transition-all"
                  >
                    {editMode ? 'Save Changes' : 'Save Campaign'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
