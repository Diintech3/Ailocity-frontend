import { useState, useEffect } from 'react'

export default function Overview({ me, token, api }) {
  const [stats, setStats] = useState([
    { label: 'Active Projects',   value: '…', color: 'text-orange-600' },
    { label: 'Total Leads',       value: '…', color: 'text-blue-600' },
    { label: 'Running Campaigns', value: '…', color: 'text-violet-600' },
    { label: 'Total Ads',         value: '…', color: 'text-emerald-600' },
  ])

  useEffect(() => {
    if (!token) return
    Promise.all([
      api('/api/pm/projects', { token }).catch(() => ({ projects: [] })),
      api('/api/business/leads', { token }).catch(() => ({ leads: [] })),
      api('/api/business/campaigns', { token }).catch(() => ({ campaigns: [] })),
    ]).then(([proj, leads, camps]) => {
      const activeProjects   = (proj.projects   || []).filter(p => p.status === 'active').length
      const totalLeads       = (leads.leads      || []).length
      const runningCampaigns = (camps.campaigns  || []).filter(c => c.status === 'active' || c.status === 'running').length
      setStats([
        { label: 'Active Projects',   value: activeProjects,   color: 'text-orange-600' },
        { label: 'Total Leads',       value: totalLeads,       color: 'text-blue-600' },
        { label: 'Running Campaigns', value: runningCampaigns, color: 'text-violet-600' },
        { label: 'Total Ads',         value: 0,                color: 'text-emerald-600' },
      ])
    })
  }, [token])
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Welcome, {me?.businessName || 'PM'}</h2>
        <p className="text-sm text-slate-500 mt-0.5">Performance Marketing Dashboard</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-2">Quick Start</p>
        <p className="text-sm text-slate-500">Create a project, add leads, and launch your first campaign to get started.</p>
      </div>
    </div>
  )
}
