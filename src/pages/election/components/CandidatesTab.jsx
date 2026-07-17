import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Plus, X, Save, Settings, Eye, Pencil, Trash2, Users, Home, UserCheck, BarChart3, AlertCircle, CheckCircle2
} from 'lucide-react'
import { api } from '../../../lib/api'

const SUB_TABS = [
  { id: 'all', label: 'All Candidates', icon: Users },
  { id: 'houses', label: 'Houses', icon: Home },
  { id: 'voters', label: 'Voters', icon: UserCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const INPUT = 'w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 focus:border-[#FF7A00] transition-colors'
const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'

const EMPTY_CANDIDATE = {
  name: '', fatherName: '', mobile: '', email: '', age: '', gender: '', party: '', symbol: '',
  state: '', district: '', electionType: '', ward: '', vidhanSabha: '', lokSabha: '',
  address: '', pincode: '', lat: '', lng: '', status: 'active', notes: '',
}

const EMPTY_HOUSE = {
  houseNumber: '', ownerName: '', mobile: '', state: '', district: '', electionType: '', ward: '',
  vidhanSabha: '', lokSabha: '', address: '', pincode: '', lat: '', lng: '',
  totalVoters: '', status: 'active', notes: '',
}

const EMPTY_VOTER = {
  name: '', fatherName: '', mobile: '', age: '', gender: '', voterIdNumber: '', houseId: '',
  houseNumber: '', state: '', district: '', electionType: '', ward: '', vidhanSabha: '', lokSabha: '',
  address: '', pincode: '', lat: '', lng: '', boothNumber: '', status: 'active', notes: '',
}

function StatusBadge({ status }) {
  const active = status === 'active'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status || '—'}
    </span>
  )
}

