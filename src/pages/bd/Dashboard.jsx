import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UserRound, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight, CalendarDays, BookOpen,
  Bot, TrendingUp, DollarSign, Users, Plus, Eye, Pencil, Trash2, Upload, Package,
} from 'lucide-react'
import { api, TOKEN_BD } from '../../lib/api'

const MAIN_TABS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'business',  label: 'Business',  icon: Package },
  { id: 'users',     label: 'Users',     icon: Users },
  { id: 'meetings',  label: 'Meetings',  icon: CalendarDays },
  { id: 'trainings', label: 'Trainings', icon: BookOpen },
  { id: 'ai-agent',  label: 'AI Agent',  icon: Bot },
  { id: 'earnings',  label: 'Earnings',  icon: DollarSign },
  { id: 'profile',   label: 'Profile',   icon: UserRound },
]

const BOTTOM_TABS = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

const BLANK_USER = {
  fullName: '', email: '', mobile: '', city: '', pincode: '', address: '',
  imageKey: '', accountType: 'New', dob: '', profession: '', password: '', confirmPassword: '',
}

function ComingSoon({ icon: Icon, label, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
        <Icon size={32} className="text-white" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">{label}</h2>
      <p className="text-slate-500 text-sm max-w-sm text-center">{desc}</p>
      <span className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
        Coming Soon
      </span>
    </div>
  )
}

