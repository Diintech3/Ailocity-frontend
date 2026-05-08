import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UserRound, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight, CalendarDays, BookOpen,
  Bot, TrendingUp, DollarSign,
} from 'lucide-react'
import { api, TOKEN_BD } from '../../lib/api'

const MAIN_TABS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'meetings',  label: 'Meetings',  icon: CalendarDays },
  { id: 'trainings', label: 'Trainings', icon: BookOpen },
  { id: 'ai-agent',  label: 'AI Agent',  icon: Bot },
  { id: 'earnings',  label: 'Earnings',  icon: DollarSign },
  { id: 'profile',   label: 'Profile',   icon: UserRound },
]

const BOTTOM_TABS = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

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
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)
  const [dash, setDash] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const load = useCallback(async () => {
    const [meRes, dashRes] = await Promise.all([
      api('/api/bd/me', { token }),
      api('/api/bd/dashboard', { token }),
    ])
    setMe(meRes)
    setDash(dashRes)
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

  if (!token) return <Navigate to="/bd/login" replace />

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
        style={{ background: 'linear-gradient(180deg,#FF7A00 0%,#cc6200 100%)' }}
      >
        {/* Brand */}
        <div className="flex h-[65px] items-center border-b border-black/20 px-3 flex-shrink-0">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-black">{me?.businessName || 'BD Partner'}</p>
              <p className="truncate text-xs text-black/60">Ailocity BD • <span className="capitalize">{me?.status || '—'}</span></p>
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
                active === id ? 'bg-black/20 text-black font-semibold' : 'text-black/80 hover:bg-black/10'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom tabs */}
        <div className="px-2 pb-3 border-t border-black/20 pt-2 flex-shrink-0 space-y-0.5">
          {BOTTOM_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={!sidebarOpen ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active === id ? 'bg-black/20 text-black font-semibold' : 'text-black/80 hover:bg-black/10'
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
    </div>
  )
}
