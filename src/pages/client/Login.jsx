import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, TOKEN_CLIENT, TOKEN_BD, TOKEN_SUBCLIENT, TOKEN_TC } from '../../lib/api'

// appId → which token key and which dashboard URL
const APP_ROUTING = {
  'ailocity-bd':       { tokenKey: TOKEN_BD,     path: '/bd/dashboard'  },
  'ailocity':          { tokenKey: TOKEN_CLIENT,  path: '/client/portal' },
  'ailocity-business': { tokenKey: TOKEN_CLIENT,  path: '/client/portal' },
  'ailocity-tc':       { tokenKey: TOKEN_CLIENT,  path: '/client/portal' },
}

// All other tokens to clear when logging in with a specific app
const ALL_TOKENS = [TOKEN_CLIENT, TOKEN_BD, TOKEN_SUBCLIENT, TOKEN_TC]

export default function ClientLogin() {
  const [apps, setApps] = useState([])
  const [form, setForm] = useState({ email: '', password: '', appId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api('/api/apps')
      .then((d) => {
        const list = d.apps || []
        setApps(list)
        setForm((f) => ({ ...f, appId: list[0]?.id || '' }))
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/api/auth/client/login', { method: 'POST', body: form })

      const routing = APP_ROUTING[form.appId] || { tokenKey: TOKEN_CLIENT, path: '/client/portal' }

      // Clear ALL other tokens first — no stale session can bleed through
      ALL_TOKENS.forEach(k => localStorage.removeItem(k))

      // Set only the correct token for this app
      localStorage.setItem(routing.tokenKey, data.token)

      navigate(routing.path)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-colors'

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md">
          <div className="mb-6 text-center">
            <img src="/Aliocity logo.jpeg" alt="Ailocity" className="w-12 h-12 rounded-xl object-cover mx-auto mb-3" />
            <h1 className="text-slate-900 text-xl font-bold">Sign In</h1>
            <p className="text-slate-500 text-sm mt-1">Select your app and sign in</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">App</label>
              <select
                value={form.appId}
                onChange={(e) => setForm({ ...form, appId: e.target.value })}
                className={inputCls}
                required
              >
                <option value="">Select app</option>
                {apps.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputCls}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !form.appId}
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:from-[#e06e00] hover:to-[#e6a000] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