export default function BDDashboard() {
  const token = localStorage.getItem(TOKEN_BD)
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(!!token)
  const [me, setMe] = useState(null)
  const [dash, setDash] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)
  const userSettingRef = useRef(null)
  const [bdUsers, setBdUsers] = useState([])
  const [userModal, setUserModal] = useState({ open: false, mode: 'add', item: null })
  const [userForm, setUserForm] = useState(BLANK_USER)
  const [userSaving, setUserSaving] = useState(false)
  const [userViewItem, setUserViewItem] = useState(null)
  const [userImgUploading, setUserImgUploading] = useState(false)
  const [userTab, setUserTab] = useState('all')
  const [userSettingOpen, setUserSettingOpen] = useState(null)
  const [businessTab, setBusinessTab] = useState('all')
  const [businessRows, setBusinessRows] = useState([])

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
      if (userSettingRef.current && !userSettingRef.current.contains(e.target)) setUserSettingOpen(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const load = useCallback(async () => {
    const [meRes, dashRes, usersRes, bizRes] = await Promise.all([
      api('/api/bd/me', { token }),
      api('/api/bd/dashboard', { token }),
      api('/api/bd/users', { token }),
      api('/api/bd/business', { token }),
    ])
    setMe(meRes)
    setDash(dashRes)
    setBdUsers(usersRes.users || [])
    setBusinessRows(bizRes.businesses || [])
  }, [token])

  const refreshUsers = useCallback(async () => {
    const usersRes = await api('/api/bd/users', { token })
    setBdUsers(usersRes.users || [])
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try { await load() } catch {
        localStorage.removeItem(TOKEN_BD)
        navigate('/bd/login')
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [token, navigate, load])

  if (!token) return null

  const logout = () => {
    localStorage.removeItem(TOKEN_BD)
    navigate('/bd/login')
  }

  const stats = dash?.stats || {}
  const initials = (me?.businessName || me?.fullName || 'BD').slice(0, 2).toUpperCase()
  const activeTab = [...MAIN_TABS, ...BOTTOM_TABS].find(t => t.id === active)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Sidebar */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}
        style={{ background: 'linear-gradient(180deg,#fff8f0 0%,#fff3e6 100%)', borderRight: '1px solid #ffe0c0' }}
      >
        {/* Brand */}
        <div className="flex h-[65px] items-center border-b border-orange-200 px-3 flex-shrink-0">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{me?.businessName || 'BD Partner'}</p>
              <p className="truncate text-xs text-slate-500">Ailocity BD • <span className="capitalize">{me?.status || '—'}</span></p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {MAIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={!sidebarOpen ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active === id ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm' : 'text-slate-600 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom tabs */}
        <div className="px-2 pb-3 border-t border-orange-200 pt-2 flex-shrink-0 space-y-0.5">
          {BOTTOM_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={!sidebarOpen ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active === id ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm' : 'text-slate-600 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(s => !s)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="font-semibold text-slate-900 text-lg">{activeTab?.label || 'Dashboard'}</h1>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                BD Dashboard <ChevronRight size={12} /> {activeTab?.label}
              </p>
            </div>
          </div>

          <div className="relative" ref={dropRef}>
            <button type="button" onClick={() => setDropOpen(v => !v)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800">{me?.businessName || '—'}</p>
                <p className="text-xs text-slate-400">{me?.email || '—'}</p>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-sm font-medium text-slate-800">{me?.businessName || '—'}</p>
                  <p className="truncate text-xs text-slate-400">{me?.email || '—'}</p>
                </div>
                <button type="button" onClick={logout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="py-16 text-center text-sm text-slate-500">Loading…</div>}

          {/* Overview */}
          {!loading && active === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'Total Meetings',  value: stats.totalMeetings  ?? 0, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Trainings Done',  value: stats.trainingsDone  ?? 0, icon: BookOpen,     color: 'text-violet-600 bg-violet-50' },
                  { label: 'AI Agent Calls',  value: stats.agentCalls     ?? 0, icon: Bot,          color: 'text-orange-500 bg-orange-50' },
                  { label: 'Total Earnings',  value: `₹${(stats.totalEarnings ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-500 text-sm">{s.label}</p>
                      <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={16} /></div>
                    </div>
                    <p className="text-slate-900 text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'meetings',  label: 'Meetings',  icon: CalendarDays, desc: 'View and manage your scheduled meetings' },
                  { id: 'trainings', label: 'Trainings', icon: BookOpen,     desc: 'Access training modules and track progress' },
                  { id: 'ai-agent',  label: 'AI Agent',  icon: Bot,          desc: 'Your AI-powered sales and support agent' },
                  { id: 'earnings',  label: 'Earnings',  icon: DollarSign,   desc: 'Track your commissions and payouts' },
                  { id: 'profile',   label: 'Profile',   icon: UserRound,    desc: 'Manage your BD partner profile' },
                ].map(card => (
                  <button key={card.id} type="button" onClick={() => setActive(card.id)}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                      <card.icon size={20} className="text-white" />
                    </div>
                    <h3 className="text-slate-900 font-semibold text-sm">{card.label}</h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Business */}
          {!loading && active === 'business' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Business</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Track your business accounts</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Filter Tabs */}
                <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-200">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'client', label: 'Client' },
                    { key: 'server', label: 'Server' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setBusinessTab(t.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        businessTab === t.key
                          ? 'border-orange-500 text-orange-500'
                          : 'border-transparent text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-10" />
                      <col className="w-12" />
                      <col className="w-40" />
                      <col className="w-32" />
                      <col className="w-44" />
                      <col className="w-28" />
                      <col className="w-20" />
                      <col className="w-20" />
                    </colgroup>
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['#', 'Logo', 'Name', 'Category', 'Email', 'Mobile', 'Type', 'Status'].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {businessRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">No business records found.</td>
                        </tr>
                      ) : (
                        businessRows
                          .filter((r) => {
                            const t = String(r.type || '').toLowerCase()
                            return businessTab === 'all' || t === businessTab
                          })
                          .map((r, idx) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-3 py-3 text-sm text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-3">
                                {r.logoUrl
                                  ? <img src={r.logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                  : <div className="w-8 h-8 rounded-full bg-orange-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-orange-600 text-xs font-bold">{(r.name || '?').slice(0, 2).toUpperCase()}</span>
                                    </div>
                                }
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                                <p className="text-xs text-slate-400 truncate">{r.company || '—'}</p>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-xs text-slate-700 truncate">{r.category || '—'}</p>
                                <p className="text-xs text-slate-400 truncate">{r.subCategory || ''}</p>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-xs text-slate-600 truncate">{r.email || '—'}</p>
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-600 truncate">{r.mobile || '—'}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                  r.type === 'client' ? 'bg-orange-100 text-orange-600' :
                                  r.type === 'server' ? 'bg-violet-100 text-violet-700' :
                                  r.type === 'both'   ? 'bg-cyan-100 text-cyan-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{r.type || '—'}</span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                }`}>{r.status || '—'}</span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Meetings */}
          {!loading && active === 'meetings' && (
            <ComingSoon icon={CalendarDays} label="Meetings" desc="Schedule and manage your client meetings. Track attendance, notes and follow-ups all in one place." />
          )}

          {/* Trainings */}
          {!loading && active === 'trainings' && (
            <ComingSoon icon={BookOpen} label="Trainings" desc="Access product training modules, watch videos and track your learning progress and certifications." />
          )}

          {/* AI Agent */}
          {!loading && active === 'ai-agent' && (
            <ComingSoon icon={Bot} label="AI Agent" desc="Your personal AI-powered assistant to help with sales pitches, client queries and automated follow-ups." />
          )}

          {/* Earnings */}
          {!loading && active === 'earnings' && (
            <ComingSoon icon={DollarSign} label="Earnings" desc="View your commission structure, track monthly earnings, pending payouts and transaction history." />
          )}

          {/* Users */}
          {!loading && active === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Users</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{bdUsers.length} total users</p>
                </div>
                <button type="button" onClick={() => { setUserForm(BLANK_USER); setUserModal({ open: true, mode: 'add', item: null }) }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                  <Plus size={16} /> Add User
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Filter Tabs */}
                <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-200">
                  {[
                    { key: 'all',      label: 'All',      color: 'text-slate-600',   count: bdUsers.length },
                    { key: 'New',      label: 'New',      color: 'text-blue-600',    count: bdUsers.filter(u => u.accountType === 'New').length },
                    { key: 'Active',   label: 'Active',   color: 'text-emerald-600', count: bdUsers.filter(u => u.accountType === 'Active').length },
                    { key: 'Premium',  label: 'Premium',  color: 'text-violet-600',  count: bdUsers.filter(u => u.accountType === 'Premium').length },
                    { key: 'Inactive', label: 'Inactive', color: 'text-slate-500',   count: bdUsers.filter(u => u.accountType === 'Inactive').length },
                  ].map(tab => (
                    <button key={tab.key} type="button"
                      onClick={() => setUserTab(tab.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        userTab === tab.key ? 'border-orange-500 text-orange-500' : `border-transparent ${tab.color} hover:text-slate-800`
                      }`}>
                      {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['#', 'Name', 'Email', 'Mobile', 'City', 'Account Type', 'Profession', 'Settings'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bdUsers.length === 0 ? (
                        <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">No users yet. Click "Add User" to get started.</td></tr>
                      ) : (userTab === 'all' ? [...bdUsers].reverse() : [...bdUsers].reverse().filter(u => u.accountType === userTab)).map((u, idx) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {u.imageUrl
                                ? <img src={u.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                                : <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>{(u.fullName||'?').slice(0,2).toUpperCase()}</div>
                              }
                              <span className="text-sm font-medium text-slate-800 truncate max-w-[120px]">{u.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[150px]">{u.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{u.mobile || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{u.city || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              u.accountType === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                              u.accountType === 'Premium' ? 'bg-violet-100 text-violet-700' :
                              u.accountType === 'Inactive' ? 'bg-slate-200 text-slate-600' :
                              'bg-blue-100 text-blue-700'
                            }`}>{u.accountType || 'New'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{u.profession || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="relative" ref={userSettingOpen === u.id ? userSettingRef : null}>
                              <button
                                type="button"
                                onClick={() => setUserSettingOpen(userSettingOpen === u.id ? null : u.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              >
                                <Settings size={15} />
                              </button>
                              {userSettingOpen === u.id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
                                  <button type="button" onClick={() => { setUserSettingOpen(null); setUserViewItem(u) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <Eye size={13} /> View
                                  </button>
                                  <button type="button" onClick={() => { setUserSettingOpen(null); setUserForm({ ...BLANK_USER, ...u }); setUserModal({ open: true, mode: 'edit', item: u }) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <Pencil size={13} /> Edit
                                  </button>
                                  <button type="button" onClick={async () => {
                                    setUserSettingOpen(null)
                                    if (!window.confirm('Delete this user?')) return
                                    try {
                                      await api(`/api/bd/users/${u.id}`, { token, method: 'DELETE' })
                                      await refreshUsers()
                                    } catch (err) { alert(err.message || 'Delete failed') }
                                  }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Profile */}
          {!loading && active === 'profile' && (
            <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">BD Partner Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Business Name', me?.businessName],
                  ['Full Name',     me?.fullName],
                  ['Email',         me?.email],
                  ['Mobile',        me?.mobile],
                  ['App',           'Ailocity BD'],
                  ['Status',        me?.status],
                  ['KYC',           me?.kyc],
                  ['Credits',       me?.creditsBalance],
                ].map(([l, v]) => v !== undefined && v !== '' ? (
                  <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{String(v)}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Settings */}
          {!loading && active === 'settings' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                {[
                  { label: 'Account Settings', desc: 'Manage your account preferences' },
                  { label: 'Notifications',     desc: 'Configure notification preferences' },
                  { label: 'Security',          desc: 'Password and security settings' },
                  { label: 'Payout Settings',   desc: 'Configure your payout method and details' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <p className="text-slate-800 font-medium text-sm">{s.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{s.desc}</p>
                    </div>
                    <span className="text-xs text-orange-500 font-medium">Coming Soon</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* User Add/Edit Modal */}
      {userModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setUserModal({ open: false, mode: 'add', item: null })}>
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{userModal.mode === 'add' ? 'Add User' : 'Edit User'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in the user details</p>
              </div>
              <button type="button" onClick={() => setUserModal({ open: false, mode: 'add', item: null })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-5 py-4 space-y-5">
              {/* User Information */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">User Information</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'fullName',   label: 'Full Name',     required: true,  placeholder: 'Enter full name' },
                    { key: 'email',      label: 'Email Address', required: true,  placeholder: 'vijay@gmail.com', type: 'email' },
                    { key: 'mobile',     label: 'Mobile Number', required: true,  placeholder: 'Enter mobile number' },
                    { key: 'city',       label: 'City',          required: true,  placeholder: 'Enter city' },
                    { key: 'pincode',    label: 'Pincode',       required: true,  placeholder: 'Enter pincode' },
                    { key: 'address',    label: 'Address',       required: false, placeholder: 'Enter address' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-slate-600 mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                      <input
                        type={f.type || 'text'}
                        value={userForm[f.key]}
                        onChange={e => setUserForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">User Image</label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 hover:border-orange-400 transition-colors">
                      <Upload size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-500 truncate">{userImgUploading ? 'Uploading…' : userForm.imageKey ? '✓ Uploaded' : 'No file chosen'}</span>
                      {!userForm.imageKey && !userImgUploading && <span className="ml-auto text-xs text-slate-400 flex-shrink-0">PNG, JPG up to 10MB</span>}
                      <input type="file" accept="image/*" className="hidden" disabled={userImgUploading} onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return
                        setUserImgUploading(true)
                        try {
                          const fd = new FormData(); fd.append('file', file)
                          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bd/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error || 'Upload failed')
                          setUserForm(p => ({ ...p, imageKey: data.key }))
                        } catch (err) {
                          alert(err.message || 'Image upload failed')
                        } finally { setUserImgUploading(false) }
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Account Details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Account Details</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Account Type</label>
                    <select value={userForm.accountType} onChange={e => setUserForm(p => ({ ...p, accountType: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      {['New', 'Active', 'Premium', 'Inactive'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Date of Birth</label>
                    <input type="date" value={userForm.dob} onChange={e => setUserForm(p => ({ ...p, dob: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Profession</label>
                    <input value={userForm.profession} onChange={e => setUserForm(p => ({ ...p, profession: e.target.value }))} placeholder="Enter profession" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Account Security */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Account Security</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Password {userModal.mode === 'add' && <span className="text-red-500">*</span>}</label>
                    <input type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Confirm Password {userModal.mode === 'add' && <span className="text-red-500">*</span>}</label>
                    <input type="password" value={userForm.confirmPassword} onChange={e => setUserForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm password" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">* Required fields</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setUserModal({ open: false, mode: 'add', item: null })} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                  <button type="button" disabled={userSaving} onClick={async () => {
                    if (!userForm.fullName.trim() || !userForm.email.trim() || !userForm.mobile.trim()) return alert('Full name, email and mobile are required')
                    if (userModal.mode === 'add' && !userForm.password) return alert('Password is required')
                    if (userForm.password && userForm.password !== userForm.confirmPassword) return alert('Passwords do not match')
                    setUserSaving(true)
                    try {
                      const { confirmPassword: _confirmPassword, ...body } = userForm
                      if (userModal.mode === 'add') {
                        await api('/api/bd/users', { token, method: 'POST', body })
                      } else {
                        await api(`/api/bd/users/${userModal.item.id}`, { token, method: 'PATCH', body })
                      }
                      // Always reload: backend attaches presigned `imageUrl` per user.
                      await refreshUsers()
                      setUserModal({ open: false, mode: 'add', item: null })
                    } catch (err) {
                      alert(err.message || 'Save failed')
                    } finally {
                      setUserSaving(false)
                    }
                  }} className="rounded-lg px-5 py-1.5 text-sm font-medium text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                    {userSaving ? 'Saving...' : userModal.mode === 'add' ? 'Add User' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User View Modal */}
      {userViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setUserViewItem(null)}>
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                {userViewItem.imageUrl
                  ? <img src={userViewItem.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                      {(userViewItem.fullName || '?').slice(0, 2).toUpperCase()}
                    </div>
                }
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{userViewItem.fullName}</h2>
                  <p className="text-xs text-slate-500">{userViewItem.profession || '—'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setUserViewItem(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {/* Body */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              {[
                ['Email',        userViewItem.email],
                ['Mobile',       userViewItem.mobile],
                ['City',         userViewItem.city],
                ['Pincode',      userViewItem.pincode],
                ['Address',      userViewItem.address],
                ['Account Type', userViewItem.accountType],
                ['Date of Birth',userViewItem.dob],
                ['Profession',   userViewItem.profession],
                ['Created At',   userViewItem.createdAt ? new Date(userViewItem.createdAt).toLocaleDateString('en-IN') : null],
              ].map(([l, v]) => v ? (
                <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5 break-all">{v}</p>
                </div>
              ) : null)}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={() => { setUserViewItem(null); setUserForm({ ...BLANK_USER, ...userViewItem }); setUserModal({ open: true, mode: 'edit', item: userViewItem }) }} className="rounded-lg px-4 py-1.5 text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>Edit</button>
              <button type="button" onClick={() => setUserViewItem(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

