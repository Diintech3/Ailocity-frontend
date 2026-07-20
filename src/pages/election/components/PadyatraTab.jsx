import { Footprints, Sparkles, Clock } from 'lucide-react'

export default function PadyatraTab() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm text-slate-800 min-h-[550px] flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-60" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-60" />

      <div className="max-w-md text-center space-y-6 z-10 flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7A00] to-[#FFB000] rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-tr from-[#FF7A00] to-[#FFB000] rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-105 transition-transform duration-300">
            <Footprints size={32} />
          </div>
        </div>

        {/* Coming Soon Tag */}
        <span className="bg-orange-50 text-[#FF7A00] border border-orange-100 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
          <Sparkles size={12} className="animate-pulse text-[#FF7A00]" /> Coming Soon
        </span>

        {/* Feature Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Padyatra & Walking Campaigns
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Coordinate street campaigns, map walk routes, register participant volunteers, and keep track of live location feedback on interactive maps.
          </p>
        </div>

        {/* Progress Timeline Block */}
        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-orange-100/50 flex items-center justify-center text-[#FF7A00]">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scheduled Launch</p>
              <p className="text-xs font-bold text-[#475569]">Phase 4 • Q4 2026</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
            In Pipeline
          </span>
        </div>
      </div>
    </div>
  )
}
