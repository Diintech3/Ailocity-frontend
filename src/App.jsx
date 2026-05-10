import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuperadminLogin from './pages/superadmin/Login'
import SuperadminDashboard from './pages/superadmin/Dashboard'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import ClientLogin from './pages/client/Login'
import ClientPortal from './pages/client/Portal'
import ClientDashboard from './pages/client/Dashboard'
import SubClientLogin from './pages/client/SubClientLogin'
import BDDashboard from './pages/bd/Dashboard'
import BDLogin from './pages/bd/Login'
import TCDashboard from './pages/tc/Dashboard'
import { TOKEN_SUPERADMIN, TOKEN_ADMIN, TOKEN_CLIENT, TOKEN_BD, TOKEN_TC, TOKEN_SUBCLIENT } from './lib/api'

function tcToken() {
  const t = localStorage.getItem(TOKEN_TC)
  if (t) return t
  const c = localStorage.getItem(TOKEN_CLIENT)
  if (!c) return null
  try {
    const p = JSON.parse(atob(c.split('.')[1]))
    if (p?.appId === 'ailocity-tc') return c
  } catch { /* ignore */ }
  return null
}

function Guard({ tokenKey, fallback, children, customCheck }) {
  const token = customCheck ? customCheck() : localStorage.getItem(tokenKey)
  if (!token) return <Navigate to={fallback} replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/superadmin/login" />} />

        {/* Superadmin */}
        <Route path="/superadmin/login" element={<SuperadminLogin />} />
        <Route path="/superadmin/dashboard" element={
          <Guard tokenKey={TOKEN_SUPERADMIN} fallback="/superadmin/login">
            <SuperadminDashboard />
          </Guard>
        } />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <Guard tokenKey={TOKEN_ADMIN} fallback="/admin/login">
            <AdminDashboard />
          </Guard>
        } />

        {/* App Portal Login */}
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/portal" element={
          <Guard tokenKey={TOKEN_CLIENT} fallback="/client/login">
            <ClientPortal />
          </Guard>
        } />

        {/* Sub Client Dashboard Login */}
        <Route path="/client/dashboard/login" element={<SubClientLogin />} />
        <Route path="/client/dashboard" element={
          <Guard tokenKey={TOKEN_SUBCLIENT} fallback="/client/dashboard/login">
            <ClientDashboard />
          </Guard>
        } />

        {/* Ailocity BD */}
        <Route path="/bd/login" element={<Navigate to="/client/login" replace />} />
        <Route path="/bd/dashboard" element={
          <Guard tokenKey={TOKEN_BD} fallback="/client/login">
            <BDDashboard />
          </Guard>
        } />

        {/* Ailocity TC */}
        <Route path="/tc/login" element={<Navigate to="/client/login" replace />} />
        <Route path="/tc/dashboard" element={
          <Guard customCheck={tcToken} fallback="/client/login">
            <TCDashboard />
          </Guard>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
