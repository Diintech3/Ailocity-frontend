import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  UserCheck,
  Activity,
  Menu,
  X,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { api, TOKEN_SUPERADMIN } from '../../lib/api'

const NAV = [
  { icon: LayoutDashboard, label: 'Overview',  id: 'overview' },
  { icon: Users,           label: 'Admins',    id: 'admins'   },
  { icon: Building2,       label: 'Business',  id: 'clients'  },
  { icon: Package,         label: 'Plans',     id: 'plans'    },
  { icon: Tag,             label: 'Coupons',   id: 'coupons'  },
  { icon: CreditCard,      label: 'Credits',   id: 'credits'  },
]

// Superadmin Dashboard - Platform owner ka dashboard
export default function SuperadminDashboard() {
  const token = localStorage.getItem(TOKEN_SUPERADMIN)
  const navigate = useNavigate()

  const [active,      setActive]      = useState('overview')
  const [collapsed,   setCollapsed]   = useState(false)
  const [dash,        setDash]        = useState(null)
  const [adminsList,  setAdminsList]  = useState([])
  const [clientsList, setClientsList] = useState([])
  const [appsList, setAppsList] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientPage, setClientPage] = useState(1)
  const CLIENT_PER_PAGE = 20
  const [appsSearch, setAppsSearch] = useState('')
  const [loading,     setLoading]     = useState(!!token)
  const [showAdd,     setShowAdd]     = useState(false)
  const [addForm,     setAddForm]     = useState({ name: '', email: '', password: '' })
  const [addErr,      setAddErr]      = useState('')
  const [addBusy,     setAddBusy]     = useState(false)
  const [delBusy,     setDelBusy]     = useState(null)
  const [dropOpen,    setDropOpen]    = useState(false)
  const dropRef = useRef(null)
  const [adminSettingOpen, setAdminSettingOpen] = useState(null)
  const [viewAdmin,   setViewAdmin]   = useState(null)
  const [editAdmin,   setEditAdmin]   = useState(null)
  const [editForm,    setEditForm]    = useState({ name: '', status: 'active' })
  const [editBusy,    setEditBusy]    = useState(false)
  const adminSettingRef = useRef(null)
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 })

  // decode email from JWT payload (no library needed — just base64)
  const superadminEmail = (() => {
    try {
      return JSON.parse(atob(token.split('.')[1])).email || 'superadmin@ailocity.com'
    } catch {
      return 'superadmin@ailocity.com'
    }
  })()

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
      if (adminSettingRef.current && !adminSettingRef.current.contains(e.target)) setAdminSettingOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadDashboard = useCallback(async () => {
    const d = await api('/api/superadmin/dashboard', { token })
    setDash(d)
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        await loadDashboard()
        const full = await api('/api/superadmin/admins', { token })
        if (!cancelled) setAdminsList(full.admins || [])
      } catch {
        localStorage.removeItem(TOKEN_SUPERADMIN)
        navigate('/superadmin/login')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [token, navigate, loadDashboard])

  useEffect(() => {
    if (active !== 'admins' || !token) return
    api('/api/superadmin/admins', { token })
      .then((r) => setAdminsList(r.admins || []))
      .catch(() => {})
  }, [active, token])

  useEffect(() => {
    if (active !== 'clients' || !token) return
    api('/api/superadmin/clients', { token })
      .then((r) => setClientsList(r.clients || []))
      .catch(() => {})
  }, [active, token])

  useEffect(() => {
    if (active !== 'apps' || !token) return
    api('/api/superadmin/apps', { token })
      .then((r) => setAppsList(r.apps || []))
      .catch(() => {})
  }, [active, token])

  if (!token) return null

  const logout = () => {
    localStorage.removeItem(TOKEN_SUPERADMIN)
    navigate('/superadmin/login')
  }

  const submitAddAdmin = async (e) => {
    e.preventDefault()
    setAddErr('')
    setAddBusy(true)
    try {
      await api('/api/superadmin/admins', { method: 'POST', token, body: addForm })
      setShowAdd(false)
      setAddForm({ name: '', email: '', password: '' })
      await loadDashboard()
      const full = await api('/api/superadmin/admins', { token })
      setAdminsList(full.admins || [])
    } catch (err) {
      setAddErr(err.message || 'Could not create admin')
    } finally {
      setAddBusy(false)
    }
  }

  const deleteAdmin = async (id) => {
    if (!confirm('Delete this admin?')) return
    setDelBusy(id)
    try {
      await api(`/api/superadmin/admins/${id}`, { method: 'DELETE', token })
      await loadDashboard()
      const full = await api('/api/superadmin/admins', { token })
      setAdminsList(full.admins || [])
    } catch (err) {
      alert(err.message || 'Delete failed')
    } finally {
      setDelBusy(null)
    }
  }


  const stats = dash?.stats
    ? [
        { label: 'Total Admins',  value: dash.stats.totalAdmins,  icon: Users,      color: 'bg-orange-50 text-orange-500'  },
        { label: 'Active Admins', value: dash.stats.activeAdmins, icon: Activity,   color: 'bg-orange-50 text-orange-500'  },
        { label: 'Total Clients', value: dash.stats.totalClients, icon: UserCheck,  color: 'bg-emerald-50 text-emerald-600'},
      ]
    : []

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">

      {/* ── Sidebar ── */}

      <aside className={`flex-shrink-0 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-60'}`} style={{background:'linear-gradient(180deg,#fff8f0 0%,#fff3e6 100%)',borderRight:'1px solid #ffe0c0'}}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-[65px] border-b border-orange-200">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-slate-800 font-semibold text-sm leading-tight">Superadmin</p>
              <p className="text-slate-500 text-xs">Platform Owner</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div className="px-3 pb-4 border-t border-orange-200 pt-3">
          <button
            type="button"
            onClick={() => setActive('settings')}
            title={collapsed ? 'Settings' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active === 'settings'
                ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100'
            }`}
          >
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-[65px] bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
            <div>
              <h1 className="text-slate-900 font-semibold text-base capitalize">{active === 'clients' ? 'Business' : active}</h1>
              <p className="text-black/60 text-xs flex items-center gap-1">
                Superadmin <ChevronRight size={11} /> <span className="capitalize">{active === 'clients' ? 'Business' : active}</span>
              </p>
            </div>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              type="button"
              onClick={() => setDropOpen(!dropOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF7A00] to-[#FFB000] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">SA</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-slate-800 text-sm font-medium leading-tight">Superadmin</p>
                <p className="text-black/60 text-xs">{superadminEmail}</p>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 py-1 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-slate-800 text-sm font-medium">Superadmin</p>
                  <p className="text-black/60 text-xs truncate">{superadminEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          )}

          {/* Overview */}
          {!loading && active === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-slate-500 text-sm">{s.label}</p>
                      <div className={`p-2 rounded-lg ${s.color}`}>
                        <s.icon size={16} />
                      </div>
                    </div>
                    <p className="text-slate-900 text-3xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Admins */}
          {!loading && active === 'admins' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-slate-800 font-semibold text-sm">All Admins</h2>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Admin
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Clients</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Login</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminsList.map((a) => (
                    <tr key={a.email} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 text-xs font-semibold">{a.name[0].toUpperCase()}</span>
                          </div>
                          <span className="text-slate-800 font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{a.email}</td>
                      <td className="px-6 py-3.5 text-slate-500">{a.clients}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await api(`/api/superadmin/admins/${a.id}/impersonate`, { method: 'POST', token })
                              localStorage.setItem('ailocity_token_admin', res.token)
                              window.open('/admin/dashboard', '_blank')
                            } catch (err) {
                              alert(err.message || 'Login failed')
                            }
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Login
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="relative flex justify-end" ref={adminSettingOpen === a.id ? adminSettingRef : null}>
                          <button
                            type="button"
                            onClick={(e) => {
                              if (adminSettingOpen === a.id) { setAdminSettingOpen(null); return }
                              const rect = e.currentTarget.getBoundingClientRect()
                              setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                              setAdminSettingOpen(a.id)
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Settings size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {adminsList.length === 0 && (
                <p className="px-6 py-10 text-center text-slate-400 text-sm">No admins yet — add one above.</p>
              )}
            </div>
          )}

          {/* Clients / Business */}
          {!loading && active === 'clients' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-slate-800 font-semibold text-sm">All Business</h2>
                <input
                  type="text"
                  placeholder="Search businesses…"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setClientPage(1) }}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 w-56"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['#', 'Logo', 'Business', 'Admin', 'Territory', 'Email', 'Mobile', 'KYC', 'Status', 'Login'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filtered = clientsList.filter((c) => {
                        const q = clientSearch.toLowerCase()
                        return !q || c.businessName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.mobile || '').includes(q)
                      })
                      const totalPages = Math.ceil(filtered.length / CLIENT_PER_PAGE)
                      const paged = filtered.slice((clientPage - 1) * CLIENT_PER_PAGE, clientPage * CLIENT_PER_PAGE)
                      return (
                        <>
                          {paged.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs">{(clientPage - 1) * CLIENT_PER_PAGE + idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {c.logoUrl
                                ? <img src={c.logoUrl} alt="logo" className="w-full h-full object-cover" />
                                : <span className="text-orange-600 text-xs font-bold">{c.businessName?.[0]?.toUpperCase() || '?'}</span>
                              }
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[150px]">
                            <p className="text-slate-800 font-medium text-sm truncate">{c.businessName}</p>
                            <p className="text-slate-400 text-xs truncate">{c.fullName}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.adminName}</td>
                          <td className="px-4 py-3 max-w-[120px]">
                            {c.territory?.podNumber ? (
                              <div>
                                <p className="text-xs font-medium text-orange-600 truncate">{c.territory.podNumber}</p>
                                <p className="text-xs text-slate-400 truncate">{c.territory.cityName}{c.territory.regionName ? ` · ${c.territory.regionName}` : ''}</p>
                              </div>
                            ) : <span className="text-xs text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate">{c.email}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.mobile || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                              c.kyc === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                              c.kyc === 'rejected' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>{c.kyc || 'pending'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                              c.status === 'prime'    ? 'bg-emerald-50 text-emerald-700' :
                              c.status === 'new'      ? 'bg-blue-50 text-blue-700' :
                              c.status === 'rejected' ? 'bg-red-50 text-red-700' :
                              c.status === 'demo'     ? 'bg-amber-50 text-amber-700' :
                              c.status === 'in-house' ? 'bg-orange-50 text-orange-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>{c.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const id = c.refClientId || c.parentClientId
                                  const res = await api(`/api/superadmin/clients/${id}/impersonate`, { method: 'POST', token })
                                  localStorage.setItem('ailocity_token_client', res.token)
                                  window.open('/client/portal', '_blank')
                                } catch (err) { alert(err.message || 'Login failed') }
                              }}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
                            >Login</button>
                          </td>
                        </tr>
                      ))}
                          {totalPages > 1 && (
                            <tr>
                              <td colSpan={10} className="px-4 py-3 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-slate-500">
                                    Showing {(clientPage - 1) * CLIENT_PER_PAGE + 1}–{Math.min(clientPage * CLIENT_PER_PAGE, filtered.length)} of {filtered.length}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => setClientPage(p => Math.max(1, p - 1))} disabled={clientPage === 1}
                                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                      .filter(p => p === 1 || p === totalPages || Math.abs(p - clientPage) <= 1)
                                      .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('...'); acc.push(p); return acc }, [])
                                      .map((p, i) => p === '...' ? (
                                        <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
                                      ) : (
                                        <button key={p} type="button" onClick={() => setClientPage(p)}
                                          className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                                            clientPage === p ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white border-orange-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                          }`}>{p}</button>
                                      ))}
                                    <button type="button" onClick={() => setClientPage(p => Math.min(totalPages, p + 1))} disabled={clientPage === totalPages}
                                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
              {clientsList.length === 0 && (
                <p className="px-6 py-10 text-center text-slate-400 text-sm">No businesses found.</p>
              )}
            </div>
          )}

          {/* Apps */}
          {!loading && active === 'apps' && (
            <div className="space-y-4">
              <h2 className="text-slate-800 font-semibold">All Apps</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['#', 'Logo', 'App', 'App ID', 'Total Clients', 'Action'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appsList.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-6 py-3.5">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                            {app.name.slice(0,2).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-slate-800 font-medium">{app.name}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">{app.id}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">{app.clientCount} clients</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <button type="button" onClick={async () => {
                              try {
                                const res = await api(`/api/superadmin/apps/${app.id}/impersonate`, { method: 'POST', token })
                                localStorage.setItem('ailocity_token_client', res.token)
                                window.open('/client/portal', '_blank')
                              } catch (err) { alert(err.message || 'Login failed') }
                            }}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">Login</button>
                        </td>
                      </tr>
                    ))}
                    {appsList.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">No apps found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Coming soon pages */}
          {!loading && ['plans', 'coupons', 'credits', 'settings'].includes(active) && (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
              <p className="text-slate-700 font-medium capitalize">{active}</p>
              <p className="text-slate-400 text-sm mt-1">Coming soon</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Admin Settings Dropdown (fixed — table overflow se clip nahi hoga) ── */}
      {adminSettingOpen && (() => {
        const a = adminsList.find(x => x.id === adminSettingOpen)
        if (!a) return null
        return (
          <div
            ref={adminSettingRef}
            style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
            className="w-36 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
          >
            <button type="button" onClick={() => { setAdminSettingOpen(null); setViewAdmin(a) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">View</button>
            <button type="button" onClick={() => { setAdminSettingOpen(null); setEditAdmin(a); setEditForm({ name: a.name, status: a.status }) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit</button>
            <button type="button" disabled={delBusy === a.id} onClick={() => { setAdminSettingOpen(null); deleteAdmin(a.id) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">Delete</button>
          </div>
        )
      })()}

      {/* ── View Admin Modal ── */}
      {viewAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewAdmin(null)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 font-semibold">Admin Details</h3>
              <button type="button" onClick={() => setViewAdmin(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                ['Name', viewAdmin.name],
                ['Email', viewAdmin.email],
                ['Status', viewAdmin.status],
                ['Clients', viewAdmin.clients],
                ['Created At', viewAdmin.createdAt ? new Date(viewAdmin.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{l}</p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{String(v ?? '—')}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-slate-200">
              <button type="button" onClick={() => setViewAdmin(null)} className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Admin Modal ── */}
      {editAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditAdmin(null)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 font-semibold">Edit Admin</h3>
              <button type="button" onClick={() => setEditAdmin(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setEditBusy(true)
              try {
                await api(`/api/superadmin/admins/${editAdmin.id}`, { method: 'PATCH', token, body: editForm })
                setEditAdmin(null)
                const full = await api('/api/superadmin/admins', { token })
                setAdminsList(full.admins || [])
                await loadDashboard()
              } catch (err) { alert(err.message || 'Update failed') }
              finally { setEditBusy(false) }
            }} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditAdmin(null)} className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={editBusy} className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-sm font-medium text-white disabled:opacity-60">
                  {editBusy ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Admin Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => { setShowAdd(false); setAddErr('') }}
          />
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl p-6 z-10">
            <h3 className="text-slate-900 font-semibold">New Admin</h3>
            <p className="text-slate-400 text-sm mt-0.5">Creates an admin who can manage clients.</p>

            {addErr && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {addErr}
              </div>
            )}

            <form onSubmit={submitAddAdmin} className="mt-4 space-y-3">
              {[
                { label: 'Name',     key: 'name',     type: 'text'     },
                { label: 'Email',    key: 'email',    type: 'email'    },
                { label: 'Password', key: 'password', type: 'password' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600">{label}</label>
                  <input
                    type={type}
                    required
                    minLength={key === 'password' ? 6 : undefined}
                    value={addForm[key]}
                    onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setAddErr('') }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBusy}
                  className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60"
                >
                  {addBusy ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}













