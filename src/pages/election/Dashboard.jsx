import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, HelpCircle, Settings as SettingsIcon,
  Menu, ChevronDown, ChevronRight, LogOut, AlertCircle, HelpCircle as HelpIcon,
  UserCheck, Navigation, Map, Shield, Activity, Footprints
} from 'lucide-react'
import { api, TOKEN_ELECTION, TOKEN_CLIENT } from '../../lib/api'
import CandidatesTab from './components/CandidatesTab'
import VolunteersTab from './components/VolunteersTab'
import RoutesTab from './components/RoutesTab'
import MapTab from './components/MapTab'
import VotersTab from './components/VotersTab'
import SabhaTab from './components/SabhaTab'
import PadyatraTab from './components/PadyatraTab'

const TABS = [
  { id: 'overview',   label: 'Overview',            icon: LayoutDashboard },
  { id: 'map',        label: 'Live Map',            icon: Map },
  { id: 'routes',     label: 'Routes',              icon: Navigation },
  { id: 'volunteers', label: 'Volunteers',          icon: UserCheck },
  { id: 'candidates', label: 'Candidates',          icon: Users },
  { id: 'voters',     label: 'Voters',              icon: Users },
  { id: 'sabha',      label: 'Sabha (Public)',      icon: Shield },
  { id: 'padyatra',   label: 'Padyatra',            icon: Footprints },
  { id: 'simulator',  label: 'Telemetry Simulator',  icon: Activity },
]

const BOTTOM_TABS = [
  { id: 'help',       label: 'Help',         icon: HelpCircle },
  { id: 'settings',   label: 'Settings',     icon: SettingsIcon },
]

