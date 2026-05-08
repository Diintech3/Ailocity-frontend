import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  AppWindow,
  Users,
  LogOut,
  ChevronRight,
  Search,
  X,
  Upload,
  Settings,
  Eye,
  Pencil,
  Trash2,
  Bot,
  HeadphonesIcon,
  HelpCircle,
  Menu,
  ChevronDown,
} from 'lucide-react'
import { api, TOKEN_ADMIN, TOKEN_CLIENT, TOKEN_BD } from '../../lib/api'

function LogoImage({ logoKey, token }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!logoKey) return
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/presigned-url?key=${encodeURIComponent(logoKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.url) setUrl(d.url) })
      .catch(() => {})
  }, [logoKey, token])

  return url
    ? <img src={url} alt="logo" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
    : <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center"><span className="text-black/60 text-xs">…</span></div>
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
  { icon: AppWindow, label: 'Apps', id: 'app' },
  { icon: HeadphonesIcon, label: 'Support', id: 'support' },
  { icon: HelpCircle, label: 'Help', id: 'help' },
  { icon: Settings, label: 'Settings', id: 'settings' },
]

const kycColors = {
  verified: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  pending: 'bg-amber-50 text-amber-700 border border-amber-100',
  rejected: 'bg-red-50 text-red-700 border border-red-100',
}

const statusColors = {
  prime: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  new: 'bg-blue-50 text-blue-700 border border-blue-100',
  demo: 'bg-amber-50 text-amber-700 border border-amber-100',
  testing: 'bg-orange-50 text-orange-700 border border-orange-100',
  rejected: 'bg-red-50 text-red-700 border border-red-100',
  'in-house': 'bg-orange-50 text-orange-600 border border-orange-100',
}

const statusTabOrder = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Prime', value: 'prime' },
  { label: 'Demo', value: 'demo' },
  { label: 'In-house', value: 'in-house' },
  { label: 'Testing', value: 'testing' },
  { label: 'Rejected', value: 'rejected' },
]

const CATEGORY_MAP = {
  'Real Estate':       ['Residential', 'Commercial', 'Plots', 'Rental'],
  'Healthcare':        ['Hospital', 'Clinic', 'Pharmacy', 'Lab'],
  'Education':         ['School', 'College', 'Coaching', 'Online'],
  'Retail':            ['Grocery', 'Fashion', 'Electronics', 'General'],
  'Restaurant / Food': ['Restaurant', 'Cafe', 'Cloud Kitchen', 'Catering'],
  'IT / Software':     ['Web Dev', 'App Dev', 'SaaS', 'Agency'],
  'Finance':           ['CA', 'Insurance', 'Loans', 'Investment'],
  'Manufacturing':     ['FMCG', 'Industrial', 'Textile', 'Auto Parts'],
  'Logistics':         ['Transport', 'Courier', 'Warehouse'],
  'Salon / Beauty':    ['Salon', 'Spa', 'Makeup', 'Skincare'],
  'Gym / Fitness':     ['Gym', 'Yoga', 'Sports', 'Nutrition'],
  'Legal':             ['Advocate', 'Law Firm', 'Compliance'],
  'Travel':            ['Tour Operator', 'Hotel', 'Visa', 'Cab'],
  'Automobile':        ['Showroom', 'Service Center', 'Spare Parts'],
  'Other':             ['Other'],
}

const CATEGORIES = Object.keys(CATEGORY_MAP)

const emptyForm = {
  // Business
  businessName: '', businessType: '', category: '', subCategory: '',
  businessEmail: '', businessPhone: '', websiteUrl: '', establishedYear: '',
  employeeCount: '', annualRevenue: '',
  // Documents
  gstNumber: '', panNumber: '', aadharNumber: '', cinNumber: '', msmeNumber: '',
  // Logo
  businessLogo: null, businessLogoKey: '',
  // Social
  instagramUrl: '', facebookUrl: '', linkedinUrl: '', googleBusinessUrl: '',
  // Owner
  fullName: '', email: '', mobile: '', alternateMobile: '',
  // Location
  address: '', city: '', state: '', pincode: '', country: 'India',
  // Banking
  bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
  // CRM
  source: 'Direct', owner: '', dealValue: '', nextFollowUp: '', notes: '',
  // Account
  appId: 'ailocity', status: 'new', kyc: 'pending', agents: 0,
  password: '', confirmPassword: '',
}

