import { useState } from 'react'
import { Plus, Folder, FolderOpen, ChevronRight, ChevronDown, Pencil, Trash2, X } from 'lucide-react'
import FolderForm from './FolderForm'

const BLANK_FOLDER = { name: '', category: '', subCategory: '', color: '#FF7A00' }

export default function FolderTree({ folders, leads, selected, onSelect, onCreateFolder, onEditFolder, onDeleteFolder, saving }) {
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(BLANK_FOLDER)
  const [activeFolder, setActiveFolder] = useState(null)
  const [expandedCats, setExpandedCats] = useState({})

  const countInFolder  = (id) => leads.filter(l => l.folderId === id).length
  const unassigned     = leads.filter(l => !l.folderId).length

  const openCreate = () => { setForm(BLANK_FOLDER); setModal('create') }
  const openEdit   = (f) => { setActiveFolder(f); setForm({ name: f.name, category: f.category, subCategory: f.subCategory, color: f.color }); setModal('edit') }
  const openDelete = (f) => { setActiveFolder(f); setModal('delete') }
  const closeModal = () => { setModal(null); setActiveFolder(null); setForm(BLANK_FOLDER) }

  const toggleCat = (cat) => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }))

  const handleCreate = async (e) => {
    e.preventDefault()
    await onCreateFolder(form)
    // Auto expand the category
    if (form.category) setExpandedCats(p => ({ ...p, [form.category]: true }))
    closeModal()
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    await onEditFolder(activeFolder.id, form)
    closeModal()
  }

  // Group folders by category
  const grouped = folders.reduce((acc, f) => {
    const key = f.category || '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  const FolderItem = ({ f }) => {
    const count    = countInFolder(f.id)
    const isActive = selected === f.id
    return (
      <div className="relative group">
        <button
          onClick={() => onSelect(f.id)}
          className={`flex items-center gap-2 w-full text-left py-1.5 pr-2 transition-colors rounded-lg mx-1 ${
            isActive ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
          }`}
          style={{ paddingLeft: f.category ? '2rem' : '1rem' }}
        >
          {isActive
            ? <FolderOpen size={14} style={{ color: f.color }} className="flex-shrink-0" />
            : <Folder size={14} style={{ color: f.color }} className="flex-shrink-0" />
          }
          <span className="flex-1 truncate text-xs">{f.name}</span>
          {f.subCategory && <span className="text-[10px] text-slate-400 truncate max-w-[50px]">{f.subCategory}</span>}
          {count > 0 && <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 flex-shrink-0">{count}</span>}
        </button>
        {/* Hover actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white rounded shadow-sm">
          <button onClick={e => { e.stopPropagation(); openEdit(f) }} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-orange-500">
            <Pencil size={10} />
          </button>
          <button onClick={e => { e.stopPropagation(); openDelete(f) }} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter</p>
        <button onClick={openCreate} className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors" title="New Folder">
          <Plus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1 space-y-0.5">

        {/* All Leads */}
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors rounded-lg mx-1 ${
            selected === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Folder size={15} className={selected === null ? 'text-orange-500' : 'text-slate-400'} />
          <span className="flex-1 text-xs">All Leads</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5">{leads.length}</span>
        </button>

        {/* Unassigned */}
        {unassigned > 0 && (
          <button
            onClick={() => onSelect('unassigned')}
            className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors rounded-lg mx-1 ${
              selected === 'unassigned' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Folder size={14} className="text-slate-300" />
            <span className="flex-1 text-xs">Unassigned</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5">{unassigned}</span>
          </button>
        )}

        {folders.length === 0 && (
          <p className="px-4 py-6 text-xs text-slate-400 text-center">No folders yet.<br />Click + to create one.</p>
        )}

        {/* Tree: Category Groups */}
        {folders.length > 0 && (
          <>
            <div className="mx-4 my-1 border-t border-slate-100" />

            {/* Folders WITH category — grouped */}
            {Object.entries(grouped)
              .filter(([key]) => key !== '__none__')
              .map(([cat, catFolders]) => {
                const isOpen = expandedCats[cat] !== false  // default open
                return (
                  <div key={cat}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCat(cat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left hover:bg-slate-50 rounded-lg mx-1 transition-colors"
                    >
                      {isOpen
                        ? <ChevronDown size={12} className="text-slate-400 flex-shrink-0" />
                        : <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                      }
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{cat}</span>
                      <span className="ml-auto text-[10px] text-slate-300">{catFolders.length}</span>
                    </button>

                    {/* Folders under this category */}
                    {isOpen && catFolders.map(f => <FolderItem key={f.id} f={f} />)}
                  </div>
                )
              })
            }

            {/* Folders WITHOUT category */}
            {grouped['__none__'] && (
              <div>
                <div className="px-4 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Other</span>
                </div>
                {grouped['__none__'].map(f => <FolderItem key={f.id} f={f} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {modal === 'create' && (
        <FolderForm form={form} setForm={setForm} onSubmit={handleCreate} onClose={closeModal} saving={saving} title="New Folder" />
      )}

      {/* Edit Modal */}
      {modal === 'edit' && (
        <FolderForm form={form} setForm={setForm} onSubmit={handleEdit} onClose={closeModal} saving={saving} title="Edit Folder" />
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && activeFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Delete Folder</h3>
              <button onClick={closeModal}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Delete "{activeFolder.name}"?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Leads unassigned ho jayenge, delete nahi honge.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700">Cancel</button>
                <button onClick={() => { onDeleteFolder(activeFolder.id); closeModal() }} className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-1.5 text-sm font-medium text-white">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
