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

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const load = useCallback(async () => {
    const [meRes, dashRes, creditsRes] = await Promise.all([
      api('/api/client/me', { token }),
      api('/api/client/dashboard', { token }),
      api('/api/client/credits', { token }),
    ])
    setMe(meRes)
    setDash(dashRes)
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
        style={{ background: 'linear-gradient(180deg,#FF7A00 0%,#cc6200 100%)' }}
      >
        {/* Brand */}
        <div className="flex h-[65px] items-center border-b border-black/20 px-3 flex-shrink-0">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-black">{me?.businessName || 'Client'}</p>
              <p className="truncate text-xs text-black/60">{me?.appName || 'Ailocity'} • <span className="capitalize">{me?.status || '—'}</span></p>
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
                      ? 'bg-black/20 text-black font-semibold'
                      : 'text-black/80 hover:bg-black/10'
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
                      ? 'bg-black/20 text-black font-semibold'
                      : 'text-black/80 hover:bg-black/10'
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
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-black/20 pl-3">
                    {section.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setActive(child.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all ${
                          active === child.id
                            ? 'bg-white/30 text-black font-semibold'
                            : 'text-black/70 hover:bg-black/10'
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
        <div className="px-2 pb-3 border-t border-black/20 pt-2 flex-shrink-0 space-y-0.5">
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
                active === tab.id ? 'bg-black/20 text-black font-semibold' : 'text-black/80 hover:bg-black/10'
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

          {/* Business - Profile */}
          {!loading && active === 'business-profile' && (
            <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Business Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Business Name', me?.businessName],
                  ['Full Name', me?.fullName],
                  ['Email', me?.email],
                  ['Mobile', me?.mobile],
                  ['App', me?.appName],
                  ['Status', me?.status],
                  ['KYC', me?.kyc],
                  ['Credits', me?.creditsBalance],
                ].map(([l, v]) => v !== undefined && v !== '' ? (
                  <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{String(v)}</p>
                  </div>
                ) : null)}
              </div>
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
          {!loading && active !== 'overview' && active !== 'business-profile' && (() => {
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
