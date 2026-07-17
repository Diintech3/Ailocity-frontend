import { useState, useEffect, useCallback, useRef } from 'react'
import { Map, Users, Navigation, Shield, Compass, Plus, Play, Pause, Activity, Filter, MapPin, User, Check, ListFilter, HelpCircle, Phone, X, CheckCircle2 } from 'lucide-react'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../../lib/api'
import 'leaflet/dist/leaflet.css'

// Pulsing Volunteer Avatar Icon
const createPulsingMarker = (name, color = '#FF7A00') => {
  const init = (name || 'VO').slice(0, 2).toUpperCase()
  return L.divIcon({
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; border-radius: 50%; background-color: ${color}; opacity: 0.2; transform: scale(1.5); animation: pulse 1.8s infinite ease-in-out;"></div>
        <div style="position: absolute; top: 3px; left: 3px; width: 28px; height: 28px; border-radius: 50%; background-color: white; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <span style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">${init}</span>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      </style>
    `,
    className: 'pulsing-volunteer-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

// Colored Marker for Route Stops
const stopIcon = L.divIcon({
  html: `<div style="width: 14px; height: 14px; border-radius: 50%; background-color: #FF5500; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.35);"></div>`,
  className: 'route-stop-marker',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

export default function MapTab({ token }) {
  const [volunteers, setVolunteers] = useState([])
  const [routes, setRoutes] = useState([])
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(true)
  const [selectedVol, setSelectedVol] = useState(null)
  
  // D2D Filters
  const [filterSupport, setFilterSupport] = useState('all')
  const [filterIssue, setFilterIssue] = useState('all')
  
  // Modal for Manual D2D Survey log
  const [surveyModal, setSurveyModal] = useState(false)
  const [surveyForm, setSurveyForm] = useState({
    volunteerId: '',
    routeId: '',
    houseNumber: '',
    headName: '',
    mobile: '',
    totalVoters: 2,
    supportStatus: 'Neutral', // Supporter, Neutral, Undecided, Opponent
    keyIssue: 'Water', // Road, Water, Electricity, Employment, Health, Education, Other
    candidateVisitRequired: 'No',
    wantsWhatsappUpdates: 'No',
    remarks: ''
  })
  
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [volRes, rteRes, srvRes] = await Promise.all([
        api('/api/election-campaign/volunteers', { token }),
        api('/api/election-campaign/routes', { token }),
        api('/api/election-campaign/surveys', { token })
      ])
      setVolunteers(volRes.volunteers || [])
      setRoutes(rteRes.routes || [])
      setSurveys(srvRes.surveys || [])
    } catch (err) {
      console.error('Failed to load tracking details:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Simulation Engine: Triggers mock-location update on backend every 4 seconds
  useEffect(() => {
    if (!simulating) return
    const interval = setInterval(async () => {
      try {
        // 1. Trigger backend path movement calculation
        await api('/api/election-campaign/volunteers/mock-locations', { method: 'POST', token })
        
        // 2. Mock D2D log submissions automatically for moving volunteers
        // Select an active volunteer at random who has an assigned route
        const activeVols = volunteers.filter(v => v.status === 'active' && v.assignedRouteId)
        if (activeVols.length > 0 && Math.random() > 0.4) {
          const luckyVol = activeVols[Math.floor(Math.random() * activeVols.length)]
          const targetRoute = routes.find(r => r.id === luckyVol.assignedRouteId)
          if (targetRoute) {
            const feedSts = ['Supporter', 'Neutral', 'Undecided', 'Opponent']
            const feedIss = ['Road', 'Water', 'Electricity', 'Employment', 'Health', 'Education', 'Other']
            const randomSts = feedSts[Math.floor(Math.random() * feedSts.length)]
            const randomIss = feedIss[Math.floor(Math.random() * feedIss.length)]
            
            // Post dynamic survey visit log
            await api('/api/election-campaign/surveys', {
              method: 'POST',
              token,
              body: {
                volunteerId: luckyVol.id,
                routeId: targetRoute.id,
                houseNumber: `H-${Math.floor(Math.random() * 200) + 1}`,
                headName: ['Amit Sharma', 'Sunita Devi', 'Rakesh Verma', 'Preeti Singh', 'Vijay Yadav'][Math.floor(Math.random() * 5)],
                mobile: '9' + Math.floor(Math.random() * 100000000),
                totalVoters: Math.floor(Math.random() * 5) + 1,
                supportStatus: randomSts,
                keyIssue: randomIss,
                candidateVisitRequired: Math.random() > 0.7 ? 'Yes' : 'No',
                wantsWhatsappUpdates: Math.random() > 0.5 ? 'Yes' : 'No',
                gpsLocation: luckyVol.lastKnownLocation || { lat: 26.8467, lng: 80.9462 }
              }
            })
          }
        }
        
        // 3. Reload everything
        await loadData()
      } catch (err) {
        console.error('Simulation step error:', err)
      }
    }, 4500)
    
    return () => clearInterval(interval)
  }, [simulating, volunteers, routes, token, loadData])

  // Seeding Mock Data if empty
  const handleSetupMockData = async () => {
    try {
      setLoading(true)
      
      // 1. Create two routes in Lucknow
      const r1 = await api('/api/election-campaign/routes', {
        method: 'POST',
        token,
        body: {
          name: 'Route 101 - Chowk Market D2D',
          ward: 'Ward 45',
          boothNumber: 'Booth 12',
          description: 'Main Bazaar sector and connecting lanes.',
          points: [
            { lat: 26.8520, lng: 80.9120 },
            { lat: 26.8550, lng: 80.9160 },
            { lat: 26.8530, lng: 80.9200 },
            { lat: 26.8580, lng: 80.9250 }
          ]
        }
      })
      
      const r2 = await api('/api/election-campaign/routes', {
        method: 'POST',
        token,
        body: {
          name: 'Route 102 - Hazratganj Sector B',
          ward: 'Ward 48',
          boothNumber: 'Booth 18',
          description: 'Residential colony near main park.',
          points: [
            { lat: 26.8467, lng: 80.9462 },
            { lat: 26.8480, lng: 80.9510 },
            { lat: 26.8510, lng: 80.9540 },
            { lat: 26.8540, lng: 80.9580 }
          ]
        }
      })
      
      // 2. Create volunteers
      const v1 = await api('/api/election-campaign/volunteers', {
        method: 'POST',
        token,
        body: {
          name: 'Vikram Singh',
          mobile: '9887766554',
          email: 'vikram@campaign.in',
          politicalParty: 'Ailocity Election Party',
          vidhanSabha: 'Lucknow Central',
          boothNumber: 'Booth 12',
          lastKnownLocation: { lat: 26.8520, lng: 80.9120, index: 0, direction: 1, updatedAt: new Date().toISOString() }
        }
      })

      const v2 = await api('/api/election-campaign/volunteers', {
        method: 'POST',
        token,
        body: {
          name: 'Priyanka Verma',
          mobile: '9112233445',
          email: 'priyanka@campaign.in',
          politicalParty: 'Ailocity Election Party',
          vidhanSabha: 'Lucknow Central',
          boothNumber: 'Booth 18',
          lastKnownLocation: { lat: 26.8467, lng: 80.9462, index: 0, direction: 1, updatedAt: new Date().toISOString() }
        }
      })
      
      // 3. Assign routes
      await Promise.all([
        api('/api/election-campaign/routes/assign', {
          method: 'POST',
          token,
          body: { volunteerId: v1.volunteer.id, routeId: r1.route.id }
        }),
        api('/api/election-campaign/routes/assign', {
          method: 'POST',
          token,
          body: { volunteerId: v2.volunteer.id, routeId: r2.route.id }
        })
      ])

      await loadData()
      setSuccess('Mock routes and volunteers created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to setup mock data')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSurveySubmit = async (e) => {
    e.preventDefault()
    if (!surveyForm.routeId || !surveyForm.houseNumber || !surveyForm.headName) {
      alert('Please fill in Route, House Number, and Family Head name.')
      return
    }
    
    // Choose coordinate from route points if matching
    const matchingRoute = routes.find(r => r.id === surveyForm.routeId)
    const mockLoc = matchingRoute?.points?.[0] || { lat: 26.8467, lng: 80.9462 }
    
    try {
      await api('/api/election-campaign/surveys', {
        method: 'POST',
        token,
        body: {
          ...surveyForm,
          gpsLocation: mockLoc
        }
      })
      
      // Reset form and reload
      setSurveyForm({
        volunteerId: '',
        routeId: '',
        houseNumber: '',
        headName: '',
        mobile: '',
        totalVoters: 2,
        supportStatus: 'Neutral',
        keyIssue: 'Water',
        candidateVisitRequired: 'No',
        wantsWhatsappUpdates: 'No',
        remarks: ''
      })
      setSurveyModal(false)
      setSuccess('D2D survey logged successfully!')
      setTimeout(() => setSuccess(''), 3000)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to save D2D survey log')
    }
  }

  // Filter survey logs
  const filteredSurveys = surveys.filter(s => {
    const stsMatch = filterSupport === 'all' || s.politicalFeedback?.supportStatus === filterSupport
    const issMatch = filterIssue === 'all' || s.politicalFeedback?.keyIssue === filterIssue
    return stsMatch && issMatch
  })

  const getStatusColor = (status) => {
    if (status === 'Supporter') return '#10b981' // Green
    if (status === 'Neutral') return '#f59e0b' // Yellow
    if (status === 'Undecided') return '#3b82f6' // Blue
    return '#ef4444' // Red
  }

  const getStatusEmoji = (status) => {
    if (status === 'Supporter') return '🟢 Supporter'
    if (status === 'Neutral') return '🟡 Neutral'
    if (status === 'Undecided') return '🔵 Undecided'
    return '🔴 Opponent'
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-800 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-orange-500 animate-pulse" /> Live Tracking Map & Survey Stream
          </h3>
          <p className="text-xs text-slate-400 font-medium">Track volunteers live on the map and view incoming campaign responses.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {routes.length === 0 && (
            <button
              onClick={handleSetupMockData}
              className="bg-orange-50 text-[#FF7A00] border border-orange-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors"
            >
              🚀 Click to Setup Mock Map Data
            </button>
          )}
          <button
            onClick={() => setSimulating(p => !p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              simulating ? 'bg-[#FF7A00] text-white hover:bg-[#e06e00]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {simulating ? (
              <>
                <Pause size={14} /> Pause Mock Walking
              </>
            ) : (
              <>
                <Play size={14} /> Start Mock Walking
              </>
            )}
          </button>
          <button
            onClick={() => setSurveyModal(true)}
            className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> New D2D Survey
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[72vh] min-h-[500px]">
          {/* Main Map View */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm relative h-full">
            <MapContainer center={[26.8467, 80.9462]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {/* Draw Route Polylines */}
              {routes.map(r => (
                r.points && r.points.length > 0 && (
                  <div key={r.id}>
                    <Polyline
                      positions={r.points.map(p => [p.lat, p.lng])}
                      color="#FFFFFF"
                      weight={8}
                      opacity={1.0}
                    />
                    <Polyline
                      positions={r.points.map(p => [p.lat, p.lng])}
                      color="#FF5500"
                      weight={4.5}
                      opacity={0.95}
                    />
                    {r.points.map((p, stopIdx) => (
                      <Marker key={stopIdx} position={[p.lat, p.lng]} icon={stopIcon} />
                    ))}
                  </div>
                )
              ))}

              {/* Plotted Live Volunteers */}
              {volunteers.map(v => (
                v.status === 'active' && v.lastKnownLocation && (
                  <Marker
                    key={v.id}
                    position={[v.lastKnownLocation.lat, v.lastKnownLocation.lng]}
                    icon={createPulsingMarker(v.name, '#FF7A00')}
                  >
                    <Popup>
                      <div className="p-2 space-y-1.5 text-xs">
                        <p className="font-bold text-slate-800 border-b pb-1 flex items-center gap-1">
                          <User size={12} className="text-[#FF7A00]" /> {v.name}
                        </p>
                        <p><strong>ID:</strong> {v.id}</p>
                        <p><strong>Party:</strong> {v.politicalParty}</p>
                        <p><strong>Vidhan Sabha:</strong> {v.vidhanSabha}</p>
                        <p><strong>Assigned Route:</strong> {routes.find(r => r.id === v.assignedRouteId)?.name || 'None'}</p>
                        <p className="text-[10px] text-slate-400">Coords: {v.lastKnownLocation.lat.toFixed(5)}, {v.lastKnownLocation.lng.toFixed(5)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          {/* Campaign Feeds & Filters */}
          <div className="xl:col-span-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-4 overflow-hidden h-full min-h-0">
            {/* Filter Toggle Headers */}
            <div className="space-y-3 pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-1 text-slate-800 font-bold text-sm">
                <Filter size={16} className="text-orange-500" /> Filter Logs
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Feedback</label>
                  <select
                    value={filterSupport}
                    onChange={e => setFilterSupport(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="all">All Feedback</option>
                    <option value="Supporter">Supporter</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Undecided">Undecided</option>
                    <option value="Opponent">Opponent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Main Issue</label>
                  <select
                    value={filterIssue}
                    onChange={e => setFilterIssue(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="all">All Issues</option>
                    <option value="Road">Road</option>
                    <option value="Water">Water</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Employment">Employment</option>
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* D2D Visit Feed */}
            <div className="flex-1 overflow-y-auto pt-3 space-y-3 min-h-0">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>D2D Live Stream</span>
                <span className="bg-orange-50 text-[#FF7A00] px-1.5 py-0.5 rounded text-[10px]">{filteredSurveys.length} visits</span>
              </div>
              {filteredSurveys.length === 0 ? (
                <div className="text-center py-16">
                  <Compass size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">No matching survey responses found.</p>
                </div>
              ) : (
                filteredSurveys.map(s => (
                  <div key={s.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all duration-200 text-xs relative overflow-hidden">
                    {/* Support Indicator Badge left line */}
                    <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: getStatusColor(s.politicalFeedback?.supportStatus) }}></div>
                    
                    <div className="pl-1.5 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800">{s.houseNumber || 'H-N/A'} — {s.familyDetails?.headName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(s.proof?.visitTime || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-medium">
                        <div className="flex items-center gap-1">
                          <span style={{ color: getStatusColor(s.politicalFeedback?.supportStatus) }}>
                            {getStatusEmoji(s.politicalFeedback?.supportStatus)}
                          </span>
                        </div>
                        <div>🔧 Issue: <strong className="text-slate-700">{s.politicalFeedback?.keyIssue}</strong></div>
                      </div>

                      <div className="text-[10px] text-slate-400 border-t pt-1 flex justify-between items-center">
                        <span>👤 Vol: {s.autoCaptured?.volunteerName || 'Manual'}</span>
                        <span>👥 Voters: {s.familyDetails?.totalVoters || 0}</span>
                      </div>
                      
                      {s.remarks && (
                        <p className="text-[10px] bg-white border border-slate-100 rounded p-1 text-slate-500 italic truncate">
                          "{s.remarks}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Survey Log Dialog */}
      {surveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-slate-900 text-lg font-bold">New Door-to-Door (D2D) Visit Log</h3>
              <button type="button" onClick={() => setSurveyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSurveySubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Route */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Route</label>
                  <select
                    required
                    value={surveyForm.routeId}
                    onChange={e => setSurveyForm(prev => ({ ...prev, routeId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="">Select Route</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.ward})</option>
                    ))}
                  </select>
                </div>

                {/* House Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">House Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H-42 / G-12"
                    value={surveyForm.houseNumber}
                    onChange={e => setSurveyForm(prev => ({ ...prev, houseNumber: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                {/* Head of Family Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Head of Family Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name of family representative"
                    value={surveyForm.headName}
                    onChange={e => setSurveyForm(prev => ({ ...prev, headName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={surveyForm.mobile}
                    onChange={e => setSurveyForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                {/* Total Voters */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Voters in Family</label>
                  <input
                    type="number"
                    min="1"
                    value={surveyForm.totalVoters}
                    onChange={e => setSurveyForm(prev => ({ ...prev, totalVoters: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                {/* Support Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Support Status</label>
                  <select
                    value={surveyForm.supportStatus}
                    onChange={e => setSurveyForm(prev => ({ ...prev, supportStatus: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="Supporter">🟢 Supporter</option>
                    <option value="Neutral">🟡 Neutral</option>
                    <option value="Undecided">🔵 Undecided</option>
                    <option value="Opponent">🔴 Opponent</option>
                  </select>
                </div>

                {/* Key Issue */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Key Issue</label>
                  <select
                    value={surveyForm.keyIssue}
                    onChange={e => setSurveyForm(prev => ({ ...prev, keyIssue: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="Road">Road</option>
                    <option value="Water">Water</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Employment">Employment</option>
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Follow up toggles */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Candidate Visit Required?</label>
                  <select
                    value={surveyForm.candidateVisitRequired}
                    onChange={e => setSurveyForm(prev => ({ ...prev, candidateVisitRequired: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Wants WhatsApp Updates?</label>
                  <select
                    value={surveyForm.wantsWhatsappUpdates}
                    onChange={e => setSurveyForm(prev => ({ ...prev, wantsWhatsappUpdates: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Short Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Any comments, specifics about the visit..."
                    value={surveyForm.remarks}
                    onChange={e => setSurveyForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 flex-shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSurveyModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF7A00] to-[#FFB000]"
                >
                  Log Visit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
