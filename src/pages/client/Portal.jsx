import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Film,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Plus,
  Save,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { api, TOKEN_CLIENT, TOKEN_SUBCLIENT, TOKEN_BD } from '../../lib/api'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'contacts', label: 'Clients', icon: Users },
  { id: 'services', label: 'Services', icon: Settings },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'datastore', label: 'Data Store', icon: Database },
  { id: 'leads', label: 'Leads', icon: FileText },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'reels', label: 'Reels', icon: Film },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

const ENDPOINTS = {
  services: '/api/client/services',
  products: '/api/client/products',
  contacts: '/api/client/contacts',
  datastore: '/api/client/datastore',
  leads: '/api/client/leads',
  campaigns: '/api/client/campaigns',
  content: '/api/client/content',
  reels: '/api/client/reels',
}

const RES_KEYS = {
  services: 'services',
  products: 'products',
  contacts: 'contacts',
  datastore: 'files',
  leads: 'leads',
  campaigns: 'campaigns',
  content: 'content',
  reels: 'reels',
}

const ID_KEYS = {
  services: 'id',
  products: 'id',
  contacts: 'id',
  datastore: 'id',
  leads: 'id',
  campaigns: 'id',
  content: 'id',
  reels: 'id',
}

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-700',
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  draft: 'bg-amber-100 text-amber-700',
  paused: 'bg-slate-200 text-slate-700',
  completed: 'bg-emerald-100 text-emerald-700',
  published: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

const INITIAL_LISTS = {
  services: [],
  products: [],
  contacts: [],
  datastore: [],
  leads: [],
  campaigns: [],
  content: [],
  reels: [],
}

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

const BLANK_CONTACT = {
  name: '', email: '', mobile: '', alternateMobile: '',
  company: '', businessType: '', category: '', subCategory: '',
  websiteUrl: '', gstNumber: '', panNumber: '',
  address: '', city: '', state: '', pincode: '', country: 'India',
  instagramUrl: '', facebookUrl: '', youtubeUrl: '', logoKey: '',
  type: 'client', status: 'active', notes: '', password: '',
}

const FIELD_MAP = {
  services: [
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'price', label: 'Price' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
  ],
  products: [
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'price', label: 'Price' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
  ],
  contacts: [],
  datastore: [
    { key: 'name', label: 'Name', required: true },
    { key: 'type', label: 'Type' },
    { key: 'size', label: 'Size' },
    { key: 'url', label: 'File URL' },
    { key: 'tagsCsv', label: 'Tags (comma separated)' },
  ],
  leads: [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'source', label: 'Source' },
    { key: 'requirement', label: 'Requirement' },
    { key: 'budget', label: 'Budget' },
    { key: 'status', label: 'Status', type: 'select', options: ['new', 'contacted', 'qualified', 'lost'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'] },
  ],
  campaigns: [
    { key: 'name', label: 'Name', required: true },
    { key: 'type', label: 'Type' },
    { key: 'platform', label: 'Platform' },
    { key: 'budget', label: 'Budget' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'paused', 'completed'] },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
  ],
  content: [
    { key: 'title', label: 'Title', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['post', 'blog', 'email', 'story'] },
    { key: 'platform', label: 'Platform' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'scheduled'] },
    { key: 'scheduledAt', label: 'Scheduled At', type: 'datetime-local' },
    { key: 'tagsCsv', label: 'Tags (comma separated)' },
  ],
  reels: [
    { key: 'title', label: 'Title', required: true },
    { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'YouTube', 'Facebook'] },
    { key: 'duration', label: 'Duration' },
    { key: 'caption', label: 'Caption', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'scheduled'] },
    { key: 'scheduledAt', label: 'Scheduled At', type: 'datetime-local' },
    { key: 'url', label: 'Reel URL' },
  ],
}

function pill(value) {
  const v = String(value || '').toLowerCase()
  return STATUS_COLORS[v] || 'bg-slate-200 text-slate-700'
}

function tableEmpty(label) {
  return (
    <tr>
      <td colSpan={100} className="px-6 py-10 text-center text-sm text-slate-500">
        No {label} found
      </td>
    </tr>
  )
}

function blankFromFields(fields) {
  return fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
}

