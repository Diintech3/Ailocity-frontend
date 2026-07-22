import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Shield, FileText, X, Sparkles, Check, AlertCircle, Users, Edit2, Phone, Calendar, MapPin, Contact, Settings } from 'lucide-react'
import { api } from '../../../lib/api'

export default function TeamTab({ token }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  
  // Row Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    position: 'Volunteer', // Volunteer, Route Coordinator, Sabha In-charge, Campaign Manager
    mobile: '',
    gender: 'Male', // Male, Female
    dob: '',
    address: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api('/api/election-campaign/team-members', { token })
      setMembers(res.teamMembers || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load team data')
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
      name: '',
      position: 'Volunteer',
      mobile: '',
      gender: 'Male',
      dob: '',
      address: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (m) => {
    setEditMode(true)
    setViewMode(false)
    setSelectedId(m.id)
    setForm({
      name: m.name,
      position: m.position,
      mobile: m.mobile,
      gender: m.gender,
      dob: m.dob || '',
      address: m.address || '',
    })
    setModalOpen(true)
  }

  const handleOpenView = (m) => {
    setEditMode(false)
    setViewMode(true)
    setSelectedId(m.id)
    setForm({
      name: m.name,
      position: m.position,
      mobile: m.mobile,
      gender: m.gender,
      dob: m.dob || '',
      address: m.address || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim() || !form.position) {
      alert('Please fill in Name, Mobile number, and Position.')
      return
    }

    try {
      setError('')
      if (editMode) {
        const res = await api(`/api/election-campaign/team-members/${selectedId}`, {
          method: 'PATCH',
          token,
          body: form,
        })
        setMembers(prev => prev.map(m => (m.id === selectedId ? res.teamMember : m)))
        setSuccess('Team Member updated successfully!')
      } else {
        const res = await api('/api/election-campaign/team-members', {
          method: 'POST',
          token,
          body: form,
        })
        setMembers(prev => [res.teamMember, ...prev])
        setSuccess('Team Member added successfully!')
      }
      setModalOpen(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save Team Member')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Team Member?')) return
    try {
      await api(`/api/election-campaign/team-members/${id}`, {
        method: 'DELETE',
        token,
      })
      setMembers(prev => prev.filter(m => m.id !== id))
      setSuccess('Team Member deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete member')
    }
  }

  // Filter members
  const filteredMembers = members.filter(m => {
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.mobile.includes(searchQuery)
  })

  // Stats
  const totalCount = members.length
  const volunteerCount = members.filter(m => m.position === 'Volunteer').length
  const coordinatorCount = members.filter(m => m.position === 'Route Coordinator').length
  const managerCount = members.filter(m => m.position === 'Campaign Manager' || m.position === 'Sabha In-charge').length

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
            <Contact size={18} className="text-[#FF7A00]" />
            Team Members Directory
          </h2>
          <p className="text-xs text-slate-550 mt-1">
            Register campaign staff, assign custom positions, manage contact details, and record team demographics.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5 transition-all flex-shrink-0"
        >
          <Plus size={14} /> Add Team Member
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Members</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{totalCount}</h3>
          <p className="text-xs text-slate-405 mt-1">Registered staff</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volunteers</p>
          <h3 className="text-2xl font-black text-[#FF7A00] mt-2">{volunteerCount}</h3>
          <p className="text-xs text-orange-500 font-medium mt-1">On-ground workers</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coordinators</p>
          <h3 className="text-2xl font-black text-blue-605 mt-2">{coordinatorCount}</h3>
          <p className="text-xs text-blue-500 font-medium mt-1">Route supervisors</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Managers & Supervisors</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">{managerCount}</h3>
          <p className="text-xs text-emerald-650 font-medium mt-1">Sabha / Campaign leads</p>
        </div>
      </div>

      {/* Filter and Table Database */}
      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
        {/* Search controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by name, position, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/70 focus:bg-white rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 transition-all"
            />
          </div>
        </div>

        {/* Database List Table */}
        <div className="overflow-x-auto rounded-xl">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users size={40} className="mx-auto text-slate-300 opacity-60" />
              <p className="text-xs text-slate-450 font-bold">No team members registered yet.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-800">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Assigned Position</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredMembers.map(m => {
                  const positionColors = m.position === 'Campaign Manager'
                    ? 'bg-purple-50 text-purple-650'
                    : m.position === 'Route Coordinator'
                    ? 'bg-blue-50 text-blue-655'
                    : m.position === 'Sabha In-charge'
                    ? 'bg-emerald-50 text-emerald-650'
                    : 'bg-orange-50 text-orange-655'

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <strong className="text-sm text-slate-800 block truncate" title={m.name}>{m.name}</strong>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${positionColors}`}>
                          {m.position}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-655 whitespace-nowrap">
                        <span className="flex items-center gap-1 font-semibold">
                          <Phone size={12} className="text-slate-400" /> {m.mobile}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 space-y-0.5 font-semibold">
                        <p>🚻 {m.gender || 'Male'}</p>
                        {m.dob && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(m.dob).toLocaleDateString([], { dateStyle: 'medium' })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-semibold max-w-[200px] truncate">
                        {m.address ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" /> {m.address}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString([], { dateStyle: 'medium' }) : '—'}
                        </span>
                        {m.createdAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            🕒 {new Date(m.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === m.id ? null : m.id)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-all"
                            title="Member settings"
                          >
                            <Settings size={15} />
                          </button>
                          {activeDropdownId === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                <button
                                  onClick={() => { handleOpenView(m); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-55 flex items-center gap-2 font-semibold"
                                >
                                  🔍 View Details
                                </button>
                                <button
                                  onClick={() => { handleOpenEdit(m); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-55 flex items-center gap-2 font-semibold"
                                >
                                  ✏️ Edit Details
                                </button>
                                <div className="border-t border-slate-50 my-1" />
                                <button
                                  onClick={() => { handleDelete(m.id); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                                >
                                  ❌ Delete Member
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
                {viewMode ? 'View Team Member Details' : editMode ? 'Edit Team Member Details' : 'Add New Team Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Member Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={viewMode}
                  placeholder="e.g. Ramesh Chandra"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Position</label>
                <select
                  required
                  disabled={viewMode}
                  value={form.position}
                  onChange={(e) => setForm(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="Volunteer">Volunteer</option>
                  <option value="Route Coordinator">Route Coordinator</option>
                  <option value="Sabha In-charge">Sabha In-charge</option>
                  <option value="Campaign Manager">Campaign Manager</option>
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  disabled={viewMode}
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={(e) => setForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Select Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Gender</label>
                <select
                  disabled={viewMode}
                  value={form.gender}
                  onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={viewMode}
                  value={form.dob}
                  onChange={(e) => setForm(prev => ({ ...prev, dob: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                <input
                  type="text"
                  disabled={viewMode}
                  placeholder="Residential address"
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-slate-100/70 text-slate-800 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF7A00]/25 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
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
                    {editMode ? 'Save Changes' : 'Register Member'}
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
