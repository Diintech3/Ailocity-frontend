import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PhoneCall, Users, FileText, Settings, Package,
  LogOut, Menu, X, ChevronDown, ChevronRight, Bot, BookOpen,
  Megaphone, Ticket, CreditCard, HelpCircle, Plus, Pencil, Trash2,
  Eye, Settings2, Search, Send, Bell, UserCheck, Mail, MapPin, Briefcase, Calendar,
} from 'lucide-react'
import { api, TOKEN_TC, TOKEN_CLIENT } from '../../lib/api'

const MAIN_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'business', label: 'Business', icon: Package },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'mydail', label: 'MyDail', icon: PhoneCall },
  { id: 'meetings', label: 'Meetings', icon: FileText },
  { id: 'team', label: 'Team', icon: UserCheck },
  { id: 'ai-agent', label: 'AI Agent', icon: Bot },
  { id: 'ai-calls', label: 'AI Calls', icon: PhoneCall },
  { id: 'trainings', label: 'Trainings', icon: BookOpen },
  { id: 'telegram', label: 'Telegram', icon: Bell },
]

const BOTTOM_TABS = [
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-600',
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-600',
  waiting: 'bg-slate-100 text-slate-700',
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-red-100 text-red-700',
  neutral: 'bg-blue-100 text-blue-700',
  inbound: 'bg-violet-100 text-violet-700',
  outbound: 'bg-cyan-100 text-cyan-700',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

function pill(v) {
  return STATUS_COLORS[String(v || '').toLowerCase()] || 'bg-slate-200 text-slate-600'
}

function fmtDt(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function meetingInRange(m, filter, rangeStart, rangeEnd) {
  const t = new Date(m.scheduledAt || m.createdAt).getTime()
  if (Number.isNaN(t)) return true
  const now = Date.now()
  const startDay = new Date()
  startDay.setHours(0, 0, 0, 0)
  if (filter === 'today') return t >= startDay.getTime() && t < startDay.getTime() + 86400000
  if (filter === '7d') return t >= now - 7 * 86400000
  if (filter === 'range' && rangeStart && rangeEnd) {
    const a = new Date(rangeStart).setHours(0, 0, 0, 0)
    const b = new Date(rangeEnd).setHours(23, 59, 59, 999)
    return t >= a && t <= b
  }
  return true
}

/** Territory as stacked lines (POD, then city · region, etc.) — wraps in column without forcing wide table. */
function contactTerritoryRows(r) {
  const t = r?.territory
  const lines = []

  if (t && typeof t === 'object') {
    const podLine = [t.podNumber, t.podName].filter(Boolean).join(' ').trim()
    if (podLine) lines.push(podLine)

    const cityReg = [t.cityName, t.regionName]
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
    if (cityReg.length) lines.push(cityReg.join(' · '))

    const state = typeof t.stateName === 'string' ? t.stateName.trim() : ''
    if (state && !lines.some((ln) => ln.includes(state))) lines.push(state)
  }

  if (lines.length === 0) {
    const fb = [r?.city, r?.state].filter(Boolean).join(', ')
    if (fb) lines.push(fb)
  }

  return lines.length ? lines : ['—']
}

function categoryCell(r) {
  const cat = String(r?.category || '').trim()
  const sub = String(r?.subCategory || '').trim()
  if (cat && sub) return { primary: cat, secondary: sub }
  if (cat) return { primary: cat, secondary: '' }
  return { primary: '—', secondary: '' }
}

/** Second line under name only when company differs from display name (no duplicate lines). */
function businessCompanySubtitle(r) {
  const co = String(r?.company || '').trim()
  if (!co) return null
  const nm = String(r?.name || '').trim().toLowerCase()
  if (co.toLowerCase() === nm) return null
  return co
}

function contactTypeIncludes(typeStr, needle) {
  const t = String(typeStr || '').toLowerCase()
  if (!needle || needle === 'all') return true
  if (needle === 'client') return t.includes('client') || t === 'both'
  if (needle === 'server') return t.includes('server') || t === 'both'
  return false
}

function tcToken() {
  let t = localStorage.getItem(TOKEN_TC)
  if (t) return t
  const c = localStorage.getItem(TOKEN_CLIENT)
  if (!c) return null
  try {
    const p = JSON.parse(atob(c.split('.')[1]))
    if (p?.appId === 'ailocity-tc') return c
  } catch {
    /* ignore */
  }
  return null
}

// ── Quick update meeting inline ─────────────────────────────────────────────
async function quickUpdateMeeting(token, id, patch, load) {
  try {
    await api(`/api/business/meetings/${id}`, { token, method: 'PATCH', body: patch })
    await load()
  } catch (e) {
    alert(e.message || 'Update failed')
  }
}

const BLANK_MEETING = {
  serverContactId: '',
  serverName: '',
  clientContactId: '',
  clientName: '',
  assignBdId: '',
  assignBdName: '',
  agenda: '',
  scheduledAt: '',
  disposition: 'warm',
  contactPerson: '',
  contactNumber: '',
  noteForBd: '',
  status: 'pending',
  outcome: 'waiting',
  notifyServer: true,
  notifyClient: true,
  notifyBd: true,
}

const BLANK_DIAL_REP = { title: '', summary: '', notes: '', periodLabel: '' }
const BLANK_DIAL_CALL = { partyName: '', phone: '', durationSec: '', disposition: '', notes: '' }
const BLANK_TRAINING = { title: '', module: '', status: 'pending', scheduledAt: '', notes: '' }
const BLANK_AI_CALL = { direction: 'inbound', party: '', phone: '', durationSec: '', outcome: '', notes: '', status: 'completed' }

/** Same page size as Client Portal → Contacts (Business) table */
const BUSINESS_PER_PAGE = 20

/** Industrial modal / form chrome (readable 16px+ body, clear hierarchy). */
const tcLabel = 'block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide'
const tcInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors'
const tcSelect = `${tcInput} appearance-none cursor-pointer capitalize`
const tcTextarea = `${tcInput} min-h-[72px] resize-y leading-relaxed`
const tcModalOverlay = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
const tcModalPanel =
  'relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]'
const tcModalHeader = 'flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-3 flex-shrink-0 bg-white rounded-t-xl'
const tcModalTitle = 'text-sm font-bold text-neutral-950 leading-tight'
const tcModalSub = 'text-xs text-neutral-500 mt-0.5 font-normal'
const tcModalBody = 'px-5 py-3 space-y-3 flex-1 overflow-y-auto'
const tcModalFooter =
  'flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3 bg-slate-50 rounded-b-xl flex-shrink-0'
const tcBtnGhost =
  'rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-800 hover:bg-slate-50 transition-colors'
const tcBtnPrimary =
  'rounded-lg px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

const tcDropdown =
  'fixed z-[9999] w-[11.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]'
const tcDropdownItem =
  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-base font-medium text-neutral-800 hover:bg-slate-50 active:bg-slate-100'
const tcDropdownItemDanger =
  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100'

function tcDisplay(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

function openMenu(e, kind, id, setMenu, setPos) {
  const rect = e.currentTarget.getBoundingClientRect()
  setPos({ top: rect.bottom + 4, left: rect.right - 160 })
  setMenu(cur => cur?.kind === kind && cur?.id === id ? null : { kind, id })
}

export default function TCDashboard() {
  const token = tcToken()
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(!!token)
  const [me, setMe] = useState(null)
  const [dash, setDash] = useState(null)
  const [leads, setLeads] = useState([])
  const [contacts, setContacts] = useState([])
  const [meetings, setMeetings] = useState([])
  const [dialReports, setDialReports] = useState([])
  const [dialCalls, setDialCalls] = useState([])
  const [trainings, setTrainings] = useState([])
  const [aiCalls, setAiCalls] = useState([])
  const [bdAssignees, setBdAssignees] = useState([])
  const [leadSearch, setLeadSearch] = useState('')
  const [myDialSub, setMyDialSub] = useState('report')
  const [aiCallsSub, setAiCallsSub] = useState('inbound')
  const [businessTab, setBusinessTab] = useState('all')
  const [businessPage, setBusinessPage] = useState(1)
  const [meetingFilter, setMeetingFilter] = useState('today')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)
  const menuRef = useRef(null)
  /** @type {[null | { kind: 'meeting' | 'report' | 'dial' | 'aicall' | 'training' | 'lead', id: string }, React.Dispatch<React.SetStateAction<null | { kind: 'meeting' | 'report' | 'dial' | 'aicall' | 'training' | 'lead', id: string }>>]} */
  const [tcActionMenu, setTcActionMenu] = useState(null)
  const [tcMenuPos, setTcMenuPos] = useState({ top: 0, left: 0 })
  const [viewMeeting, setViewMeeting] = useState(null)
  const [viewReport, setViewReport] = useState(null)
  const [viewDialCall, setViewDialCall] = useState(null)
  const [viewAiCall, setViewAiCall] = useState(null)
  const [viewTraining, setViewTraining] = useState(null)
  const [meetingModal, setMeetingModal] = useState({ open: false, mode: 'add', item: null })
  const [meetingForm, setMeetingForm] = useState(BLANK_MEETING)
  const [meetingSaving, setMeetingSaving] = useState(false)
  const [repModal, setRepModal] = useState({ open: false, item: null })
  const [repForm, setRepForm] = useState(BLANK_DIAL_REP)
  const [dialCallModal, setDialCallModal] = useState({ open: false, item: null })
  const [dialCallForm, setDialCallForm] = useState(BLANK_DIAL_CALL)
  const [trainingModal, setTrainingModal] = useState({ open: false, item: null })
  const [trainingForm, setTrainingForm] = useState(BLANK_TRAINING)
  const [aiCallModal, setAiCallModal] = useState({ open: false, item: null })
  const [aiCallForm, setAiCallForm] = useState(BLANK_AI_CALL)
  const [savingMisc, setSavingMisc] = useState(false)

  // ── Team state ──────────────────────────────────────────────────────────────
  const TEAM_ROLES = ['TC', 'BD', 'Support', 'Manager', 'Trainer', 'Field Agent', 'Other']
  const BLANK_TEAM_MEMBER = { name: '', email: '', mobile: '', role: 'TC', city: '', address: '', status: 'active', joiningDate: '', notes: '', imageUrl: '' }
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Rahul Sharma', email: 'rahul@ailocity.com', mobile: '9876543210', role: 'TC', city: 'Mumbai', address: 'Andheri West, Mumbai', status: 'active', joiningDate: '2024-01-15', notes: 'Senior TC, handles west zone', imageUrl: '' },
    { id: '2', name: 'Priya Verma', email: 'priya@ailocity.com', mobile: '9812345678', role: 'BD', city: 'Delhi', address: 'Connaught Place, Delhi', status: 'active', joiningDate: '2024-02-10', notes: 'BD partner, north region', imageUrl: '' },
    { id: '3', name: 'Amit Patel', email: 'amit@ailocity.com', mobile: '9988776655', role: 'Support', city: 'Ahmedabad', address: 'SG Highway, Ahmedabad', status: 'active', joiningDate: '2024-03-05', notes: '', imageUrl: '' },
    { id: '4', name: 'Sneha Joshi', email: 'sneha@ailocity.com', mobile: '9765432109', role: 'Trainer', city: 'Pune', address: 'Hinjewadi, Pune', status: 'inactive', joiningDate: '2023-11-20', notes: 'On leave', imageUrl: '' },
    { id: '5', name: 'Vikram Singh', email: 'vikram@ailocity.com', mobile: '9654321098', role: 'Field Agent', city: 'Jaipur', address: 'Malviya Nagar, Jaipur', status: 'active', joiningDate: '2024-04-01', notes: 'Rajasthan zone', imageUrl: '' },
  ])
  const [teamModal, setTeamModal] = useState({ open: false, mode: 'add', item: null })
  const [teamForm, setTeamForm] = useState(BLANK_TEAM_MEMBER)
  const [teamViewItem, setTeamViewItem] = useState(null)
  const [teamTabFilter, setTeamTabFilter] = useState('all')
  const [teamSearch, setTeamSearch] = useState('')
  const [teamImgUploading, setTeamImgUploading] = useState(false)

  // ── Lead management state ───────────────────────────────────────────────────
  const BLANK_LEAD = { name: '', email: '', mobile: '', source: 'Direct', requirement: '', budget: '', status: 'new', priority: 'medium', assignedTo: '', assignedName: '', followUpDate: '', notes: '' }
  const [leadModal, setLeadModal] = useState({ open: false, item: null })
  const [leadForm, setLeadForm] = useState(BLANK_LEAD)
  const [leadViewItem, setLeadViewItem] = useState(null)
  const [leadStatusFilter, setLeadStatusFilter] = useState('all')
  const [leadPriorityFilter, setLeadPriorityFilter] = useState('all')
  const [leadSearchQ, setLeadSearchQ] = useState('')

  // ── Telegram state ──────────────────────────────────────────────────────────
  const [tgBotToken, setTgBotToken] = useState('')
  const [tgChatId, setTgChatId] = useState('')
  const [tgSettingsSaving, setTgSettingsSaving] = useState(false)
  const [tgSettingsSaved, setTgSettingsSaved] = useState(false)
  const [tgMessage, setTgMessage] = useState('')
  const [tgSending, setTgSending] = useState(false)
  const [tgSendResult, setTgSendResult] = useState(null) // { ok: bool, msg: string }
  const [tgActiveSection, setTgActiveSection] = useState('send') // 'send' | 'settings'

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
      if (!e.target.closest('[data-menu]')) setTcActionMenu(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Load telegram settings on mount and when tab opens
  useEffect(() => {
    if (!token) return
    api('/api/business/telegram/settings', { token })
      .then((r) => {
        setTgBotToken(r.botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '')
        setTgChatId(r.chatId || import.meta.env.VITE_TELEGRAM_CHAT_ID || '')
      })
      .catch(() => {
        setTgBotToken(import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '')
        setTgChatId(import.meta.env.VITE_TELEGRAM_CHAT_ID || '')
      })
  }, [token])

  const load = useCallback(async () => {
    const [
      meRes,
      dashRes,
      leadsRes,
      contactsRes,
      meetingsRes,
      repRes,
      dialCallsRes,
      trainRes,
      aiRes,
      bdRes,
    ] = await Promise.all([
      api('/api/business/me', { token }),
      api('/api/business/dashboard', { token }),
      api('/api/business/leads', { token }),
      api('/api/business/contacts', { token }),
      api('/api/business/meetings', { token }),
      api('/api/business/dial-reports', { token }),
      api('/api/business/dial-calls', { token }),
      api('/api/business/tc-trainings', { token }),
      api('/api/business/ai-calls', { token }),
      api('/api/business/tc-bd-assignees', { token }),
    ])
    setMe(meRes)
    setDash(dashRes)
    setLeads(leadsRes.leads || [])
    setContacts(contactsRes.contacts || [])
    setMeetings(meetingsRes.meetings || [])
    setDialReports(repRes.reports || [])
    setDialCalls(dialCallsRes.calls || [])
    setTrainings(trainRes.trainings || [])
    setAiCalls(aiRes.calls || [])
    setBdAssignees(bdRes.assignees || [])
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        await load()
      } catch {
        localStorage.removeItem(TOKEN_TC)
        localStorage.removeItem(TOKEN_CLIENT)
        navigate('/client/login')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, navigate, load])

  useEffect(() => {
    const filtered = contacts.filter((r) => contactTypeIncludes(r.type, businessTab))
    const tp = Math.max(1, Math.ceil(filtered.length / BUSINESS_PER_PAGE))
    setBusinessPage((p) => Math.min(Math.max(1, p), tp))
  }, [contacts, businessTab])

  if (!token) return null

  const logout = () => {
    localStorage.removeItem(TOKEN_TC)
    localStorage.removeItem(TOKEN_CLIENT)
    navigate('/client/login')
  }

  const stats = dash?.stats || {}
  const initials = (me?.businessName || me?.fullName || 'TC').slice(0, 2).toUpperCase()
  const allTabs = [...MAIN_TABS, ...BOTTOM_TABS]
  const activeTab = allTabs.find((t) => t.id === active)

  const filteredLeads = leads.filter((l) => {
    const q = leadSearch.toLowerCase()
    return (
      !q ||
      (l.name || '').toLowerCase().includes(q) ||
      (l.mobile || '').includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    )
  })

  const contactsServers = contacts.filter((c) => contactTypeIncludes(c.type, 'server'))
  const contactsClients = contacts.filter((c) => contactTypeIncludes(c.type, 'client'))

  const filteredMeetings = [...meetings].reverse().filter((m) => meetingInRange(m, meetingFilter, rangeStart, rangeEnd))

  const filteredAiCalls = aiCalls.filter((c) => String(c.direction || '').toLowerCase() === aiCallsSub)

  const syncServerFields = (id) => {
    const row = contactsServers.find((x) => x.id === id)
    setMeetingForm((p) => ({
      ...p,
      serverContactId: id,
      serverName: row ? row.name || row.company || '' : '',
    }))
  }

  const syncClientFields = (id) => {
    const row = contactsClients.find((x) => x.id === id)
    setMeetingForm((p) => ({
      ...p,
      clientContactId: id,
      clientName: row ? row.name || row.company || '' : '',
    }))
  }

  const syncBdFields = (id) => {
    const row = bdAssignees.find((x) => x.id === id)
    setMeetingForm((p) => ({
      ...p,
      assignBdId: id,
      assignBdName: row ? row.name || '' : '',
    }))
  }

  const saveMeeting = async () => {
    if (!meetingForm.agenda.trim()) return alert('Agenda is required')
    if (!meetingForm.scheduledAt) return alert('Date & time is required')
    if (!meetingForm.clientContactId && !meetingForm.serverContactId) return alert('Please select at least one Server Contact or Client Contact to send notifications')
    setMeetingSaving(true)
    try {
      const body = {
        serverContactId:  meetingForm.serverContactId,
        serverName:       meetingForm.serverName,
        clientContactId:  meetingForm.clientContactId,
        clientName:       meetingForm.clientName,
        assignBdId:       meetingForm.assignBdId,
        assignBdName:     meetingForm.assignBdName,
        agenda:           meetingForm.agenda,
        scheduledAt:      meetingForm.scheduledAt,
        disposition:      meetingForm.disposition,
        contactPerson:    meetingForm.contactPerson,
        contactNumber:    meetingForm.contactNumber,
        noteForBd:        meetingForm.noteForBd,
        status:           meetingForm.status,
        outcome:          meetingForm.outcome,
        notifyServer:     meetingForm.notifyServer ?? true,
        notifyClient:     meetingForm.notifyClient ?? true,
        notifyBd:         meetingForm.notifyBd     ?? true,
      }
      if (meetingModal.mode === 'add') {
        await api('/api/business/meetings', { token, method: 'POST', body })
      } else {
        await api(`/api/business/meetings/${meetingModal.item.id}`, { token, method: 'PATCH', body })
      }
      await load()
      setMeetingModal({ open: false, mode: 'add', item: null })
      setMeetingForm(BLANK_MEETING)
    } catch (e) {
      alert(e.message || 'Save failed')
    } finally {
      setMeetingSaving(false)
    }
  }

  const deleteMeeting = async (id) => {
    if (!window.confirm('Delete this meeting?')) return
    try {
      await api(`/api/business/meetings/${id}`, { token, method: 'DELETE' })
      await load()
    } catch (e) {
      alert(e.message || 'Delete failed')
    }
    setTcActionMenu(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}
        style={{ background: 'linear-gradient(180deg,#fff8f0 0%,#fff3e6 100%)', borderRight: '1px solid #ffe0c0' }}
      >
        <div className="flex h-[65px] items-center border-b border-orange-200 px-3 flex-shrink-0">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-neutral-900">{me?.businessName || 'TC Portal'}</p>
              <p className="truncate text-xs text-neutral-800">
                Ailocity TC • <span className="capitalize">{me?.status || '—'}</span>
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {MAIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={!sidebarOpen ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm'
                  : 'text-neutral-900 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 pb-3 border-t border-orange-200 pt-2 flex-shrink-0 space-y-0.5">
          {BOTTOM_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={!sidebarOpen ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active === id
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-sm'
                  : 'text-neutral-900 hover:bg-orange-100'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <header className="flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-6 flex-shrink-0 text-neutral-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              className="rounded-lg p-1.5 text-neutral-800 hover:bg-slate-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="font-semibold text-neutral-950 text-lg">{activeTab?.label || 'Dashboard'}</h1>
              <p className="flex items-center gap-1 text-xs text-neutral-800">
                TC Dashboard <ChevronRight size={12} className="text-neutral-700 shrink-0" />{' '}
                <span className="font-medium">{activeTab?.label}</span>
              </p>
            </div>
          </div>

          <div className="relative" ref={dropRef}>
            <button
              type="button"
              onClick={() => setDropOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors text-neutral-900"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
              >
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-neutral-900">{me?.businessName || '—'}</p>
                <p className="text-xs text-neutral-800">{me?.email || '—'}</p>
              </div>
              <ChevronDown size={15} className={`text-neutral-700 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50 text-neutral-900">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-sm font-medium text-neutral-950">{me?.businessName || '—'}</p>
                  <p className="truncate text-xs text-neutral-800">{me?.email || '—'}</p>
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

        <div className="min-w-0 flex-1 overflow-y-auto p-6 text-neutral-900">
          {loading && <div className="py-16 text-center text-sm font-medium text-neutral-800">Loading…</div>}

          {!loading && active === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  { label: 'Total Calls', value: stats.totalCalls ?? 0, icon: PhoneCall, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Active Agents', value: stats.activeAgents ?? 0, icon: Users, color: 'text-orange-500 bg-orange-50' },
                  { label: 'Open Tickets', value: stats.openTickets ?? 0, icon: Ticket, color: 'text-violet-600 bg-violet-50' },
                  { label: 'Credits Left', value: stats.creditsLeft ?? 0, icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Total Leads', value: stats.totalLeads ?? leads.length, icon: Users, color: 'text-cyan-600 bg-cyan-50' },
                  { label: 'Total Campaigns', value: stats.totalCampaigns ?? 0, icon: Megaphone, color: 'text-rose-600 bg-rose-50' },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-neutral-800 text-sm font-medium">{s.label}</p>
                      <div className={`p-2 rounded-lg ${s.color}`}>
                        <s.icon size={16} />
                      </div>
                    </div>
                    <p className="text-neutral-950 text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-sm text-neutral-950">Recent Leads</div>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Name', 'Mobile', 'Status'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-900">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(dash?.recentLeads || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-10 text-center text-sm font-medium text-neutral-700">
                            No recent leads
                          </td>
                        </tr>
                      ) : (
                        dash.recentLeads.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-950">{l.name}</td>
                            <td className="px-4 py-3 text-sm text-neutral-900">{l.mobile || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill(l.status)}`}>{l.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-sm text-neutral-950">Recent Campaigns</div>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Name', 'Status'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-900">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(dash?.recentCampaigns || []).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-10 text-center text-sm font-medium text-neutral-700">
                            No recent campaigns
                          </td>
                        </tr>
                      ) : (
                        dash.recentCampaigns.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-950">{c.name || c.title || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill(c.status)}`}>{c.status || '—'}</span>
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

          {!loading && active === 'business' && (() => {
            const bizRows =
              contacts.length === 0
                ? []
                : contacts.filter((r) => contactTypeIncludes(r.type, businessTab))
            const totalPages = Math.ceil(bizRows.length / BUSINESS_PER_PAGE) || 1
            const pagedRows = bizRows.slice((businessPage - 1) * BUSINESS_PER_PAGE, businessPage * BUSINESS_PER_PAGE)
            return (
            <div className="space-y-4 w-full min-w-0 max-w-full">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">Business</h2>
                <p className="text-sm text-neutral-900 mt-1 leading-relaxed max-w-3xl">
                  Directory is loaded from your linked <span className="font-semibold text-black">Ailocity Business</span> account
                  (same admin). Use All / Client / Server to filter by contact type.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-0">
                <div className="flex flex-wrap gap-1 px-4 pt-3 pb-0 border-b border-slate-200">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'client', label: 'Client' },
                    { key: 'server', label: 'Server' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setBusinessTab(t.key)
                        setBusinessPage(1)
                      }}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                        businessTab === t.key
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-neutral-900 hover:text-black'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="w-full min-w-0 max-w-full overflow-hidden">
                  <table className="w-full max-w-full table-fixed border-collapse text-left text-neutral-900">
                    <colgroup>
                      <col style={{ width: '3%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '7%' }} />
                      <col style={{ width: '6%' }} />
                    </colgroup>
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['#', 'Logo', 'Name', 'Category', 'Territory', 'Email', 'Mobile', 'Type', 'KYC', 'Status'].map((h) => (
                          <th
                            key={h}
                            className="px-1.5 sm:px-2 py-2.5 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-black border-b border-slate-200 align-bottom bg-slate-50 leading-tight"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contacts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-sm font-medium text-neutral-800 leading-relaxed">
                            No businesses found. Add contacts under{' '}
                            <span className="font-semibold text-black">Ailocity Business</span> in the client portal (same admin), or ensure
                            your TC and Business accounts share the same administrator.
                          </td>
                        </tr>
                      ) : bizRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-sm font-medium text-neutral-800">
                            No businesses match this filter.
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((r, idx) => {
                          const { primary: catPrimary, secondary: catSecondary } = categoryCell(r)
                          const territoryRows = contactTerritoryRows(r)
                          const companySub = businessCompanySubtitle(r)
                          const kycVal = String(r.kyc || 'pending').toLowerCase()
                          const nameInitials = String(r.name || '?')
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                          const emailStr = r.email?.trim() ? r.email.trim() : ''
                          const territoryTitle = territoryRows.join(' — ')
                          const territoryOneLine = territoryRows.join(' · ')
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 align-top">
                              <td className="min-w-0 px-1.5 sm:px-2 py-2 text-xs font-semibold text-neutral-900 tabular-nums">
                                {(businessPage - 1) * BUSINESS_PER_PAGE + idx + 1}
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2">
                                {r.logoUrl ? (
                                  <img
                                    src={r.logoUrl}
                                    alt=""
                                    className="h-8 w-8 rounded-md object-cover border border-slate-200 bg-white"
                                  />
                                ) : (
                                  <div
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-[9px] font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                                  >
                                    {nameInitials}
                                  </div>
                                )}
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2" title={[r.name, companySub].filter(Boolean).join(' — ')}>
                                <p className="line-clamp-2 text-xs sm:text-sm font-semibold text-black leading-snug break-words">
                                  {r.name || '—'}
                                </p>
                                {companySub ? (
                                  <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-800 leading-snug break-words">{companySub}</p>
                                ) : null}
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2" title={[catPrimary, catSecondary].filter(Boolean).join(' — ')}>
                                <p className="line-clamp-2 text-xs sm:text-sm text-black leading-snug break-words">{catPrimary}</p>
                                {catSecondary ? (
                                  <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-800 leading-snug break-words">{catSecondary}</p>
                                ) : null}
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2 align-top" title={territoryTitle}>
                                <p className="line-clamp-3 text-[11px] sm:text-xs font-medium text-neutral-950 leading-snug break-words">
                                  {territoryOneLine}
                                </p>
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2">
                                {emailStr ? (
                                  <a
                                    href={`mailto:${emailStr}`}
                                    className="block truncate text-xs sm:text-sm text-black underline decoration-slate-300 underline-offset-2 hover:decoration-orange-500"
                                    title={emailStr}
                                  >
                                    {emailStr}
                                  </a>
                                ) : (
                                  <span className="text-xs text-neutral-700">—</span>
                                )}
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2">
                                <span
                                  className="block truncate text-xs sm:text-sm font-medium tabular-nums text-black"
                                  title={r.mobile || ''}
                                >
                                  {r.mobile || '—'}
                                </span>
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2 align-top">
                                <span
                                  className="block truncate rounded-md border border-neutral-200 bg-neutral-100 px-1 py-0.5 text-center text-[10px] font-semibold capitalize text-black"
                                  title={r.type || ''}
                                >
                                  {r.type || '—'}
                                </span>
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2 align-top">
                                <span
                                  className={`block truncate rounded-md px-1 py-0.5 text-center text-[10px] font-semibold capitalize ${pill(kycVal)}`}
                                  title={kycVal}
                                >
                                  {kycVal}
                                </span>
                              </td>
                              <td className="min-w-0 px-1.5 sm:px-2 py-2 align-top">
                                <span
                                  className={`block truncate rounded-md px-1 py-0.5 text-center text-[10px] font-semibold capitalize ${pill(r.status)}`}
                                  title={r.status || ''}
                                >
                                  {r.status || '—'}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {bizRows.length > 0 && totalPages > 1 && (
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-neutral-800">
                      Showing {(businessPage - 1) * BUSINESS_PER_PAGE + 1}–
                      {Math.min(businessPage * BUSINESS_PER_PAGE, bizRows.length)} of {bizRows.length}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBusinessPage((p) => Math.max(1, p - 1))}
                        disabled={businessPage === 1}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-neutral-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - businessPage) <= 1)
                        .reduce((acc, p, i, arr) => {
                          if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                          acc.push(p)
                          return acc
                        }, [])
                        .map((p, i) =>
                          p === '...' ? (
                            <span key={`biz-e${i}`} className="px-1 text-xs text-neutral-500">
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setBusinessPage(p)}
                              className={`w-7 h-7 text-xs font-medium rounded-lg border transition-colors ${
                                businessPage === p
                                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white border-orange-400'
                                  : 'border-slate-200 text-neutral-800 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}
                      <button
                        type="button"
                        onClick={() => setBusinessPage((p) => Math.min(totalPages, p + 1))}
                        disabled={businessPage === totalPages}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-neutral-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )
          })()}

          {!loading && active === 'leads' && (() => {
            const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost']
            const LEAD_PRIORITIES = ['high', 'medium', 'low']
            const LEAD_SOURCES = ['Direct', 'Referral', 'Website', 'Social Media', 'Cold Call', 'Email', 'Walk-in', 'Other']

            const filtered = leads.filter((l) => {
              const q = leadSearchQ.toLowerCase()
              const matchQ = !q || (l.name||'').toLowerCase().includes(q) || (l.mobile||'').includes(q) || (l.email||'').toLowerCase().includes(q) || (l.requirement||'').toLowerCase().includes(q)
              const matchStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter
              const matchPriority = leadPriorityFilter === 'all' || l.priority === leadPriorityFilter
              return matchQ && matchStatus && matchPriority
            })

            const counts = LEAD_STATUSES.reduce((acc, s) => ({ ...acc, [s]: leads.filter(l => l.status === s).length }), {})

            const saveLead = async () => {
              if (!leadForm.name.trim()) return alert('Name is required')
              setSavingMisc(true)
              try {
                if (leadModal.item) {
                  await api(`/api/business/leads/${leadModal.item.id}`, { token, method: 'PATCH', body: leadForm })
                } else {
                  await api('/api/business/leads', { token, method: 'POST', body: leadForm })
                }
                await load()
                setLeadModal({ open: false, item: null })
              } catch (e) { alert(e.message || 'Save failed') }
              finally { setSavingMisc(false) }
            }

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-950">Lead Management</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">{leads.length} total leads</p>
                  </div>
                  <button type="button"
                    onClick={() => { setLeadForm({ name: '', email: '', mobile: '', source: 'Direct', requirement: '', budget: '', status: 'new', priority: 'medium', assignedTo: '', assignedName: '', followUpDate: '', notes: '' }); setLeadModal({ open: true, item: null }) }}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                    <Plus size={16} /> Add Lead
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[{ label: 'New', key: 'new', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Contacted', key: 'contacted', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Qualified', key: 'qualified', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { label: 'Lost', key: 'lost', color: 'text-red-600 bg-red-50 border-red-100' },
                  ].map(s => (
                    <button key={s.key} type="button"
                      onClick={() => setLeadStatusFilter(leadStatusFilter === s.key ? 'all' : s.key)}
                      className={`rounded-xl border p-3 text-left transition-all ${s.color} ${leadStatusFilter === s.key ? 'ring-2 ring-offset-1 ring-orange-400' : ''}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
                      <p className="text-2xl font-black mt-0.5">{counts[s.key] || 0}</p>
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search name, mobile, email…" value={leadSearchQ}
                      onChange={e => setLeadSearchQ(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <select value={leadPriorityFilter} onChange={e => setLeadPriorityFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400">
                    <option value="all">All Priority</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  {(leadStatusFilter !== 'all' || leadPriorityFilter !== 'all' || leadSearchQ) && (
                    <button type="button" onClick={() => { setLeadStatusFilter('all'); setLeadPriorityFilter('all'); setLeadSearchQ('') }}
                      className="text-xs font-medium text-orange-600 hover:text-orange-800 border border-orange-200 rounded-lg px-3 py-1.5">
                      Clear filters
                    </button>
                  )}
                  <p className="text-xs text-slate-400 ml-auto">{filtered.length} results</p>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-8">#</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">Name</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-28">Mobile</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-24">Source</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">Requirement</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-28">Assigned To</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-24">BD Notes</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-20">Priority</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-24">Status</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 w-24">Follow Up</th>
                          <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600 w-14">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                          <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">No leads found.</td></tr>
                        ) : [...filtered].reverse().map((l, idx) => (
                          <tr key={l.id} className="hover:bg-orange-50/30 transition-colors align-middle">
                            <td className="px-3 py-3 text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                            <td className="px-3 py-3">
                              <p className="text-sm font-semibold text-neutral-900">{l.name}</p>
                              {l.email && <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{l.email}</p>}
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-700 tabular-nums whitespace-nowrap">{l.mobile || '—'}</td>
                            <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{l.source || '—'}</td>
                            <td className="px-3 py-3">
                              <p className="text-xs text-slate-700 line-clamp-1 max-w-[160px]">{l.requirement || '—'}</p>
                              {l.budget && <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">₹{l.budget}</p>}
                            </td>
                            <td className="px-3 py-3">
                              {l.assignedName
                                ? <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5 whitespace-nowrap max-w-[100px] truncate">
                                    <Users size={10} className="flex-shrink-0" />{l.assignedName}
                                  </span>
                                : <span className="text-xs text-slate-400">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              {l.bdNotes
                                ? <p className="text-xs text-slate-600 line-clamp-1 max-w-[100px]" title={l.bdNotes}>{l.bdNotes}</p>
                                : <span className="text-xs text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize whitespace-nowrap ${pill(l.priority)}`}>{l.priority}</span>
                            </td>
                            <td className="px-3 py-3">
                              <select value={l.status}
                                onChange={async (e) => {
                                  try {
                                    await api(`/api/business/leads/${l.id}`, { token, method: 'PATCH', body: { status: e.target.value } })
                                    await load()
                                  } catch(err) { alert(err.message || 'Failed') }
                                }}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 ${pill(l.status)}`}>
                                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                              {l.followUpDate ? new Date(l.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="relative inline-block">
                                <button type="button"
                                  data-menu
                                  onClick={(e) => openMenu(e, 'lead', l.id, setTcActionMenu, setTcMenuPos)}
                                  className="inline-flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-500 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                                  <Settings2 size={15} strokeWidth={2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add/Edit Lead Modal */}
                {leadModal.open && (
                  <div className={tcModalOverlay} onClick={() => setLeadModal({ open: false, item: null })}>
                    <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                      <div className={tcModalHeader}>
                        <div>
                          <h2 className={tcModalTitle}>{leadModal.item ? 'Edit Lead' : 'Add New Lead'}</h2>
                          <p className={tcModalSub}>Fill lead details and assign to BD/TC</p>
                        </div>
                        <button type="button" onClick={() => setLeadModal({ open: false, item: null })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
                      </div>
                      <div className={tcModalBody}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className={tcLabel}>Name *</label>
                            <input className={tcInput} value={leadForm.name} onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))} placeholder="Lead name" />
                          </div>
                          <div>
                            <label className={tcLabel}>Mobile</label>
                            <input className={tcInput} value={leadForm.mobile} onChange={e => setLeadForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile number" />
                          </div>
                          <div>
                            <label className={tcLabel}>Email</label>
                            <input className={tcInput} type="email" value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
                          </div>
                          <div>
                            <label className={tcLabel}>Source</label>
                            <select className={tcSelect} value={leadForm.source} onChange={e => setLeadForm(p => ({ ...p, source: e.target.value }))}>
                              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={tcLabel}>Budget</label>
                            <input className={tcInput} value={leadForm.budget} onChange={e => setLeadForm(p => ({ ...p, budget: e.target.value }))} placeholder="e.g. 50000" />
                          </div>
                          <div>
                            <label className={tcLabel}>Priority</label>
                            <select className={tcSelect} value={leadForm.priority} onChange={e => setLeadForm(p => ({ ...p, priority: e.target.value }))}>
                              <option value="high">🔴 High</option>
                              <option value="medium">🟡 Medium</option>
                              <option value="low">🟢 Low</option>
                            </select>
                          </div>
                          <div>
                            <label className={tcLabel}>Status</label>
                            <select className={tcSelect} value={leadForm.status} onChange={e => setLeadForm(p => ({ ...p, status: e.target.value }))}>
                              {LEAD_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={tcLabel}>Assign To (BD/TC)</label>
                            <select className={tcSelect} value={leadForm.assignedTo}
                              onChange={e => {
                                const bd = bdAssignees.find(x => x.id === e.target.value)
                                setLeadForm(p => ({ ...p, assignedTo: e.target.value, assignedName: bd?.name || '' }))
                              }}>
                              <option value="">— Unassigned —</option>
                              {bdAssignees.map(b => <option key={b.id} value={b.id}>{b.name} ({b.role})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={tcLabel}>Follow Up Date</label>
                            <input type="date" className={tcInput} value={leadForm.followUpDate} onChange={e => setLeadForm(p => ({ ...p, followUpDate: e.target.value }))} />
                          </div>
                          <div className="col-span-2">
                            <label className={tcLabel}>Requirement</label>
                            <textarea className={tcTextarea} rows={2} value={leadForm.requirement} onChange={e => setLeadForm(p => ({ ...p, requirement: e.target.value }))} placeholder="What does the lead need?" />
                          </div>
                          <div className="col-span-2">
                            <label className={tcLabel}>Notes</label>
                            <textarea className={tcTextarea} rows={2} value={leadForm.notes} onChange={e => setLeadForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes…" />
                          </div>
                        </div>
                      </div>
                      <div className={tcModalFooter}>
                        <button type="button" className={tcBtnGhost} onClick={() => setLeadModal({ open: false, item: null })}>Cancel</button>
                        <button type="button" disabled={savingMisc} className={tcBtnPrimary}
                          style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                          onClick={saveLead}>
                          {savingMisc ? 'Saving…' : leadModal.item ? 'Update Lead' : 'Add Lead'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {!loading && active === 'mydail' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">MyDail</h2>
                <p className="text-sm text-slate-500 mt-0.5">Reports, leads snapshot, and dial call log</p>
              </div>
              <div className="flex gap-1 border-b border-slate-200">
                {[
                  { id: 'report', label: 'Report' },
                  { id: 'leads', label: 'Leads' },
                  { id: 'calls', label: 'Calls' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMyDialSub(t.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      myDialSub === t.id
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {myDialSub === 'report' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRepForm(BLANK_DIAL_REP)
                        setRepModal({ open: true, item: null })
                      }}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                    >
                      <Plus size={16} /> Add report
                    </button>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full min-w-0" style={{ overflow: 'visible' }}>
                    <table className="w-full table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[5%]" />
                        <col className="w-[20%]" />
                        <col className="w-[12%]" />
                        <col className="w-[38%]" />
                        <col className="w-[15%]" />
                        <col className="w-[10%]" />
                      </colgroup>
                      <thead className="bg-slate-50 border-b-2 border-slate-200">
                        <tr>
                          {['#', 'Title', 'Period', 'Summary', 'Created', ''].map((h) => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dialReports.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                              No dial reports yet.
                            </td>
                          </tr>
                        ) : (
                          [...dialReports].reverse().map((r, idx) => (
                            <tr key={r.id} className="hover:bg-orange-50/40 transition-colors">
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-bold text-neutral-500 tabular-nums">{idx + 1}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-bold text-neutral-900 line-clamp-2" title={tcDisplay(r.title)}>
                                  {tcDisplay(r.title)}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-medium text-slate-600 truncate">{tcDisplay(r.periodLabel)}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm text-slate-600 line-clamp-2">{tcDisplay(r.summary)}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-xs font-medium text-slate-500 whitespace-nowrap">{fmtDt(r.createdAt)}</p>
                              </td>
                              <td
                                className="relative min-w-0 px-1 py-2 text-center align-middle"
                                ref={tcActionMenu?.kind === 'report' && tcActionMenu?.id === r.id ? menuRef : null}
                              >
                                <button
                                  type="button"
                                  aria-label="Row actions"
                                  className="inline-flex rounded-lg border border-transparent p-2 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                                  onClick={() =>
                                    setTcActionMenu((cur) =>
                                      cur?.kind === 'report' && cur?.id === r.id ? null : { kind: 'report', id: r.id }
                                    )
                                  }
                                >
                                  <Settings2 size={18} aria-hidden strokeWidth={2} />
                                </button>
                                {tcActionMenu?.kind === 'report' && tcActionMenu?.id === r.id && (
                                  <div className={tcDropdown} onClick={e => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className={tcDropdownItem}
                                      onClick={() => {
                                        setTcActionMenu(null)
                                        setViewReport(r)
                                      }}
                                    >
                                      <Eye size={17} aria-hidden /> View
                                    </button>
                                    <button
                                      type="button"
                                      className={tcDropdownItem}
                                      onClick={() => {
                                        setTcActionMenu(null)
                                        setRepForm({ ...BLANK_DIAL_REP, ...r })
                                        setRepModal({ open: true, item: r })
                                      }}
                                    >
                                      <Pencil size={17} aria-hidden /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className={tcDropdownItemDanger}
                                      onClick={async () => {
                                        if (!window.confirm('Delete report?')) return
                                        setTcActionMenu(null)
                                        try {
                                          await api(`/api/business/dial-reports/${r.id}`, { token, method: 'DELETE' })
                                          await load()
                                        } catch (e) {
                                          alert(e.message || 'Failed')
                                        }
                                      }}
                                    >
                                      <Trash2 size={17} aria-hidden /> Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {myDialSub === 'leads' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <p className="text-sm text-slate-600">{leads.length} leads (same as CRM leads)</p>
                    <div className="relative w-56">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search…"
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['Name', 'Mobile', 'Email', 'Status', 'Priority'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                              No leads.
                            </td>
                          </tr>
                        ) : (
                          filteredLeads.map((l) => (
                            <tr key={l.id}>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">{l.name}</td>
                              <td className="px-4 py-3 text-sm">{l.mobile || '—'}</td>
                              <td className="px-4 py-3 text-sm truncate max-w-[140px]">{l.email || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill(l.status)}`}>{l.status}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill(l.priority)}`}>{l.priority}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {myDialSub === 'calls' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDialCallForm(BLANK_DIAL_CALL)
                        setDialCallModal({ open: true, item: null })
                      }}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                    >
                      <Plus size={16} /> Log call
                    </button>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full min-w-0" style={{ overflow: 'visible' }}>
                    <table className="w-full table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[4%]" />
                        <col className="w-[15%]" />
                        <col className="w-[12%]" />
                        <col className="w-[8%]" />
                        <col className="w-[11%]" />
                        <col className="w-[32%]" />
                        <col className="w-[13%]" />
                        <col className="w-[5%]" />
                      </colgroup>
                      <thead className="bg-slate-50 border-b-2 border-slate-200">
                        <tr>
                          {['#', 'Party', 'Phone', 'Dur', 'Disposition', 'Notes', 'Time', ''].map((h) => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dialCalls.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                              No dial calls logged.
                            </td>
                          </tr>
                        ) : (
                          [...dialCalls].reverse().map((c, idx) => (
                            <tr key={c.id} className="hover:bg-orange-50/40 transition-colors">
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-bold text-neutral-500 tabular-nums">{idx + 1}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-bold text-neutral-900 truncate" title={tcDisplay(c.partyName)}>
                                  {tcDisplay(c.partyName)}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-medium text-slate-700 truncate">{tcDisplay(c.phone)}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-medium text-slate-700">{c.durationSec ? `${c.durationSec}s` : '—'}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm font-medium text-slate-700 truncate">{tcDisplay(c.disposition)}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-sm text-slate-600 line-clamp-2">{tcDisplay(c.notes)}</p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="text-xs font-medium text-slate-500 whitespace-nowrap">{fmtDt(c.createdAt)}</p>
                              </td>
                              <td
                                className="relative min-w-0 px-1 py-2 text-center align-middle"
                                ref={tcActionMenu?.kind === 'dial' && tcActionMenu?.id === c.id ? menuRef : null}
                              >
                                <button
                                  type="button"
                                  aria-label="Row actions"
                                  className="inline-flex rounded-lg border border-transparent p-2 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                                  onClick={() =>
                                    setTcActionMenu((cur) =>
                                      cur?.kind === 'dial' && cur?.id === c.id ? null : { kind: 'dial', id: c.id }
                                    )
                                  }
                                >
                                  <Settings2 size={18} aria-hidden strokeWidth={2} />
                                </button>
                                {tcActionMenu?.kind === 'dial' && tcActionMenu?.id === c.id && (
                                  <div className={tcDropdown} onClick={e => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className={tcDropdownItem}
                                      onClick={() => {
                                        setTcActionMenu(null)
                                        setViewDialCall(c)
                                      }}
                                    >
                                      <Eye size={17} aria-hidden /> View
                                    </button>
                                    <button
                                      type="button"
                                      className={tcDropdownItem}
                                      onClick={() => {
                                        setTcActionMenu(null)
                                        setDialCallForm({
                                          partyName: c.partyName || '',
                                          phone: c.phone || '',
                                          durationSec: String(c.durationSec ?? ''),
                                          disposition: c.disposition || '',
                                          notes: c.notes || '',
                                        })
                                        setDialCallModal({ open: true, item: c })
                                      }}
                                    >
                                      <Pencil size={17} aria-hidden /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className={tcDropdownItemDanger}
                                      onClick={async () => {
                                        if (!window.confirm('Delete call log?')) return
                                        setTcActionMenu(null)
                                        try {
                                          await api(`/api/business/dial-calls/${c.id}`, { token, method: 'DELETE' })
                                          await load()
                                        } catch (e) {
                                          alert(e.message || 'Failed')
                                        }
                                      }}
                                    >
                                      <Trash2 size={17} aria-hidden /> Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && active === 'meetings' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Meetings</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Schedule and track meeting setups</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMeetingForm(BLANK_MEETING)
                    setMeetingModal({ open: true, mode: 'add', item: null })
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                >
                  <Plus size={16} /> Create meeting
                </button>
              </div>

              <div className="flex flex-wrap gap-2 items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter</span>
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: 'range', label: 'Date range' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setMeetingFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      meetingFilter === f.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                {meetingFilter === 'range' && (
                  <>
                    <input
                      type="date"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                    />
                  </>
                )}
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl px-6 py-16 text-center shadow-sm">
                  <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">No meetings in this range</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
                    >
                      {/* Top accent bar */}
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#FF7A00,#FFB000)' }} />

                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-neutral-900 leading-snug line-clamp-2 mb-1">
                            {tcDisplay(m.agenda)}
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <FileText size={12} className="shrink-0" />
                            <span className="text-[11px] font-medium">{fmtDt(m.scheduledAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${pill(m.status)}`}>
                            {tcDisplay(m.status)}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                              onClick={() => setTcActionMenu((cur) => cur?.kind === 'meeting' && cur?.id === m.id ? null : { kind: 'meeting', id: m.id })}
                            >
                              <Settings2 size={15} strokeWidth={2} />
                            </button>
                            {tcActionMenu?.kind === 'meeting' && tcActionMenu?.id === m.id && (
                              <div
                                className="absolute right-0 z-[9999] mt-1 w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                                style={{ top: '100%' }}
                                onClick={e => e.stopPropagation()}
                              >
                                <button type="button" className={tcDropdownItem} onClick={() => { setTcActionMenu(null); setViewMeeting(m) }}>
                                  <Eye size={14} /> View
                                </button>
                                <button type="button" className={tcDropdownItem} onClick={() => { setTcActionMenu(null); setMeetingForm({ ...BLANK_MEETING, ...m, scheduledAt: m.scheduledAt ? String(m.scheduledAt).slice(0, 16) : '' }); setMeetingModal({ open: true, mode: 'edit', item: m }) }}>
                                  <Pencil size={14} /> Edit
                                </button>
                                <button type="button" className={tcDropdownItemDanger} onClick={() => deleteMeeting(m.id)}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-4 border-t border-slate-100" />

                      {/* Body */}
                      <div className="px-4 py-3 flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          {[
                            { label: 'Server', value: m.serverName },
                            { label: 'Client', value: m.clientName },
                            { label: 'BD Assigned', value: m.assignBdName },
                            { label: 'Contact Person', value: m.contactPerson },
                            { label: 'Contact No.', value: m.contactNumber },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                              <p className="text-[13px] font-semibold text-neutral-800 truncate">{tcDisplay(value)}</p>
                            </div>
                          ))}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Disposition</p>
                            <span className="inline-block rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-[11px] font-bold capitalize text-orange-600">
                              {tcDisplay(m.disposition)}
                            </span>
                          </div>
                        </div>

                        {m.noteForBd && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Note for BD</p>
                            <p className="text-[12px] text-neutral-700 leading-relaxed line-clamp-2">{m.noteForBd}</p>
                          </div>
                        )}
                      </div>

                      {/* Footer — Quick Update Bar */}
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Outcome</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${pill(m.outcome)}`}>
                              {tcDisplay(m.outcome)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">{fmtDt(m.updatedAt)}</p>
                        </div>
                        {/* Inline quick-update controls */}
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200">
                          {/* Status */}
                          <select
                            value={m.status}
                            onChange={(e) => quickUpdateMeeting(token, m.id, { status: e.target.value }, load)}
                            className="flex-1 min-w-[90px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-800 focus:outline-none focus:border-orange-400 cursor-pointer"
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="completed">✅ Completed</option>
                            <option value="cancelled">❌ Cancelled</option>
                          </select>
                          {/* Outcome */}
                          <select
                            value={m.outcome}
                            onChange={(e) => quickUpdateMeeting(token, m.id, { outcome: e.target.value }, load)}
                            className="flex-1 min-w-[90px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-800 focus:outline-none focus:border-orange-400 cursor-pointer"
                          >
                            <option value="waiting">⏸ Waiting</option>
                            <option value="positive">👍 Positive</option>
                            <option value="negative">👎 Negative</option>
                            <option value="neutral">😐 Neutral</option>
                          </select>
                          {/* Disposition */}
                          <select
                            value={m.disposition}
                            onChange={(e) => quickUpdateMeeting(token, m.id, { disposition: e.target.value }, load)}
                            className="flex-1 min-w-[80px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-800 focus:outline-none focus:border-orange-400 cursor-pointer"
                          >
                            <option value="hot">🔥 Hot</option>
                            <option value="warm">🌤 Warm</option>
                            <option value="cancelled">🚫 Cancel</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && active === 'ai-agent' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">AI Agent</h2>
              <p className="text-sm text-slate-500">Agents linked to your account</p>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Name', 'Role', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dash?.agents || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-400">
                          No AI agents configured yet.
                        </td>
                      </tr>
                    ) : (
                      dash.agents.map((a) => (
                        <tr key={a.id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">{a.name || '—'}</td>
                          <td className="px-4 py-3 text-sm">{a.role || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill(a.status)}`}>{a.status || '—'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && active === 'ai-calls' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">AI Calls</h2>
                <p className="text-sm text-slate-500">Inbound and outbound AI-handled calls</p>
              </div>
              <div className="flex gap-1 border-b border-slate-200">
                {[
                  { id: 'inbound', label: 'Inbound' },
                  { id: 'outbound', label: 'Outbound' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAiCallsSub(t.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      aiCallsSub === t.id
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAiCallForm({ ...BLANK_AI_CALL, direction: aiCallsSub })
                    setAiCallModal({ open: true, item: null })
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                >
                  <Plus size={16} /> Add AI call
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full min-w-0" style={{ overflow: 'visible' }}>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[20%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[13%]" />
                    <col className="w-[11%]" />
                    <col className="w-[21%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Party', 'Phone', 'Dur (s)', 'Outcome', 'Status', 'Updated'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAiCalls.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                          No {aiCallsSub} AI calls yet.
                        </td>
                      </tr>
                    ) : (
                      [...filteredAiCalls].reverse().map((c) => (
                        <tr key={c.id}>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-xs font-semibold text-neutral-900" title={tcDisplay(c.party)}>
                              {tcDisplay(c.party)}
                            </p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-xs text-slate-700" title={tcDisplay(c.phone)}>
                              {tcDisplay(c.phone)}
                            </p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-xs text-slate-700">{tcDisplay(c.durationSec)}</p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="line-clamp-2 text-xs text-slate-700" title={tcDisplay(c.outcome)}>
                              {tcDisplay(c.outcome)}
                            </p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <span
                              className={`inline-flex max-w-full truncate rounded-full px-1.5 py-px text-[10px] font-semibold capitalize ${pill(c.status)}`}
                              title={tcDisplay(c.status)}
                            >
                              {tcDisplay(c.status)}
                            </span>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-[11px] text-slate-500">{fmtDt(c.updatedAt)}</p>
                          </td>
                          <td
                            className="relative min-w-0 px-1 py-2 text-center align-middle"
                            ref={tcActionMenu?.kind === 'aicall' && tcActionMenu?.id === c.id ? menuRef : null}
                          >
                            <button
                              type="button"
                              aria-label="Row actions"
                              className="inline-flex rounded-lg border border-transparent p-2 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                              onClick={() =>
                                setTcActionMenu((cur) =>
                                  cur?.kind === 'aicall' && cur?.id === c.id ? null : { kind: 'aicall', id: c.id }
                                )
                              }
                            >
                              <Settings2 size={18} aria-hidden strokeWidth={2} />
                            </button>
                            {tcActionMenu?.kind === 'aicall' && tcActionMenu?.id === c.id && (
                              <div className={tcDropdown} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className={tcDropdownItem}
                                  onClick={() => {
                                    setTcActionMenu(null)
                                    setViewAiCall(c)
                                  }}
                                >
                                  <Eye size={17} aria-hidden /> View
                                </button>
                                <button
                                  type="button"
                                  className={tcDropdownItem}
                                  onClick={() => {
                                    setTcActionMenu(null)
                                    setAiCallForm({
                                      direction: c.direction,
                                      party: c.party || '',
                                      phone: c.phone || '',
                                      durationSec: String(c.durationSec ?? ''),
                                      outcome: c.outcome || '',
                                      notes: c.notes || '',
                                      status: c.status || 'completed',
                                    })
                                    setAiCallModal({ open: true, item: c })
                                  }}
                                >
                                  <Pencil size={17} aria-hidden /> Edit
                                </button>
                                <button
                                  type="button"
                                  className={tcDropdownItemDanger}
                                  onClick={async () => {
                                    if (!window.confirm('Delete this AI call record?')) return
                                    setTcActionMenu(null)
                                    try {
                                      await api(`/api/business/ai-calls/${c.id}`, { token, method: 'DELETE' })
                                      await load()
                                    } catch (e) {
                                      alert(e.message || 'Failed')
                                    }
                                  }}
                                >
                                  <Trash2 size={17} aria-hidden /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && active === 'trainings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Trainings</h2>
                  <p className="text-sm text-slate-500">Track modules and completion</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTrainingForm(BLANK_TRAINING)
                    setTrainingModal({ open: true, item: null })
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                >
                  <Plus size={16} /> Add training
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full min-w-0" style={{ overflow: 'visible' }}>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[18%]" />
                    <col className="w-[11%]" />
                    <col className="w-[14%]" />
                    <col className="w-[16%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Title', 'Module', 'Status', 'Scheduled', 'Updated'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                          No trainings logged.
                        </td>
                      </tr>
                    ) : (
                      [...trainings].reverse().map((tRow) => (
                        <tr key={tRow.id}>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="line-clamp-2 text-xs font-semibold text-neutral-900" title={tcDisplay(tRow.title)}>
                              {tcDisplay(tRow.title)}
                            </p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-xs text-slate-700" title={tcDisplay(tRow.module)}>
                              {tcDisplay(tRow.module)}
                            </p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <span
                              className={`inline-flex max-w-full truncate rounded-full px-1.5 py-px text-[10px] font-semibold capitalize ${pill(tRow.status)}`}
                              title={tcDisplay(tRow.status)}
                            >
                              {tcDisplay(tRow.status)}
                            </span>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-[11px] text-slate-600">
                              {tRow.scheduledAt ? fmtDt(tRow.scheduledAt) : '—'}
                            </p>
                          </td>
                          <td className="min-w-0 px-3 py-2 align-top">
                            <p className="truncate text-[11px] text-slate-500">{fmtDt(tRow.updatedAt)}</p>
                          </td>
                          <td
                            className="relative min-w-0 px-1 py-2 text-center align-middle"
                            ref={tcActionMenu?.kind === 'training' && tcActionMenu?.id === tRow.id ? menuRef : null}
                          >
                            <button
                              type="button"
                              aria-label="Row actions"
                              className="inline-flex rounded-lg border border-transparent p-2 text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                              onClick={() =>
                                setTcActionMenu((cur) =>
                                  cur?.kind === 'training' && cur?.id === tRow.id ? null : { kind: 'training', id: tRow.id }
                                )
                              }
                            >
                              <Settings2 size={18} aria-hidden strokeWidth={2} />
                            </button>
                            {tcActionMenu?.kind === 'training' && tcActionMenu?.id === tRow.id && (
                              <div className={tcDropdown} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className={tcDropdownItem}
                                  onClick={() => {
                                    setTcActionMenu(null)
                                    setViewTraining(tRow)
                                  }}
                                >
                                  <Eye size={17} aria-hidden /> View
                                </button>
                                <button
                                  type="button"
                                  className={tcDropdownItem}
                                  onClick={() => {
                                    setTcActionMenu(null)
                                    setTrainingForm({
                                      title: tRow.title || '',
                                      module: tRow.module || '',
                                      status: tRow.status || 'pending',
                                      scheduledAt: tRow.scheduledAt ? String(tRow.scheduledAt).slice(0, 16) : '',
                                      notes: tRow.notes || '',
                                    })
                                    setTrainingModal({ open: true, item: tRow })
                                  }}
                                >
                                  <Pencil size={17} aria-hidden /> Edit
                                </button>
                                <button
                                  type="button"
                                  className={tcDropdownItemDanger}
                                  onClick={async () => {
                                    if (!window.confirm('Delete training row?')) return
                                    setTcActionMenu(null)
                                    try {
                                      await api(`/api/business/tc-trainings/${tRow.id}`, { token, method: 'DELETE' })
                                      await load()
                                    } catch (e) {
                                      alert(e.message || 'Failed')
                                    }
                                  }}
                                >
                                  <Trash2 size={17} aria-hidden /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TEAM SECTION ── */}
          {!loading && active === 'team' && (() => {
            const filteredTeam = teamMembers.filter(m => {
              const q = teamSearch.toLowerCase()
              const matchQ = !q || m.name.toLowerCase().includes(q) || m.mobile.includes(q) || m.email.toLowerCase().includes(q) || m.city.toLowerCase().includes(q)
              const matchTab = teamTabFilter === 'all' || (teamTabFilter === 'active' ? m.status === 'active' : teamTabFilter === 'inactive' ? m.status === 'inactive' : m.role === teamTabFilter)
              return matchQ && matchTab
            })

            const roleColors = {
              TC: 'bg-orange-100 text-orange-700 border-orange-200',
              BD: 'bg-violet-100 text-violet-700 border-violet-200',
              Support: 'bg-blue-100 text-blue-700 border-blue-200',
              Manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
              Trainer: 'bg-cyan-100 text-cyan-700 border-cyan-200',
              'Field Agent': 'bg-amber-100 text-amber-700 border-amber-200',
              Other: 'bg-slate-100 text-slate-600 border-slate-200',
            }

            const saveTeamMember = () => {
              if (!teamForm.name.trim()) return alert('Name is required')
              if (teamModal.mode === 'add') {
                setTeamMembers(prev => [...prev, { ...teamForm, id: Date.now().toString() }])
              } else {
                setTeamMembers(prev => prev.map(m => m.id === teamModal.item.id ? { ...m, ...teamForm } : m))
              }
              setTeamModal({ open: false, mode: 'add', item: null })
            }

            const deleteTeamMember = (id) => {
              if (!window.confirm('Delete this team member?')) return
              setTeamMembers(prev => prev.filter(m => m.id !== id))
            }

            const activeCount = teamMembers.filter(m => m.status === 'active').length
            const inactiveCount = teamMembers.filter(m => m.status === 'inactive').length

            return (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-950">Team</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">{teamMembers.length} total members</p>
                  </div>
                  <button type="button"
                    onClick={() => { setTeamForm(BLANK_TEAM_MEMBER); setTeamModal({ open: true, mode: 'add', item: null }) }}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                    <Plus size={16} /> Add Member
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: teamMembers.length, cls: 'text-slate-700 bg-slate-50 border-slate-200' },
                    { label: 'Active', value: activeCount, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                    { label: 'Inactive', value: inactiveCount, cls: 'text-red-600 bg-red-50 border-red-100' },
                    { label: 'Roles', value: [...new Set(teamMembers.map(m => m.role))].length, cls: 'text-violet-700 bg-violet-50 border-violet-100' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
                      <p className="text-3xl font-black mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Filter + Search bar */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search name, mobile, city…" value={teamSearch}
                        onChange={e => setTeamSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                    <p className="text-xs text-slate-400 ml-auto">{filteredTeam.length} results</p>
                  </div>

                  {/* Role/Status tabs */}
                  <div className="flex flex-wrap gap-0.5 px-4 pt-2 pb-0 border-b border-slate-100">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'active', label: 'Active' },
                      { key: 'inactive', label: 'Inactive' },
                      ...TEAM_ROLES.map(r => ({ key: r, label: r })),
                    ].map(t => (
                      <button key={t.key} type="button"
                        onClick={() => setTeamTabFilter(t.key)}
                        className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                          teamTabFilter === t.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['#', 'Member', 'Role', 'Mobile', 'City', 'Joining Date', 'Status', 'Action'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeam.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">No team members found.</td></tr>
                        ) : filteredTeam.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-orange-50/20 transition-colors align-middle">
                            <td className="px-3 py-3 text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                {m.imageUrl
                                  ? <img src={m.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                                  : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                                      {m.name.slice(0, 2).toUpperCase()}
                                    </div>
                                }
                                <div>
                                  <p className="text-sm font-semibold text-neutral-900">{m.name}</p>
                                  <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{m.email || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleColors[m.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{m.role}</span>
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-700 tabular-nums whitespace-nowrap">{m.mobile || '—'}</td>
                            <td className="px-3 py-3 text-sm text-slate-600">{m.city || '—'}</td>
                            <td className="px-3 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                              {m.joiningDate ? new Date(m.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                                m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}>{m.status}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="relative inline-block">
                                <button type="button"
                                  data-menu
                                  onClick={(e) => openMenu(e, 'team', m.id, setTcActionMenu, setTcMenuPos)}
                                  className="inline-flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-500 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                                  <Settings2 size={15} strokeWidth={2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add/Edit Modal */}
                {teamModal.open && (
                  <div className={tcModalOverlay} onClick={() => setTeamModal({ open: false, mode: 'add', item: null })}>
                    <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                      <div className={tcModalHeader}>
                        <div>
                          <h2 className={tcModalTitle}>{teamModal.mode === 'add' ? 'Add Team Member' : 'Edit Team Member'}</h2>
                          <p className={tcModalSub}>Fill in the member details</p>
                        </div>
                        <button type="button" onClick={() => setTeamModal({ open: false, mode: 'add', item: null })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
                      </div>
                      <div className={tcModalBody}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className={tcLabel}>Full Name *</label>
                            <input className={tcInput} value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" />
                          </div>
                          <div>
                            <label className={tcLabel}>Mobile</label>
                            <input className={tcInput} value={teamForm.mobile} onChange={e => setTeamForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile number" />
                          </div>
                          <div>
                            <label className={tcLabel}>Email</label>
                            <input className={tcInput} type="email" value={teamForm.email} onChange={e => setTeamForm(p => ({ ...p, email: e.target.value }))} placeholder="Email address" />
                          </div>
                          <div className="col-span-2">
                            <label className={tcLabel}>Profile Photo</label>
                            <div className="flex items-center gap-3">
                              {teamForm.imageUrl
                                ? <img src={teamForm.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-orange-200 flex-shrink-0" />
                                : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2 border-orange-200"
                                    style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                                    {teamForm.name ? teamForm.name.slice(0, 2).toUpperCase() : '?'}
                                  </div>
                              }
                              <label className="flex-1 flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 hover:border-orange-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 flex-shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span className="text-sm text-slate-500">{teamImgUploading ? 'Uploading…' : teamForm.imageUrl ? '✓ Photo uploaded' : 'Choose photo'}</span>
                                <input type="file" accept="image/*" className="hidden" disabled={teamImgUploading}
                                  onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    setTeamImgUploading(true)
                                    const reader = new FileReader()
                                    reader.onload = ev => { setTeamForm(p => ({ ...p, imageUrl: ev.target.result })); setTeamImgUploading(false) }
                                    reader.readAsDataURL(file)
                                  }} />
                              </label>
                              {teamForm.imageUrl && (
                                <button type="button" onClick={() => setTeamForm(p => ({ ...p, imageUrl: '' }))}
                                  className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">Remove</button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className={tcLabel}>Role</label>
                            <select className={tcSelect} value={teamForm.role} onChange={e => setTeamForm(p => ({ ...p, role: e.target.value }))}>
                              {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={tcLabel}>Status</label>
                            <select className={tcSelect} value={teamForm.status} onChange={e => setTeamForm(p => ({ ...p, status: e.target.value }))}>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                          <div>
                            <label className={tcLabel}>City</label>
                            <input className={tcInput} value={teamForm.city} onChange={e => setTeamForm(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                          </div>
                          <div>
                            <label className={tcLabel}>Joining Date</label>
                            <input type="date" className={tcInput} value={teamForm.joiningDate} onChange={e => setTeamForm(p => ({ ...p, joiningDate: e.target.value }))} />
                          </div>
                          <div className="col-span-2">
                            <label className={tcLabel}>Address</label>
                            <input className={tcInput} value={teamForm.address} onChange={e => setTeamForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" />
                          </div>
                          <div className="col-span-2">
                            <label className={tcLabel}>Notes</label>
                            <textarea className={tcTextarea} rows={2} value={teamForm.notes} onChange={e => setTeamForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about this member…" />
                          </div>
                        </div>
                      </div>
                      <div className={tcModalFooter}>
                        <button type="button" className={tcBtnGhost} onClick={() => setTeamModal({ open: false, mode: 'add', item: null })}>Cancel</button>
                        <button type="button" className={tcBtnPrimary} style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }} onClick={saveTeamMember}>
                          {teamModal.mode === 'add' ? 'Add Member' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {!loading && active === 'telegram' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">Telegram Alerts</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Send client, server and meeting alerts to your Telegram group</p>
              </div>

              {/* Sub tabs */}
              <div className="flex gap-1 border-b border-slate-200">
                {[
                  { id: 'send', label: '📤 Send Alert' },
                  { id: 'settings', label: '⚙️ Bot Settings' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTgActiveSection(t.id)}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                      tgActiveSection === t.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── SEND ALERT SECTION ── */}
              {tgActiveSection === 'send' && (
                <div className="space-y-4">
                  {!tgBotToken || !tgChatId ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <p className="text-sm font-semibold text-amber-700">⚠️ Bot not configured</p>
                      <p className="text-xs text-amber-600 mt-1">Please save your Bot Token and Chat ID in the "Bot Settings" tab first.</p>
                      <button
                        type="button"
                        onClick={() => setTgActiveSection('settings')}
                        className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-800 underline"
                      >
                        Go to Settings →
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
                      <span className="text-emerald-600 text-sm font-semibold">✅ Bot connected</span>
                      <span className="text-xs text-emerald-500">Chat ID: {tgChatId}</span>
                    </div>
                  )}

                  {/* Quick Templates */}
                  <div>
                    <p className={tcLabel}>Quick Templates</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      {[
                        {
                          label: '🤝 Meeting Alert',
                          msg: `🤝 <b>New Meeting Scheduled</b>\n📋 Agenda: [enter agenda]\n👤 Client: [client name]\n🏢 Server: [server name]\n🕒 Time: [date & time]\n📍 Status: Pending\n\n— Ailocity TC`,
                        },
                        {
                          label: '👤 Client Alert',
                          msg: `👤 <b>Client Update</b>\n🏢 Business: [business name]\n📞 Mobile: [mobile]\n📧 Email: [email]\n🏷 Status: Active\n\n— Ailocity TC`,
                        },
                        {
                          label: '🏢 Server Alert',
                          msg: `🏢 <b>Server Update</b>\n🏷 Name: [server name]\n📞 Mobile: [mobile]\n📧 Email: [email]\n✅ KYC: Verified\n\n— Ailocity TC`,
                        },
                      ].map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setTgMessage(t.msg)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-neutral-800 hover:border-orange-400 hover:bg-orange-50 transition-all shadow-sm"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Box */}
                  <div>
                    <label className={tcLabel}>Message</label>
                    <textarea
                      className={tcTextarea}
                      rows={7}
                      value={tgMessage}
                      onChange={(e) => setTgMessage(e.target.value)}
                      placeholder="Type your message here or select a template above...\n\nHTML formatting supported:\n<b>Bold</b>, <i>Italic</i>, <code>Code</code>"
                    />
                    <p className="text-xs text-slate-400 mt-1">HTML tags support: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;</p>
                  </div>

                  {/* Send Result */}
                  {tgSendResult && (
                    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      tgSendResult.ok
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {tgSendResult.ok ? '✅ ' : '❌ '}{tgSendResult.msg}
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={tgSending || !tgMessage.trim() || !tgBotToken || !tgChatId}
                      onClick={async () => {
                        setTgSending(true)
                        setTgSendResult(null)
                        try {
                          const res = await api('/api/business/telegram/send-alert', {
                            token,
                            method: 'POST',
                            body: { message: tgMessage },
                          })
                          if (res.ok) {
                            setTgSendResult({ ok: true, msg: `Alert sent successfully! ${res.notifiedCount > 0 ? `(${res.notifiedCount} portal(s) notified)` : ''}${res.telegramOk ? ' ✅ Telegram delivered' : res.telegramError ? ` ⚠️ Telegram: ${res.telegramError}` : ''}` })
                            setTgMessage('')
                          } else {
                            setTgSendResult({ ok: false, msg: 'Send failed' })
                          }
                        } catch (e) {
                          setTgSendResult({ ok: false, msg: e.message || 'Network error' })
                        } finally {
                          setTgSending(false)
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                    >
                      <Send size={15} />
                      {tgSending ? 'Sending…' : 'Send Alert'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── BOT SETTINGS SECTION ── */}
              {tgActiveSection === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">📖 Setup Guide</p>
                    <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                      <li>Open <b>@BotFather</b> on Telegram</li>
                      <li>Send <b>/newbot</b> command and copy the Bot Token</li>
                      <li>Create a Telegram group, add the bot and make it admin</li>
                      <li>Send any message in the group, then use getUpdates URL to get Chat ID</li>
                    </ol>
                  </div>

                  <div>
                    <label className={tcLabel}>Bot Token <span className="text-red-500">*</span></label>
                    <input
                      className={tcInput}
                      value={tgBotToken}
                      onChange={(e) => setTgBotToken(e.target.value)}
                      placeholder="1234567890:AAHdqTcvCH1vGWJxfSeofSs0K5PALDsaw-w"
                    />
                  </div>

                  <div>
                    <label className={tcLabel}>Chat ID (Group) <span className="text-red-500">*</span></label>
                    <input
                      className={tcInput}
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                      placeholder="-1001234567890"
                    />
                    <p className="text-xs text-slate-400 mt-1">Group Chat ID is a negative number (e.g. -1001234567890)</p>
                  </div>

                  {tgSettingsSaved && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-medium text-emerald-700">
                      ✅ Settings saved successfully!
                    </div>
                  )}

                  <div className="flex gap-3">
                    {/* Test Connection */}
                    <button
                      type="button"
                      disabled={!tgBotToken || !tgChatId}
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `https://api.telegram.org/bot${tgBotToken}/sendMessage`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                chat_id: tgChatId,
                                text: '🤖 <b>Ailocity TC Bot</b> — Connection test successful! ✅',
                                parse_mode: 'HTML',
                              }),
                            }
                          )
                          const data = await res.json()
                          if (data.ok) alert('✅ Test message sent! Check your Telegram group.')
                          else alert('❌ Failed: ' + (data.description || 'Unknown error'))
                        } catch (e) {
                          alert('❌ Error: ' + e.message)
                        }
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      🔗 Test Connection
                    </button>

                    {/* Save Settings */}
                    <button
                      type="button"
                      disabled={tgSettingsSaving || !tgBotToken.trim() || !tgChatId.trim()}
                      onClick={async () => {
                        setTgSettingsSaving(true)
                        setTgSettingsSaved(false)
                        try {
                          await api('/api/business/telegram/settings', {
                            token,
                            method: 'POST',
                            body: { botToken: tgBotToken.trim(), chatId: tgChatId.trim() },
                          })
                          setTgSettingsSaved(true)
                          setTimeout(() => setTgSettingsSaved(false), 3000)
                        } catch (e) {
                          alert(e.message || 'Save failed')
                        } finally {
                          setTgSettingsSaving(false)
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                    >
                      {tgSettingsSaving ? 'Saving…' : '💾 Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && active === 'help' && (
            <div className="max-w-3xl space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Help</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Meetings</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Use Meetings to plan visits with server and client contacts. Set disposition (Hot/Warm), status (Pending/Completed/Cancelled),
                    and outcome after the meeting (Waiting/Positive/Negative/Neutral). Filters use the scheduled date and time.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">MyDail</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Report holds dial summaries; Leads mirrors your CRM leads for quick review; Calls is your manual dial log separate from AI
                    calls.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">AI Calls</p>
                  <p className="text-sm text-slate-600 mt-1">Split inbound vs outbound to track AI-handled conversations and outcomes.</p>
                </div>
              </div>
            </div>
          )}

          {!loading && active === 'settings' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                {[
                  { label: 'Account Settings', desc: 'Manage your account preferences' },
                  { label: 'Notifications', desc: 'Configure notification preferences' },
                  { label: 'Call Settings', desc: 'Configure call scripts and IVR settings' },
                  { label: 'Security', desc: 'Password and security settings' },
                ].map((s) => (
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

      {/* Team View Modal */}
      {teamViewItem && (
        <div className={tcModalOverlay} onClick={() => setTeamViewItem(null)}>
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                {teamViewItem.imageUrl
                  ? <img src={teamViewItem.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                      {teamViewItem.name.slice(0, 2).toUpperCase()}
                    </div>
                }
                <div>
                  <h2 className={tcModalTitle}>{teamViewItem.name}</h2>
                  <p className={tcModalSub}>{teamViewItem.role} • <span className={`capitalize font-semibold ${ teamViewItem.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>{teamViewItem.status}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setTeamViewItem(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className={tcModalBody}>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <PhoneCall size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Mobile</p>
                    <p className="text-sm font-semibold text-neutral-900">{tcDisplay(teamViewItem.mobile)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Mail size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-neutral-900 break-all">{tcDisplay(teamViewItem.email)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Briefcase size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Role</p>
                    <p className="text-sm font-semibold text-orange-600">{tcDisplay(teamViewItem.role)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">City</p>
                    <p className="text-sm font-semibold text-neutral-900">{tcDisplay(teamViewItem.city)}</p>
                  </div>
                </div>
                <div className="col-span-2 bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Address</p>
                    <p className="text-sm text-neutral-900">{tcDisplay(teamViewItem.address)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Calendar size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Joining Date</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {teamViewItem.joiningDate ? new Date(teamViewItem.joiningDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Status</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                    teamViewItem.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>{teamViewItem.status}</span>
                </div>
              </div>
              {teamViewItem.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">Notes</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{teamViewItem.notes}</p>
                </div>
              )}
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost}
                onClick={() => { setTeamViewItem(null); setTeamForm({ ...teamViewItem }); setTeamModal({ open: true, mode: 'edit', item: teamViewItem }) }}>
                Edit
              </button>
              <button type="button" className={tcBtnGhost} onClick={() => setTeamViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead View Modal */}
      {leadViewItem && (
        <div className={tcModalOverlay} onClick={() => setLeadViewItem(null)}>
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}>
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <h2 className={tcModalTitle}>{leadViewItem.name}</h2>
                  <p className={tcModalSub}>{leadViewItem.source || 'Lead'} • {leadViewItem.createdAt ? new Date(leadViewItem.createdAt).toLocaleDateString('en-IN') : '—'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setLeadViewItem(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className={tcModalBody}>
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Mobile</p>
                  <p className="text-sm font-semibold text-neutral-900">{tcDisplay(leadViewItem.mobile)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-neutral-900 break-all">{tcDisplay(leadViewItem.email)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Source</p>
                  <p className="text-sm font-semibold text-neutral-900">{tcDisplay(leadViewItem.source)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Budget</p>
                  <p className="text-sm font-semibold text-emerald-600">{leadViewItem.budget ? `₹${leadViewItem.budget}` : '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Priority</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold capitalize ${pill(leadViewItem.priority)}`}>{tcDisplay(leadViewItem.priority)}</span>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Status</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold capitalize ${pill(leadViewItem.status)}`}>{tcDisplay(leadViewItem.status)}</span>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Assigned To</p>
                  <p className="text-sm font-semibold text-violet-700">{tcDisplay(leadViewItem.assignedName)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Follow Up Date</p>
                  <p className="text-sm font-semibold text-neutral-900">{leadViewItem.followUpDate ? new Date(leadViewItem.followUpDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}</p>
                </div>
              </div>

              {/* Requirement */}
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Requirement</p>
                <p className="text-sm text-neutral-900 whitespace-pre-wrap">{tcDisplay(leadViewItem.requirement)}</p>
              </div>

              {/* TC Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">TC Notes</p>
                <p className="text-sm text-neutral-900 whitespace-pre-wrap">{tcDisplay(leadViewItem.notes)}</p>
              </div>

              {/* BD Notes */}
              <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 mb-0.5">BD Notes</p>
                <p className="text-sm text-neutral-900 whitespace-pre-wrap">{tcDisplay(leadViewItem.bdNotes)}</p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Created</p>
                  <p className="text-xs text-neutral-700">{fmtDt(leadViewItem.createdAt)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Last Updated</p>
                  <p className="text-xs text-neutral-700">{fmtDt(leadViewItem.updatedAt)}</p>
                </div>
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost}
                onClick={() => { setLeadViewItem(null); setLeadForm({ ...leadViewItem }); setLeadModal({ open: true, item: leadViewItem }) }}>
                Edit
              </button>
              <button type="button" className={tcBtnGhost} onClick={() => setLeadViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View modals (read-only) */}
      {viewMeeting && (
        <div className={tcModalOverlay} onClick={() => setViewMeeting(null)}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                  <FileText size={16} className="text-white" />
                </div>
                <div>
                  <h2 className={tcModalTitle}>Meeting Details</h2>
                  <p className={tcModalSub}>{fmtDt(viewMeeting.scheduledAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewMeeting(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <div className={tcModalBody}>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Server', viewMeeting.serverName],
                  ['Client', viewMeeting.clientName],
                  ['BD Assigned', viewMeeting.assignBdName],
                  ['Contact Person', viewMeeting.contactPerson],
                  ['Contact Number', viewMeeting.contactNumber],
                  ['Disposition', viewMeeting.disposition],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-sm font-semibold text-neutral-900 capitalize">{tcDisplay(v)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Agenda</p>
                <p className="text-sm text-neutral-900 whitespace-pre-wrap">{tcDisplay(viewMeeting.agenda)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Status', viewMeeting.status],
                  ['Outcome', viewMeeting.outcome],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${pill(v)}`}>{tcDisplay(v)}</span>
                  </div>
                ))}
              </div>
              {viewMeeting.noteForBd && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">Note for BD</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{viewMeeting.noteForBd}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Created', fmtDt(viewMeeting.createdAt)],
                  ['Updated', fmtDt(viewMeeting.updatedAt)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-xs text-neutral-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setViewMeeting(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewReport && (
        <div className={tcModalOverlay} onClick={() => setViewReport(null)}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                  <FileText size={16} className="text-white" />
                </div>
                <div>
                  <h2 className={tcModalTitle}>{viewReport.title || 'Dial Report'}</h2>
                  <p className={tcModalSub}>{viewReport.periodLabel || fmtDt(viewReport.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewReport(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className={tcModalBody}>
              {viewReport.summary && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Summary</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{viewReport.summary}</p>
                </div>
              )}
              {viewReport.notes && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Notes</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{viewReport.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {[['Created', fmtDt(viewReport.createdAt)], ['Updated', fmtDt(viewReport.updatedAt)]].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-xs text-neutral-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setViewReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewDialCall && (
        <div className={tcModalOverlay} onClick={() => setViewDialCall(null)}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                  <PhoneCall size={16} className="text-white" />
                </div>
                <div>
                  <h2 className={tcModalTitle}>{viewDialCall.partyName || 'Dial Call'}</h2>
                  <p className={tcModalSub}>{fmtDt(viewDialCall.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewDialCall(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className={tcModalBody}>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Phone', viewDialCall.phone],
                  ['Duration (s)', viewDialCall.durationSec],
                  ['Disposition', viewDialCall.disposition],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-sm font-semibold text-neutral-900">{tcDisplay(v)}</p>
                  </div>
                ))}
              </div>
              {viewDialCall.notes && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Notes</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{viewDialCall.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {[['Created', fmtDt(viewDialCall.createdAt)], ['Updated', fmtDt(viewDialCall.updatedAt)]].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-xs text-neutral-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setViewDialCall(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewAiCall && (
        <div className={tcModalOverlay} onClick={() => setViewAiCall(null)}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h2 className={tcModalTitle}>{viewAiCall.party || 'AI Call'}</h2>
                  <p className={tcModalSub}><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${viewAiCall.direction === 'inbound' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700'}`}>{viewAiCall.direction}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setViewAiCall(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className={tcModalBody}>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Phone', viewAiCall.phone],
                  ['Duration (s)', viewAiCall.durationSec],
                  ['Status', viewAiCall.status],
                  ['Outcome', viewAiCall.outcome],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    {k === 'Status' ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${pill(v)}`}>{tcDisplay(v)}</span>
                      : <p className="text-sm font-semibold text-neutral-900">{tcDisplay(v)}</p>}
                  </div>
                ))}
              </div>
              {viewAiCall.notes && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Notes</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{viewAiCall.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {[['Created', fmtDt(viewAiCall.createdAt)], ['Updated', fmtDt(viewAiCall.updatedAt)]].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-xs text-neutral-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setViewAiCall(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewTraining && (
        <div className={tcModalOverlay} onClick={() => setViewTraining(null)}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#FF7A00,#FFB000)'}}>
                  <BookOpen size={16} className="text-white" />
                </div>
                <div>
                  <h2 className={tcModalTitle}>{viewTraining.title || 'Training'}</h2>
                  <p className={tcModalSub}>{viewTraining.module || fmtDt(viewTraining.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewTraining(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className={tcModalBody}>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Status</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${pill(viewTraining.status)}`}>{tcDisplay(viewTraining.status)}</span>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Scheduled</p>
                  <p className="text-xs text-neutral-700">{viewTraining.scheduledAt ? fmtDt(viewTraining.scheduledAt) : '—'}</p>
                </div>
              </div>
              {viewTraining.notes && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Notes</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{viewTraining.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {[['Created', fmtDt(viewTraining.createdAt)], ['Updated', fmtDt(viewTraining.updatedAt)]].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">{k}</p>
                    <p className="text-xs text-neutral-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setViewTraining(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting modal */}
      {meetingModal.open && (
        <div
          className={tcModalOverlay}
          onClick={() => setMeetingModal({ open: false, mode: 'add', item: null })}
        >
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div>
                <h2 className={tcModalTitle}>{meetingModal.mode === 'add' ? 'Create meeting' : 'Edit meeting'}</h2>
                <p className={tcModalSub}>Fill the details and save.</p>
              </div>
              <button type="button" onClick={() => setMeetingModal({ open: false, mode: 'add', item: null })} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className={tcModalBody}>
              <div>
                <label className={tcLabel}>Server Contact</label>
                <select
                  className={tcSelect}
                  value={meetingForm.serverContactId}
                  onChange={(e) => syncServerFields(e.target.value)}
                >
                  <option value="">— None —</option>
                  {contactsServers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={tcLabel}>Client Contact</label>
                <select
                  className={tcSelect}
                  value={meetingForm.clientContactId}
                  onChange={(e) => syncClientFields(e.target.value)}
                >
                  <option value="">— None —</option>
                  {contactsClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={tcLabel}>Assign BD User</label>
                <select
                  className={tcSelect}
                  value={meetingForm.assignBdId}
                  onChange={(e) => syncBdFields(e.target.value)}
                >
                  <option value="">— Choose BD User —</option>
                  {bdAssignees.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Warning: at least one contact required */}
              {!meetingForm.clientContactId && !meetingForm.serverContactId && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] text-amber-700 font-medium">⚠️ Please select at least one Server or Client contact — otherwise no notification will be sent</p>
                </div>
              )}

              {/* Notify section */}
              {(meetingForm.serverContactId || meetingForm.clientContactId || meetingForm.assignBdId) && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Email Notification</p>
                  <p className="text-xs text-slate-500 mb-1">Select who should receive a meeting notification email</p>
                  <div className="space-y-2">
                    {meetingForm.serverContactId && (
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meetingForm.notifyServer ?? true}
                          onChange={(e) => setMeetingForm(p => ({ ...p, notifyServer: e.target.checked }))}
                          className="w-4 h-4 rounded accent-orange-500"
                        />
                        <span className="text-sm text-neutral-800">Notify <strong>{meetingForm.serverName}</strong> <span className="text-slate-400 text-xs">(Server)</span></span>
                      </label>
                    )}
                    {meetingForm.clientContactId && (
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meetingForm.notifyClient ?? true}
                          onChange={(e) => setMeetingForm(p => ({ ...p, notifyClient: e.target.checked }))}
                          className="w-4 h-4 rounded accent-orange-500"
                        />
                        <span className="text-sm text-neutral-800">Notify <strong>{meetingForm.clientName}</strong> <span className="text-slate-400 text-xs">(Client)</span></span>
                      </label>
                    )}
                    {meetingForm.assignBdId && (
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={meetingForm.notifyBd ?? true}
                          onChange={(e) => setMeetingForm(p => ({ ...p, notifyBd: e.target.checked }))}
                          className="w-4 h-4 rounded accent-orange-500"
                        />
                        <span className="text-sm text-neutral-800">Notify <strong>{meetingForm.assignBdName}</strong> <span className="text-slate-400 text-xs">(BD)</span></span>
                      </label>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className={tcLabel}>Agenda *</label>
                <textarea
                  className={tcTextarea}
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, agenda: e.target.value }))}
                />
              </div>
              <div>
                <label className={tcLabel}>Date & Time *</label>
                <input
                  type="datetime-local"
                  className={tcInput}
                  value={meetingForm.scheduledAt}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={tcLabel}>Disposition</label>
                  <select
                    className={tcSelect}
                    value={meetingForm.disposition}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, disposition: e.target.value }))}
                  >
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className={tcLabel}>Status</label>
                  <select
                    className={tcSelect}
                    value={meetingForm.status}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={tcLabel}>Outcome</label>
                  <select
                    className={tcSelect}
                    value={meetingForm.outcome}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, outcome: e.target.value }))}
                  >
                    <option value="waiting">Waiting</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className={tcLabel}>Contact person</label>
                  <input
                    className={tcInput}
                    value={meetingForm.contactPerson}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, contactPerson: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className={tcLabel}>Contact number</label>
                <input
                  className={tcInput}
                  value={meetingForm.contactNumber}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, contactNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className={tcLabel}>Note for BD</label>
                <textarea
                  className={tcTextarea}
                  value={meetingForm.noteForBd}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, noteForBd: e.target.value }))}
                />
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setMeetingModal({ open: false, mode: 'add', item: null })}>
                Cancel
              </button>
              <button
                type="button"
                disabled={meetingSaving}
                className={tcBtnPrimary}
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                onClick={saveMeeting}
              >
                {meetingSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dial report modal */}
      {repModal.open && (
        <div className={tcModalOverlay} onClick={() => setRepModal({ open: false, item: null })}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div>
                <h3 className={tcModalTitle}>{repModal.item ? 'Edit report' : 'New dial report'}</h3>
                <p className={tcModalSub}>Share your activity summary.</p>
              </div>
              <button type="button" onClick={() => setRepModal({ open: false, item: null })} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className={tcModalBody}>
              <div>
                <label className={tcLabel}>Title *</label>
                <input
                  className={tcInput}
                  value={repForm.title}
                  onChange={(e) => setRepForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label className={tcLabel}>Period label</label>
                <input
                  className={tcInput}
                  value={repForm.periodLabel}
                  onChange={(e) => setRepForm((p) => ({ ...p, periodLabel: e.target.value }))}
                />
              </div>
              <div>
                <label className={tcLabel}>Summary</label>
                <textarea
                  className={tcTextarea}
                  value={repForm.summary}
                  onChange={(e) => setRepForm((p) => ({ ...p, summary: e.target.value }))}
                />
              </div>
              <div>
                <label className={tcLabel}>Notes</label>
                <textarea
                  className={tcTextarea}
                  value={repForm.notes}
                  onChange={(e) => setRepForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setRepModal({ open: false, item: null })}>
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMisc}
                className={tcBtnPrimary}
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                onClick={async () => {
                  if (!repForm.title.trim()) return alert('Title required')
                  setSavingMisc(true)
                  try {
                    if (repModal.item) {
                      await api(`/api/business/dial-reports/${repModal.item.id}`, { token, method: 'PATCH', body: repForm })
                    } else {
                      await api('/api/business/dial-reports', { token, method: 'POST', body: repForm })
                    }
                    await load()
                    setRepModal({ open: false, item: null })
                  } catch (e) {
                    alert(e.message || 'Failed')
                  } finally {
                    setSavingMisc(false)
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dial call modal */}
      {dialCallModal.open && (
        <div className={tcModalOverlay} onClick={() => setDialCallModal({ open: false, item: null })}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div>
                <h3 className={tcModalTitle}>{dialCallModal.item ? 'Edit call' : 'Log call'}</h3>
                <p className={tcModalSub}>Add a manual call record.</p>
              </div>
              <button type="button" onClick={() => setDialCallModal({ open: false, item: null })} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className={tcModalBody}>
              <div>
                <label className={tcLabel}>Party name *</label>
                <input className={tcInput} value={dialCallForm.partyName} onChange={(e) => setDialCallForm((p) => ({ ...p, partyName: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Phone</label>
                <input className={tcInput} value={dialCallForm.phone} onChange={(e) => setDialCallForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Duration (seconds)</label>
                <input className={tcInput} value={dialCallForm.durationSec} onChange={(e) => setDialCallForm((p) => ({ ...p, durationSec: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Disposition</label>
                <select className={tcSelect} value={dialCallForm.disposition} onChange={(e) => setDialCallForm((p) => ({ ...p, disposition: e.target.value }))}>
                  <option value="">— Select —</option>
                  {['Connected', 'Not Connected', 'Busy', 'Call Back', 'Not Interested', 'Interested', 'Follow Up', 'Voicemail', 'Wrong Number'].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={tcLabel}>Notes</label>
                <textarea className={tcTextarea} value={dialCallForm.notes} onChange={(e) => setDialCallForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setDialCallModal({ open: false, item: null })}>
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMisc}
                className={tcBtnPrimary}
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                onClick={async () => {
                  if (!dialCallForm.partyName.trim()) return alert('Party name required')
                  setSavingMisc(true)
                  try {
                    const body = {
                      ...dialCallForm,
                      durationSec: dialCallForm.durationSec === '' ? 0 : Number(dialCallForm.durationSec),
                    }
                    if (dialCallModal.item) {
                      await api(`/api/business/dial-calls/${dialCallModal.item.id}`, { token, method: 'PATCH', body })
                    } else {
                      await api('/api/business/dial-calls', { token, method: 'POST', body })
                    }
                    await load()
                    setDialCallModal({ open: false, item: null })
                  } catch (e) {
                    alert(e.message || 'Failed')
                  } finally {
                    setSavingMisc(false)
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training modal */}
      {trainingModal.open && (
        <div className={tcModalOverlay} onClick={() => setTrainingModal({ open: false, item: null })}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div>
                <h3 className={tcModalTitle}>{trainingModal.item ? 'Edit training' : 'Add training'}</h3>
                <p className={tcModalSub}>Track modules and completion.</p>
              </div>
              <button type="button" onClick={() => setTrainingModal({ open: false, item: null })} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className={tcModalBody}>
              <div>
                <label className={tcLabel}>Title *</label>
                <input className={tcInput} value={trainingForm.title} onChange={(e) => setTrainingForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Module</label>
                <input className={tcInput} value={trainingForm.module} onChange={(e) => setTrainingForm((p) => ({ ...p, module: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Status</label>
                <select className={tcSelect} value={trainingForm.status} onChange={(e) => setTrainingForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className={tcLabel}>Scheduled at</label>
                <input type="datetime-local" className={tcInput} value={trainingForm.scheduledAt} onChange={(e) => setTrainingForm((p) => ({ ...p, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Notes</label>
                <textarea className={tcTextarea} value={trainingForm.notes} onChange={(e) => setTrainingForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setTrainingModal({ open: false, item: null })}>
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMisc}
                className={tcBtnPrimary}
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                onClick={async () => {
                  if (!trainingForm.title.trim()) return alert('Title required')
                  setSavingMisc(true)
                  try {
                    if (trainingModal.item) {
                      await api(`/api/business/tc-trainings/${trainingModal.item.id}`, { token, method: 'PATCH', body: trainingForm })
                    } else {
                      await api('/api/business/tc-trainings', { token, method: 'POST', body: trainingForm })
                    }
                    await load()
                    setTrainingModal({ open: false, item: null })
                  } catch (e) {
                    alert(e.message || 'Failed')
                  } finally {
                    setSavingMisc(false)
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI call modal */}
      {aiCallModal.open && (
        <div className={tcModalOverlay} onClick={() => setAiCallModal({ open: false, item: null })}>
          <div className={tcModalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={tcModalHeader}>
              <div>
                <h3 className={tcModalTitle}>{aiCallModal.item ? 'Edit AI call' : 'Add AI call'}</h3>
                <p className={tcModalSub}>Inbound and outbound AI call record.</p>
              </div>
              <button type="button" onClick={() => setAiCallModal({ open: false, item: null })} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className={tcModalBody}>
              <div>
                <label className={tcLabel}>Direction</label>
                <select className={tcSelect} value={aiCallForm.direction} onChange={(e) => setAiCallForm((p) => ({ ...p, direction: e.target.value }))}>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
              <div>
                <label className={tcLabel}>Party</label>
                <input className={tcInput} value={aiCallForm.party} onChange={(e) => setAiCallForm((p) => ({ ...p, party: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Phone</label>
                <input className={tcInput} value={aiCallForm.phone} onChange={(e) => setAiCallForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Duration (seconds)</label>
                <input className={tcInput} value={aiCallForm.durationSec} onChange={(e) => setAiCallForm((p) => ({ ...p, durationSec: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Outcome</label>
                <input className={tcInput} value={aiCallForm.outcome} onChange={(e) => setAiCallForm((p) => ({ ...p, outcome: e.target.value }))} />
              </div>
              <div>
                <label className={tcLabel}>Status</label>
                <select className={tcSelect} value={aiCallForm.status} onChange={(e) => setAiCallForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className={tcLabel}>Notes</label>
                <textarea className={tcTextarea} value={aiCallForm.notes} onChange={(e) => setAiCallForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className={tcModalFooter}>
              <button type="button" className={tcBtnGhost} onClick={() => setAiCallModal({ open: false, item: null })}>
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMisc}
                className={tcBtnPrimary}
                style={{ background: 'linear-gradient(135deg,#FF7A00,#FFB000)' }}
                onClick={async () => {
                  setSavingMisc(true)
                  try {
                    const body = {
                      ...aiCallForm,
                      durationSec: aiCallForm.durationSec === '' ? 0 : Number(aiCallForm.durationSec),
                    }
                    if (aiCallModal.item) {
                      await api(`/api/business/ai-calls/${aiCallModal.item.id}`, { token, method: 'PATCH', body })
                    } else {
                      await api('/api/business/ai-calls', { token, method: 'POST', body })
                    }
                    await load()
                    setAiCallModal({ open: false, item: null })
                  } catch (e) {
                    alert(e.message || 'Failed')
                  } finally {
                    setSavingMisc(false)
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Action Dropdown Portal — renders outside any overflow:hidden */}
      {tcActionMenu && (
        <div
          className={tcDropdown}
          style={{ top: tcMenuPos.top, left: tcMenuPos.left }}
          data-menu
          onClick={e => e.stopPropagation()}
        >
          {tcActionMenu.kind === 'lead' && (() => {
            const l = leads.find(x => x.id === tcActionMenu.id)
            if (!l) return null
            return (
              <>
                <button type="button" className={tcDropdownItem}
                  onClick={() => { setTcActionMenu(null); setLeadViewItem(l) }}>
                  <Eye size={15} /> View
                </button>
                <button type="button" className={tcDropdownItem}
                  onClick={() => { setTcActionMenu(null); setLeadForm({ ...l }); setLeadModal({ open: true, item: l }) }}>
                  <Pencil size={15} /> Edit
                </button>
                <button type="button" className={tcDropdownItemDanger}
                  onClick={async () => {
                    if (!window.confirm('Delete this lead?')) return
                    setTcActionMenu(null)
                    try { await api(`/api/business/leads/${l.id}`, { token, method: 'DELETE' }); await load() }
                    catch(e) { alert(e.message || 'Failed') }
                  }}>
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )
          })()}
          {tcActionMenu.kind === 'team' && (() => {
            const m = teamMembers.find(x => x.id === tcActionMenu.id)
            if (!m) return null
            return (
              <>
                <button type="button" className={tcDropdownItem}
                  onClick={() => { setTcActionMenu(null); setTeamViewItem(m) }}>
                  <Eye size={15} /> View
                </button>
                <button type="button" className={tcDropdownItem}
                  onClick={() => { setTcActionMenu(null); setTeamForm({ ...m }); setTeamModal({ open: true, mode: 'edit', item: m }) }}>
                  <Pencil size={15} /> Edit
                </button>
                <button type="button" className={tcDropdownItemDanger}
                  onClick={() => {
                    setTcActionMenu(null)
                    if (!window.confirm('Delete this team member?')) return
                    setTeamMembers(prev => prev.filter(x => x.id !== m.id))
                  }}>
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