function ActionsDropdown({ onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF7A00] hover:bg-orange-50 transition-colors"
        title="Actions"
      >
        <Settings size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-36 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
          <button type="button" onClick={() => { setOpen(false); onView() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Eye size={14} /> View
          </button>
          <button type="button" onClick={() => { setOpen(false); onEdit() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Pencil size={14} /> Edit
          </button>
          <button type="button" onClick={() => { setOpen(false); onDelete() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

function EntityModal({ title, onClose, children, wide, footer }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden`}>
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="text-slate-900 text-lg font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {children}
        </div>
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function FormFields({ fields, form, setForm, readOnly }) {
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(f => (
        <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
          <label className={LABEL}>{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={form[f.key] ?? ''}
              onChange={e => set(f.key, e.target.value)}
              disabled={readOnly}
              className={INPUT}
            >
              {(f.options || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea
              rows={3}
              value={form[f.key] ?? ''}
              onChange={e => set(f.key, e.target.value)}
              readOnly={readOnly}
              className={INPUT}
            />
          ) : (
            <input
              type={f.type || 'text'}
              required={f.required && !readOnly}
              value={form[f.key] ?? ''}
              onChange={e => set(f.key, e.target.value)}
              readOnly={readOnly}
              placeholder={f.placeholder}
              className={readOnly ? `${INPUT} bg-slate-50` : INPUT}
            />
          )}
        </div>
      ))}
    </div>
  )
}

const GENDER_OPTS = [{ value: '', label: 'Select' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]
const STATUS_OPTS = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]

const CANDIDATE_FIELDS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Full name' },
  { key: 'fatherName', label: 'Father Name', placeholder: "Father's name" },
  { key: 'mobile', label: 'Mobile', placeholder: '10-digit mobile' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
  { key: 'age', label: 'Age', type: 'number', placeholder: 'Age' },
  { key: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTS },
  { key: 'party', label: 'Party', placeholder: 'Party name' },
  { key: 'symbol', label: 'Symbol', placeholder: 'Election symbol' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'district', label: 'District', placeholder: 'District' },
  { key: 'electionType', label: 'Election Type', placeholder: 'e.g. Municipal' },
  { key: 'ward', label: 'Ward', placeholder: 'Ward number/name' },
  { key: 'vidhanSabha', label: 'Vidhan Sabha', placeholder: 'Constituency' },
  { key: 'lokSabha', label: 'Lok Sabha', placeholder: 'Constituency' },
  { key: 'address', label: 'Address', full: true, placeholder: 'Full address' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'lat', label: 'Latitude', placeholder: 'Lat' },
  { key: 'lng', label: 'Longitude', placeholder: 'Lng' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  { key: 'notes', label: 'Notes', type: 'textarea', full: true },
]

const HOUSE_FIELDS = [
  { key: 'houseNumber', label: 'House Number', required: true, placeholder: 'House no.' },
  { key: 'ownerName', label: 'Owner Name', placeholder: 'Owner name' },
  { key: 'mobile', label: 'Mobile', placeholder: 'Mobile' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'district', label: 'District', placeholder: 'District' },
  { key: 'electionType', label: 'Election Type', placeholder: 'Election type' },
  { key: 'ward', label: 'Ward', placeholder: 'Ward' },
  { key: 'vidhanSabha', label: 'Vidhan Sabha', placeholder: 'Vidhan Sabha' },
  { key: 'lokSabha', label: 'Lok Sabha', placeholder: 'Lok Sabha' },
  { key: 'address', label: 'Address', full: true, placeholder: 'Address' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'lat', label: 'Latitude', placeholder: 'Lat' },
  { key: 'lng', label: 'Longitude', placeholder: 'Lng' },
  { key: 'totalVoters', label: 'Total Voters', type: 'number', placeholder: '0' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  { key: 'notes', label: 'Notes', type: 'textarea', full: true },
]

const VOTER_FIELDS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Voter name' },
  { key: 'fatherName', label: 'Father Name', placeholder: "Father's name" },
  { key: 'mobile', label: 'Mobile', placeholder: 'Mobile' },
  { key: 'age', label: 'Age', type: 'number', placeholder: 'Age' },
  { key: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTS },
  { key: 'voterIdNumber', label: 'Voter ID', placeholder: 'EPIC / Voter ID' },
  { key: 'houseId', label: 'House ID', placeholder: 'Linked house ID' },
  { key: 'houseNumber', label: 'House Number', placeholder: 'House number' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'district', label: 'District', placeholder: 'District' },
  { key: 'electionType', label: 'Election Type', placeholder: 'Election type' },
  { key: 'ward', label: 'Ward', placeholder: 'Ward' },
  { key: 'vidhanSabha', label: 'Vidhan Sabha', placeholder: 'Vidhan Sabha' },
  { key: 'lokSabha', label: 'Lok Sabha', placeholder: 'Lok Sabha' },
  { key: 'address', label: 'Address', full: true, placeholder: 'Address' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'lat', label: 'Latitude', placeholder: 'Lat' },
  { key: 'lng', label: 'Longitude', placeholder: 'Lng' },
  { key: 'boothNumber', label: 'Booth Number', placeholder: 'Booth no.' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  { key: 'notes', label: 'Notes', type: 'textarea', full: true },
]

function DataTable({ columns, rows, emptyIcon: EmptyIcon, emptyTitle, emptyDesc }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <EmptyIcon size={48} className="mx-auto text-slate-300 mb-3" />
        <h4 className="text-slate-800 font-bold text-base">{emptyTitle}</h4>
        <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">{emptyDesc}</p>
      </div>
    )
  }
  return (
    <div>
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={`px-4 py-3 ${col.align === 'right' ? 'text-right w-16' : ''} ${col.className || ''} ${
                  idx === 0 ? 'rounded-tl-2xl' : idx === columns.length - 1 ? 'rounded-tr-2xl' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {rows.map((row, rowIdx) => (
            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((col, colIdx) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''} ${
                    rowIdx === rows.length - 1
                      ? colIdx === 0
                        ? 'rounded-bl-2xl'
                        : colIdx === columns.length - 1
                        ? 'rounded-br-2xl'
                        : ''
                      : ''
                  }`}
                >
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AnalyticsPanel({ candidates, houses, voters }) {
  const partyStats = candidates.reduce((acc, c) => {
    const p = c.party || 'Unknown'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})
  const wardStats = [...candidates, ...houses, ...voters].reduce((acc, item) => {
    const w = item.ward || 'Unassigned'
    acc[w] = (acc[w] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Candidates</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{candidates.length}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">{candidates.filter(c => c.status === 'active').length} active</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Houses</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{houses.length}</h3>
          <p className="text-xs text-slate-500 mt-1">{houses.reduce((s, h) => s + (Number(h.totalVoters) || 0), 0)} total voters listed</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Voters</p>
          <h3 className="text-2xl font-black text-slate-800 mt-2">{voters.length}</h3>
          <p className="text-xs text-orange-600 font-semibold mt-1">{voters.filter(v => v.status === 'active').length} active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-orange-600">Party Breakdown</h3>
          {Object.keys(partyStats).length === 0 ? (
            <p className="text-slate-400 text-sm italic">No candidate data yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(partyStats).map(([party, count]) => {
                const pct = candidates.length ? Math.round((count / candidates.length) * 100) : 0
                return (
                  <div key={party} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-700">{party}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-orange-600">Ward Coverage</h3>
          {Object.keys(wardStats).length === 0 ? (
            <p className="text-slate-400 text-sm italic">No ward data yet.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(wardStats).sort((a, b) => b[1] - a[1]).map(([ward, count]) => (
                <div key={ward} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-700">{ward}</span>
                  <span className="text-slate-500 font-medium">{count} records</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CandidatesTab({ token, onCandidatesChange }) {
  const [subTab, setSubTab] = useState('all')
  const [candidates, setCandidates] = useState([])
  const [houses, setHouses] = useState([])
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabError, setTabError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [modal, setModal] = useState(null)

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3500)
  }

  const loadCandidates = useCallback(async () => {
    const data = await api('/api/election/candidates', { token })
    const list = data.candidates || []
    setCandidates(list)
    onCandidatesChange?.(list)
    return list
  }, [token, onCandidatesChange])

  const loadHouses = useCallback(async () => {
    const data = await api('/api/election/houses', { token })
    setHouses(data.houses || [])
  }, [token])

  const loadVoters = useCallback(async () => {
    const data = await api('/api/election/voters', { token })
    setVoters(data.voters || [])
  }, [token])

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setTabError('')
      await Promise.all([loadCandidates(), loadHouses(), loadVoters()])
    } catch (err) {
      setTabError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [loadCandidates, loadHouses, loadVoters])

  useEffect(() => { loadAll() }, [loadAll])

  const openAdd = (type) => {
    const empty = type === 'candidate' ? EMPTY_CANDIDATE : type === 'house' ? EMPTY_HOUSE : EMPTY_VOTER
    setModal({ mode: 'add', type, form: { ...empty }, item: null })
  }

  const openEdit = (type, item) => {
    setModal({ mode: 'edit', type, form: { ...item }, item })
  }

  const openView = (type, item) => {
    setModal({ mode: 'view', type, form: { ...item }, item })
  }

  const closeModal = () => setModal(null)

  const entityConfig = (type) => {
    if (type === 'candidate') return { path: 'candidates', key: 'candidate', fields: CANDIDATE_FIELDS, empty: EMPTY_CANDIDATE, title: 'Candidate' }
    if (type === 'house') return { path: 'houses', key: 'house', fields: HOUSE_FIELDS, empty: EMPTY_HOUSE, title: 'House' }
    return { path: 'voters', key: 'voter', fields: VOTER_FIELDS, empty: EMPTY_VOTER, title: 'Voter' }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!modal) return
    const { mode, type, form, item } = modal
    const cfg = entityConfig(type)
    setSubmitting(true)
    try {
      if (mode === 'add') {
        const res = await api(`/api/election/${cfg.path}`, { method: 'POST', token, body: form })
        const created = res[cfg.key]
        if (type === 'candidate') {
          const next = [...candidates, created]
          setCandidates(next)
          onCandidatesChange?.(next)
        } else if (type === 'house') setHouses(prev => [...prev, created])
        else setVoters(prev => [...prev, created])
        showSuccess(`${cfg.title} added successfully`)
      } else {
        const res = await api(`/api/election/${cfg.path}/${item.id}`, { method: 'PATCH', token, body: form })
        const updated = res[cfg.key]
        if (type === 'candidate') {
          const next = candidates.map(c => c.id === updated.id ? updated : c)
          setCandidates(next)
          onCandidatesChange?.(next)
        } else if (type === 'house') setHouses(prev => prev.map(h => h.id === updated.id ? updated : h))
        else setVoters(prev => prev.map(v => v.id === updated.id ? updated : v))
        showSuccess(`${cfg.title} updated successfully`)
      }
      closeModal()
    } catch (err) {
      setTabError(err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (type, id) => {
    const cfg = entityConfig(type)
    if (!confirm(`Delete this ${cfg.title.toLowerCase()}?`)) return
    try {
      await api(`/api/election/${cfg.path}/${id}`, { method: 'DELETE', token })
      if (type === 'candidate') {
        const next = candidates.filter(c => c.id !== id)
        setCandidates(next)
        onCandidatesChange?.(next)
      } else if (type === 'house') setHouses(prev => prev.filter(h => h.id !== id))
      else setVoters(prev => prev.filter(v => v.id !== id))
      showSuccess(`${cfg.title} deleted successfully`)
    } catch (err) {
      setTabError(err.message || 'Delete failed')
    }
  }

  const addLabels = { all: 'Add Candidate', houses: 'Add House', voters: 'Add Voter' }
  const addTypes = { all: 'candidate', houses: 'house', voters: 'voter' }

  const candidateCols = [
    { key: 'name', label: 'Name', className: 'w-[22%]', render: r => <span className="font-bold text-slate-800 line-clamp-2">{r.name}</span> },
    { key: 'party', label: 'Party', className: 'w-[24%]', render: r => (
      <span className="bg-orange-50 text-orange-600 font-semibold px-2 py-1 rounded-full text-xs line-clamp-2 inline-block max-w-full">{r.party || '—'}</span>
    )},
    { key: 'symbol', label: 'Symbol', className: 'w-[12%]' },
    { key: 'ward', label: 'Ward', className: 'w-[18%]' },
    { key: 'status', label: 'Status', className: 'w-[14%]', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: 'Actions', align: 'right', render: r => (
      <ActionsDropdown
        onView={() => openView('candidate', r)}
        onEdit={() => openEdit('candidate', r)}
        onDelete={() => handleDelete('candidate', r.id)}
      />
    )},
  ]

  const houseCols = [
    { key: 'houseNumber', label: 'House No.', className: 'w-[14%]', render: r => <span className="font-bold text-slate-800">{r.houseNumber}</span> },
    { key: 'ownerName', label: 'Owner', className: 'w-[22%]' },
    { key: 'ward', label: 'Ward', className: 'w-[22%]' },
    { key: 'totalVoters', label: 'Voters', className: 'w-[12%]' },
    { key: 'status', label: 'Status', className: 'w-[16%]', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: 'Actions', align: 'right', render: r => (
      <ActionsDropdown
        onView={() => openView('house', r)}
        onEdit={() => openEdit('house', r)}
        onDelete={() => handleDelete('house', r.id)}
      />
    )},
  ]

  const voterCols = [
    { key: 'name', label: 'Name', className: 'w-[22%]', render: r => <span className="font-bold text-slate-800 line-clamp-2">{r.name}</span> },
    { key: 'voterIdNumber', label: 'Voter ID', className: 'w-[16%]' },
    { key: 'houseNumber', label: 'House No.', className: 'w-[12%]' },
    { key: 'ward', label: 'Ward', className: 'w-[22%]' },
    { key: 'status', label: 'Status', className: 'w-[14%]', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: 'Actions', align: 'right', render: r => (
      <ActionsDropdown
        onView={() => openView('voter', r)}
        onEdit={() => openEdit('voter', r)}
        onDelete={() => handleDelete('voter', r.id)}
      />
    )},
  ]

  const modalTitle = modal && (() => {
    const t = entityConfig(modal.type).title
    if (modal.mode === 'view') return `View ${t}`
    if (modal.mode === 'edit') return `Edit ${t}`
    return `Add ${t}`
  })()

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-800 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          {success}
        </div>
      )}
      {tabError && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          {tabError}
          <button type="button" onClick={() => setTabError('')} className="ml-auto text-xs font-bold uppercase text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              subTab === id
                ? 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-md'
                : 'text-slate-600 hover:bg-orange-50 hover:text-slate-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
        </div>
      ) : subTab === 'analytics' ? (
        <AnalyticsPanel candidates={candidates} houses={houses} voters={voters} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {SUB_TABS.find(t => t.id === subTab)?.label}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Manage election {subTab === 'all' ? 'candidates' : subTab} records
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAdd(addTypes[subTab])}
              className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
            >
              <Plus size={16} />
              {addLabels[subTab]}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            {subTab === 'all' && (
              <DataTable
                columns={candidateCols}
                rows={candidates}
                emptyIcon={Users}
                emptyTitle="No candidates registered"
                emptyDesc="Add your first contesting candidate to get started."
              />
            )}
            {subTab === 'houses' && (
              <DataTable
                columns={houseCols}
                rows={houses}
                emptyIcon={Home}
                emptyTitle="No houses registered"
                emptyDesc="Add house records to track voter households."
              />
            )}
            {subTab === 'voters' && (
              <DataTable
                columns={voterCols}
                rows={voters}
                emptyIcon={UserCheck}
                emptyTitle="No voters registered"
                emptyDesc="Add voter records linked to houses and wards."
              />
            )}
          </div>
        </>
      )}

      {modal && (
        <EntityModal
          title={modalTitle}
          onClose={closeModal}
          wide
          footer={modal.mode !== 'view' ? (
            <button
              type="submit"
              form="entity-modal-form"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              {submitting ? 'Saving...' : modal.mode === 'edit' ? 'Update' : 'Save'}
            </button>
          ) : null}
        >
          {modal.mode === 'view' ? (
            <FormFields fields={entityConfig(modal.type).fields} form={modal.form} setForm={() => {}} readOnly />
          ) : (
            <form id="entity-modal-form" onSubmit={handleSubmit}>
              <FormFields
                fields={entityConfig(modal.type).fields}
                form={modal.form}
                setForm={(updater) => setModal(m => ({
                  ...m,
                  form: typeof updater === 'function' ? updater(m.form) : updater,
                }))}
              />
            </form>
          )}
        </EntityModal>
      )}
    </div>
  )
}