// Admin Dashboard - Admin ka dashboard (clients/apps manage karta hai)
export default function AdminDashboard() {
  const token = localStorage.getItem(TOKEN_ADMIN)
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [appSearch, setAppSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [logoUploading, setLogoUploading] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [profileDropOpen, setProfileDropOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [editLogoUploading, setEditLogoUploading] = useState(false)
  const [viewClient, setViewClient] = useState(null)
  const dropdownRef = useRef(null)
  const profileDropRef = useRef(null)
  const navigate = useNavigate()

  const adminEmail = (() => {
    try {
      return JSON.parse(atob(token.split('.')[1])).email || 'admin@ailocity.com'
    } catch {
      return 'admin@ailocity.com'
    }
  })()

  const adminName = (() => {
    try {
      const name = JSON.parse(atob(token.split('.')[1])).name || 'Admin'
      return name.toLowerCase().includes('admin') ? 'Admin' : name.split(' ')[0]
    } catch {
      return 'Admin'
    }
  })()

  const [dash, setDash] = useState(null)
  const [clients, setClients] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(async () => {
    if (!token) return
    const [d, cList, appsRes] = await Promise.all([
      api('/api/admin/dashboard', { token }),
      api('/api/admin/apps', { token }),
      api('/api/apps'),
    ])
    setDash(d)
    setClients(cList.clients || [])
    setApps(appsRes.apps || [])
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        await refreshData()
      } catch {
        localStorage.removeItem(TOKEN_ADMIN)
        navigate('/admin/login')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, navigate, refreshData])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
      if (profileDropRef.current && !profileDropRef.current.contains(e.target)) {
        setProfileDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  const filteredApps = clients.filter((c) => {
    const q = appSearch.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.business.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  const handleFormChange = async (e) => {
    const { name, value, files } = e.target
    if (name === 'businessLogo' && files?.[0]) {
      const file = files[0]
      setLogoUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        setForm((prev) => ({ ...prev, businessLogoKey: data.key, businessLogo: file }))
      } catch (err) {
        alert(err.message || 'Logo upload failed')
      } finally {
        setLogoUploading(false)
      }
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    try {
      await api('/api/admin/apps', {
        method: 'POST',
        token,
        body: {
          businessName: form.businessName, businessType: form.businessType,
          category: form.category, subCategory: form.subCategory,
          businessEmail: form.businessEmail, businessPhone: form.businessPhone,
          websiteUrl: form.websiteUrl, establishedYear: form.establishedYear,
          employeeCount: form.employeeCount, annualRevenue: form.annualRevenue,
          gstNumber: form.gstNumber, panNumber: form.panNumber,
          aadharNumber: form.aadharNumber, cinNumber: form.cinNumber, msmeNumber: form.msmeNumber,
          businessLogoKey: form.businessLogoKey || '',
          instagramUrl: form.instagramUrl, facebookUrl: form.facebookUrl,
          linkedinUrl: form.linkedinUrl, googleBusinessUrl: form.googleBusinessUrl,
          fullName: form.fullName, email: form.email,
          mobile: form.mobile, alternateMobile: form.alternateMobile,
          address: form.address, city: form.city, state: form.state,
          pincode: form.pincode, country: form.country,
          bankName: form.bankName, accountHolderName: form.accountHolderName,
          accountNumber: form.accountNumber, ifscCode: form.ifscCode,
          source: form.source, owner: form.owner, dealValue: form.dealValue,
          nextFollowUp: form.nextFollowUp, notes: form.notes,
          appId: form.appId, status: form.status, kyc: form.kyc,
          agents: form.agents, password: form.password,
        },
      })
      setShowForm(false)
      setForm(emptyForm)
      await refreshData()
    } catch (err) {
      alert(err.message || 'Failed to create client')
    }
  }

  const handleEditLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setEditClient((prev) => ({ ...prev, businessLogoKey: data.key }))
    } catch (err) {
      alert(err.message || 'Logo upload failed')
    } finally {
      setEditLogoUploading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await api(`/api/admin/apps/${editClient.id}`, {
        method: 'PATCH',
        token,
        body: {
          businessName: editClient.business, businessType: editClient.businessType || '',
          category: editClient.category || '', subCategory: editClient.subCategory || '',
          businessEmail: editClient.businessEmail || '', businessPhone: editClient.businessPhone || '',
          websiteUrl: editClient.websiteUrl || '', establishedYear: editClient.establishedYear || '',
          employeeCount: editClient.employeeCount || '', annualRevenue: editClient.annualRevenue || '',
          gstNumber: editClient.gstNumber || '', panNumber: editClient.panNumber || '',
          aadharNumber: editClient.aadharNumber || '', cinNumber: editClient.cinNumber || '',
          msmeNumber: editClient.msmeNumber || '', businessLogoKey: editClient.businessLogoKey || '',
          instagramUrl: editClient.instagramUrl || '', facebookUrl: editClient.facebookUrl || '',
          linkedinUrl: editClient.linkedinUrl || '', googleBusinessUrl: editClient.googleBusinessUrl || '',
          fullName: editClient.name, mobile: editClient.mobile,
          alternateMobile: editClient.alternateMobile || '',
          address: editClient.address || '', city: editClient.city || '',
          state: editClient.state || '', pincode: editClient.pincode || '',
          country: editClient.country || 'India',
          bankName: editClient.bankName || '', accountHolderName: editClient.accountHolderName || '',
          accountNumber: editClient.accountNumber || '', ifscCode: editClient.ifscCode || '',
          source: editClient.source || '', owner: editClient.owner || '',
          dealValue: editClient.dealValue || '', nextFollowUp: editClient.nextFollowUp || '',
          notes: editClient.notes || '', agents: editClient.agents,
          status: editClient.status, kyc: editClient.kyc,
        },
      })
      setEditClient(null)
      setOpenDropdown(null)
      await refreshData()
    } catch (err) {
      alert(err.message || 'Update failed')
    }
  }


  const deleteClient = async (id) => {
    if (!confirm('Delete this client?')) return
    try {
      await api(`/api/admin/apps/${id}`, { method: 'DELETE', token })
      setOpenDropdown(null)
      await refreshData()
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_ADMIN)
    navigate('/admin/login')
  }

  const overviewStats = dash?.stats
    ? [
        { label: 'Total Apps', value: String(dash.stats.totalClients), icon: Users, color: 'text-blue-600 bg-blue-50' },
        { label: 'Total Agents', value: String(dash.stats.activeAgents), icon: Bot, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Active Agents', value: String(dash.stats.activeAgents), icon: Bot, color: 'text-orange-500 bg-orange-50' },
      ]
    : []

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <aside
        className={`relative flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
        style={{background:'linear-gradient(180deg,#FF7A00 0%,#cc6200 100%)'}}
      >
        <div className="flex items-center border-b border-black/20 px-4" style={{ height: 65 }}>
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="text-black font-semibold text-sm whitespace-nowrap">Admin Portal</p>
              <p className="text-black/60 text-xs whitespace-nowrap">Ailocity Platform</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems
            .filter((n) => !['support', 'help', 'settings'].includes(n.id))
            .map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActive(id)
                  setShowForm(false)
                }}
                title={!sidebarOpen ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active === id
                    ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md shadow-orange-500/25'
                    : 'text-black/70 hover:text-black hover:bg-white/20'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              </button>
            ))}
        </nav>

        <div className="px-3 pb-4 border-t border-black/20 pt-3 space-y-0.5">
          {navItems
            .filter((n) => ['support', 'help', 'settings'].includes(n.id))
            .map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActive(id)
                  setShowForm(false)
                }}
                title={!sidebarOpen ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active === id
                    ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md shadow-orange-500/25'
                    : 'text-black/70 hover:text-black hover:bg-white/20'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              </button>
            ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[65px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-slate-900 font-semibold text-lg">
                {navItems.find((n) => n.id === active)?.label}
              </h1>
              <p className="text-slate-500 text-xs flex items-center gap-1">
                Admin Portal <ChevronRight size={12} />
                <span>{navItems.find((n) => n.id === active)?.label}</span>
              </p>
            </div>
          </div>
          <div className="relative" ref={profileDropRef}>
            <button
              type="button"
              onClick={() => setProfileDropOpen(!profileDropOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF7A00] to-[#FFB000] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{adminName[0]?.toUpperCase() || 'A'}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-slate-800 text-sm font-medium leading-tight">{adminName}</p>
                <p className="text-black/60 text-xs">{adminEmail}</p>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${profileDropOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileDropOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 py-1 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-slate-800 text-sm font-medium">{adminName}</p>
                  <p className="text-black/60 text-xs truncate">{adminEmail}</p>
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

        <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden">
          {loading && <div className="text-center text-slate-500 py-16">Loading…</div>}

          {!loading && active === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {overviewStats.map((stat) => (
                  <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-500 text-sm">{stat.label}</p>
                      <div className={`p-2 rounded-lg ${stat.color}`}>
                        <stat.icon size={16} />
                      </div>
                    </div>
                    <p className="text-slate-900 text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {!loading && active === 'app' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-slate-900 text-xl font-semibold">Apps Management</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium shadow-md shadow-orange-500/20"
                >
                  + Add New App
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 pt-4 pb-3 border-b border-slate-200 flex justify-start">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search apps…"
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 w-80"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Logo</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Business</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Agents</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Owner</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">GST / PAN</th>

                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Login</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApps.length > 0 ? (
                        filteredApps.map((client, idx) => (
                          <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                            <td className="px-4 py-3">
                              {client.businessLogoKey ? (
                                <LogoImage logoKey={client.businessLogoKey} token={token} />
                              ) : (
                                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center">
                                  <span className="text-slate-500 text-sm font-medium">{client.business?.[0] || '?'}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-slate-900 text-sm font-medium leading-tight">{client.business}</p>
                                <p className="text-slate-500 text-xs">{client.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm">{client.source}</td>
                            <td className="px-4 py-3 text-slate-600 text-sm">{client.agents}</td>
                            <td className="px-4 py-3 text-slate-600 text-sm">{client.owner}</td>
                            <td className="px-4 py-3">
                              <p className="text-slate-700 text-sm">{client.mobile}</p>
                              <p className="text-black/60 text-xs">{client.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-700 text-xs">{client.gstNumber || '—'}</p>
                              <p className="text-black/60 text-xs">{client.panNumber || '—'}</p>
                            </td>

                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await api(`/api/admin/apps/${client.id}/impersonate`, { method: 'POST', token })
                                    // Route to correct dashboard based on appId
                                    if (client.appId === 'ailocity-bd') {
                                      localStorage.setItem(TOKEN_BD, res.token)
                                      window.open('/bd/dashboard', '_blank')
                                    } else {
                                      localStorage.setItem(TOKEN_CLIENT, res.token)
                                      window.open('/client/portal', '_blank')
                                    }
                                  } catch (err) {
                                    alert(err.message || 'Login failed')
                                  }
                                }}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                Login
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative" ref={openDropdown === client.id ? dropdownRef : null}>
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === client.id ? null : client.id)}
                                  className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                  <Settings size={15} />
                                </button>
                                {openDropdown === client.id && (
                                  <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden">
                                    <button
                                      type="button"
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                      onClick={() => { setOpenDropdown(null); setEditClient(client) }}
                                    >
                                      <Pencil size={14} /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                      onClick={() => { setOpenDropdown(null); setViewClient(client) }}
                                    >
                                      <Eye size={14} /> View
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                      onClick={() => deleteClient(client.id)}
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-slate-500">No apps found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && active === 'support' && (
            <div className="space-y-4">
              <h2 className="text-slate-900 text-xl font-semibold">Support</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                  {[
                    {
                      title: 'Contact Support Team',
                      desc: 'Reach out to our support team for technical issues.',
                      action: 'Email: support@ailocity.com',
                    },
                    { title: 'Raise a Ticket', desc: 'Submit a support ticket and track its status.', action: 'Coming soon' },
                    { title: 'Live Chat', desc: 'Chat with a support agent in real time.', action: 'Coming soon' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <div>
                        <p className="text-slate-900 font-medium text-sm">{item.title}</p>
                        <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                      </div>
                      <span className="text-blue-600 text-xs mt-1 ml-4 flex-shrink-0">{item.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && active === 'help' && (
            <div className="space-y-4">
              <h2 className="text-slate-900 text-xl font-semibold">Help</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                  {[
                    { q: 'How to add a new client?', a: 'Go to Clients tab and click "+ Add Client" button.' },
                    { q: 'How to manage apps?', a: 'Navigate to the Apps tab to view and manage all apps.' },
                    { q: 'How to update KYC status?', a: 'Use PATCH /api/admin/apps/:id from API or upcoming UI.' },
                    { q: 'How to logout?', a: 'Click the Logout button in the header.' },
                  ].map((item) => (
                    <div key={item.q} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-slate-900 font-medium text-sm">{item.q}</p>
                      <p className="text-slate-500 text-xs mt-1">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && active === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <p className="text-slate-600">Settings</p>
              <p className="text-slate-400 text-sm mt-2">Coming soon…</p>
            </div>
          )}

          {viewClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewClient(null)}>
              <div className="absolute inset-0 bg-slate-900/40" />
              <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <LogoImage logoKey={viewClient.businessLogoKey} token={token} />
                    <div>
                      <h2 className="text-slate-900 text-base font-semibold">{viewClient.business}</h2>
                      <p className="text-slate-500 text-xs">{viewClient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[viewClient.status] || 'bg-slate-100 text-slate-600'}`}>{viewClient.status}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${kycColors[viewClient.kyc] || 'bg-slate-100 text-slate-600'}`}>{viewClient.kyc}</span>
                    <button type="button" onClick={() => setViewClient(null)} className="ml-2 text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Business Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Business Name', viewClient.business],
                        ['App ID', viewClient.appId],
                        ['Website', viewClient.websiteUrl],
                        ['GST Number', viewClient.gstNumber],
                        ['PAN Number', viewClient.panNumber],
                        ['Source', viewClient.source],
                        ['Owner', viewClient.owner],
                        ['Agents', viewClient.agents],
                      ].map(([l, v]) => v !== undefined && v !== '' ? (
                        <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-slate-400">{l}</p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">{String(v)}</p>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Contact Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Full Name', viewClient.name],
                        ['Email', viewClient.email],
                        ['Mobile', viewClient.mobile],
                        ['City', viewClient.city],
                        ['Address', viewClient.address],
                        ['Pincode', viewClient.pincode],
                      ].map(([l, v]) => v ? (
                        <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-slate-400">{l}</p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">{v}</p>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                  <button type="button" onClick={async () => {
                    try {
                      await api(`/api/admin/apps/${viewClient.id}`, { method: 'PATCH', token, body: { kyc: 'verified' } })
                      await refreshData()
                      setViewClient(prev => ({ ...prev, kyc: 'verified' }))
                    } catch(err) { alert(err.message) }
                  }} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white">✓ Verify KYC</button>
                  <button type="button" onClick={async () => {
                    try {
                      await api(`/api/admin/apps/${viewClient.id}`, { method: 'PATCH', token, body: { kyc: 'rejected' } })
                      await refreshData()
                      setViewClient(prev => ({ ...prev, kyc: 'rejected' }))
                    } catch(err) { alert(err.message) }
                  }} className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-1.5 text-sm font-medium text-white">✗ Reject KYC</button>
                  <button type="button" onClick={() => { setViewClient(null); setEditClient(viewClient) }} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-1.5 text-sm font-medium text-white">Edit</button>
                  <button type="button" onClick={() => setViewClient(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Close</button>
                </div>
              </div>
            </div>
          )}

          {editClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditClient(null)}>
              <div className="absolute inset-0 bg-slate-900/40" />
              <div className="relative bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                  <h2 className="text-slate-900 text-base font-semibold">Edit App</h2>
                  <button type="button" onClick={() => setEditClient(null)} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Business Information</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Business Name', key: 'business' },
                        { label: 'Website URL', key: 'websiteUrl' },
                        { label: 'GST Number', key: 'gstNumber' },
                        { label: 'PAN Number', key: 'panNumber' },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <label className="block text-xs text-slate-600 mb-1">{label}</label>
                          <input
                            type="text"
                            value={editClient[key] ?? ''}
                            onChange={(e) => setEditClient((p) => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                          />
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-600 mb-1">Business Logo</label>
                        <label className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-1.5 cursor-pointer hover:border-orange-400 transition-colors">
                          <Upload size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500 text-sm">{editLogoUploading ? 'Uploading…' : editClient.businessLogoKey ? '✓ Logo uploaded' : 'Upload new logo'}</span>
                          <input type="file" accept="image/*" onChange={handleEditLogoChange} className="hidden" disabled={editLogoUploading} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Personal Information</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Full Name', key: 'name' },
                        { label: 'Mobile', key: 'mobile' },
                        { label: 'City', key: 'city' },
                        { label: 'Address', key: 'address' },
                        { label: 'Pincode', key: 'pincode' },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <label className="block text-xs text-slate-600 mb-1">{label}</label>
                          <input
                            type="text"
                            value={editClient[key] ?? ''}
                            onChange={(e) => setEditClient((p) => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Account Details</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Source', key: 'source' },
                        { label: 'Owner', key: 'owner' },
                        { label: 'Agents', key: 'agents' },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <label className="block text-xs text-slate-600 mb-1">{label}</label>
                          <input
                            type={key === 'agents' ? 'number' : 'text'}
                            value={editClient[key] ?? ''}
                            onChange={(e) => setEditClient((p) => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button type="button" onClick={() => setEditClient(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm border border-slate-200">Cancel</button>
                    <button type="submit" className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white px-5 py-1.5 rounded-lg text-sm shadow-md shadow-orange-500/20">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowForm(false)
                setForm(emptyForm)
              }}
            >
              <div className="absolute inset-0 bg-slate-900/40" />
              <div
                className="relative bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl z-10">
                  <div>
                    <h2 className="text-slate-900 text-lg font-semibold">Add New App</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Fill in the details to register a new app</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setForm(emptyForm)
                    }}
                    className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Business Information</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="businessName"
                          value={form.businessName}
                          onChange={handleFormChange}
                          required
                          placeholder="Enter business name"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Website URL</label>
                        <input
                          name="websiteUrl"
                          value={form.websiteUrl}
                          onChange={handleFormChange}
                          placeholder="https://example.com"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">GST Number</label>
                        <input
                          name="gstNumber"
                          value={form.gstNumber}
                          onChange={handleFormChange}
                          placeholder="Enter GST number"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">PAN Number</label>
                        <input
                          name="panNumber"
                          value={form.panNumber}
                          onChange={handleFormChange}
                          placeholder="Enter PAN number"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-600 mb-1">Business Logo</label>
                        <label className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-1.5 cursor-pointer hover:border-orange-400 transition-colors">
                          <Upload size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500 text-sm truncate">
                            {logoUploading ? 'Uploading…' : form.businessLogo ? form.businessLogo.name : 'No file chosen'}
                          </span>
                          {form.businessLogoKey && !logoUploading && (
                            <span className="ml-auto text-xs text-emerald-600 flex-shrink-0">✓ Uploaded</span>
                          )}
                          {!form.businessLogoKey && !logoUploading && (
                            <span className="ml-auto text-xs text-slate-400 flex-shrink-0">PNG, JPG up to 10MB</span>
                          )}
                          <input type="file" name="businessLogo" onChange={handleFormChange} accept="image/*" className="hidden" disabled={logoUploading} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Personal Information</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="fullName"
                          value={form.fullName}
                          onChange={handleFormChange}
                          required
                          placeholder="Enter full name"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleFormChange}
                          required
                          placeholder="Enter email address"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="mobile"
                          value={form.mobile}
                          onChange={handleFormChange}
                          required
                          placeholder="Enter mobile number"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">City</label>
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleFormChange}
                          placeholder="Enter city"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Address</label>
                        <input
                          name="address"
                          value={form.address}
                          onChange={handleFormChange}
                          placeholder="Enter address"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Pincode</label>
                        <input
                          name="pincode"
                          value={form.pincode}
                          onChange={handleFormChange}
                          placeholder="Enter pincode"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Account Security</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">App <span className="text-red-500">*</span></label>
                        <select
                          name="appId"
                          value={form.appId}
                          onChange={handleFormChange}
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                        >
                          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={handleFormChange}
                          required
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="confirmPassword"
                          type="password"
                          value={form.confirmPassword}
                          onChange={handleFormChange}
                          required
                          placeholder="Confirm password"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <p className="text-black/60 text-xs">* Required fields</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setForm(emptyForm)
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg font-medium text-sm transition-colors border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white px-5 py-1.5 rounded-lg font-medium text-sm transition-colors shadow-md shadow-orange-500/20"
                      >
                        {active === 'app' ? 'Add App' : 'Add App'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}












