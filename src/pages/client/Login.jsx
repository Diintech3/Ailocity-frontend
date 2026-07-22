import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle2, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { api, TOKEN_CLIENT, TOKEN_BD, TOKEN_SUBCLIENT, TOKEN_TC, TOKEN_PM, TOKEN_ELECTION } from '../../lib/api'

// All tokens to clear when logging in
const ALL_TOKENS = [TOKEN_CLIENT, TOKEN_BD, TOKEN_SUBCLIENT, TOKEN_TC, TOKEN_PM, TOKEN_ELECTION]

export default function UserLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    appId: 'ailocity-election',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setForm(f => ({ ...f, appId: 'ailocity-election' }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.email.trim() || !form.password) {
      setError('Email address and password are required.')
      return
    }

    setLoading(true)
    try {
      const data = await api('/api/auth/client/login', {
        method: 'POST',
        body: { email: form.email, password: form.password, appId: 'ailocity-election' }
      })

      // Clear all existing tokens
      ALL_TOKENS.forEach(k => localStorage.removeItem(k))

      // Set active Election token
      localStorage.setItem(TOKEN_ELECTION, data.token)

      setSuccess('Signed in successfully! Redirecting to dashboard...')
      setTimeout(() => {
        navigate('/election/dashboard')
      }, 700)
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/40 focus:border-[#FF7A00] transition-all font-semibold'

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FFB000] p-0.5 shadow-lg shadow-orange-500/20 mx-auto mb-3">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="text-[#FF7A00]" size={26} />
              </div>
            </div>
            <h1 className="text-white text-xl sm:text-2xl font-black tracking-tight">
              Ailocity Election
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Sign in to access your election operations
            </p>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 text-xs font-semibold text-red-400 bg-red-950/50 border border-red-850/80 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-850/80 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:brightness-110 disabled:opacity-50 text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-98 mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
