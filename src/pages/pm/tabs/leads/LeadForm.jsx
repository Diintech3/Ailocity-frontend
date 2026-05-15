import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { CATEGORY_MAP } from './constants'

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-600 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

function Section({ title }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">{title}</p>
}

export default function LeadForm({ form, setForm, onSubmit, onClose, saving, title, token, folders = [] }) {
  const [logoUploading, setLogoUploading] = useState(false)

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
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
      setForm(p => ({ ...p, logoKey: data.key }))
    } catch { /* ignore */ }
    finally { setLogoUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 flex-shrink-0">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto px-5 py-4 space-y-5 flex-1">

          {/* Business Information */}
          <div>
            <Section title="Business Information" />
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Name" required>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Full name" className={inp} />
              </Field>
              <Field label="Company">
                <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" className={inp} />
              </Field>
              <Field label="Business Logo">
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 hover:border-orange-400 transition-colors">
                  {form.logoKey
                    ? <img src={`${import.meta.env.VITE_API_URL || ''}/api/business/presigned-url?key=${encodeURIComponent(form.logoKey)}`} alt="logo" className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />
                    : <Plus size={13} className="text-slate-400 flex-shrink-0" />
                  }
                  <span className="text-sm text-slate-500 truncate">
                    {logoUploading ? 'Uploading…' : form.logoKey ? 'Change logo' : 'Upload logo'}
                  </span>
                  {form.logoKey && !logoUploading && <span className="ml-auto text-xs text-emerald-600">✓</span>}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={logoUploading} />
                </label>
              </Field>
              <Field label="Business Type">
                <select value={form.businessType} onChange={e => setForm(p => ({ ...p, businessType: e.target.value }))} className={inp}>
                  <option value="">Select type</option>
                  {['Proprietorship', 'Partnership', 'Pvt Ltd', 'LLP', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value, subCategory: '' }))} className={inp}>
                  <option value="">Select category</option>
                  {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub Category">
                <select value={form.subCategory} onChange={e => setForm(p => ({ ...p, subCategory: e.target.value }))} className={inp} disabled={!form.category}>
                  <option value="">Select sub category</option>
                  {(CATEGORY_MAP[form.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Website URL">
                <input value={form.websiteUrl} onChange={e => setForm(p => ({ ...p, websiteUrl: e.target.value }))} placeholder="https://" className={inp} />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Contact Details */}
          <div>
            <Section title="Contact Details" />
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Email">
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className={inp} />
              </Field>
              <Field label="Mobile">
                <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile number" className={inp} />
              </Field>
              <Field label="Alternate Mobile">
                <input value={form.alternateMobile} onChange={e => setForm(p => ({ ...p, alternateMobile: e.target.value }))} placeholder="Alternate number" className={inp} />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Documents */}
          <div>
            <Section title="Documents" />
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="GST Number">
                <input value={form.gstNumber} onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value }))} placeholder="GST Number" className={inp} />
              </Field>
              <Field label="PAN Number">
                <input value={form.panNumber} onChange={e => setForm(p => ({ ...p, panNumber: e.target.value }))} placeholder="PAN Number" className={inp} />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Location */}
          <div>
            <Section title="Location" />
            <div className="grid grid-cols-3 gap-2.5">
              {[['address','Address'],['city','City'],['state','State'],['pincode','Pincode'],['country','Country']].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={l} className={inp} />
                </Field>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Social */}
          <div>
            <Section title="Social / Online Presence" />
            <div className="grid grid-cols-3 gap-2.5">
              {[['instagramUrl','Instagram URL'],['facebookUrl','Facebook URL'],['youtubeUrl','YouTube URL']].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder="https://" className={inp} />
                </Field>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* CRM Details */}
          <div>
            <Section title="CRM Details" />
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Lead Type">
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inp}>
                  {[['hot','Hot Lead'],['warm','Warm Lead'],['cold','Cold Lead'],['qualified','Qualified'],['client','Client']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lead Sub Category">
                <select value={form.mbcSubCategory} onChange={e => setForm(p => ({ ...p, mbcSubCategory: e.target.value }))} className={inp}>
                  <option value="">Select sub category</option>
                  {['B2B', 'B2C', 'Enterprise', 'SME', 'Startup', 'Others'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Source">
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className={inp}>
                  {['Direct', 'Referral', 'Social Media', 'Website', 'Cold Call', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inp}>
                  {[['new','New'],['contacted','Contacted'],['qualified','Qualified'],['lost','Lost']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={inp}>
                  {[['high','High'],['medium','Medium'],['low','Low']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Budget">
                <input value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="Budget" className={inp} />
              </Field>
              <Field label="KYC Status">
                <select value={form.kyc} onChange={e => setForm(p => ({ ...p, kyc: e.target.value }))} className={inp}>
                  {[['pending','Pending'],['verified','Verified'],['rejected','Rejected']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Requirement">
                <input value={form.requirement} onChange={e => setForm(p => ({ ...p, requirement: e.target.value }))} placeholder="Requirement" className={inp} />
              </Field>
              <Field label="Assign to Folder">
                <select value={form.folderId || ''} onChange={e => setForm(p => ({ ...p, folderId: e.target.value }))} className={inp}>
                  <option value="">— No Folder —</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}{f.category ? ` (${f.category})` : ''}</option>
                  ))}
                </select>
              </Field>
              <div className="col-span-3">
                <Field label="Notes">
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." rows={2} className={`${inp} resize-none`} />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FFB000] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
