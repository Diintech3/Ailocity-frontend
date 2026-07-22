import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from '../../lib/leafletFix'
import 'leaflet/dist/leaflet.css'
import {
  MapPin, ClipboardList, Activity, User, Play, Pause, Compass, Battery, Wifi,
  CheckCircle2, MessageSquare, Plus, RefreshCw, ArrowLeft, Shield, Sparkles, Navigation, Layers, Info
} from 'lucide-react'
import { api, TOKEN_ELECTION, TOKEN_CLIENT } from '../../lib/api'

const createPulsingMarker = (name, isDarkMode = true, color = '#FF7A00') => {
  const init = (name || 'VO').slice(0, 2).toUpperCase()
  const centerBg = isDarkMode ? '#0f172a' : '#ffffff'
  const glowShadow = isDarkMode ? `box-shadow: 0 0 12px ${color}aa;` : `box-shadow: 0 2px 6px rgba(0,0,0,0.15);`
  
  return L.divIcon({
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="position: absolute; top: 0; left: 0; width: 36px; height: 36px; border-radius: 50%; background-color: ${color}; opacity: 0.3; transform: scale(1.4); animation: pulse 1.8s infinite ease-in-out;"></div>
        <div style="position: absolute; top: 3px; left: 3px; width: 30px; height: 30px; border-radius: 50%; background-color: ${centerBg}; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; ${glowShadow}">
          <span style="font-size: 11px; font-weight: 900; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">${init}</span>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      </style>
    `,
    className: 'pulsing-volunteer-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

const createStartIcon = (isDarkMode = true) => {
  const centerBg = isDarkMode ? '#064e3b' : '#10b981'
  const glowColor = '#10b981'
  return L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${glowColor}; opacity: 0.3; transform: scale(1.4); animation: pulseGreen 1.8s infinite ease-in-out;"></div>
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background-color: ${centerBg}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
          <span style="font-size: 8px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">START</span>
        </div>
      </div>
    `,
    className: 'route-start-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const createEndIcon = (isDarkMode = true) => {
  const centerBg = isDarkMode ? '#7f1d1d' : '#ef4444'
  const glowColor = '#ef4444'
  return L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${glowColor}; opacity: 0.3; transform: scale(1.4); animation: pulseRed 1.8s infinite ease-in-out;"></div>
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background-color: ${centerBg}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
          <span style="font-size: 8px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">END</span>
        </div>
      </div>
    `,
    className: 'route-end-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const createStopIcon = (isDarkMode = true) => {
  const centerBg = isDarkMode ? '#1e293b' : '#ffffff'
  return L.divIcon({
    html: `<div style="width: 8px; height: 8px; border-radius: 50%; background-color: #FF5500; border: 1.5px solid ${isDarkMode ? '#0f172a' : '#ffffff'}; box-shadow: 0 1px 3px rgba(0,0,0,0.25);"></div>`,
    className: 'route-stop-marker',
    iconSize: [8, 8],
    iconAnchor: [4, 4]
  })
}

const createSurveyMarker = (status, isDarkMode = true) => {
  let color = '#FF7A00'
  let label = '?'
  if (status === 'Supporter') { color = '#10b981'; label = '✔' }
  else if (status === 'Neutral') { color = '#f59e0b'; label = '⚬' }
  else if (status === 'Undecided') { color = '#3b82f6'; label = '?' }
  else if (status === 'Opponent') { color = '#ef4444'; label = '✖' }

  const fillBg = isDarkMode ? '#0f172a' : color
  const borderCol = isDarkMode ? color : 'white'
  const textCol = isDarkMode ? color : 'white'
  const glowShadow = isDarkMode ? `box-shadow: 0 0 8px ${color}88;` : `box-shadow: 0 2px 4px rgba(0,0,0,0.25);`

  return L.divIcon({
    html: `
      <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: ${fillBg}; border: 2.2px solid ${borderCol}; ${glowShadow} display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 10px; font-weight: 900; color: ${textCol}; line-height: 1;">${label}</span>
      </div>
    `,
    className: 'survey-marker-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })
}

const createHouseMarker = (isDarkMode = true, isAssignedToSelectedRoute = false) => {
  const fillBg = isDarkMode ? '#1e293b' : '#ffffff'
  const borderCol = isAssignedToSelectedRoute 
    ? '#FF7A00' 
    : (isDarkMode ? '#475569' : '#cbd5e1')
  const glowShadow = isAssignedToSelectedRoute
    ? 'box-shadow: 0 0 10px #FF7A00, 0 2px 5px rgba(0,0,0,0.25); border-width: 2.2px;'
    : 'box-shadow: 0 2px 5px rgba(0,0,0,0.15);'
  return L.divIcon({
    html: `
      <div style="position: relative; width: 24px; height: 24px; border-radius: 8px; background-color: ${fillBg}; border: 2px solid ${borderCol}; ${glowShadow} display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 11px;">🏠</span>
        ${isAssignedToSelectedRoute ? '<span style="position: absolute; top: -5px; right: -5px; font-size: 9px; background: #FF7A00; color: white; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid white;">✓</span>' : ''}
      </div>
    `,
    className: 'house-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

// Map Camera Controller
function MapRecenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], zoom || 16, { duration: 1 })
    }
  }, [center, zoom, map])
  return null
}

export default function FieldUserApp() {
  const [authToken, setAuthToken] = useState(localStorage.getItem(TOKEN_ELECTION) || localStorage.getItem(TOKEN_CLIENT))
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('map') // 'map' | 'campaign' | 'surveys' | 'profile'
  const [me, setMe] = useState(null)
  const [routes, setRoutes] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [surveys, setSurveys] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [houses, setHouses] = useState([])

  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [activeVolunteer, setActiveVolunteer] = useState(null)
  const [mapCenter, setMapCenter] = useState({ lat: 26.8467, lng: 80.9462, zoom: 15 })

  const [loading, setLoading] = useState(true)
  const [newSurveyModal, setNewSurveyModal] = useState(false)
  const [surveyForm, setSurveyForm] = useState({
    houseNumber: '',
    ownerName: '',
    supportStatus: 'Supporter',
    keyIssue: 'Development',
    remarks: '',
  })

  // Load telemetry datasets
  const loadData = async () => {
    try {
      setLoading(true)
      const [meRes, routesRes, volsRes, surveysRes, campRes, hseRes] = await Promise.all([
        api('/api/election/me', { token: authToken }).catch(() => null),
        api('/api/election-campaign/routes', { token: authToken }).catch(() => ({ routes: [] })),
        api('/api/election-campaign/volunteers', { token: authToken }).catch(() => ({ volunteers: [] })),
        api('/api/election-campaign/surveys', { token: authToken }).catch(() => ({ surveys: [] })),
        api('/api/election-campaign/d2d-campaigns', { token: authToken }).catch(() => ({ campaigns: [] })),
        api('/api/election/houses', { token: authToken }).catch(() => ({ houses: [] })),
      ])

      if (!meRes) {
        setAuthToken(null)
        localStorage.removeItem(TOKEN_ELECTION)
        return
      }

      setMe(meRes)
      const rList = routesRes.routes || []
      const vList = volsRes.volunteers || []
      setRoutes(rList)
      setVolunteers(vList)
      setSurveys(surveysRes.surveys || [])
      setCampaigns(campRes.campaigns || [])
      setHouses(hseRes.houses || [])

      if (rList.length > 0) {
        setSelectedRouteId(rList[0].id)
        if (rList[0].points && rList[0].points.length > 0) {
          setMapCenter({ lat: rList[0].points[0].lat, lng: rList[0].points[0].lng, zoom: 15 })
        }
      }
      if (vList.length > 0) {
        setActiveVolunteer(vList[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authToken) {
      loadData()
    }
  }, [authToken])

  // Auto Walking Simulation Engine
  useEffect(() => {
    let interval = null
    if (simulating) {
      interval = setInterval(async () => {
        try {
            const res = await api('/api/election-campaign/volunteers/mock-locations', {
              method: 'POST',
              body: { simulateAll: true },
              token: authToken,
            })
          if (res.volunteers) {
            setVolunteers(res.volunteers)
            const currentVol = res.volunteers.find(v => v.assignedRouteId === selectedRouteId) || res.volunteers[0]
            if (currentVol) {
              setActiveVolunteer(currentVol)
              if (currentVol.currentLocation?.lat) {
                setMapCenter({ lat: currentVol.currentLocation.lat, lng: currentVol.currentLocation.lng, zoom: 16 })
              }
            }
          }
          if (res.newSurveys && res.newSurveys.length > 0) {
            setSurveys(prev => [...res.newSurveys, ...prev])
          }
        } catch (err) {
          console.error('Simulation step failed', err)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [simulating, selectedRouteId, authToken])

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0]
  const activeCampaign = campaigns.find(c => c.routeId === selectedRouteId || c.status === 'running') || campaigns[0]

  const routePolyline = currentRoute?.points?.map(p => [p.lat, p.lng]) || []

  // Add Survey Record
  const handleAddSurvey = async (e) => {
    e.preventDefault()
    if (!surveyForm.houseNumber || !surveyForm.ownerName) return
    try {
      const vol = activeVolunteer || volunteers[0]
      const lat = vol?.currentLocation?.lat || mapCenter.lat
      const lng = vol?.currentLocation?.lng || mapCenter.lng

      const payload = {
        houseNumber: surveyForm.houseNumber,
        ownerName: surveyForm.ownerName,
        routeId: selectedRouteId,
        volunteerId: vol?.id || 'vol_1',
        politicalFeedback: {
          supportStatus: surveyForm.supportStatus,
          keyIssue: surveyForm.keyIssue,
          remarks: surveyForm.remarks,
        },
        location: { lat, lng },
      }

      const res = await api('/api/election-campaign/surveys', {
        method: 'POST',
        body: payload,
        token: authToken,
      })
      
      setSurveys(prev => [res.survey, ...prev])
      setSurveyForm({ ...surveyForm, houseNumber: '', ownerName: '', remarks: '' })
      setNewSurveyModal(false)
    } catch (err) {
      alert(err.message || 'Failed to submit survey')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, appId: 'ailocity-election' })
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem(TOKEN_ELECTION, data.token)
        setAuthToken(data.token)
      } else {
        setLoginError(data.error || 'Login failed')
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem(TOKEN_ELECTION)
  }

  if (!authToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF7A00] to-[#FFB000] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 mb-4">
              <MapPin size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Ailocity Field</h1>
            <p className="text-xs text-slate-400 font-semibold">Sign in to start your campaign survey route</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl text-center font-bold">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" required
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="voter@campaign.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF7A00] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Password</label>
              <input 
                type="password" required
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF7A00] transition-colors"
              />
            </div>
            <button 
              type="submit" disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-2 disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Start Field Work'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 bg-gradient-to-br from-[#FF7A00] to-[#FFB000] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 mb-4 animate-pulse">
        <MapPin size={32} className="text-white" />
      </div>
      <p className="text-slate-400 font-bold animate-pulse text-sm">Loading Field Data...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      
      {/* Top Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/election/dashboard')}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm text-white tracking-tight">Ailocity Field App</h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
              {me?.fullName || 'Field Campaigner'} • Live Telemetry
            </p>
          </div>
        </div>

        {/* Live Simulation Switcher */}
        <button
          onClick={() => setSimulating(s => !s)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
            simulating
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white shadow-orange-500/20'
          }`}
        >
          {simulating ? <Pause size={14} /> : <Play size={14} />}
          <span>{simulating ? 'Live Walking' : 'Start Simulation'}</span>
        </button>
      </header>

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden bg-slate-950">
        
        {/* Tab 1: Live Field Map */}
        {activeTab === 'map' && (
          <div className="w-full h-full relative">
            
            {/* Top Route Selector Bar */}
            <div className="absolute top-3 left-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Navigation size={16} className="text-[#FF7A00] flex-shrink-0" />
                <select
                  value={selectedRouteId}
                  onChange={(e) => {
                    const rId = e.target.value
                    setSelectedRouteId(rId)
                    const route = routes.find(r => r.id === rId)
                    if (route && route.points && route.points.length > 0) {
                      setMapCenter({ lat: route.points[0].lat, lng: route.points[0].lng, zoom: 16 })
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 w-full focus:outline-none focus:border-[#FF7A00]"
                >
                  {routes.length === 0 && (
                    <option value="" disabled className="bg-slate-900 text-slate-400">No active routes available</option>
                  )}
                  {routes.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.name} ({r.distanceKm || '1.2'} km)</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (activeVolunteer?.currentLocation?.lat) {
                    setMapCenter({ lat: activeVolunteer.currentLocation.lat, lng: activeVolunteer.currentLocation.lng, zoom: 17 })
                  }
                }}
                className="p-2 rounded-xl bg-orange-500/10 border border-[#FF7A00]/30 text-[#FF7A00] hover:bg-orange-500/20 transition-all flex-shrink-0"
                title="Focus Camera on Active Volunteer"
              >
                <Compass size={16} />
              </button>
            </div>

            {/* Leaflet Live Map Engine */}
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={mapCenter.zoom}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              <MapRecenter center={mapCenter} zoom={mapCenter.zoom} />

              {/* Route Vectors */}
              {routePolyline.length > 0 && (
                <>
                  <Polyline
                    positions={routePolyline}
                    pathOptions={{ color: '#FF7A00', weight: 4, opacity: 0.8, dashArray: '6, 6' }}
                  />
                  <Marker position={routePolyline[0]} icon={createStartIcon(true)} />
                  <Marker position={routePolyline[routePolyline.length - 1]} icon={createEndIcon(true)} />
                  {routePolyline.slice(1, -1).map((pos, idx) => (
                    <Marker key={idx} position={pos} icon={createStopIcon(true)} />
                  ))}
                </>
              )}

              {/* Walked Path */}
              {activeVolunteer?.locationHistory && activeVolunteer.locationHistory.length > 0 && (
                <Polyline
                  positions={activeVolunteer.locationHistory.map(p => [p.lat, p.lng])}
                  pathOptions={{ color: '#0ea5e9', weight: 4, dashArray: '8, 8', opacity: 0.9 }}
                />
              )}

              {/* Volunteer Position Marker */}
              {activeVolunteer?.currentLocation?.lat && (
                <Marker
                  position={[activeVolunteer.currentLocation.lat, activeVolunteer.currentLocation.lng]}
                  icon={createPulsingMarker(activeVolunteer.name, true)}
                >
                  <Popup className="dark-popup">
                    <div className="text-xs font-bold p-1 text-slate-200 bg-slate-950">
                      <p className="text-[#FF7A00] font-black">{activeVolunteer.name}</p>
                      <p className="text-slate-400">Assigned Route: {currentRoute?.name || 'Active Street'}</p>
                      <p className="text-slate-500 text-[10px] mt-1">Battery: {activeVolunteer.batteryLevel || 85}% • Signal: {activeVolunteer.signalStrength || 'Good'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Surveys */}
              {surveys.map(s => {
                if (!s.gpsLocation || s.gpsLocation.lat === undefined) return null
                return (
                  <Marker
                    key={s.id}
                    position={[s.gpsLocation.lat, s.gpsLocation.lng]}
                    icon={createSurveyMarker(s.politicalFeedback?.supportStatus, true)}
                  >
                    <Popup className="dark-popup">
                      <div className="p-2 space-y-1 text-xs min-w-[160px] text-slate-200">
                        <p className="font-bold border-b pb-1 border-slate-700">🏠 House: {s.houseNumber}</p>
                        <p><strong>Head:</strong> {s.familyDetails?.headName || s.ownerName}</p>
                        <p><strong>Status:</strong> {s.politicalFeedback?.supportStatus}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Houses */}
              {houses.map(h => {
                if (h.lat === undefined || h.lng === undefined) return null
                let isAssigned = false
                if (currentRoute && Array.isArray(currentRoute.houseIds) && currentRoute.houseIds.includes(h.id)) {
                  isAssigned = true
                }
                return (
                  <Marker
                    key={h.id}
                    position={[Number(h.lat), Number(h.lng)]}
                    icon={createHouseMarker(true, isAssigned)}
                  >
                    <Popup className="dark-popup">
                      <div className="p-2 space-y-1 text-xs min-w-[160px] text-slate-200">
                        <p className="font-extrabold border-b pb-1 border-slate-700">🏠 House: {h.houseNumber}</p>
                        <p><strong>Owner:</strong> {h.ownerName || '—'}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-36 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl text-[11px] space-y-2 max-w-[180px] sm:max-w-[200px] pointer-events-auto text-slate-200">
              <h4 className="font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Info size={11} className="text-[#FF7A00]" /> Map Legend
              </h4>
              <div className="space-y-1.5 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 border-t border-dashed border-[#FF7A00]" style={{ borderTopWidth: '2px' }} />
                  <span>Planned Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-slate-500/30 border border-slate-400 flex items-center justify-center text-[8px]">🏠</span>
                  <span>Household Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 border-t border-dashed border-[#0ea5e9]" style={{ borderTopWidth: '2px' }} />
                  <span>Walked Path</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10b981] border border-white inline-block shadow-sm" />
                  <span>🟢 Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-white inline-block shadow-sm" />
                  <span>🔴 End Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00]" />
                  <span>Volunteer Position</span>
                </div>
                <div className="border-t border-slate-700/50 pt-1.5 mt-1 space-y-1 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span>🟢 Supporter House</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span>🔴 Opponent House</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span>🟡 Neutral House</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    <span>🔵 Undecided House</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Live Telemetry Panel */}
            <div className="absolute bottom-4 left-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 text-[#FF7A00] font-black text-xs flex items-center justify-center">
                    {activeVolunteer?.name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">{activeVolunteer?.name || 'Volunteer On-Ground'}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Target: {currentRoute?.name || 'Assigned Walk Route'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi size={12} /> {activeVolunteer?.signalStrength || '4G Good'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Battery size={12} /> {activeVolunteer?.batteryLevel || 88}%
                  </span>
                </div>
              </div>

              {/* Progress Counters */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-center text-[10px]">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <p className="text-slate-500 font-semibold uppercase">Households</p>
                  <p className="text-sm font-black text-white">{surveys.length} / {currentRoute?.householdCount || 45}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <p className="text-emerald-500 font-semibold uppercase">Supporters</p>
                  <p className="text-sm font-black text-emerald-400">
                    {surveys.filter(s => s.politicalFeedback?.supportStatus === 'Supporter').length}
                  </p>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <p className="text-blue-500 font-semibold uppercase">Status</p>
                  <p className="text-sm font-black text-blue-400">{simulating ? 'WALKING' : 'IDLE'}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: D2D Campaign Overview */}
        {activeTab === 'campaign' && (
          <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-orange-500/20 text-[#FF7A00] border border-[#FF7A00]/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Active Campaign
                </span>
                <span className="text-xs font-bold text-slate-400">{activeCampaign?.title || 'D2D Outreach'}</span>
              </div>
              <h2 className="text-base font-black text-white">{activeCampaign?.title || 'Main Constituency D2D Campaign'}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeCampaign?.description || 'Door to door voter outreach and survey tracking.'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <p className="text-slate-500 font-medium">Assigned Volunteer</p>
                  <p className="font-bold text-slate-200 mt-0.5">{activeCampaign?.volunteerName || activeVolunteer?.name || 'Rahul Verma'}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <p className="text-slate-500 font-medium">Selected Route</p>
                  <p className="font-bold text-slate-200 mt-0.5">{activeCampaign?.routeName || currentRoute?.name || 'Ward 14 Street'}</p>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setNewSurveyModal(true)}
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FFB000] hover:brightness-110 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Plus size={16} />
              <span>Record Live Household Survey</span>
            </button>
          </div>
        )}

        {/* Tab 3: Surveys & Telemetry Feed */}
        {activeTab === 'surveys' && (
          <div className="p-4 space-y-3 h-full overflow-y-auto pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-[#FF7A00]" />
                Live Survey Feed ({surveys.length})
              </h2>
              <button
                onClick={() => setNewSurveyModal(true)}
                className="bg-orange-500/10 text-[#FF7A00] border border-[#FF7A00]/30 px-3 py-1 rounded-xl text-xs font-bold"
              >
                + New
              </button>
            </div>

            {surveys.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-850 rounded-2xl">
                <ClipboardList size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-bold">No surveys logged yet</p>
                <p className="text-[10px] text-slate-500 mt-1">Start simulation or record a new survey</p>
              </div>
            ) : (
              surveys.map((s, idx) => (
                <div key={s.id || idx} className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">House #{s.houseNumber || 'H-102'}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      s.politicalFeedback?.supportStatus === 'Supporter' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      s.politicalFeedback?.supportStatus === 'Neutral' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {s.politicalFeedback?.supportStatus || 'Supporter'}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium">Owner: {s.ownerName || 'Voter Resident'}</p>
                  {s.politicalFeedback?.keyIssue && (
                    <p className="text-[10px] text-slate-400">Issue: {s.politicalFeedback.keyIssue}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Profile / Account */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4 h-full overflow-y-auto pb-20">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFB000] text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
                {me?.fullName?.charAt(0) || 'S'}
              </div>
              <div>
                <h2 className="text-base font-black text-white">{me?.fullName || 'Field Campaign User'}</h2>
                <p className="text-xs text-slate-400 font-semibold">{me?.email || 'user@ailocity.com'}</p>
              </div>
              <span className="inline-block bg-orange-500/20 text-[#FF7A00] border border-[#FF7A00]/30 text-[10px] font-black px-3 py-1 rounded-full">
                Active Field Operator
              </span>
            </div>

            <button
              onClick={() => navigate('/election/dashboard')}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              Switch to Full Admin Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4"
            >
              Log Out
            </button>
          </div>
        )}

      </main>

      {/* Record New Survey Modal */}
      {newSurveyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-black text-white text-sm">Record Household Survey</h3>
            <form onSubmit={handleAddSurvey} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">House Number</label>
                <input
                  type="text"
                  required
                  value={surveyForm.houseNumber}
                  onChange={(e) => setSurveyForm({ ...surveyForm, houseNumber: e.target.value })}
                  placeholder="e.g. H-405"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Resident Owner Name</label>
                <input
                  type="text"
                  required
                  value={surveyForm.ownerName}
                  onChange={(e) => setSurveyForm({ ...surveyForm, ownerName: e.target.value })}
                  placeholder="e.g. Ram Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Political Support Status</label>
                <select
                  value={surveyForm.supportStatus}
                  onChange={(e) => setSurveyForm({ ...surveyForm, supportStatus: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value="Supporter">🟢 Supporter</option>
                  <option value="Neutral">🟡 Neutral</option>
                  <option value="Undecided">🔵 Undecided</option>
                  <option value="Opponent">🔴 Opponent</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewSurveyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white font-black shadow-md"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Native Mobile Navigation Bar */}
      <nav className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 flex-shrink-0 z-30">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'map' ? 'text-[#FF7A00] font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <MapPin size={20} />
          <span className="text-[10px]">Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('campaign')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'campaign' ? 'text-[#FF7A00] font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <ClipboardList size={20} />
          <span className="text-[10px]">Campaign</span>
        </button>

        <button
          onClick={() => setActiveTab('surveys')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'surveys' ? 'text-[#FF7A00] font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <Activity size={20} />
          <span className="text-[10px]">Live Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-[#FF7A00] font-black' : 'text-slate-500 font-semibold'
          }`}
        >
          <User size={20} />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

    </div>
  )
}
