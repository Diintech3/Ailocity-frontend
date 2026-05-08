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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/superadmin/login" />} />

        {/* Superadmin */}
        <Route path="/superadmin/login" element={<SuperadminLogin />} />
        <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* App Portal Login */}
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/portal" element={<ClientPortal />} />

        {/* Sub Client Dashboard Login */}
        <Route path="/client/dashboard/login" element={<SubClientLogin />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />

        {/* Ailocity BD */}
        <Route path="/bd/login" element={<Navigate to="/client/login" replace />} />
        <Route path="/bd/dashboard" element={<BDDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
