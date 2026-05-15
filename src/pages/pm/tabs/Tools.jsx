import { Link2, BarChart2, Users, Sparkles, Wallet, Search } from 'lucide-react'

const TOOLS = [
  { name: 'UTM Builder', desc: 'Create UTM tracking links for campaigns', icon: Link2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
  { name: 'ROI Calculator', desc: 'Calculate return on ad spend', icon: BarChart2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
  { name: 'Audience Estimator', desc: 'Estimate reach for your target audience', icon: Users, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100', hover: 'hover:border-violet-300 hover:shadow-violet-100' },
  { name: 'Ad Copy Generator', desc: 'AI-powered ad copy suggestions', icon: Sparkles, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', hover: 'hover:border-orange-300 hover:shadow-orange-100' },
  { name: 'Budget Planner', desc: 'Plan and allocate campaign budgets', icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
  { name: 'Competitor Analysis', desc: 'Track competitor ad strategies', icon: Search, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', hover: 'hover:border-red-300 hover:shadow-red-100' },
]

export default function Tools() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Tools</h2>
        <p className="text-sm text-slate-500 mt-0.5">Performance marketing tools & utilities</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TOOLS.map(({ name, desc, icon: Icon, color, bg, border, hover }) => (
          <div key={name} className={`group rounded-xl border-2 ${border} ${hover} bg-white p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon size={22} className={color} />
            </div>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
            <div className="mt-4 flex items-center gap-1">
              <span className="text-xs font-medium text-slate-400 group-hover:text-orange-500 transition-colors">Coming Soon</span>
              <span className="text-xs text-slate-300 group-hover:text-orange-400 transition-colors">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

