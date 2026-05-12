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
  MapPin,
} from 'lucide-react'
import { api, TOKEN_CLIENT, TOKEN_SUBCLIENT, TOKEN_BD, TOKEN_TC } from '../../lib/api'

// Loads logo from R2 presigned URL
function ContactLogo({ logoKey, token, size = 'md' }) {
  const [url, setUrl] = useState(null)
  const sz = size === 'lg' ? 'w-12 h-12' : size === 'xl' ? 'w-16 h-16' : 'w-8 h-8'
  const txt = size === 'lg' ? 'text-sm' : size === 'xl' ? 'text-base' : 'text-xs'
  useEffect(() => {
    if (!logoKey) return
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/business/presigned-url?key=${encodeURIComponent(logoKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.url) setUrl(d.url) })
      .catch(() => {})
  }, [logoKey, token])
  if (!logoKey) return null
  return url
    ? <img src={url} alt="logo" className={`${sz} rounded-full object-cover border border-slate-200 flex-shrink-0`} />
    : <div className={`${sz} rounded-full bg-orange-100 border border-slate-200 flex items-center justify-center flex-shrink-0`}>
        <span className={`text-orange-600 ${txt} font-bold`}>…</span>
      </div>
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'contacts', label: 'Business', icon: Users },
  { id: 'territory', label: 'Territory', icon: MapPin },
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
  services: '/api/business/services',
  products: '/api/business/products',
  contacts: '/api/business/contacts',
  datastore: '/api/business/datastore',
  leads: '/api/business/leads',
  campaigns: '/api/business/campaigns',
  content: '/api/business/content',
  reels: '/api/business/reels',
}

