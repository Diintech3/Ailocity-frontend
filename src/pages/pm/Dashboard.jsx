import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Users, Megaphone,
  Wrench, MonitorPlay, HelpCircle, Settings as SettingsIcon,
  Menu, ChevronDown, ChevronRight, LogOut, X,
} from 'lucide-react'
import { api, TOKEN_PM, TOKEN_CLIENT } from '../../lib/api'

import Overview  from './tabs/Overview'
import Projects  from './tabs/Projects'
import Leads     from './tabs/Leads'
import Campaign  from './tabs/Campaign'
import Tools     from './tabs/Tools'
import Ads       from './tabs/Ads'
import Help      from './tabs/Help'
import PMSettings from './tabs/Settings'

const TABS = [
  { id: 'overview',  label: 'Overview',   icon: LayoutDashboard },
  { id: 'projects',  label: 'Projects',   icon: FolderOpen },
  { id: 'leads',     label: 'Leads',      icon: Users },
  { id: 'campaign',  label: 'Campaign',   icon: Megaphone },
  { id: 'tools',     label: 'Tools',      icon: Wrench },
  { id: 'ads',       label: 'Ads',        icon: MonitorPlay },
]

const BOTTOM_TABS = [
  { id: 'help',      label: 'Help',       icon: HelpCircle },
  { id: 'settings',  label: 'Settings',   icon: SettingsIcon },
]

export default function PMDashboard() {
  const token = localStorage.getItem(TOKEN_PM) || localStorage.getItem(TOKEN_CLIENT)
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dropOpen, setDropOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    api('/api/pm/me', { token })
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (!token) return <Navigate to="/client/login" replace />

  const logout = () => {
    localStorage.removeItem(TOKEN_PM)
    localStorage.removeItem(TOKEN_CLIENT)
    navigate('/client/login')
  }

  const heading = TABS.find(t => t.id === active)?.label || 'PM'

  const renderTab = () => {
    const props = { token, api, me }
    switch (active) {
      case 'overview':  return <Overview {...props} />
      case 'projects':  return <Projects {...props} />
      case 'leads':     return <Leads {...props} />
      case 'campaign':  return <Campaign {...props} />
      case 'tools':     return <Tools />
      case 'ads':       return <Ads {...props} />
      case 'help':      return <Help />
      case 'settings':  return <PMSettings {...props} />
      default:          return <Overview {...props} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'} flex flex-col flex-shrink-0`}
        style={{ background: 'linear-gradient(180deg,#fff8f0 0%,#fff3e6 100%)', borderRight: '1px solid #ffe0c0' }}
      >
        {/* Logo */}
        <div className="flex h-[65px] items-center border-b border-orange-200 px-3 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF7A00] to-[#FFB000] flex items-center justify-center flex-shrink-0">
            <MonitorPlay size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{me?.businessName || 'PM'}</p>
              <p className="truncate text-xs text-slate-500">Performance Marketing</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Tabs */}
        <div className="border-t border-orange-200 p-2 space-y-1">
          {BOTTOM_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(s => !s)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-semibold text-slate-900">{heading}</h1>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                PM Portal <ChevronRight size={12} /> {heading}
              </p>
            </div>
          </div>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setDropOpen(v => !v)} className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFB000] text-white text-xs font-bold shadow-md">
                {(me?.businessName || 'PM').slice(0, 2).toUpperCase()}
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
                <button onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={14} /></button>
            </div>
          )}
          {loading
            ? <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            : renderTab()
          }
        </section>
      </main>
    </div>
  )
}
