const FAQS = [
  { q: 'How to create a new campaign?', a: 'Go to Campaign tab → Click "New Campaign" → Fill in the details and save.' },
  { q: 'How to track ad performance?', a: 'Go to Ads tab → Select the platform → View all active ads and their status.' },
  { q: 'How to add leads?', a: 'Go to Leads tab → Click "Add Lead" → Fill in contact details and requirements.' },
  { q: 'What is the difference between Campaign and Ads?', a: 'A Campaign is the overall marketing initiative. Ads are individual creatives running under a campaign.' },
]

export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Help & Support</h2>
        <p className="text-sm text-slate-500 mt-0.5">Frequently asked questions and guides</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Q: {f.q}</p>
            <p className="text-sm text-slate-600 mt-1.5">A: {f.a}</p>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-orange-800">Need more help?</p>
        <p className="text-sm text-orange-700 mt-1">Contact support at <span className="font-medium">support@ailocity.com</span></p>
      </div>
    </div>
  )
}