// App Portal - App owner ka portal (Ailocity Business, Ailocity)
export default function ClientPortal() {
  const token = localStorage.getItem(TOKEN_CLIENT)
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bootLoading, setBootLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')
  const [me, setMe] = useState(null)
  const [dash, setDash] = useState(null)
  const [credits, setCredits] = useState({ creditsBalance: 0, usageStats: [] })
  const [agents, setAgents] = useState([])
  const [lists, setLists] = useState(INITIAL_LISTS)
  const [profile, setProfile] = useState({
    businessName: '',
    fullName: '',
    email: '',
    mobile: '',
    websiteUrl: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    pincode: '',
  })

  const [modal, setModal] = useState({ open: false, tab: null, mode: 'add', item: null })
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)
  const [contactModal, setContactModal] = useState({ open: false, mode: 'add', item: null })
  const [contactForm, setContactForm] = useState(BLANK_CONTACT)
  const [contactLogoUploading, setContactLogoUploading] = useState(false)
  const [contactSettingOpen, setContactSettingOpen] = useState(null)
  const [contactViewItem, setContactViewItem] = useState(null)
  const [contactTab, setContactTab] = useState('all')
  const [contactSearch, setContactSearch] = useState('')

  const isBdToken = useMemo(() => {
    if (!token) return false
    try {
      const parts = token.split('.')
      if (parts.length < 2) return false
      const payload = JSON.parse(atob(parts[1]))
      return payload?.appId === 'ailocity-bd'
    } catch {
      return false
    }
  }, [token])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const heading = useMemo(() => TABS.find((x) => x.id === active)?.label || 'Client', [active])

  const loadOverview = useCallback(async () => {
    const [meRes, dashRes, creditsRes, leadsRes, campaignRes] = await Promise.all([
      api('/api/client/me', { token }),
      api('/api/client/dashboard', { token }),
      api('/api/client/credits', { token }),
      api('/api/client/leads', { token }),
      api('/api/client/campaigns', { token }),
    ])
    setMe(meRes)
    setDash(dashRes)
    setCredits(creditsRes)
    setAgents(dashRes.agents || [])
    setProfile({
      businessName: meRes.businessName || '',
      fullName: meRes.fullName || '',
      email: meRes.email || '',
      mobile: meRes.mobile || '',
      websiteUrl: meRes.websiteUrl || '',
      gstNumber: meRes.gstNumber || '',
      panNumber: meRes.panNumber || '',
      address: meRes.address || '',
      city: meRes.city || '',
      pincode: meRes.pincode || '',
    })
    setLists((prev) => ({
      ...prev,
      leads: leadsRes.leads || [],
      campaigns: campaignRes.campaigns || [],
    }))
  }, [token])

  const loadTabCollection = useCallback(async (tabId) => {
    if (!ENDPOINTS[tabId]) return
    const res = await api(ENDPOINTS[tabId], { token })
    setLists((prev) => ({ ...prev, [tabId]: res[RES_KEYS[tabId]] || [] }))
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        await loadOverview()
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load dashboard')
          localStorage.removeItem(TOKEN_CLIENT)
          navigate('/client/login')
        }
      } finally {
        if (!cancelled) setBootLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, navigate, loadOverview])

  useEffect(() => {
    if (!token || !ENDPOINTS[active]) return
    ;(async () => {
      try {
        setTabLoading(true)
        await loadTabCollection(active)
      } catch (e) {
        setError(e.message || 'Unable to fetch data')
      } finally {
        setTabLoading(false)
      }
    })()
  }, [active, token, loadTabCollection])

  useEffect(() => {
    if (!token || !isBdToken) return
    localStorage.removeItem(TOKEN_CLIENT)
    localStorage.setItem(TOKEN_BD, token)
    navigate('/bd/dashboard', { replace: true })
  }, [token, isBdToken, navigate])

  if (!token) return <Navigate to="/client/login" replace />
  if (isBdToken) return null

  const logout = () => {
    localStorage.removeItem(TOKEN_CLIENT)
    navigate('/client/login')
  }

  const openContactAdd = () => {
    setContactForm(BLANK_CONTACT)
    setContactLogoUploading(false)
    setContactModal({ open: true, mode: 'add', item: null })
  }

  const openContactEdit = (item) => {
    setContactForm({ ...BLANK_CONTACT, ...item })
    setContactLogoUploading(false)
    setContactModal({ open: true, mode: 'edit', item })
  }

  const closeContactModal = () => setContactModal({ open: false, mode: 'add', item: null })

  const saveContact = async (e) => {
    e.preventDefault()
    if (!contactForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...contactForm,
        type: String(contactForm.type || '').trim().toLowerCase(),
        status: String(contactForm.status || '').trim().toLowerCase(),
      }
      if (contactModal.mode === 'add') {
        await api('/api/client/contacts', { token, method: 'POST', body: payload })
      } else {
        await api(`/api/client/contacts/${contactModal.item.id}`, { token, method: 'PATCH', body: payload })
      }
      await loadTabCollection('contacts')
      closeContactModal()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleContactLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setContactLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/client/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setContactForm(p => ({ ...p, logoKey: data.key }))
    } catch (err) {
      setError(err.message || 'Logo upload failed')
    } finally {
      setContactLogoUploading(false)
    }
  }

  const deleteContact = async (item) => {
    if (item.readonly) {
      setError('Admin-created clients are read-only in this view.')
      return
    }
    if (!window.confirm('Delete this client?')) return
    try {
      await api(`/api/client/contacts/${item.id}`, { token, method: 'DELETE' })
      await loadTabCollection('contacts')
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const openAdd = (tab) => {
    const fields = FIELD_MAP[tab] || []
    setForm(blankFromFields(fields))
    setModal({ open: true, tab, mode: 'add', item: null })
  }

  const openView = (tab, item) => {
    setForm(item)
    setModal({ open: true, tab, mode: 'view', item })
  }

  const openEdit = (tab, item) => {
    const fields = FIELD_MAP[tab] || []
    const next = blankFromFields(fields)
    for (const f of fields) {
      next[f.key] = f.key === 'tagsCsv' ? (item.tags || []).join(', ') : item[f.key] ?? ''
    }
    setForm(next)
    setModal({ open: true, tab, mode: 'edit', item })
  }

  const closeModal = () => setModal({ open: false, tab: null, mode: 'add', item: null })

  const validate = (tab, payload) => {
    const fields = FIELD_MAP[tab] || []
    for (const f of fields) {
      if (f.required && !String(payload[f.key] || '').trim()) {
        throw new Error(`${f.label} is required`)
      }
    }
  }

  const saveModal = async () => {
    const tab = modal.tab
    if (!tab) return
    const payload = { ...form }
    if (payload.tagsCsv !== undefined) {
      payload.tags = String(payload.tagsCsv || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      delete payload.tagsCsv
    }
    validate(tab, payload)
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        await api(ENDPOINTS[tab], { token, method: 'POST', body: payload })
      } else {
        const id = modal.item?.[ID_KEYS[tab]]
        await api(`${ENDPOINTS[tab]}/${id}`, { token, method: 'PATCH', body: payload })
      }
      await loadTabCollection(tab)
      if (tab === 'leads' || tab === 'campaigns') await loadOverview()
      closeModal()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const removeRow = async (tab, item) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await api(`${ENDPOINTS[tab]}/${item[ID_KEYS[tab]]}`, { token, method: 'DELETE' })
      await loadTabCollection(tab)
      if (tab === 'leads' || tab === 'campaigns') await loadOverview()
    } catch (e) {
      setError(e.message || 'Delete failed')
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!profile.businessName.trim() || !profile.fullName.trim() || !profile.mobile.trim()) {
      setError('Business name, full name and mobile are required')
      return
    }
    setSaving(true)
    try {
      await api('/api/client/profile', { token, method: 'PATCH', body: profile })
      await loadOverview()
    } catch (e2) {
      setError(e2.message || 'Profile update failed')
    } finally {
      setSaving(false)
    }
  }

  const renderGeneric = (tab, title, columns, disableEdit = false) => {
    const rows = lists[tab] || []
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={() => openAdd(tab)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000]"
          >
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && tableEmpty(title.toLowerCase())}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-sm text-slate-700">
                      {c.kind === 'badge' ? (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${pill(r[c.key])}`}>{r[c.key]}</span>
                      ) : (
                        r[c.key] || '-'
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openView(tab, r)} className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                        View
                      </button>
                      {!disableEdit && (
                        <button type="button" onClick={() => openEdit(tab, r)} className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                          Edit
                        </button>
                      )}
                      <button type="button" onClick={() => removeRow(tab, r)} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const stats = dash?.stats || {}

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`text-black transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'} flex flex-col`} style={{background:'linear-gradient(180deg,#FF7A00 0%,#cc6200 100%)'}}>
        <div className="flex h-[65px] items-center border-b border-black/20 px-3">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-black">{me?.businessName || 'Client'}</p>
              <p className="truncate text-xs text-black/60">{me?.appName || 'Ailocity'} • <span className="capitalize">{me?.status || '—'}</span></p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                active === id ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white' : 'text-black/70 hover:bg-white/20'
              }`}
            >
              <Icon size={18} />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-hidden">
        <header className="flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen((s) => !s)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-semibold text-slate-900">{heading}</h1>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                Client Portal <ChevronRight size={12} /> {heading}
              </p>
            </div>
          </div>
          <div className="relative" ref={dropRef}>
            <button
              type="button"
              onClick={() => setDropOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20">
                {(me?.businessName || me?.fullName || 'C').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800">{me?.businessName || '—'}</p>
                <p className="text-xs text-slate-400">{me?.email || '—'}</p>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/60 z-50">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-sm font-medium text-slate-800">{me?.businessName || '—'}</p>
                  <p className="truncate text-xs text-slate-400">{me?.email || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="h-[calc(100vh-65px)] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="ml-3 text-red-400 hover:text-red-700"><X size={14} /></button>
            </div>
          )}
          {(bootLoading || tabLoading) && <div className="py-10 text-center text-sm text-slate-500">Loading...</div>}

          {!bootLoading && !tabLoading && active === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'Total Calls', value: stats.totalCalls ?? 0 },
                  { label: 'Active Agents', value: stats.activeAgents ?? 0 },
                  { label: 'Open Tickets', value: stats.openTickets ?? 0 },
                  { label: 'Credits Left', value: stats.creditsLeft ?? credits.creditsBalance ?? 0 },
                  { label: 'Total Leads', value: lists.leads.length },
                  { label: 'Total Campaigns', value: lists.campaigns.length },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <div className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">Recent Leads</div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Name', 'Email', 'Source', 'Requirement', 'Status', 'Priority'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dash?.recentLeads || []).length === 0 && tableEmpty('recent leads')}
                    {(dash?.recentLeads || []).map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-3 text-sm text-slate-700">{l.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{l.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{l.source || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{l.requirement || '-'}</td>
                        <td className="px-4 py-3 text-sm"><span className={`rounded-full px-2 py-1 text-xs font-medium ${pill(l.status)}`}>{l.status}</span></td>
                        <td className="px-4 py-3 text-sm"><span className={`rounded-full px-2 py-1 text-xs font-medium ${pill(l.priority)}`}>{l.priority}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <div className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">Recent Campaigns</div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Name', 'Type', 'Platform', 'Budget', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dash?.recentCampaigns || []).length === 0 && tableEmpty('recent campaigns')}
                    {(dash?.recentCampaigns || []).map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-sm text-slate-700">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{c.type || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{c.platform || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{c.budget || '-'}</td>
                        <td className="px-4 py-3 text-sm"><span className={`rounded-full px-2 py-1 text-xs font-medium ${pill(c.status)}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!bootLoading && !tabLoading && active === 'profile' && (
            <form onSubmit={saveProfile} className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Profile Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['businessName', 'Business Name'],
                  ['fullName', 'Full Name'],
                  ['email', 'Email'],
                  ['mobile', 'Mobile'],
                  ['websiteUrl', 'Website URL'],
                  ['gstNumber', 'GST Number'],
                  ['panNumber', 'PAN Number'],
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['pincode', 'Pincode'],
                ].map(([k, label]) => (
                  <div key={k}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                    <input
                      value={profile[k]}
                      onChange={(e) => setProfile((p) => ({ ...p, [k]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60">
                <Save size={16} /> Save Profile
              </button>
            </form>
          )}

          {!bootLoading && !tabLoading && active === 'agents' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">AI Agents</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Name', 'Type', 'Calls', 'Status', 'Action'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agents.length === 0 && tableEmpty('agents')}
                    {agents.map((a) => (
                      <tr key={a.name}>
                        <td className="px-4 py-3 text-sm text-slate-700">{a.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{a.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{a.calls}</td>
                        <td className="px-4 py-3 text-sm"><span className={`rounded-full px-2 py-1 text-xs font-medium ${pill(a.status)}`}>{a.status}</span></td>
                        <td className="px-4 py-3 text-sm">
                          <button type="button" onClick={() => openView('agents', a)} className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!bootLoading && !tabLoading && active === 'services' && renderGeneric('services', 'Services', [
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
            { key: 'price', label: 'Price' },
            { key: 'status', label: 'Status', kind: 'badge' },
          ])}
          {!bootLoading && !tabLoading && active === 'products' && renderGeneric('products', 'Products', [
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'price', label: 'Price' },
            { key: 'status', label: 'Status', kind: 'badge' },
          ])}
          {!bootLoading && !tabLoading && active === 'contacts' && (() => {
            const rows = [...(lists.contacts || [])].reverse()
            const typeColors = {
              client: 'bg-orange-100 text-orange-600',
              lead: 'bg-blue-100 text-blue-700',
              partner: 'bg-amber-100 text-amber-700',
              server: 'bg-violet-100 text-violet-700',
              both: 'bg-cyan-100 text-cyan-700',
              'in-house': 'bg-emerald-100 text-emerald-700',
              venture: 'bg-pink-100 text-pink-700',
              startups: 'bg-yellow-100 text-yellow-700',
              business: 'bg-indigo-100 text-indigo-700',
            }
            const tabFiltered = contactTab === 'all' ? rows
              : contactTab === 'new' ? rows.filter(r => r.status === 'new')
              : rows.filter(r => (r.type || '').toLowerCase() === contactTab)
            const filteredRows = contactSearch.trim()
              ? tabFiltered.filter(r =>
                  (r.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                  (r.company || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                  (r.email || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                  (r.mobile || '').includes(contactSearch)
                )
              : tabFiltered
            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Clients</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{rows.length} total contacts</p>
                  </div>
                  <button type="button" onClick={() => openContactAdd()} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] shadow-sm shadow-orange-500/20">
                    <Plus size={16} /> Add Client
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: rows.length, color: 'text-slate-900' },
                    { label: 'Clients', value: rows.filter(r => String(r.type||'').toLowerCase() === 'client').length, color: 'text-orange-600' },
                    { label: 'Leads', value: rows.filter(r => String(r.type||'').toLowerCase() === 'lead').length, color: 'text-blue-700' },
                    { label: 'Active', value: rows.filter(r => String(r.status||'').toLowerCase() === 'active').length, color: 'text-emerald-700' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Filter Tabs */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-slate-200">
                    <div className="flex gap-1">
                      {[
                        { key: 'all',       label: 'All',       count: rows.length },
                        { key: 'in-house',  label: 'In-house',  count: rows.filter(r => (r.type||'').toLowerCase() === 'in-house').length },
                        { key: 'client',    label: 'Client',    count: rows.filter(r => (r.type||'').toLowerCase() === 'client').length },
                        { key: 'server',    label: 'Server',    count: rows.filter(r => (r.type||'').toLowerCase() === 'server').length },
                        { key: 'both',      label: 'Both',      count: rows.filter(r => (r.type||'').toLowerCase() === 'both').length },
                        { key: 'venture',   label: 'Venture',   count: rows.filter(r => (r.type||'').toLowerCase() === 'venture').length },
                        { key: 'startups',  label: 'Startups',  count: rows.filter(r => (r.type||'').toLowerCase() === 'startups').length },
                        { key: 'business',  label: 'Business',  count: rows.filter(r => (r.type||'').toLowerCase() === 'business').length },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setContactTab(tab.key)}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            contactTab === tab.key
                              ? 'border-orange-500 text-orange-500'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label} <span className="ml-1 text-xs text-slate-400">({tab.count})</span>
                        </button>
                      ))}
                    </div>
                    <div className="relative mb-1">
                      <input
                        type="text"
                        placeholder="Search clients…"
                        value={contactSearch}
                        onChange={e => setContactSearch(e.target.value)}
                        className="border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 w-56"
                      />
                      {contactSearch && (
                        <button type="button" onClick={() => setContactSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">✕</button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['#', 'Logo', 'Name', 'Category', 'Email', 'Mobile', 'Type', 'Status', 'Login', 'Settings'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.length === 0 ? (
                          <tr><td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-400">No clients found.</td></tr>
                        ) : filteredRows.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2.5 text-sm text-slate-400 whitespace-nowrap">{idx + 1}</td>
                            <td className="px-3 py-2.5">
                              {r.logoUrl
                                ? <img src={r.logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                : <div className="w-8 h-8 rounded-full bg-orange-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-600 text-xs font-bold">{(r.name || '?').slice(0,2).toUpperCase()}</span>
                                  </div>
                              }
                            </td>
                            <td className="px-3 py-2.5 max-w-[140px]">
                              <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                              <p className="text-xs text-slate-400 truncate">{r.company || '—'}</p>
                            </td>
                            <td className="px-3 py-2.5 max-w-[110px]">
                              <p className="text-xs text-slate-700 truncate">{r.category || '—'}</p>
                              <p className="text-xs text-slate-400 truncate">{r.subCategory || ''}</p>
                            </td>
                            <td className="px-3 py-2.5 max-w-[150px]">
                              <p className="text-xs text-slate-600 truncate">{r.email || '—'}</p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{r.mobile || '—'}</td>
                            <td className="px-3 py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${typeColors[(r.type||'').toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>{r.type || '—'}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${pill(r.status)}`}>{r.status || '—'}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <button type="button" onClick={async () => {
                                try {
                                  const res = await api(`/api/client/contacts/${r.id}/login`, { token, method: 'POST' })
                                  localStorage.setItem(TOKEN_SUBCLIENT, res.token)
                                  window.open('/client/dashboard', '_blank')
                                } catch (err) { setError(err.message || 'No login account linked') }
                              }} className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
                                Login
                              </button>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setContactSettingOpen(contactSettingOpen === r.id ? null : r.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                >
                                  <Settings size={15} />
                                </button>
                                {contactSettingOpen === r.id && (
                                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
                                    <button type="button" disabled={r.readonly} onClick={() => { setContactSettingOpen(null); openContactEdit(r) }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${r.readonly ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50'}`}>Edit</button>
                                    <button type="button" onClick={() => { setContactSettingOpen(null); setContactViewItem(r) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">View</button>
                                    <button type="button" disabled={r.readonly} onClick={() => { setContactSettingOpen(null); deleteContact(r) }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${r.readonly ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>Delete</button>
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
            )
          })()}
          {!bootLoading && !tabLoading && active === 'datastore' && renderGeneric('datastore', 'Data Store', [
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
            { key: 'size', label: 'Size' },
            { key: 'url', label: 'URL' },
          ], true)}
          {!bootLoading && !tabLoading && active === 'leads' && renderGeneric('leads', 'Leads / Requirements', [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'source', label: 'Source' },
            { key: 'budget', label: 'Budget' },
            { key: 'status', label: 'Status', kind: 'badge' },
            { key: 'priority', label: 'Priority', kind: 'badge' },
          ])}
          {!bootLoading && !tabLoading && active === 'campaigns' && renderGeneric('campaigns', 'Ads / Campaigns', [
            { key: 'name', label: 'Name' },
            { key: 'platform', label: 'Platform' },
            { key: 'budget', label: 'Budget' },
            { key: 'startDate', label: 'Start' },
            { key: 'endDate', label: 'End' },
            { key: 'status', label: 'Status', kind: 'badge' },
          ])}
          {!bootLoading && !tabLoading && active === 'content' && renderGeneric('content', 'Content Management', [
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type' },
            { key: 'platform', label: 'Platform' },
            { key: 'status', label: 'Status', kind: 'badge' },
            { key: 'scheduledAt', label: 'Scheduled' },
          ])}
          {!bootLoading && !tabLoading && active === 'reels' && renderGeneric('reels', 'Reels Management', [
            { key: 'title', label: 'Title' },
            { key: 'platform', label: 'Platform' },
            { key: 'duration', label: 'Duration' },
            { key: 'views', label: 'Views' },
            { key: 'likes', label: 'Likes' },
            { key: 'status', label: 'Status', kind: 'badge' },
          ])}
        </section>
      </main>

      {/* Contact View Modal */}
      {contactViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setContactViewItem(null)}>
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                {contactViewItem.logoUrl
                  ? <img src={contactViewItem.logoUrl} alt="logo" className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-orange-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 text-sm font-bold">{(contactViewItem.name || '?').slice(0,2).toUpperCase()}</span>
                    </div>
                }
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{contactViewItem.name}</h2>
                  <p className="text-xs text-slate-500">{contactViewItem.company || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${{ client: 'bg-orange-100 text-orange-600', lead: 'bg-blue-100 text-blue-700', partner: 'bg-amber-100 text-amber-700' }[contactViewItem.type] || 'bg-slate-100 text-slate-600'}`}>{contactViewItem.type}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pill(contactViewItem.status)}`}>{contactViewItem.status}</span>
                <button type="button" onClick={() => setContactViewItem(null)} className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">

              {/* Business */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Business Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Business Type', contactViewItem.businessType],
                    ['Category', contactViewItem.category],
                    ['Sub Category', contactViewItem.subCategory],
                    ['Website', contactViewItem.websiteUrl],
                    ['GST Number', contactViewItem.gstNumber],
                    ['PAN Number', contactViewItem.panNumber],
                  ].map(([l, v]) => v ? (
                    <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400">{l}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{v}</p>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Contact */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Contact Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Email', contactViewItem.email],
                    ['Mobile', contactViewItem.mobile],
                    ['Alternate Mobile', contactViewItem.alternateMobile],
                  ].map(([l, v]) => v ? (
                    <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400">{l}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{v}</p>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Location */}
              {(contactViewItem.city || contactViewItem.address) && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Location</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Address', contactViewItem.address],
                      ['City', contactViewItem.city],
                      ['State', contactViewItem.state],
                      ['Pincode', contactViewItem.pincode],
                      ['Country', contactViewItem.country],
                    ].map(([l, v]) => v ? (
                      <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">{v}</p>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Social */}
              {(contactViewItem.instagramUrl || contactViewItem.facebookUrl || contactViewItem.youtubeUrl) && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Social / Online Presence</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Instagram', contactViewItem.instagramUrl],
                      ['Facebook', contactViewItem.facebookUrl],
                      ['YouTube', contactViewItem.youtubeUrl],
                    ].map(([l, v]) => v ? (
                      <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400">{l}</p>
                        <a href={v} target="_blank" rel="noreferrer" className="text-sm font-medium text-orange-500 hover:underline mt-0.5 block truncate">{v}</a>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {contactViewItem.notes && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Notes</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{contactViewItem.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={() => { setContactViewItem(null); openContactEdit(contactViewItem) }} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-1.5 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000]">Edit</button>
              <button type="button" onClick={() => setContactViewItem(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Contacts Modal */}
      {contactModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeContactModal}>
          <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{contactModal.mode === 'add' ? 'Add Client' : 'Edit Client'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in the client details</p>
              </div>
              <button type="button" onClick={closeContactModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"><X size={18} /></button>
            </div>

            <form onSubmit={saveContact} className="max-h-[78vh] overflow-y-auto px-5 py-4 space-y-5">

              {/* Business Information */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Business Information</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Name <span className="text-red-500">*</span></label>
                    <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required placeholder="Full name" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Company</label>
                    <input value={contactForm.company} onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Business Logo</label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 hover:border-orange-400 transition-colors">
                      <Plus size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-500 truncate">
                        {contactLogoUploading ? 'Uploading…' : contactForm.logoKey ? '✓ Logo uploaded' : 'Upload logo'}
                      </span>
                      {contactForm.logoKey && !contactLogoUploading && (
                        <span className="ml-auto text-xs text-emerald-600 flex-shrink-0">✓</span>
                      )}
                      <input type="file" accept="image/*" onChange={handleContactLogoUpload} className="hidden" disabled={contactLogoUploading} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Business Type</label>
                    <select value={contactForm.businessType} onChange={e => setContactForm(p => ({ ...p, businessType: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      <option value="">Select type</option>
                      {['Proprietorship','Partnership','Pvt Ltd','LLP','Other'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Category</label>
                    <select value={contactForm.category} onChange={e => setContactForm(p => ({ ...p, category: e.target.value, subCategory: '' }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      <option value="">Select category</option>
                      {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Sub Category</label>
                    <select value={contactForm.subCategory} onChange={e => setContactForm(p => ({ ...p, subCategory: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" disabled={!contactForm.category}>
                      <option value="">Select sub category</option>
                      {(CATEGORY_MAP[contactForm.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Website URL</label>
                    <input value={contactForm.websiteUrl} onChange={e => setContactForm(p => ({ ...p, websiteUrl: e.target.value }))} placeholder="https://" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Contact Details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Contact Details</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Email</label>
                    <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Password {contactModal.mode === 'add' && <span className="text-red-500">*</span>}</label>
                    <input type="password" value={contactForm.password} onChange={e => setContactForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Mobile</label>
                    <input value={contactForm.mobile} onChange={e => setContactForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile number" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Alternate Mobile</label>
                    <input value={contactForm.alternateMobile} onChange={e => setContactForm(p => ({ ...p, alternateMobile: e.target.value }))} placeholder="Alternate number" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Documents</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[['gstNumber','GST Number'],['panNumber','PAN Number']].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs text-slate-600 mb-1">{l}</label>
                      <input value={contactForm[k]} onChange={e => setContactForm(p => ({ ...p, [k]: e.target.value }))} placeholder={l} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Location */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Location</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[['address','Address'],['city','City'],['state','State'],['pincode','Pincode'],['country','Country']].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs text-slate-600 mb-1">{l}</label>
                      <input value={contactForm[k]} onChange={e => setContactForm(p => ({ ...p, [k]: e.target.value }))} placeholder={l} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Social */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Social / Online Presence</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[['instagramUrl','Instagram URL'],['facebookUrl','Facebook URL'],['youtubeUrl','YouTube URL']].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs text-slate-600 mb-1">{l}</label>
                      <input value={contactForm[k]} onChange={e => setContactForm(p => ({ ...p, [k]: e.target.value }))} placeholder="https://" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* CRM */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">CRM Details</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Type</label>
                    <select value={String(contactForm.type || '').toLowerCase()} onChange={e => setContactForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      {[
                        { v: 'client', label: 'Client' },
                        { v: 'server', label: 'Server' },
                        { v: 'both', label: 'Both' },
                        { v: 'in-house', label: 'In-house' },
                        { v: 'venture', label: 'Venture' },
                        { v: 'startups', label: 'Startups' },
                        { v: 'business', label: 'Business' },
                        { v: 'lead', label: 'Lead' },
                        { v: 'partner', label: 'Partner' },
                      ].map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Status</label>
                    <select value={String(contactForm.status || '').toLowerCase()} onChange={e => setContactForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      {[
                        { v: 'active', label: 'Active' },
                        { v: 'inactive', label: 'Inactive' },
                        { v: 'new', label: 'New' },
                      ].map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-slate-600 mb-1">Notes</label>
                    <textarea value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-none" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <p className="text-xs text-slate-400">* Required fields</p>
                <div className="flex gap-2">
                  <button type="button" onClick={closeContactModal} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60 shadow-sm shadow-orange-500/20">
                    {saving ? 'Saving...' : contactModal.mode === 'add' ? 'Add Client' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 capitalize">{modal.mode} {modal.tab}</h3>
              <button type="button" onClick={closeModal} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            {modal.tab === 'agents' || modal.mode === 'view' ? (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {Object.entries(form || modal.item || {}).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium">{k}:</span> {Array.isArray(v) ? v.join(', ') : String(v)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {(FIELD_MAP[modal.tab] || []).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                    {f.type === 'select' ? (
                      <select
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
                      >
                        <option value="">Select {f.label}</option>
                        {f.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}
                        className="min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
                      />
                    ) : (
                      <input
                        type={f.type || 'text'}
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Close
              </button>
              {modal.mode !== 'view' && modal.tab !== 'agents' && (
                <button type="button" disabled={saving} onClick={saveModal} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}















