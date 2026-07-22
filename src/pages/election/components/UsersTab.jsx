import { useState, useEffect } from 'react'
import { Plus, Settings, Eye, Edit, Trash2, LogIn, Mail, Lock, UserCheck, ShieldCheck, X, AlertCircle } from 'lucide-react'
import { api, TOKEN_ELECTION, TOKEN_CLIENT } from '../../../lib/api'

export default function UsersTab({ token: propToken }) {
  const token = propToken || localStorage.getItem(TOKEN_ELECTION) || localStorage.getItem(TOKEN_CLIENT)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api('/api/election-campaign/users', { token })
      setUsers(res.users || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [token])

  const handleOpenAddModal = () => {
    setEditMode(false)
    setViewMode(false)
    setSelectedUser(null)
    setForm({ name: '', email: '', password: '' })
    setModalOpen(true)
  }

  const handleOpenViewModal = (user) => {
    setEditMode(false)
    setViewMode(true)
    setSelectedUser(user)
    setForm({ name: user.name, email: user.email, password: '' })
    setModalOpen(true)
    setActiveDropdown(null)
  }

  const handleOpenEditModal = (user) => {
    setEditMode(true)
    setViewMode(false)
    setSelectedUser(user)
    setForm({ name: user.name, email: user.email, password: '' })
    setModalOpen(true)
    setActiveDropdown(null)
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api(`/api/election-campaign/users/${id}`, { method: 'DELETE', token })
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete user')
    } finally {
      setActiveDropdown(null)
    }
  }

  const handleLoginAsUser = async (user) => {
    try {
      const res = await api(`/api/election-campaign/users/${user.id}/login-as`, { method: 'POST', token })
      if (res.token) {
        localStorage.setItem(TOKEN_ELECTION, res.token)
        window.open('/election/app', '_blank')
      }
    } catch (err) {
      alert(err.message || 'Failed to login as user')
    } finally {
      setActiveDropdown(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    if (!editMode && !form.password) {
      alert('Password is required')
      return
    }

    try {
      setSaving(true)
      if (editMode && selectedUser) {
        const payload = { name: form.name, email: form.email }
        if (form.password) payload.password = form.password
        const res = await api(`/api/election-campaign/users/${selectedUser.id}`, {
          method: 'PATCH',
          body: payload,
          token
        })
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? res.user : u))
      } else {
        const res = await api('/api/election-campaign/users', {
          method: 'POST',
          body: form,
          token
        })
        setUsers(prev => [res.user, ...prev])
      }
      setModalOpen(false)
    } catch (err) {
      alert(err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="text-[#FF7A00]" size={22} />
            Users Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Register campaign users and switch accounts directly from the table
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-slate-700 font-bold text-sm">No Users Found</h3>
            <p className="text-slate-400 text-xs mt-1">Click "+ Add User" to register a new user</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Date Created</th>
                  <th className="px-5 py-3.5 text-center">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="px-5 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF7A00] font-black text-xs flex items-center justify-center flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className="bg-orange-50 text-[#FF7A00] border border-orange-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                        {u.role || 'Campaign Member'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4 text-center relative">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleLoginAsUser(u)}
                          className="bg-orange-50 text-[#FF7A00] hover:bg-gradient-to-r hover:from-[#FF7A00] hover:to-[#FFB000] hover:text-white border border-orange-200 hover:border-transparent px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          title="Login as this user"
                        >
                          <LogIn size={13} />
                          <span>Login</span>
                        </button>

                        <button
                          onClick={() => setActiveDropdown(activeDropdown === u.id ? null : u.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="More options"
                        >
                          <Settings size={16} />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {activeDropdown === u.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
                          <div className="absolute right-6 mt-1 w-44 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl z-30 text-left font-medium space-y-0.5">
                            <button
                              onClick={() => handleLoginAsUser(u)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 font-bold transition-colors"
                            >
                              <LogIn size={14} />
                              <span>Login as User</span>
                            </button>

                            <button
                              onClick={() => handleOpenViewModal(u)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                            >
                              <Eye size={14} />
                              <span>View Details</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                            >
                              <Edit size={14} />
                              <span>Edit User</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit / View User Modal - Solid Overlay (NO BACKGROUND BLUR) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <UserCheck className="text-[#FF7A00]" size={20} />
                {viewMode ? 'User Details' : editMode ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  disabled={viewMode}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Anil Kumar Singh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A00] disabled:opacity-75 font-semibold"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    disabled={viewMode}
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="anil@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A00] disabled:opacity-75 font-semibold"
                  />
                </div>
              </div>

              {/* Password */}
              {!viewMode && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password {editMode && '(Leave blank to keep unchanged)'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      required={!editMode}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A00] font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                {!viewMode && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editMode ? 'Update User' : 'Add User'}
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
