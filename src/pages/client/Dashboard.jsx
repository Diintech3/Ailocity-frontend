import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UserRound, Package, Settings, Megaphone,
  FileText, Share2, Radio, Bot, Database, Workflow, PlayCircle,
  Users, Briefcase, Shield, Scale, Calculator, Receipt, BadgeCheck,
  Landmark, TrendingUp, ChevronDown, ChevronRight, LogOut, Menu, X,
  CreditCard, PhoneCall, Ticket, Film, Video,
} from 'lucide-react'
import { api, TOKEN_SUBCLIENT } from '../../lib/api'

const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    single: true,
  },
  {
    id: 'ai-services',
    label: 'AI Services',
    icon: Bot,
    children: [
      { id: 'ai-calling',        label: 'AI Calling',            icon: PhoneCall },
      { id: 'ai-agents',         label: 'AI Agents',             icon: Bot },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Workflow,
    single: true,
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    children: [
      { id: 'business-profile',  label: 'Profile',  icon: UserRound },
      { id: 'business-products', label: 'Products', icon: Package },
      { id: 'business-services', label: 'Services', icon: Settings },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { id: 'marketing-content', label: 'Content',      icon: FileText },
      { id: 'marketing-social',  label: 'Social Media', icon: Share2 },
      { id: 'marketing-ads',     label: 'Ads',          icon: Radio },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: TrendingUp,
    children: [
      { id: 'sales-leads',    label: 'Leads',    icon: Users },
      { id: 'sales-training', label: 'Training', icon: PlayCircle },
      { id: 'sales-revenue',  label: 'Revenue',  icon: CreditCard },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Bot,
    children: [
      { id: 'automation-agent',      label: 'AI Agent',   icon: Bot },
      { id: 'automation-datastore',  label: 'Datastore',  icon: Database },
      { id: 'automation-workflow',   label: 'Workflow',   icon: Workflow },
      { id: 'automation-playground', label: 'Playground', icon: PlayCircle },
    ],
  },
  {
    id: 'operation',
    label: 'Operation',
    icon: Shield,
    children: [
      { id: 'operation-team',   label: 'Team',   icon: Users },
      { id: 'operation-hiring', label: 'Hiring', icon: Briefcase },
      { id: 'operation-policy', label: 'Policy', icon: BadgeCheck },
      { id: 'operation-legal',  label: 'Legal',  icon: Scale },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Landmark,
    children: [
      { id: 'finance-accounting',  label: 'Accounting',  icon: Calculator },
      { id: 'finance-tax',         label: 'Tax',         icon: Receipt },
      { id: 'finance-compliance',  label: 'Compliance',  icon: BadgeCheck },
      { id: 'finance-loan',        label: 'Loan',        icon: Landmark },
      { id: 'finance-investment',  label: 'Investment',  icon: TrendingUp },
    ],
  },
]

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-700',
  new: 'bg-blue-100 text-blue-700',
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

function pill(v) {
  return STATUS_COLORS[String(v || '').toLowerCase()] || 'bg-slate-200 text-slate-700'
}

function getActiveLabel(activeId) {
  if (activeId === 'overview') return 'Overview'
  if (activeId === 'settings') return 'Settings'
  if (activeId === 'ai-credits') return 'Credits'
  if (activeId === 'ai-tickets') return 'Tickets'
  if (activeId === 'tools') return 'Tools'
  for (const s of NAV_SECTIONS) {
    if (s.children) {
      const c = s.children.find(x => x.id === activeId)
      if (c) return `${s.label} / ${c.label}`
    }
  }
  return activeId
}

// Client Dashboard - App ke sub-clients ka dashboard
export default function ClientDashboard() {
  const token = localStorage.getItem(TOKEN_SUBCLIENT)
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [openSections, setOpenSections] = useState({ business: true })
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)
  const [dash, setDash] = useState(null)
  const [credits, setCredits] = useState({ creditsBalance: 0 })
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)
  const [settingsTab, setSettingsTab] = useState('vectorise')
  const [profileTab, setProfileTab] = useState('profile')
  const [dsModal, setDsModal] = useState(false)
  const [dsForm, setDsForm] = useState({ type: '', title: '', description: '', websiteUrl: '', fileKey: '', fileName: '', uploading: false })
  const [dsSaving, setDsSaving] = useState(false)
  const [dsFilter, setDsFilter] = useState('All')
  const [productModal, setProductModal] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', price: '', status: 'active', imageKey: '', imageName: '', uploading: false })
  const [productSaving, setProductSaving] = useState(false)
  const [productEditId, setProductEditId] = useState(null)
  const [productViewModal, setProductViewModal] = useState(false)
  const [productViewData, setProductViewData] = useState(null)
  const [serviceModal, setServiceModal] = useState(false)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', status: 'active' })
  const [serviceSaving, setServiceSaving] = useState(false)
  const [serviceEditId, setServiceEditId] = useState(null)
  const [serviceViewModal, setServiceViewModal] = useState(false)
  const [serviceViewData, setServiceViewData] = useState(null)
  const [productDropdown, setProductDropdown] = useState(null)
  const [serviceDropdown, setServiceDropdown] = useState(null)

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setProductDropdown(null)
        setServiceDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const load = useCallback(async () => {
    const [meRes, dashRes, creditsRes, datastoreRes, productsRes, servicesRes] = await Promise.all([
      api('/api/business/me', { token }),
      api('/api/business/dashboard', { token }),
      api('/api/business/credits', { token }),
      api('/api/business/datastore', { token }),
      api('/api/business/products', { token }),
      api('/api/business/services', { token }),
    ])
    setMe(meRes)
    setDash({ ...dashRes, datastore: datastoreRes.items || [], products: productsRes.products || [], services: servicesRes.services || [] })
    setCredits(creditsRes)
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try { await load() } catch {
        localStorage.removeItem(TOKEN_SUBCLIENT)
        navigate('/client/dashboard/login')
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [token, navigate, load])

  if (!token) return <Navigate to="/client/dashboard/login" replace />

  const logout = () => {
    localStorage.removeItem(TOKEN_SUBCLIENT)
    navigate('/client/dashboard/login')
  }

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleTabClick = (tabId, sectionId) => {
    setActive(tabId)
    if (sectionId) setOpenSections(prev => ({ ...prev, [sectionId]: true }))
  }

  const stats = dash?.stats || {}
  const agents = dash?.agents || []
  const tickets = dash?.tickets || []
  const initials = (me?.businessName || me?.fullName || 'C').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'} flex-shrink-0`}
        style={{ background: 'linear-gradient(180deg,#fff8f0 0%,#fff3e6 100%)', borderRight: '1px solid #ffe0c0' }}
      >
        {/* Brand */}
        <div className="flex h-[65px] items-center border-b border-orange-200 px-3 flex-shrink-0">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{me?.businessName || 'Client'}</p>
              <p className="truncate text-xs text-slate-500">{me?.appName || 'Ailocity'} • <span className="capitalize">{me?.status || '—'}</span></p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-none" style={{scrollbarWidth:'none'}}>
          {NAV_SECTIONS.map((section) => {
            if (section.single) {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActive(section.id)}
                  title={!sidebarOpen ? section.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    active === section.id
                      ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-orange-100'
                  }`}
                >
                  <section.icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="whitespace-nowrap">{section.label}</span>}
                </button>
              )
            }

            const isOpen = openSections[section.id]
            const isActiveSection = section.children?.some(c => c.id === active)

            return (
              <div key={section.id}>
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => sidebarOpen ? toggleSection(section.id) : handleTabClick(section.children[0].id, section.id)}
                  title={!sidebarOpen ? section.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActiveSection
                      ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-orange-100'
                  }`}
                >
                  <section.icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left whitespace-nowrap">{section.label}</span>
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* Sub-tabs */}
                {sidebarOpen && isOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-orange-200 pl-3">
                    {section.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setActive(child.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all ${
                          active === child.id
                            ? 'bg-orange-100 text-orange-700 font-semibold'
                            : 'text-slate-500 hover:bg-orange-50'
                        }`}
                      >
                        <child.icon size={15} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom tabs - Credits, Tickets, Settings */}
        <div className="px-2 pb-3 border-t border-orange-200 pt-2 flex-shrink-0 space-y-0.5">
          {[
            { id: 'ai-credits', label: 'Credits', icon: CreditCard },
            { id: 'ai-tickets', label: 'Tickets', icon: Ticket },
            { id: 'settings',   label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              title={!sidebarOpen ? tab.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active === tab.id ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm' : 'text-slate-600 hover:bg-orange-100'
              }`}
            >
              <tab.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{tab.label}</span>}
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
              <h1 className="font-semibold text-slate-900 text-lg">{getActiveLabel(active)}</h1>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                Dashboard <ChevronRight size={12} /> {getActiveLabel(active)}
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
                  { label: 'Total Calls',   value: stats.totalCalls ?? 0,   icon: PhoneCall,  color: 'text-blue-600 bg-blue-50' },
                  { label: 'Active Agents', value: stats.activeAgents ?? 0, icon: Bot,        color: 'text-orange-500 bg-orange-50' },
                  { label: 'Open Tickets',  value: stats.openTickets ?? 0,  icon: Ticket,     color: 'text-amber-600 bg-amber-50' },
                  { label: 'Credits Left',  value: stats.creditsLeft ?? 0,  icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-500 text-sm">{s.label}</p>
                      <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={16} /></div>
                    </div>
                    <p className="text-slate-900 text-2xl font-bold">{s.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-sm text-slate-800">AI Agents</div>
                  {agents.length === 0
                    ? <p className="px-5 py-8 text-center text-slate-400 text-sm">No agents yet</p>
                    : agents.map(a => (
                      <div key={a.name} className="px-5 py-3 flex items-center justify-between border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{a.name}</p>
                          <p className="text-slate-400 text-xs">{a.type} • {a.calls} calls</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${a.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{a.status}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-sm text-slate-800">Recent Tickets</div>
                  {tickets.length === 0
                    ? <p className="px-5 py-8 text-center text-slate-400 text-sm">No tickets yet</p>
                    : tickets.map(t => (
                      <div key={t.id} className="px-5 py-3 flex items-center justify-between border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{t.subject}</p>
                          <p className="text-slate-400 text-xs">{t.id}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pill(t.status)}`}>{t.status}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Business - Products */}
          {!loading && active === 'business-products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Products</h2>
                  <p className="text-slate-500 text-sm mt-1">{(dash?.products || []).length} products</p>
                </div>
                <button type="button" onClick={() => { setProductForm({ name: '', description: '', category: '', price: '', status: 'active', imageKey: '', imageName: '', uploading: false }); setProductEditId(null); setProductModal(true) }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                  style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>+ Add Product</button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['#', 'Image', 'Product Name', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dash?.products || []).length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No products yet. Add your first product to get started.</td></tr>
                    ) : (dash?.products || []).map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <Package size={20} className="text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{p.name || '—'}</p>
                          {p.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.category || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{p.price || '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pill(p.status)}`}>{p.status || 'active'}</span></td>
                        <td className="px-4 py-3">
                          <div className="relative dropdown-container">
                            <button onClick={(e) => { e.stopPropagation(); setProductDropdown(productDropdown === p.id ? null : p.id) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                              <Settings size={16} />
                            </button>
                            {productDropdown === p.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-[100]">
                                <button onClick={(e) => { e.stopPropagation(); setProductDropdown(null); setProductViewData(p); setProductViewModal(true) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-t-lg">
                                  <UserRound size={14} /> View
                                </button>
                                <button onClick={(e) => { 
                                  e.stopPropagation()
                                  setProductDropdown(null)
                                  setProductForm({ name: p.name, description: p.description || '', category: p.category || '', price: p.price || '', status: p.status, imageKey: p.imageKey || '', imageName: '', uploading: false })
                                  setProductEditId(p.id)
                                  setProductModal(true)
                                }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                  <FileText size={14} /> Edit
                                </button>
                                <button onClick={async (e) => {
                                  e.stopPropagation()
                                  setProductDropdown(null)
                                  if (!confirm('Delete ' + p.name + '?')) return
                                  try {
                                    await api('/api/business/products/' + p.id, { token, method: 'DELETE' })
                                    const res = await api('/api/business/products', { token })
                                    setDash(prev => ({ ...prev, products: res.products || [] }))
                                  } catch (e) { alert(e.message || 'Delete failed') }
                                }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-b-lg">
                                  <X size={14} /> Delete
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

              {/* Add/Edit Product Modal */}
              {productModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setProductModal(false)}>
                  <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                      <h2 className="text-base font-semibold text-slate-900">{productEditId ? 'Edit Product' : 'Add New Product'}</h2>
                      <button type="button" onClick={() => setProductModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                    </div>
                    <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Product Image</label>
                        <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 hover:border-orange-400 transition-colors">
                          {productForm.imageKey ? (
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                                <Package size={20} className="text-slate-500" />
                              </div>
                              <span className="text-sm text-slate-700 truncate">✓ {productForm.imageName || 'Image uploaded'}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">{productForm.uploading ? 'Uploading…' : 'Choose product image'}</span>
                          )}
                          <input type="file" accept="image/*" className="hidden" disabled={productForm.uploading} onChange={async e => {
                            const file = e.target.files?.[0]; if (!file) return
                            setProductForm(p => ({...p, uploading: true}))
                            try {
                              const fd = new FormData(); fd.append('file', file)
                              const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/business/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
                              const data = await res.json()
                              if (!res.ok) throw new Error(data.error || 'Upload failed')
                              setProductForm(p => ({...p, imageKey: data.key, imageName: file.name, uploading: false}))
                            } catch(err) { alert(err.message || 'Upload failed'); setProductForm(p => ({...p, uploading: false})) }
                          }} />
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Product Name <span className="text-red-500">*</span></label>
                        <input value={productForm.name} onChange={e => setProductForm(p => ({...p, name: e.target.value}))} placeholder="Enter product name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Category</label>
                        <input value={productForm.category} onChange={e => setProductForm(p => ({...p, category: e.target.value}))} placeholder="e.g. Electronics, Clothing, Food" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Price</label>
                        <input value={productForm.price} onChange={e => setProductForm(p => ({...p, price: e.target.value}))} placeholder="₹ 0.00" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Description</label>
                        <textarea value={productForm.description} onChange={e => setProductForm(p => ({...p, description: e.target.value}))} placeholder="Enter product description" rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Status</label>
                        <select value={productForm.status} onChange={e => setProductForm(p => ({...p, status: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                      <button type="button" onClick={() => setProductModal(false)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                      <button type="button" disabled={productSaving || !productForm.name.trim()} onClick={async () => {
                        setProductSaving(true)
                        try {
                          if (productEditId) {
                            await api('/api/business/products/' + productEditId, { token, method: 'PATCH', body: {
                              name: productForm.name.trim(),
                              description: productForm.description.trim(),
                              category: productForm.category.trim(),
                              price: productForm.price.trim(),
                              status: productForm.status,
                              imageKey: productForm.imageKey,
                            }})
                          } else {
                            await api('/api/business/products', { token, method: 'POST', body: {
                              name: productForm.name.trim(),
                              description: productForm.description.trim(),
                              category: productForm.category.trim(),
                              price: productForm.price.trim(),
                              status: productForm.status,
                              imageKey: productForm.imageKey,
                            }})
                          }
                          const res = await api('/api/business/products', { token })
                          setDash(prev => ({ ...prev, products: res.products || [] }))
                          setProductModal(false)
                        } catch (e) { alert(e.message || 'Save failed') }
                        finally { setProductSaving(false) }
                      }} className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>{ productSaving ? 'Saving...' : productEditId ? 'Update Product' : 'Add Product'}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* View Product Modal */}
              {productViewModal && productViewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setProductViewModal(false)}>
                  <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                      <h2 className="text-base font-semibold text-slate-900">Product Details</h2>
                      <button type="button" onClick={() => setProductViewModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {productViewData.imageUrl && (
                        <div className="flex justify-center">
                          <img src={productViewData.imageUrl} alt={productViewData.name} className="w-32 h-32 rounded-xl object-cover border-2 border-slate-200" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Product Name</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{productViewData.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{productViewData.category || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{productViewData.price || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</p>
                          <p className="text-sm text-slate-700 mt-1">{productViewData.description || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${pill(productViewData.status)}`}>{productViewData.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Created</p>
                            <p className="text-xs text-slate-700 mt-1">{new Date(productViewData.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Updated</p>
                            <p className="text-xs text-slate-700 mt-1">{new Date(productViewData.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                      <button type="button" onClick={() => setProductViewModal(false)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business - Services */}
          {!loading && active === 'business-services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Services</h2>
                  <p className="text-slate-500 text-sm mt-1">{(dash?.services || []).length} services</p>
                </div>
                <button type="button" onClick={() => { setServiceForm({ name: '', description: '', price: '', status: 'active' }); setServiceEditId(null); setServiceModal(true) }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                  style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>+ Add Service</button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['#', 'Service Name', 'Description', 'Price', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dash?.services || []).length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No services yet. Add your first service to get started.</td></tr>
                    ) : (dash?.services || []).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{s.description || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.price || '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pill(s.status)}`}>{s.status || 'active'}</span></td>
                        <td className="px-4 py-3">
                          <div className="relative dropdown-container">
                            <button onClick={(e) => { e.stopPropagation(); setServiceDropdown(serviceDropdown === s.id ? null : s.id) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                              <Settings size={16} />
                            </button>
                            {serviceDropdown === s.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-[100]">
                                <button onClick={(e) => { e.stopPropagation(); setServiceDropdown(null); setServiceViewData(s); setServiceViewModal(true) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-t-lg">
                                  <UserRound size={14} /> View
                                </button>
                                <button onClick={(e) => {
                                  e.stopPropagation()
                                  setServiceDropdown(null)
                                  setServiceForm({ name: s.name, description: s.description || '', price: s.price || '', status: s.status })
                                  setServiceEditId(s.id)
                                  setServiceModal(true)
                                }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                  <FileText size={14} /> Edit
                                </button>
                                <button onClick={async (e) => {
                                  e.stopPropagation()
                                  setServiceDropdown(null)
                                  if (!confirm('Delete ' + s.name + '?')) return
                                  try {
                                    await api('/api/business/services/' + s.id, { token, method: 'DELETE' })
                                    const res = await api('/api/business/services', { token })
                                    setDash(prev => ({ ...prev, services: res.services || [] }))
                                  } catch (e) { alert(e.message || 'Delete failed') }
                                }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-b-lg">
                                  <X size={14} /> Delete
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

              {/* Add/Edit Service Modal */}
              {serviceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setServiceModal(false)}>
                  <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                      <h2 className="text-base font-semibold text-slate-900">{serviceEditId ? 'Edit Service' : 'Add New Service'}</h2>
                      <button type="button" onClick={() => setServiceModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Service Name <span className="text-red-500">*</span></label>
                        <input value={serviceForm.name} onChange={e => setServiceForm(p => ({...p, name: e.target.value}))} placeholder="Enter service name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Price</label>
                        <input value={serviceForm.price} onChange={e => setServiceForm(p => ({...p, price: e.target.value}))} placeholder="₹ 0.00" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Description</label>
                        <textarea value={serviceForm.description} onChange={e => setServiceForm(p => ({...p, description: e.target.value}))} placeholder="Enter service description" rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Status</label>
                        <select value={serviceForm.status} onChange={e => setServiceForm(p => ({...p, status: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                      <button type="button" onClick={() => setServiceModal(false)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                      <button type="button" disabled={serviceSaving || !serviceForm.name.trim()} onClick={async () => {
                        setServiceSaving(true)
                        try {
                          if (serviceEditId) {
                            await api('/api/business/services/' + serviceEditId, { token, method: 'PATCH', body: {
                              name: serviceForm.name.trim(),
                              description: serviceForm.description.trim(),
                              price: serviceForm.price.trim(),
                              status: serviceForm.status,
                            }})
                          } else {
                            await api('/api/business/services', { token, method: 'POST', body: {
                              name: serviceForm.name.trim(),
                              description: serviceForm.description.trim(),
                              price: serviceForm.price.trim(),
                              status: serviceForm.status,
                            }})
                          }
                          const res = await api('/api/business/services', { token })
                          setDash(prev => ({ ...prev, services: res.services || [] }))
                          setServiceModal(false)
                        } catch (e) { alert(e.message || 'Save failed') }
                        finally { setServiceSaving(false) }
                      }} className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>{ serviceSaving ? 'Saving...' : serviceEditId ? 'Update Service' : 'Add Service'}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* View Service Modal */}
              {serviceViewModal && serviceViewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setServiceViewModal(false)}>
                  <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                      <h2 className="text-base font-semibold text-slate-900">Service Details</h2>
                      <button type="button" onClick={() => setServiceViewModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Service Name</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{serviceViewData.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{serviceViewData.price || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</p>
                          <p className="text-sm text-slate-700 mt-1">{serviceViewData.description || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${pill(serviceViewData.status)}`}>{serviceViewData.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Created</p>
                            <p className="text-xs text-slate-700 mt-1">{new Date(serviceViewData.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Updated</p>
                            <p className="text-xs text-slate-700 mt-1">{new Date(serviceViewData.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                      <button type="button" onClick={() => setServiceViewModal(false)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business - Profile */}
          {!loading && active === 'business-profile' && (
            <div className="space-y-5">

              {/* Tabs */}
              <div className="flex gap-1 border-b border-slate-200">
                {[
                  { id: 'profile',   label: 'Business Profile' },
                  { id: 'datastore', label: 'Data Store' },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setProfileTab(t.id)}
                    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      profileTab === t.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}>{t.label}</button>
                ))}
              </div>

              {/* Business Profile Tab */}
              {profileTab === 'profile' && (
              <div className="space-y-5">

                {/* Profile Header Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-5">
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 text-2xl font-bold border border-slate-200">
                        {(me?.businessName || 'B').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900">{me?.businessName || '—'}</h2>
                        <p className="text-base text-slate-600 mt-1">{me?.fullName || '—'}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            <span>{me?.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneCall size={16} className="text-slate-400" />
                            <span>{me?.mobile || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-slate-400" />
                            <span>{me?.appName || '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase text-center ${pill(me?.status)}`}>{me?.status || '—'}</span>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase text-center ${me?.kyc === 'verified' ? 'bg-emerald-100 text-emerald-700' : me?.kyc === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{me?.kyc || 'pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Business Info */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3.5 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-900">Business Information</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Business Name', value: me?.businessName, Icon: Briefcase },
                      { label: 'Full Name',     value: me?.fullName,     Icon: UserRound },
                      { label: 'App',           value: me?.appName,      Icon: Package },
                      { label: 'Source',        value: me?.source,       Icon: Radio },
                      { label: 'Owner',         value: me?.owner,        Icon: Users },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Icon size={16} className="text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">{value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3.5 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-900">Contact Details</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Email',   value: me?.email,      Icon: FileText },
                      { label: 'Mobile',  value: me?.mobile,     Icon: PhoneCall },
                      { label: 'Website', value: me?.websiteUrl, Icon: Share2 },
                      { label: 'Address', value: me?.address,    Icon: Radio },
                      { label: 'City',    value: me?.city,       Icon: Landmark },
                      { label: 'Pincode', value: me?.pincode,    Icon: Receipt },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Icon size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5 break-words">{value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account & Compliance */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3.5 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-900">Account &amp; Compliance</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'GST Number', value: me?.gstNumber, Icon: Receipt },
                      { label: 'PAN Number', value: me?.panNumber, Icon: CreditCard },
                      { label: 'KYC Status', value: me?.kyc,       Icon: BadgeCheck },
                      { label: 'Status',     value: me?.status,    Icon: Shield },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Icon size={16} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5 capitalize">{value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Credits */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-100 to-orange-200 px-5 py-3.5 border-b border-orange-300">
                    <p className="text-sm font-bold text-orange-900">Credits &amp; Usage</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Available Credits</p>
                        <p className="text-3xl font-black text-orange-900 mt-1">{(me?.creditsBalance ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center">
                        <CreditCard size={24} className="text-orange-600" />
                      </div>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-3">
                      <div className="h-3 rounded-full" style={{width: me?.creditsBalance > 0 ? '40%' : '0%', background:'linear-gradient(135deg,#FF7A00,#FFB000)'}} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Calls',   value: me?.totalCalls        ?? 0, Icon: PhoneCall },
                        { label: 'Active Agents', value: me?.activeAgentsCount ?? 0, Icon: Bot },
                      ].map(({ label, value, Icon }) => (
                        <div key={label} className="bg-white rounded-xl px-4 py-3 border-2 border-orange-300 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                              <Icon size={14} className="text-orange-600" />
                            </div>
                            <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">{label}</p>
                          </div>
                          <p className="text-2xl font-black text-orange-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
              </div>
              )}

              {/* Data Store Tab */}
              {profileTab === 'datastore' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{(dash?.datastore || []).length} items</p>
                    <button type="button" onClick={() => { setDsForm({ type: '', title: '', description: '', websiteUrl: '', fileKey: '', fileName: '', uploading: false }); setDsModal(true) }}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                      style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>+ Add New Data</button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap gap-1 border-b border-slate-200">
                    {['All','Images','Videos','PDFs','URLs','Websites','YouTube','Text','AI Guidelines'].map(t => (
                      <button key={t} type="button"
                        onClick={() => setDsFilter(t)}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                          dsFilter === t ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}>{t}</button>
                    ))}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['#', 'Type', 'Title', 'Description', 'URL / File'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const typeMap = { Images: 'File Upload', Videos: 'File Upload', PDFs: 'File Upload', URLs: 'URLs', Websites: 'Website', YouTube: 'Youtube', Text: 'Text', 'AI Guidelines': 'AI Guidelines' }
                          const filtered = dsFilter === 'All' ? (dash?.datastore || []) : (dash?.datastore || []).filter(f => f.type === typeMap[dsFilter] || f.type === dsFilter)
                          return filtered.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No items found.</td></tr>
                          ) : filtered.map((f, idx) => (
                            <tr key={f.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 text-sm text-slate-400">{idx + 1}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">{f.type || '—'}</span></td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">{f.title || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{f.description || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {f.fileUrl ? (
                                  <div className="flex items-center gap-3">
                                    {f.mimeType?.startsWith('image/') && (
                                      <img src={f.fileUrl} alt={f.fileName || 'Image'} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                                    )}
                                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline flex items-center gap-1">
                                      {f.fileName ? (
                                        <span className="truncate max-w-[120px]">{f.fileName}</span>
                                      ) : (
                                        <span>View File</span>
                                      )}
                                    </a>
                                  </div>
                                ) : f.url ? (
                                  <a href={f.url} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline truncate block max-w-[160px]">{f.url}</a>
                                ) : '—'}
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Modal */}
                  {dsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDsModal(false)}>
                      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                          <h2 className="text-base font-semibold text-slate-900">Add New Data</h2>
                          <button type="button" onClick={() => setDsModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Item Type</label>
                            <select value={dsForm.type} onChange={e => setDsForm(p => ({...p, type: e.target.value, websiteUrl: '', fileKey: '', fileName: ''}))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                              <option value="">Select type</option>
                              {['File Upload','Youtube','Website','URLs','Text','AI Guidelines'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Title <span className="text-red-500">*</span></label>
                            <input value={dsForm.title} onChange={e => setDsForm(p => ({...p, title: e.target.value}))} placeholder="Enter title" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Description</label>
                            <textarea value={dsForm.description} onChange={e => setDsForm(p => ({...p, description: e.target.value}))} placeholder="Enter description" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-none" />
                          </div>
                          {dsForm.type === 'File Upload' && (
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Upload File</label>
                              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 hover:border-orange-400 transition-colors">
                                <span className="text-sm text-slate-500 truncate">
                                  {dsForm.uploading ? 'Uploading…' : dsForm.fileKey ? `✓ ${dsForm.fileName}` : 'Choose file'}
                                </span>
                                <input type="file" className="hidden" disabled={dsForm.uploading} onChange={async e => {
                                  const file = e.target.files?.[0]; if (!file) return
                                  setDsForm(p => ({...p, uploading: true}))
                                  try {
                                    const fd = new FormData(); fd.append('file', file)
                                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/business/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
                                    const data = await res.json()
                                    if (!res.ok) throw new Error(data.error || 'Upload failed')
                                    setDsForm(p => ({...p, fileKey: data.key, fileName: file.name, mimeType: file.type, fileSize: file.size, uploading: false}))
                                  } catch(err) { alert(err.message || 'Upload failed'); setDsForm(p => ({...p, uploading: false})) }
                                }} />
                              </label>
                            </div>
                          )}
                          {dsForm.type === 'File Upload' && (
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Website URL</label>
                              <input value={dsForm.websiteUrl} onChange={e => setDsForm(p => ({...p, websiteUrl: e.target.value}))} placeholder="https://" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                          )}
                          {(dsForm.type === 'Youtube' || dsForm.type === 'Website') && (
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">{dsForm.type === 'Youtube' ? 'YouTube URL' : 'Website URL'}</label>
                              <input value={dsForm.websiteUrl} onChange={e => setDsForm(p => ({...p, websiteUrl: e.target.value}))} placeholder={dsForm.type === 'Youtube' ? 'https://youtube.com/...' : 'https://'} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                          <button type="button" onClick={() => setDsModal(false)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                          <button type="button" disabled={dsSaving || !dsForm.title.trim() || (dsForm.type === 'File Upload' && !dsForm.fileKey)} onClick={async () => {
                            setDsSaving(true)
                            try {
                              await api('/api/business/datastore', { token, method: 'POST', body: {
                                title: dsForm.title.trim(),
                                type: dsForm.type,
                                description: dsForm.description.trim(),
                                url: dsForm.type === 'File Upload' ? dsForm.websiteUrl.trim() : dsForm.websiteUrl.trim(),
                                fileKey: dsForm.type === 'File Upload' ? dsForm.fileKey : '',
                                fileName: dsForm.type === 'File Upload' ? dsForm.fileName : '',
                                mimeType: dsForm.type === 'File Upload' ? dsForm.mimeType : '',
                                fileSize: dsForm.type === 'File Upload' ? dsForm.fileSize : 0,
                              }})
                              const res = await api('/api/business/datastore', { token })
                              setDash(prev => ({ ...prev, datastore: res.items || [] }))
                              setDsModal(false)
                            } catch (e) { alert(e.message || 'Save failed') }
                            finally { setDsSaving(false) }
                          }} className="rounded-lg px-5 py-1.5 text-sm font-medium text-white disabled:opacity-60" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>{ dsSaving ? 'Saving...' : 'Add Data'}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Tools Page */}
          {!loading && active === 'tools' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Tools</h2>
                <p className="text-slate-500 text-sm mt-1">All your AI-powered tools in one place</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'WhatsApp Automation', desc: 'Send automated WhatsApp messages, campaigns and chatbot flows to your customers at scale.', icon: Radio, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Social Media Campaign', desc: 'Create and manage social media ad campaigns across Instagram, Facebook, YouTube and more.', icon: Megaphone, color: 'bg-orange-50 text-orange-500' },
                  { label: 'Business Automation', desc: 'Automate repetitive business tasks, workflows, follow-ups and internal processes.', icon: Workflow, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Bulk Reels', desc: 'Generate multiple reels at once using AI. Upload content and get ready-to-post reels in bulk.', icon: Film, color: 'bg-pink-50 text-pink-600' },
                  { label: 'Reels Generation', desc: 'Create single high-quality reels using AI. Add captions, music and effects automatically.', icon: Video, color: 'bg-rose-50 text-rose-600' },
                  { label: 'Social Media Mgmt', desc: 'Schedule posts, track engagement and manage all your social media accounts from one place.', icon: Share2, color: 'bg-cyan-50 text-cyan-600' },
                ].map(tool => (
                  <div key={tool.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
                      <tool.icon size={20} />
                    </div>
                    <h3 className="text-slate-900 font-semibold text-sm">{tool.label}</h3>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{tool.desc}</p>
                    <div className="mt-4">
                      <span className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)',color:'white'}}>Coming Soon</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Credits */}
          {!loading && active === 'ai-credits' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-500 text-sm">Current Balance</p>
                <p className="text-slate-900 text-4xl font-bold mt-1">{(credits.creditsBalance ?? 0).toLocaleString()}</p>
                <p className="text-slate-400 text-sm mt-1">credits available</p>
              </div>
            </div>
          )}

          {/* AI Tickets */}
          {!loading && active === 'ai-tickets' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-sm text-slate-800">Support Tickets</div>
              {tickets.length === 0
                ? <p className="px-5 py-12 text-center text-slate-400 text-sm">No tickets yet</p>
                : tickets.map(t => (
                  <div key={t.id} className="px-5 py-4 flex items-center justify-between border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{t.subject}</p>
                      <p className="text-slate-400 text-xs">{t.id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pill(t.status)}`}>{t.status}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* Settings */}
          {!loading && active === 'settings' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                {[{id:'vectorise',label:'Vectorise AI'},{id:'general',label:'General Settings'}].map(t => (
                  <button key={t.id} type="button" onClick={() => setSettingsTab(t.id)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      settingsTab === t.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}>{t.label}</button>
                ))}
              </div>

              {/* Vectorise AI Tab */}
              {settingsTab === 'vectorise' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Vectorise AI</p>
                      <p className="text-white/70 text-xs">Your AI-powered business assistant</p>
                    </div>
                    <span className="ml-auto text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">Active</span>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'AI Calls Made',   value: '0', color: 'text-orange-500' },
                        { label: 'Messages Sent',   value: '0', color: 'text-blue-600' },
                        { label: 'Leads Generated', value: '0', color: 'text-emerald-600' },
                        { label: 'Tasks Automated', value: '0', color: 'text-violet-600' },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <p className="text-xs text-slate-400">{s.label}</p>
                          <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">AI Modules</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'AI Calling Agent',       desc: 'Automate inbound & outbound calls',  icon: PhoneCall },
                          { label: 'WhatsApp Bot',            desc: 'Automated WhatsApp messaging',       icon: Radio },
                          { label: 'Lead Qualifier',          desc: 'Auto-qualify and score leads',       icon: TrendingUp },
                          { label: 'Content Generator',       desc: 'AI-powered content creation',        icon: FileText },
                          { label: 'Social Media Scheduler',  desc: 'Schedule & post across platforms',   icon: Share2 },
                          { label: 'Workflow Automation',     desc: 'Automate repetitive business tasks', icon: Workflow },
                        ].map(m => (
                          <div key={m.label} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                <m.icon size={15} className="text-orange-500" />
                              </div>
                              <div>
                                <p className="text-slate-800 font-medium text-sm">{m.label}</p>
                                <p className="text-slate-400 text-xs">{m.desc}</p>
                              </div>
                            </div>
                            <span className="text-xs bg-slate-200 text-slate-500 px-2.5 py-1 rounded-full font-medium flex-shrink-0">Coming Soon</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">API Access</p>
                      <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex-1">
                          <p className="text-slate-800 font-medium text-sm">Vectorise AI API Key</p>
                          <p className="text-slate-400 text-xs mt-0.5 font-mono">••••••••••••••••••••••••••••••••</p>
                        </div>
                        <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Settings Tab */}
              {settingsTab === 'general' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                  {[
                    { label: 'Account Settings', desc: 'Manage your account preferences' },
                    { label: 'Notifications',     desc: 'Configure notification preferences' },
                    { label: 'Security',          desc: 'Password and security settings' },
                    { label: 'Billing',           desc: 'Manage your billing and credits' },
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
              )}
            </div>
          )}

          {/* Coming Soon for all other tabs */}
          {!loading && active !== 'overview' && active !== 'business-profile' && active !== 'business-products' && active !== 'business-services' && active !== 'tools' && active !== 'ai-credits' && active !== 'ai-tickets' && active !== 'settings' && (() => {
            const allTabs = NAV_SECTIONS.flatMap(s => s.children || [])
            const tab = allTabs.find(t => t.id === active)
            if (!tab) return null
            const section = NAV_SECTIONS.find(s => s.children?.some(c => c.id === active))
            return (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex items-start gap-6">
                  <div className="p-4 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                    <tab.icon size={32} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{section?.label}</p>
                    <h2 className="text-xl font-semibold text-slate-900">{tab.label}</h2>
                    <p className="text-slate-500 text-sm mt-2 max-w-xl">
                      Manage your {tab.label.toLowerCase()} efficiently. This module is being built and will be available soon.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                      Coming Soon
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Setup', 'Analytics', 'Automation'].map(f => (
                    <div key={f} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <p className="text-slate-800 font-semibold text-sm">{f}</p>
                      <p className="text-slate-400 text-xs mt-1">Feature coming soon</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </main>
    </div>
  )
}