export default function ElectionDashboard() {
  const token = localStorage.getItem(TOKEN_ELECTION) || localStorage.getItem(TOKEN_CLIENT)
  const navigate = useNavigate()

  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [me, setMe] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const [simSubTab, setSimSubTab] = useState('map') // 'map' | 'volunteers' | 'routes'

  // Fetch election context and candidates list
  const loadData = async () => {
    try {
      setLoading(true)
      const data = await api('/api/election/me', { token })
      setMe(data)
      setCandidates(data.portalCandidates || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load election data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  if (!token) return <Navigate to="/client/login" replace />

  const logout = () => {
    localStorage.removeItem(TOKEN_ELECTION)
    localStorage.removeItem(TOKEN_CLIENT)
    navigate('/client/login')
  }

  const heading = [...TABS, ...BOTTOM_TABS].find(t => t.id === active)?.label || 'Election Portal'

  // Calculations for dashboard overview
  const partyStats = candidates.reduce((acc, curr) => {
    acc[curr.party] = (acc[curr.party] || 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'} flex flex-col flex-shrink-0 border-r border-orange-200`}
        style={{ background: 'linear-gradient(180deg, #FFFDFB 0%, #FFF5EB 100%)' }}
      >
        {/* Logo Section */}
        <div className="flex h-[65px] items-center border-b border-orange-200 px-4 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF7A00] to-[#FFB000] flex items-center justify-center flex-shrink-0 shadow-md">
            <Users size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-800">{me?.businessName || 'Ailocity Election'}</p>
              <p className="truncate text-xs text-orange-600 font-medium">Election Management</p>
            </div>
          )}
        </div>

        {/* Top Navigation */}
        <nav className="flex-1 space-y-1 p-2 mt-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md'
                  : 'text-slate-600 hover:bg-orange-100/50 hover:text-slate-800'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-orange-200 p-2 space-y-1 mb-2 bg-orange-50/30">
          {BOTTOM_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md'
                  : 'text-slate-600 hover:bg-orange-100/50 hover:text-slate-800'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(s => !s)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-base">{heading}</h1>
              <p className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                Election <ChevronRight size={10} /> {heading}
              </p>
            </div>
          </div>

          {/* User Profile Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropOpen(!dropOpen)}
              className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/50 px-3 py-1.5 text-sm hover:bg-orange-100/50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#FF7A00] text-white text-xs font-bold flex items-center justify-center">
                E
              </div>
              <span className="font-semibold text-slate-800 max-w-[120px] truncate">{me?.fullName || 'Election Admin'}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {dropOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1 shadow-lg z-20">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Overview Tab Content */}
              {active === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Candidates</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-2">{candidates.length}</h3>
                      <p className="text-xs text-emerald-600 font-medium mt-1">✓ Live inside system</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Wards</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-2">
                        {new Set(candidates.map(c => c.ward)).size || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Total constituencies</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Parties</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-2">
                        {new Set(candidates.map(c => c.party)).size || 0}
                      </h3>
                      <p className="text-xs text-orange-600 font-semibold mt-1">Parties contesting</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Status</p>
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-slate-700 uppercase">Operational</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Syncing live databases</p>
                    </div>
                  </div>

                  {/* Charts & Analytics Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Contesting Parties Breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-orange-600">Contesting Parties Breakdown</h3>
                      {Object.keys(partyStats).length === 0 ? (
                        <p className="text-slate-400 text-sm italic py-4">No candidates registered to build party analytics.</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(partyStats).map(([party, count]) => {
                            const pct = Math.round((count / candidates.length) * 100)
                            return (
                              <div key={party} className="space-y-1.5">
                                <div className="flex justify-between text-sm font-semibold">
                                  <span className="text-slate-700">{party}</span>
                                  <span className="text-slate-500">{count} Candidates ({pct}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] h-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Election Notifications / Notice Board */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-orange-600">Election Circulars & Help</h3>
                      <div className="space-y-4 flex-1">
                        <div className="border-l-4 border-orange-500 pl-3 py-1 bg-orange-50/30 rounded-r-lg">
                          <p className="text-xs text-slate-400 font-medium">16 July, 2026</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">Nominations Closed</p>
                          <p className="text-xs text-slate-500 mt-1">Verification of candidates documents is ongoing.</p>
                        </div>
                        <div className="border-l-4 border-slate-300 pl-3 py-1 bg-slate-50/50 rounded-r-lg">
                          <p className="text-xs text-slate-400 font-medium">12 July, 2026</p>
                          <p className="text-sm font-semibold text-slate-700 mt-0.5">Voter Slips Released</p>
                          <p className="text-xs text-slate-500 mt-1">Local booth officers have begun digital slip generation.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates Tab Content */}
              {active === 'candidates' && (
                <CandidatesTab token={token} onCandidatesChange={setCandidates} mode="real" />
              )}

              {/* Volunteers Tab Content */}
              {active === 'volunteers' && (
                <VolunteersTab token={token} mode="real" />
              )}

              {/* Routes Tab Content */}
              {active === 'routes' && (
                <RoutesTab token={token} mode="real" />
              )}

              {/* Map Tab Content */}
              {active === 'map' && (
                <MapTab token={token} mode="real" />
              )}

              {/* Voters Tab Content */}
              {active === 'voters' && (
                <VotersTab />
              )}

              {/* Sabha Tab Content */}
              {active === 'sabha' && (
                <SabhaTab />
              )}

              {/* Padyatra Tab Content */}
              {active === 'padyatra' && (
                <PadyatraTab />
              )}

              {/* Telemetry Simulator Hub Tab Content */}
              {active === 'simulator' && (
                <div className="space-y-6">
                  {/* Premium Inner Tabs Subbar */}
                  <div className="flex border-b border-orange-200 gap-1 bg-orange-50/20 p-1.5 rounded-2xl border">
                    <button
                      onClick={() => setSimSubTab('map')}
                      className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                        simSubTab === 'map'
                          ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md'
                          : 'text-slate-600 hover:bg-orange-50 hover:text-slate-800'
                      }`}
                    >
                      📟 Simulator Map & Stream
                    </button>
                    <button
                      onClick={() => setSimSubTab('volunteers')}
                      className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                        simSubTab === 'volunteers'
                          ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md'
                          : 'text-slate-600 hover:bg-orange-50 hover:text-slate-800'
                      }`}
                    >
                      👥 Mock Volunteers
                    </button>
                    <button
                      onClick={() => setSimSubTab('routes')}
                      className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                        simSubTab === 'routes'
                          ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md'
                          : 'text-slate-600 hover:bg-orange-50 hover:text-slate-800'
                      }`}
                    >
                      📍 Mock Routes
                    </button>
                  </div>

                  {/* Render Simulator Sub-tab content */}
                  <div className="pt-2">
                    {simSubTab === 'map' && (
                      <MapTab token={token} mode="simulator" />
                    )}
                    {simSubTab === 'volunteers' && (
                      <VolunteersTab token={token} mode="simulator" />
                    )}
                    {simSubTab === 'routes' && (
                      <RoutesTab token={token} mode="simulator" />
                    )}
                  </div>
                </div>
              )}

              {/* Help Tab Content */}
              {active === 'help' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Support & Assistance</h3>
                    <p className="text-xs text-slate-400 mt-1">Find instructions and support context for operating the election dashboard</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-700">FAQ Guidelines</h4>
                      <div className="space-y-3">
                        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                          <p className="font-bold text-slate-800 text-sm">How do I add a new candidate?</p>
                          <p className="text-xs text-slate-500 mt-1.5">Navigate to the Candidates tab, click the "Add Candidate" button, fill in their details (Name, Party, Symbol, Ward), and click Save.</p>
                        </div>
                        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                          <p className="font-bold text-slate-800 text-sm">Can I update a candidate's details?</p>
                          <p className="text-xs text-slate-500 mt-1.5">Yes. Use the gear icon on any row and choose Edit to update candidate, house, or voter records.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2">
                          <HelpIcon size={18} className="text-[#FF7A00]" />
                          Need direct help?
                        </h4>
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                          For high-level system assistance, system integration challenges, or custom symbol graphics uploads, please open a direct support request through the Main Admin client interface.
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-orange-200/50 text-xs text-orange-700 font-semibold">
                        Support Hotline: support@ailocity.com
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab Content */}
              {active === 'settings' && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Election Settings</h3>
                    <p className="text-xs text-slate-400 mt-1">Configure profile details and election parameters</p>
                  </div>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={me?.fullName || ''}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business / Agency Name</label>
                      <input
                        type="text"
                        value={me?.businessName || ''}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={me?.email || ''}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Associated Phone</label>
                      <input
                        type="text"
                        value={me?.mobile || ''}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="pt-4">
                      <p className="text-xs text-slate-400 italic">★ Settings values are locked. Contact your platform admin to request structural edits to your election account profile.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

    </div>
  )
}