const RES_KEYS = {
  services: 'services',
  products: 'products',
  contacts: 'contacts',
  datastore: 'items',
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
  type: 'client', status: 'active', kyc: 'pending', notes: '', password: '', mbcSubCategory: '',
  territory: { stateId: '', stateName: '', cityId: '', cityName: '', regionId: '', regionName: '', podId: '', podNumber: '', podName: '' },
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

// App Portal — Business owner portal (Ailocity Business, Ailocity)
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
  const settingRef = useRef(null)
  const [contactModal, setContactModal] = useState({ open: false, mode: 'add', item: null })
  const [contactForm, setContactForm] = useState(BLANK_CONTACT)
  const [contactLogoUploading, setContactLogoUploading] = useState(false)
  const [contactSettingOpen, setContactSettingOpen] = useState(null)
  const [contactViewItem, setContactViewItem] = useState(null)
  const [contactTab, setContactTab] = useState('all')
  const [contactSubTab, setContactSubTab] = useState('all')
  const [contactSearch, setContactSearch] = useState('')
  const [contactPage, setContactPage] = useState(1)
  const CONTACTS_PER_PAGE = 20
  const [contactKycLoading, setContactKycLoading] = useState(null)
  const [contactKycFilter, setContactKycFilter] = useState('all')
  const [contactCategoryFilter, setContactCategoryFilter] = useState('all')
  const [contactTerritoryFilter, setContactTerritoryFilter] = useState('all')
  // Territory filter state — cascading
  const [tfState, setTfState] = useState('')
  const [tfCity, setTfCity] = useState('')
  const [tfRegion, setTfRegion] = useState('')
  const [tfPod, setTfPod] = useState('')
  const [contactStep, setContactStep] = useState(1)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [territoryData, setTerritoryData] = useState({ states: [] })
  const LAST_TERRITORY_KEY = 'ailocity_last_territory_session'
  const lastTerritoryRef = useRef({})
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedPod, setSelectedPod] = useState('')
  const [territoryLoading, setTerritoryLoading] = useState(false)
  const [editTerritoryOpen, setEditTerritoryOpen] = useState(false)
  const [editSelState, setEditSelState] = useState('')
  const [editSelCity, setEditSelCity] = useState('')
  const [editSelRegion, setEditSelRegion] = useState('')
  const [editSelPod, setEditSelPod] = useState('')

  // Territory management state
  const [treeData, setTreeData] = useState({ states: [] })
  const [treeLoading, setTreeLoading] = useState(false)
  const [tActiveSt, setTActiveSt] = useState(null)
  const [tActiveCt, setTActiveCt] = useState(null)
  const [tActiveRg, setTActiveRg] = useState(null)
  const [tModal, setTModal] = useState(null) // { type: 'state'|'city'|'region'|'pod', parentIds: {} }
  const [tForm, setTForm] = useState({})
  const [tSaving, setTSaving] = useState(false)

  const loadTerritoryTree = useCallback(async () => {
    setTreeLoading(true)
    try {
      const res = await api('/api/business/territories', { token })
      setTreeData(res || { states: [] })
      setTerritoryData(res || { states: [] })
    } catch {}
    finally { setTreeLoading(false) }
  }, [token])

  const isTcToken = useMemo(() => {
    if (!token) return false
    try {
      const parts = token.split('.')
      if (parts.length < 2) return false
      const payload = JSON.parse(atob(parts[1]))
      return payload?.appId === 'ailocity-tc'
    } catch { return false }
  }, [token])

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
      if (settingRef.current && !settingRef.current.contains(e.target)) setContactSettingOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const heading = useMemo(() => TABS.find((x) => x.id === active)?.label || 'Client', [active])

  const loadOverview = useCallback(async () => {
    const [meRes, dashRes, creditsRes, leadsRes, campaignRes] = await Promise.all([
      api('/api/business/me', { token }),
      api('/api/business/dashboard', { token }),
      api('/api/business/credits', { token }),
      api('/api/business/leads', { token }),
      api('/api/business/campaigns', { token }),
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
    if ((active === 'territory' || active === 'contacts') && token) {
      loadTerritoryTree()
    }
  }, [active, token, loadTerritoryTree])

  useEffect(() => {
    if (!token || !isTcToken) return
    localStorage.removeItem(TOKEN_CLIENT)
    localStorage.setItem(TOKEN_TC, token)
    navigate('/tc/dashboard', { replace: true })
  }, [token, isTcToken, navigate])

  useEffect(() => {
    if (!token || !isBdToken) return
    localStorage.removeItem(TOKEN_CLIENT)
    localStorage.setItem(TOKEN_BD, token)
    navigate('/bd/dashboard', { replace: true })
  }, [token, isBdToken, navigate])

  if (!token) return <Navigate to="/client/login" replace />
  if (isTcToken) return null
  if (isBdToken) return null

  const logout = () => {
    localStorage.removeItem(TOKEN_CLIENT)
    navigate('/client/login')
  }

  const aiAutoFill = async () => {
    const prompt = aiPrompt.trim() || contactForm.name?.trim() || contactForm.company?.trim() || contactForm.websiteUrl?.trim()
    if (!prompt) { setError('Please type a business description in the AI prompt box first'); return }
    setAiLoading(true)
    try {
      const res = await api('/api/business/ai-fill', { token, method: 'POST', body: { prompt } })
      if (res.data) {
        setContactForm(p => {
          const next = { ...p }
          for (const [k, v] of Object.entries(res.data)) {
            if (v && String(v).trim()) next[k] = String(v).trim()
          }
          return next
        })
      }
    } catch (err) {
      setError(err.message || 'AI auto-fill failed')
    } finally {
      setAiLoading(false)
    }
  }

  const openContactAdd = () => {
    setContactForm(BLANK_CONTACT)
    setContactLogoUploading(false)
    setContactStep(1)
    setAiPrompt('')
    const lt = (() => { try { return JSON.parse(sessionStorage.getItem(LAST_TERRITORY_KEY) || '{}') } catch { return {} } })()
    setSelectedState(lt.stateId || '')
    setSelectedCity(lt.cityId || '')
    setSelectedRegion(lt.regionId || '')
    setSelectedPod(lt.podId || '')
    // Load territory data
    if (territoryData.states.length === 0) {
      setTerritoryLoading(true)
      loadTerritoryTree().finally(() => setTerritoryLoading(false))
    }
    setContactModal({ open: true, mode: 'add', item: null })
  }

  const openContactEdit = (item) => {
    setContactForm({ ...BLANK_CONTACT, ...item, territory: item.territory || BLANK_CONTACT.territory })
    setContactLogoUploading(false)
    setEditTerritoryOpen(false)
    const t = item.territory || {}
    setEditSelState(t.stateId || '')
    setEditSelCity(t.cityId || '')
    setEditSelRegion(t.regionId || '')
    setEditSelPod(t.podId || '')
    if (territoryData.states.length === 0) loadTerritoryTree()
    setContactModal({ open: true, mode: 'edit', item })
  }

  const closeContactModal = () => {
    setContactModal({ open: false, mode: 'add', item: null })
    setContactStep(1)
    setSelectedState('')
    setSelectedCity('')
    setSelectedRegion('')
    setSelectedPod('')
    setEditTerritoryOpen(false)
    setEditSelState('')
    setEditSelCity('')
    setEditSelRegion('')
    setEditSelPod('')
  }

  const saveContact = async (e) => {
    e.preventDefault()
    if (!contactForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      // Build territory payload
      const getTerritoryPayload = (stId, ctId, rgId, pdId) => {
        if (!pdId) return {}
        const st = territoryData.states?.find(s => s.id === stId)
        const ct = st?.cities?.find(c => c.id === ctId)
        const rg = ct?.regions?.find(r => r.id === rgId)
        const pd = rg?.pods?.find(p => p.id === pdId)
        return {
          stateId: stId, stateName: st?.name || '',
          cityId: ctId, cityName: ct?.name || '',
          regionId: rgId, regionName: rg?.name || '',
          podId: pdId, podNumber: pd?.podNumber || '', podName: pd?.podName || '',
        }
      }

      const payload = {
        ...contactForm,
        type: String(contactForm.type || '').trim().toLowerCase(),
        status: String(contactForm.status || '').trim().toLowerCase(),
        ...(contactModal.mode === 'add' && selectedPod
          ? { territory: getTerritoryPayload(selectedState, selectedCity, selectedRegion, selectedPod) }
          : {}),
        ...(contactModal.mode === 'edit' && editSelPod
          ? { territory: getTerritoryPayload(editSelState, editSelCity, editSelRegion, editSelPod) }
          : {}),
      }
      if (contactModal.mode === 'add') {
        await api('/api/business/contacts', { token, method: 'POST', body: payload })
      } else {
        await api(`/api/business/contacts/${contactModal.item.id}`, { token, method: 'PATCH', body: payload })
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/business/upload`, {
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
    if (!window.confirm('Delete this business?')) return
    try {
      await api(`/api/business/contacts/${item.id}`, { token, method: 'DELETE' })
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
      await api('/api/business/profile', { token, method: 'PATCH', body: profile })
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
      <aside className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'} flex flex-col`} style={{background:'linear-gradient(180deg,#fff8f0 0%,#fff3e6 100%)',borderRight:'1px solid #ffe0c0'}}>
        <div className="flex h-[65px] items-center border-b border-orange-200 px-3">
          <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{me?.businessName || 'Client'}</p>
              <p className="truncate text-xs text-slate-500">{me?.appName || 'Ailocity'} • <span className="capitalize">{me?.status || '—'}</span></p>
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
                active === id ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white' : 'text-slate-600 hover:bg-orange-100'
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
            <div className="max-w-5xl space-y-6">
              {/* Profile Header */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl font-bold shadow-lg">
                    {(me?.businessName || 'B').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{me?.businessName || '—'}</h2>
                    <p className="text-sm text-slate-500 mt-1">{me?.email || '—'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${pill(me?.status)}`}>{me?.status || '—'}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${me?.kyc === 'verified' ? 'bg-emerald-100 text-emerald-700' : me?.kyc === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>KYC: {me?.kyc || 'pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">Business Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['Business Name', me?.businessName],
                    ['Full Name', me?.fullName],
                    ['App', me?.appName],
                    ['Source', me?.source],
                    ['Owner', me?.owner],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Details */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">Contact Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['Email', me?.email],
                    ['Mobile', me?.mobile],
                    ['Website', me?.websiteUrl],
                    ['Address', me?.address],
                    ['City', me?.city],
                    ['Pincode', me?.pincode],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account & Compliance */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">Account &amp; Compliance</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['GST Number', me?.gstNumber],
                    ['PAN Number', me?.panNumber],
                    ['KYC Status', me?.kyc],
                    ['Status', me?.status],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credits & Usage */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">Credits &amp; Usage</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ['Available Credits', me?.creditsBalance ?? 0],
                    ['Total Calls', me?.totalCalls ?? 0],
                    ['Active Agents', me?.activeAgentsCount ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg px-4 py-3 border border-orange-200">
                      <p className="text-xs font-medium text-orange-700 mb-1">{label}</p>
                      <p className="text-2xl font-bold text-orange-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={saveProfile} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">Edit Profile</h3>
                </div>
                <div className="p-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      <label className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
                      <input
                        value={profile[k]}
                        onChange={(e) => setProfile((p) => ({ ...p, [k]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-2.5 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60 shadow-sm">
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
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
              client:           'bg-orange-100 text-orange-600',
              server:           'bg-violet-100 text-violet-700',
              'server & client':'bg-cyan-100 text-cyan-700',
            }
            const tabFiltered = contactTab === 'all' ? rows
              : contactTab === 'new' ? rows.filter(r => r.status === 'new')
              : rows.filter(r => (r.type || '').toLowerCase() === contactTab)
            const subTabs = contactTab === 'server' || contactTab === 'client'
              ? ['Startup - Inhouse', 'Startup - Outside', 'MSME', 'Big Enterprise', 'PSU', 'Others']
              : []
            const subFiltered = contactSubTab === 'all' || subTabs.length === 0
              ? tabFiltered
              : tabFiltered.filter(r => (r.mbcSubCategory || '') === contactSubTab)

            // Territory cascading filter
            const tfStateObj  = territoryData.states?.find(s => s.id === tfState)
            const tfCityObj   = tfStateObj?.cities?.find(c => c.id === tfCity)
            const tfRegionObj = tfCityObj?.regions?.find(r => r.id === tfRegion)
            const tfAvailCities  = tfStateObj?.cities  || []
            const tfAvailRegions = tfCityObj?.regions  || []
            const tfAvailPods    = tfRegionObj?.pods   || []

            const territoryFiltered = (() => {
              if (!tfState) return subFiltered
              return subFiltered.filter(r => {
                const t = r.territory || {}
                if (tfState  && t.stateId  !== tfState)  return false
                if (tfCity   && t.cityId   !== tfCity)   return false
                if (tfRegion && t.regionId !== tfRegion) return false
                if (tfPod    && t.podId    !== tfPod)    return false
                return true
              })
            })()

            const filteredRows = contactSearch.trim()
              ? territoryFiltered.filter(r =>
                  (r.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                  (r.company || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                  (r.email || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                  (r.mobile || '').includes(contactSearch)
                )
              : territoryFiltered
            const totalPages = Math.ceil(filteredRows.length / CONTACTS_PER_PAGE)
            const pagedRows = filteredRows.slice((contactPage - 1) * CONTACTS_PER_PAGE, contactPage * CONTACTS_PER_PAGE)

            const resetTerritoryFilter = () => { setTfState(''); setTfCity(''); setTfRegion(''); setTfPod(''); setContactPage(1) }
            const isTerritoryFiltered = !!tfState

            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Business</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{rows.length} total businesses</p>
                  </div>
                  <button type="button" onClick={() => openContactAdd()} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-2 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] shadow-sm shadow-orange-500/20">
                    <Plus size={16} /> Add Business
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total',   value: rows.length,                                                                     color: 'text-slate-900' },
                    { label: 'Clients', value: rows.filter(r => String(r.type||'').toLowerCase() === 'client').length,          color: 'text-orange-600' },
                    { label: 'Server',  value: rows.filter(r => String(r.type||'').toLowerCase() === 'server').length,          color: 'text-violet-700' },
                    { label: 'Active',  value: rows.filter(r => String(r.status||'').toLowerCase() === 'active').length,        color: 'text-emerald-700' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Territory Filter Panel */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-orange-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Territory Filter</span>
                      {isTerritoryFiltered && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                          {filteredRows.length} result{filteredRows.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {isTerritoryFiltered && (
                      <button type="button" onClick={resetTerritoryFilter} className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">
                        ✕ Clear filter
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3">
                    {/* State */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">State</label>
                      <select
                        value={tfState}
                        onChange={e => { setTfState(e.target.value); setTfCity(''); setTfRegion(''); setTfPod(''); setContactPage(1) }}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                      >
                        <option value="">All States</option>
                        {(territoryData.states || []).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* City */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">City</label>
                      <select
                        value={tfCity}
                        onChange={e => { setTfCity(e.target.value); setTfRegion(''); setTfPod(''); setContactPage(1) }}
                        disabled={!tfState}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">All Cities</option>
                        {tfAvailCities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Region */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Region</label>
                      <select
                        value={tfRegion}
                        onChange={e => { setTfRegion(e.target.value); setTfPod(''); setContactPage(1) }}
                        disabled={!tfCity}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">All Regions</option>
                        {tfAvailRegions.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* POD */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">POD</label>
                      <select
                        value={tfPod}
                        onChange={e => { setTfPod(e.target.value); setContactPage(1) }}
                        disabled={!tfRegion}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">All PODs</option>
                        {tfAvailPods.map(p => (
                          <option key={p.id} value={p.id}>{p.podNumber} — {p.podName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Active filter breadcrumb */}
                  {isTerritoryFiltered && (
                    <div className="px-4 pb-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Filtering by:</span>
                      {[
                        tfStateObj?.name,
                        tfCityObj?.name,
                        tfRegionObj?.name ? `${tfRegionObj.name} Region` : null,
                        tfAvailPods.find(p => p.id === tfPod)?.podNumber,
                      ].filter(Boolean).map((label, i, arr) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="rounded-md bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-700">{label}</span>
                          {i < arr.length - 1 && <ChevronRight size={10} className="text-slate-300" />}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Filter Tabs */}
                  <div className="border-b border-slate-200">
                    <div className="flex items-center justify-between px-4 pt-3 pb-0">
                      <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                        {[
                          { key: 'all',    label: 'All',    count: rows.length },
                          { key: 'client', label: 'Client', count: rows.filter(r => (r.type||'').toLowerCase() === 'client').length },
                          { key: 'server', label: 'Server', count: rows.filter(r => (r.type||'').toLowerCase() === 'server').length },
                        ].map(tab => (
                          <button key={tab.key} type="button"
                            onClick={() => { setContactTab(tab.key); setContactSubTab('all'); setContactPage(1) }}
                            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                              contactTab === tab.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}>
                            {tab.label} <span className="ml-0.5 text-slate-400">({tab.count})</span>
                          </button>
                        ))}
                      </div>
                      <div className="relative mb-1 flex-shrink-0">
                        <input type="text" placeholder="Search…" value={contactSearch}
                          onChange={e => { setContactSearch(e.target.value); setContactPage(1) }}
                          className="border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 w-40" />
                        {contactSearch && (
                          <button type="button" onClick={() => setContactSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">✕</button>
                        )}
                      </div>
                    </div>
                    {/* Sub-tabs for Client and Server */}
                    {subTabs.length > 0 && (
                      <div className="flex gap-1 px-4 pb-0 pt-1 overflow-x-auto">
                        <button type="button"
                          onClick={() => { setContactSubTab('all'); setContactPage(1) }}
                          className={`px-2.5 py-1.5 text-[11px] font-medium rounded-t border-b-2 transition-colors whitespace-nowrap ${
                            contactSubTab === 'all' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                          }`}>
                          All <span className="ml-0.5 opacity-60">({tabFiltered.length})</span>
                        </button>
                        {subTabs.map(s => (
                          <button key={s} type="button"
                            onClick={() => { setContactSubTab(s); setContactPage(1) }}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-t border-b-2 transition-colors whitespace-nowrap ${
                              contactSubTab === s ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}>
                            {s} <span className="ml-0.5 opacity-60">({tabFiltered.filter(r => (r.mbcSubCategory||'') === s).length})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-8" />
                        <col className="w-10" />
                        <col className="w-[13%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[13%]" />
                        <col className="w-[10%]" />
                        <col className="w-[9%]" />
                        <col className="w-[8%]" />
                        <col className="w-[7%]" />
                        <col className="w-[6%]" />
                        <col className="w-10" />
                      </colgroup>
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['#', 'Logo', 'Name', 'Category', 'Territory', 'Email', 'Mobile', 'Type', 'KYC', 'Status', 'Login', ''].map(h => (
                            <th key={h} className="px-2 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedRows.length === 0 ? (
                          <tr><td colSpan={12} className="px-6 py-12 text-center text-sm text-slate-400">No businesses found.</td></tr>
                        ) : pagedRows.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-2 py-2 text-xs text-slate-400 w-8">{(contactPage - 1) * CONTACTS_PER_PAGE + idx + 1}</td>
                            <td className="px-2 py-2 w-10">
                              {r.logoKey
                                ? <ContactLogo logoKey={r.logoKey} token={token} size="md" />
                                : <div className="w-7 h-7 rounded-full bg-orange-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-600 text-xs font-bold">{(r.name || '?').slice(0,2).toUpperCase()}</span>
                                  </div>
                              }
                            </td>
                            <td className="px-2 py-2 w-32">
                              <p className="text-xs font-medium text-slate-800 truncate max-w-[120px]">{r.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[120px]">{r.company || '—'}</p>
                            </td>
                            <td className="px-2 py-2 w-28">
                              <p className="text-xs text-slate-700 truncate max-w-[100px]">{r.category || '—'}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[100px]">{r.subCategory || ''}</p>
                            </td>
                            <td className="px-2 py-2 w-28">
                              {r.territory?.podNumber ? (
                                <div>
                                  <p className="text-xs font-medium text-orange-600 truncate max-w-[100px]">{r.territory.podNumber}</p>
                                  <p className="text-xs text-slate-400 truncate max-w-[100px]">{r.territory.cityName}{r.territory.regionName ? ` · ${r.territory.regionName}` : ''}</p>
                                </div>
                              ) : <span className="text-xs text-slate-300">—</span>}
                            </td>
                            <td className="px-2 py-2 w-32">
                              <p className="text-xs text-slate-600 truncate max-w-[120px]">{r.email || '—'}</p>
                            </td>
                            <td className="px-2 py-2 text-xs text-slate-600 w-24 whitespace-nowrap">{r.mobile || '—'}</td>
                            <td className="px-2 py-2 w-24">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${typeColors[(r.type||'').toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>{r.type || '—'}</span>
                            </td>
                            <td className="px-2 py-2 w-20">
                              {(() => {
                                const kyc = r.kyc || 'pending'
                                const kycColor = kyc === 'verified' ? 'bg-emerald-100 text-emerald-700' : kyc === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                return <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap capitalize ${kycColor}`}>{kyc}</span>
                              })()}
                            </td>
                            <td className="px-2 py-2 w-20">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${pill(r.status)}`}>{r.status || '—'}</span>
                            </td>
                            <td className="px-2 py-2 w-16">
                              <button type="button" onClick={async () => {
                                try {
                                  const res = await api(`/api/business/contacts/${r.id}/login`, { token, method: 'POST' })
                                  localStorage.setItem(TOKEN_SUBCLIENT, res.token)
                                  window.open('/client/dashboard', '_blank')
                                } catch (err) { setError(err.message || 'No login account linked') }
                              }} className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
                                Login
                              </button>
                            </td>
                            <td className="px-2 py-2 w-10">
                              <div className="relative" ref={contactSettingOpen === r.id ? settingRef : null}>
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        Showing {(contactPage - 1) * CONTACTS_PER_PAGE + 1}–{Math.min(contactPage * CONTACTS_PER_PAGE, filteredRows.length)} of {filteredRows.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setContactPage(p => Math.max(1, p - 1))} disabled={contactPage === 1}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - contactPage) <= 1)
                          .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('...'); acc.push(p); return acc }, [])
                          .map((p, i) => p === '...' ? (
                            <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
                          ) : (
                            <button key={p} type="button" onClick={() => setContactPage(p)}
                              className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                                contactPage === p ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white border-orange-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}>{p}</button>
                          ))}
                        <button type="button" onClick={() => setContactPage(p => Math.min(totalPages, p + 1))} disabled={contactPage === totalPages}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                      </div>
                    </div>
                  )}
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

          {!bootLoading && active === 'territory' && (() => {
            const saveTerritory = async (e) => {
              e.preventDefault()
              setTSaving(true)
              try {
                const { type, parentIds } = tModal
                let body = {}
                if (type === 'state') body = { name: tForm.name, code: tForm.code || '' }
                if (type === 'city') body = { stateId: parentIds.stateId, name: tForm.name }
                if (type === 'region') body = { stateId: parentIds.stateId, cityId: parentIds.cityId, name: tForm.name }
                if (type === 'pod') body = { stateId: parentIds.stateId, cityId: parentIds.cityId, regionId: parentIds.regionId, podNumber: tForm.podNumber, podName: tForm.podName, capacity: tForm.capacity || 100 }
                await api(`/api/business/territories/${type}s`, { token, method: 'POST', body })
                await loadTerritoryTree()
                setTModal(null)
                setTForm({})
              } catch (err) { setError(err.message || 'Save failed') }
              finally { setTSaving(false) }
            }

            const activeState = treeData.states?.find(s => s.id === tActiveSt)
            const activeCity = activeState?.cities?.find(c => c.id === tActiveCt)
            const activeRegion = activeCity?.regions?.find(r => r.id === tActiveRg)

            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Territory Management</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage State → City → Region → POD hierarchy</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { loadTerritoryTree() }}
                    className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5"
                  >↻ Refresh</button>
                </div>

                {treeLoading && <div className="py-10 text-center text-sm text-slate-400">Loading…</div>}

                {!treeLoading && (
                  <div className="grid grid-cols-4 gap-4 h-[calc(100vh-220px)]">

                    {/* Column 1: States */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">States</p>
                        <button type="button" onClick={() => { setTModal({ type: 'state', parentIds: {} }); setTForm({}) }} className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {(treeData.states || []).length === 0 && (
                          <p className="px-4 py-6 text-xs text-slate-400 text-center">No states yet. Add one.</p>
                        )}
                        {(treeData.states || []).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setTActiveSt(s.id); setTActiveCt(null); setTActiveRg(null) }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                              tActiveSt === s.id ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-medium">{s.name}</p>
                            {s.code && <p className="text-xs text-slate-400">{s.code}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{s.cities?.length || 0} cities</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Cities */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cities</p>
                        {tActiveSt && (
                          <button type="button" onClick={() => { setTModal({ type: 'city', parentIds: { stateId: tActiveSt } }); setTForm({}) }} className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                            <Plus size={13} />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {!tActiveSt && <p className="px-4 py-6 text-xs text-slate-400 text-center">Select a state first</p>}
                        {tActiveSt && (activeState?.cities || []).length === 0 && <p className="px-4 py-6 text-xs text-slate-400 text-center">No cities yet.</p>}
                        {(activeState?.cities || []).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setTActiveCt(c.id); setTActiveRg(null) }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                              tActiveCt === c.id ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{c.regions?.length || 0} regions</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Regions */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Regions</p>
                        {tActiveCt && (
                          <button type="button" onClick={() => { setTModal({ type: 'region', parentIds: { stateId: tActiveSt, cityId: tActiveCt } }); setTForm({}) }} className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                            <Plus size={13} />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {!tActiveCt && <p className="px-4 py-6 text-xs text-slate-400 text-center">Select a city first</p>}
                        {tActiveCt && (activeCity?.regions || []).length === 0 && <p className="px-4 py-6 text-xs text-slate-400 text-center">No regions yet.</p>}
                        {(activeCity?.regions || []).map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setTActiveRg(r.id)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                              tActiveRg === r.id ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-medium">{r.name} Region</p>
                            <p className="text-xs text-slate-400 mt-0.5">{r.pods?.length || 0} PODs</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: PODs */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">PODs</p>
                        {tActiveRg && (
                          <button type="button" onClick={() => { setTModal({ type: 'pod', parentIds: { stateId: tActiveSt, cityId: tActiveCt, regionId: tActiveRg } }); setTForm({}) }} className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                            <Plus size={13} />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {!tActiveRg && <p className="px-4 py-6 text-xs text-slate-400 text-center">Select a region first</p>}
                        {tActiveRg && (activeRegion?.pods || []).length === 0 && <p className="px-4 py-6 text-xs text-slate-400 text-center">No PODs yet.</p>}
                        {(activeRegion?.pods || []).map(p => (
                          <div key={p.id} className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{p.podNumber}</p>
                            <p className="text-xs text-slate-500">{p.podName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Capacity: {p.capacity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Territory Add Modal */}
                {tModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setTModal(null)}>
                    <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                        <h2 className="text-base font-semibold text-slate-900 capitalize">Add {tModal.type}</h2>
                        <button type="button" onClick={() => setTModal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
                      </div>
                      <form onSubmit={saveTerritory} className="px-5 py-4 space-y-3">
                        {tModal.type === 'state' && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">State Name <span className="text-red-500">*</span></label>
                              <input value={tForm.name || ''} onChange={e => setTForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Delhi" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">State Code</label>
                              <input value={tForm.code || ''} onChange={e => setTForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. DL" maxLength={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                          </>
                        )}
                        {tModal.type === 'city' && (
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">City Name <span className="text-red-500">*</span></label>
                            <input value={tForm.name || ''} onChange={e => setTForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Gurgaon" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                          </div>
                        )}
                        {tModal.type === 'region' && (
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Region <span className="text-red-500">*</span></label>
                            <select value={tForm.name || ''} onChange={e => setTForm(p => ({ ...p, name: e.target.value }))} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                              <option value="">— Select Region —</option>
                              {['North','South','East','West','Central'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        )}
                        {tModal.type === 'pod' && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">POD Number <span className="text-red-500">*</span></label>
                              <input value={tForm.podNumber || ''} onChange={e => setTForm(p => ({ ...p, podNumber: e.target.value }))} required placeholder="e.g. POD-001" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">POD Name <span className="text-red-500">*</span></label>
                              <input value={tForm.podName || ''} onChange={e => setTForm(p => ({ ...p, podName: e.target.value }))} required placeholder="e.g. Sector 14-28" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Capacity</label>
                              <input type="number" value={tForm.capacity || 100} onChange={e => setTForm(p => ({ ...p, capacity: Number(e.target.value) }))} min={1} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500" />
                            </div>
                          </>
                        )}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button type="button" onClick={() => setTModal(null)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                          <button type="submit" disabled={tSaving} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-60">
                            {tSaving ? 'Saving…' : `Add ${tModal.type.charAt(0).toUpperCase() + tModal.type.slice(1)}`}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </section>
      </main>

      {/* Contact View Modal */}
      {contactViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setContactViewItem(null)}>
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                {contactViewItem.logoKey
                  ? <ContactLogo logoKey={contactViewItem.logoKey} token={token} size="lg" />
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
                  {contactViewItem.logoKey && (
                    <div className="col-span-2 flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                      <ContactLogo logoKey={contactViewItem.logoKey} token={token} size="xl" />
                      <div>
                        <p className="text-xs text-slate-400">Business Logo</p>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">{contactViewItem.name}</p>
                      </div>
                    </div>
                  )}
                  {[
                    ['Full Name', contactViewItem.name],
                    ['Company', contactViewItem.company],
                    ['Business Type', contactViewItem.businessType],
                    ['Category', contactViewItem.category],
                    ['Sub Category', contactViewItem.subCategory],
                    ['Website', contactViewItem.websiteUrl],
                    ['GST Number', contactViewItem.gstNumber],
                    ['PAN Number', contactViewItem.panNumber],
                  ].map(([l, v]) => v ? (
                    <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400">{l}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 break-all">{v}</p>
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
              {(contactViewItem.city || contactViewItem.address || contactViewItem.state) && (
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

              {/* Territory */}
              {(contactViewItem.territory?.stateName || contactViewItem.stateName) && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Territory Assignment</p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">
                      {contactViewItem.territory?.stateName || contactViewItem.stateName} →{' '}
                      {contactViewItem.territory?.cityName || contactViewItem.cityName} →{' '}
                      {contactViewItem.territory?.regionName || contactViewItem.region} Region →{' '}
                      {contactViewItem.territory?.podNumber || contactViewItem.podNumber}
                    </p>
                    {(contactViewItem.territory?.podName || contactViewItem.podName) && (
                      <p className="text-xs text-slate-500 mt-1">
                        POD: {contactViewItem.territory?.podName || contactViewItem.podName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CRM / MBC */}
              {(contactViewItem.type || contactViewItem.mbcSubCategory) && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">CRM Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['MBC Type', contactViewItem.type],
                      ['MBC Sub Category', contactViewItem.mbcSubCategory],
                      ['Status', contactViewItem.status],
                      ['Created At', contactViewItem.createdAt ? new Date(contactViewItem.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null],
                    ].map(([l, v]) => v ? (
                      <div key={l} className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{v}</p>
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
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{contactViewItem.notes}</p>
                </div>
              )}

              {/* KYC Status */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">KYC Status</p>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                    contactViewItem.kyc === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    contactViewItem.kyc === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {contactViewItem.kyc || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" disabled={contactKycLoading !== null} onClick={async () => {
                try {
                  setContactKycLoading('verified')
                  await api(`/api/business/contacts/${contactViewItem.id}/kyc`, { token, method: 'PATCH', body: { kyc: 'verified' } })
                  await loadTabCollection('contacts')
                  setContactViewItem(prev => ({ ...prev, kyc: 'verified' }))
                } catch (err) { setError(err.message || 'KYC update failed') }
                finally { setContactKycLoading(null) }
              }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-1.5 text-sm font-medium text-white">
                {contactKycLoading === 'verified' ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✓'} Verify KYC
              </button>
              <button type="button" disabled={contactKycLoading !== null} onClick={async () => {
                try {
                  setContactKycLoading('rejected')
                  await api(`/api/business/contacts/${contactViewItem.id}/kyc`, { token, method: 'PATCH', body: { kyc: 'rejected' } })
                  await loadTabCollection('contacts')
                  setContactViewItem(prev => ({ ...prev, kyc: 'rejected' }))
                } catch (err) { setError(err.message || 'KYC update failed') }
                finally { setContactKycLoading(null) }
              }} className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-1.5 text-sm font-medium text-white">
                {contactKycLoading === 'rejected' ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✗'} Reject KYC
              </button>
              <button type="button" disabled={contactKycLoading !== null} onClick={() => { setContactViewItem(null); openContactEdit(contactViewItem) }} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-4 py-1.5 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60">Edit</button>
              <button type="button" disabled={contactKycLoading !== null} onClick={() => setContactViewItem(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">Close</button>
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
                <h2 className="text-base font-semibold text-slate-900">
                  {contactModal.mode === 'add' ? 'Add New Business' : 'Edit Business'}
                </h2>
                {contactModal.mode === 'add' && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step {contactStep} of 2 — {contactStep === 1 ? 'Territory Selection' : 'Business Details'}
                  </p>
                )}
              </div>
              <button type="button" onClick={closeContactModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"><X size={18} /></button>
            </div>

            {/* Progress Bar — only for add mode */}
            {contactModal.mode === 'add' && (
              <div className="px-5 pt-3 pb-1">
                <div className="flex gap-2">
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${contactStep >= 1 ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000]' : 'bg-slate-200'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${contactStep >= 2 ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000]' : 'bg-slate-200'}`} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className={`text-xs font-medium ${contactStep >= 1 ? 'text-orange-500' : 'text-slate-400'}`}>Territory</span>
                  <span className={`text-xs font-medium ${contactStep >= 2 ? 'text-orange-500' : 'text-slate-400'}`}>Business Details</span>
                </div>
              </div>
            )}

            {/* ── STEP 1: Territory Selection ── */}
            {contactModal.mode === 'add' && contactStep === 1 && (() => {
              const currentState = territoryData.states?.find(s => s.id === selectedState)
              const currentCity = currentState?.cities?.find(c => c.id === selectedCity)
              const currentRegion = currentCity?.regions?.find(r => r.id === selectedRegion)
              const availableCities = currentState?.cities || []
              const availableRegions = currentCity?.regions || []
              const availablePods = currentRegion?.pods || []
              return (
                <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {territoryLoading ? (
                    <div className="py-10 text-center text-sm text-slate-400">Loading territory data…</div>
                  ) : (
                    <>
                      {/* State */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Business State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedState}
                          onChange={e => { setSelectedState(e.target.value); setSelectedCity(''); setSelectedRegion(''); setSelectedPod('') }}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                        >
                          <option value="">— Select State —</option>
                          {(territoryData.states || []).map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.cities?.length || 0} cities)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          City <span className="text-red-500">*</span>
                          {selectedState && <span className="ml-1 text-orange-500 font-normal">({availableCities.length} available)</span>}
                        </label>
                        <select
                          value={selectedCity}
                          onChange={e => { setSelectedCity(e.target.value); setSelectedRegion(''); setSelectedPod('') }}
                          disabled={!selectedState}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">— Select City —</option>
                          {availableCities.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.regions?.length || 0} regions)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Region */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Region <span className="text-red-500">*</span>
                          {selectedCity && <span className="ml-1 text-orange-500 font-normal">({availableRegions.length} available)</span>}
                        </label>
                        <select
                          value={selectedRegion}
                          onChange={e => { setSelectedRegion(e.target.value); setSelectedPod('') }}
                          disabled={!selectedCity}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">— Select Region —</option>
                          {availableRegions.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.pods?.length || 0} PODs)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* POD */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          POD (Point of Delivery) <span className="text-red-500">*</span>
                          {selectedRegion && <span className="ml-1 text-orange-500 font-normal">({availablePods.length} available)</span>}
                        </label>
                        <select
                          value={selectedPod}
                          onChange={e => setSelectedPod(e.target.value)}
                          disabled={!selectedRegion}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">— Select POD —</option>
                          {availablePods.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.podNumber} — {p.podName} (cap: {p.capacity})
                            </option>
                          ))}
                        </select>
                        {selectedPod && availablePods.find(p => p.id === selectedPod) && (
                          <p className="mt-1.5 text-xs text-slate-500">
                            📍 {availablePods.find(p => p.id === selectedPod)?.podNumber} · {availablePods.find(p => p.id === selectedPod)?.podName}
                          </p>
                        )}
                      </div>

                      {/* Territory Summary */}
                      {selectedState && selectedCity && selectedRegion && selectedPod && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                          <p className="text-xs font-semibold text-orange-700 mb-1">Selected Territory</p>
                          <p className="text-sm text-slate-700">
                            {currentState?.name} → {currentCity?.name} → {currentRegion?.name} Region → {availablePods.find(p => p.id === selectedPod)?.podNumber}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <button type="button" onClick={closeContactModal} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                    <button
                      type="button"
                      disabled={!selectedState || !selectedCity || !selectedRegion || !selectedPod}
                      onClick={() => {
                        sessionStorage.setItem(LAST_TERRITORY_KEY, JSON.stringify({ stateId: selectedState, cityId: selectedCity, regionId: selectedRegion, podId: selectedPod }))
                        setContactStep(2)
                      }}
                      className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-2 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-orange-500/20"
                    >
                      Next: Business Details →
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* ── STEP 2 (add) or full form (edit) ── */}
            {(contactModal.mode === 'edit' || (contactModal.mode === 'add' && contactStep === 2)) && (
            <form onSubmit={saveContact} className="max-h-[78vh] overflow-y-auto px-5 py-4 space-y-5">

              {/* Territory Summary Banner — only in add mode step 2 */}
              {contactModal.mode === 'add' && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-orange-700">Territory</p>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {territoryData.states?.find(s => s.id === selectedState)?.name} →{' '}
                      {territoryData.states?.find(s => s.id === selectedState)?.cities?.find(c => c.id === selectedCity)?.name} →{' '}
                      {territoryData.states?.find(s => s.id === selectedState)?.cities?.find(c => c.id === selectedCity)?.regions?.find(r => r.id === selectedRegion)?.name} Region →{' '}
                      {(() => { const p = territoryData.states?.find(s => s.id === selectedState)?.cities?.find(c => c.id === selectedCity)?.regions?.find(r => r.id === selectedRegion)?.pods?.find(p => p.id === selectedPod); return p ? `${p.podNumber} · ${p.podName}` : '' })()}
                    </p>
                  </div>
                  <button type="button" onClick={() => setContactStep(1)} className="text-xs text-orange-600 hover:text-orange-800 font-medium whitespace-nowrap ml-4">Change</button>
                </div>
              )}

              {/* AI Auto-Fill */}
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-violet-700">✨ AI Auto-Fill</p>
                  <button
                    type="button"
                    onClick={aiAutoFill}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-60 shadow-sm"
                  >
                    {aiLoading
                      ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</>
                      : '✨ Fill Form'}
                  </button>
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Describe the business in natural language… e.g. Ramesh ki IT company hai Delhi mein, web development aur app development karte hain, Pvt Ltd hai"
                  rows={2}
                  className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 resize-none placeholder-slate-400"
                />
                <p className="text-xs text-violet-600">AI will only fill empty fields — already filled fields will remain unchanged.</p>
              </div>

              {/* Business Information */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Information</p>
                </div>
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
                    <div className="flex items-center gap-2">
                      {contactForm.logoKey && (
                        <ContactLogo logoKey={contactForm.logoKey} token={token} size="lg" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 hover:border-orange-400 transition-colors flex-1">
                        <Plus size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-500 truncate">
                          {contactLogoUploading ? 'Uploading…' : contactForm.logoKey ? 'Change logo' : 'Upload logo'}
                        </span>
                        {contactForm.logoKey && !contactLogoUploading && (
                          <span className="ml-auto text-xs text-emerald-600 flex-shrink-0">✓</span>
                        )}
                        <input type="file" accept="image/*" onChange={handleContactLogoUpload} className="hidden" disabled={contactLogoUploading} />
                      </label>
                    </div>
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
                    <label className="block text-xs text-slate-600 mb-1">Major Business Category (MBC)</label>
                    <select value={String(contactForm.type || '').toLowerCase()} onChange={e => setContactForm(p => ({ ...p, type: e.target.value, mbcSubCategory: '' }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      {[
                        { v: 'client', label: 'Client' },
                        { v: 'server', label: 'Server' },
                      ].map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">MBC Sub Category</label>
                    <select value={contactForm.mbcSubCategory || ''} onChange={e => setContactForm(p => ({ ...p, mbcSubCategory: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      <option value="">Select sub category</option>
                      {['Startup - Inhouse', 'Startup - Outside', 'MSME', 'Big Enterprise', 'PSU', 'Others'].map(o => <option key={o} value={o}>{o}</option>)}
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
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">KYC Status</label>
                    <select value={String(contactForm.kyc || 'pending').toLowerCase()} onChange={e => setContactForm(p => ({ ...p, kyc: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                      {[
                        { v: 'pending', label: 'Pending' },
                        { v: 'verified', label: 'Verified' },
                        { v: 'rejected', label: 'Rejected' },
                      ].map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-slate-600 mb-1">Notes</label>
                    <textarea value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 resize-none" />
                  </div>
                </div>
              </div>

              {/* Territory — Edit Mode */}
              {contactModal.mode === 'edit' && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Territory Assignment</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTerritoryOpen(v => !v)
                        if (territoryData.states.length === 0) loadTerritoryTree()
                      }}
                      className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                    >
                      {editTerritoryOpen ? 'Cancel Change' : 'Change Territory'}
                    </button>
                  </div>

                  {/* Show current territory */}
                  {!editTerritoryOpen && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      {(contactForm.territory?.stateName || contactModal.item?.territory?.stateName) ? (
                        <>
                          <p className="text-sm font-medium text-slate-800">
                            {contactForm.territory?.stateName} → {contactForm.territory?.cityName} → {contactForm.territory?.regionName} Region → {contactForm.territory?.podNumber}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">POD: {contactForm.territory?.podName}</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">No territory assigned. Click "Change Territory" to assign.</p>
                      )}
                    </div>
                  )}

                  {/* Territory change dropdowns */}
                  {editTerritoryOpen && (() => {
                    const st = territoryData.states?.find(s => s.id === editSelState)
                    const ct = st?.cities?.find(c => c.id === editSelCity)
                    const rg = ct?.regions?.find(r => r.id === editSelRegion)
                    return (
                      <div className="space-y-2.5 rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                          <select value={editSelState} onChange={e => { setEditSelState(e.target.value); setEditSelCity(''); setEditSelRegion(''); setEditSelPod('') }}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500">
                            <option value="">— Select State —</option>
                            {(territoryData.states || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                          <select value={editSelCity} onChange={e => { setEditSelCity(e.target.value); setEditSelRegion(''); setEditSelPod('') }}
                            disabled={!editSelState}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:opacity-50">
                            <option value="">— Select City —</option>
                            {(st?.cities || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Region <span className="text-red-500">*</span></label>
                          <select value={editSelRegion} onChange={e => { setEditSelRegion(e.target.value); setEditSelPod('') }}
                            disabled={!editSelCity}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:opacity-50">
                            <option value="">— Select Region —</option>
                            {(ct?.regions || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">POD <span className="text-red-500">*</span></label>
                          <select value={editSelPod} onChange={e => setEditSelPod(e.target.value)}
                            disabled={!editSelRegion}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:opacity-50">
                            <option value="">— Select POD —</option>
                            {(rg?.pods || []).map(p => <option key={p.id} value={p.id}>{p.podNumber} — {p.podName}</option>)}
                          </select>
                        </div>
                        {editSelPod && (
                          <p className="text-xs text-orange-700 font-medium">
                            ✓ {st?.name} → {ct?.name} → {rg?.name} → {rg?.pods?.find(p => p.id === editSelPod)?.podNumber}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="border-t border-slate-100" />

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <div className="flex gap-2">
                  {contactModal.mode === 'add' && (
                    <button type="button" onClick={() => setContactStep(1)} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                      ← Back
                    </button>
                  )}
                  <button type="button" onClick={closeContactModal} className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Cancel</button>
                </div>
                <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-60 shadow-sm shadow-orange-500/20">
                  {saving ? 'Saving...' : contactModal.mode === 'add' ? 'Add Business' : 'Save Changes'}
                </button>
              </div>
            </form>
            )}
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















