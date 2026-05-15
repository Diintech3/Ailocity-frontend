import { useState, useEffect } from 'react'
import { Search, Folder, Users } from 'lucide-react'
import FolderTree from './leads/FolderTree'
import LeadTable  from './leads/LeadTable'
import LeadForm   from './leads/LeadForm'
import { BLANK_LEAD } from './leads/constants'

export default function Leads({ token, api }) {
  const [tab, setTab]           = useState('leads')
  const [leads, setLeads]       = useState([])
  const [folders, setFolders]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(null)
  const [editLead, setEditLead] = useState(null)
  const [form, setForm]         = useState(BLANK_LEAD)

  useEffect(() => {
    Promise.all([
      api('/api/pm/leads', { token }),
      api('/api/pm/folders', { token }),
    ]).then(([l, f]) => {
      setLeads(l.leads || [])
      setFolders(f.folders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  // Leads tab — all leads
  // Folders tab — filter by selected folder
  const visibleLeads = tab === 'leads'
    ? leads
    : leads.filter(l => {
        if (selected === null) return true
        if (selected === 'unassigned') return !l.folderId
        return l.folderId === selected
      })

  const folderLabel = selected === null
    ? 'All Leads'
    : selected === 'unassigned'
      ? 'Unassigned'
      : folders.find(f => f.id === selected)?.name || 'Folder'

  const closeModal = () => { setModal(null); setEditLead(null); setForm(BLANK_LEAD) }

  const openAdd = () => {
    const folder = folders.find(f => f.id === selected)
    setForm({
      ...BLANK_LEAD,
      category: folder?.category || '',
      subCategory: folder?.subCategory || '',
      folderId: (tab === 'folders' && selected && selected !== 'unassigned') ? selected : '',
    })
    setModal('create')
  }

  const openEdit = (lead) => {
    setEditLead(lead)
    setForm({ ...BLANK_LEAD, ...lead })
    setModal('edit')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await api('/api/pm/leads', { token, method: 'POST', body: form })
      setLeads(p => [res.lead, ...p])
      closeModal()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await api(`/api/pm/leads/${editLead.id}`, { token, method: 'PUT', body: form })
      setLeads(p => p.map(x => x.id === editLead.id ? res.lead : x))
      closeModal()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api(`/api/pm/leads/${id}`, { token, method: 'DELETE' })
      setLeads(p => p.filter(x => x.id !== id))
    } catch { /* ignore */ }
  }

  const handleAssignFolder = async (leadId, folderId) => {
    try {
      const lead = leads.find(l => l.id === leadId)
      await api(`/api/pm/leads/${leadId}`, { token, method: 'PUT', body: { ...lead, folderId } })
      setLeads(p => p.map(x => x.id === leadId ? { ...x, folderId } : x))
    } catch { /* ignore */ }
  }

  const handleCreateFolder = async (f) => {
    setSaving(true)
    try {
      const res = await api('/api/pm/folders', { token, method: 'POST', body: f })
      setFolders(p => [...p, res.folder])
      setSelected(res.folder.id)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleEditFolder = async (id, f) => {
    setSaving(true)
    try {
      const res = await api(`/api/pm/folders/${id}`, { token, method: 'PUT', body: f })
      setFolders(p => p.map(x => x.id === id ? res.folder : x))
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDeleteFolder = async (id) => {
    try {
      await api(`/api/pm/folders/${id}`, { token, method: 'DELETE' })
      setFolders(p => p.filter(x => x.id !== id))
      setLeads(p => p.map(x => x.folderId === id ? { ...x, folderId: '' } : x))
      if (selected === id) setSelected(null)
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col h-full -m-6">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab('leads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'leads' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={13} /> Leads
            <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 text-[10px]">{leads.length}</span>
          </button>
          <button
            onClick={() => setTab('folders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'folders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Folder size={13} /> Folders
            <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 text-[10px]">{folders.length}</span>
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search leads…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-48 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Tab: Leads — full width table */}
      {tab === 'leads' && (
        <LeadTable
          leads={visibleLeads}
          folders={folders}
          loading={loading}
          search={search}
          folderLabel="All Leads"
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={handleDelete}
          onAssignFolder={handleAssignFolder}
          token={token}
        />
      )}

      {/* Tab: Folders — tree + filtered table */}
      {tab === 'folders' && (
        <div className="flex flex-1 overflow-hidden">
          <FolderTree
            folders={folders}
            leads={leads}
            selected={selected}
            onSelect={setSelected}
            onCreateFolder={handleCreateFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
            saving={saving}
          />
          <LeadTable
            leads={visibleLeads}
            folders={folders}
            loading={loading}
            search={search}
            folderLabel={folderLabel}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAssignFolder={handleAssignFolder}
            token={token}
          />
        </div>
      )}

      {modal === 'create' && (
        <LeadForm form={form} setForm={setForm} onSubmit={handleCreate} onClose={closeModal} saving={saving} title="Add Lead" token={token} folders={folders} />
      )}
      {modal === 'edit' && (
        <LeadForm form={form} setForm={setForm} onSubmit={handleEdit} onClose={closeModal} saving={saving} title="Edit Lead" token={token} folders={folders} />
      )}
    </div>
  )
}
