import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, TOKEN_SUBCLIENT } from '../../lib/api'

export default function SubClientLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // appId is always 'ailocity' for sub-client dashboard — never BD or Business
      const data = await api('/api/auth/client/login', { method: 'POST', body: { ...form, appId: 'ailocity' } })
      localStorage.setItem(TOKEN_SUBCLIENT, data.token)
      navigate('/client/dashboard')
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
            <h1 className="text-slate-900 text-xl font-bold">Client Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your dashboard</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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



