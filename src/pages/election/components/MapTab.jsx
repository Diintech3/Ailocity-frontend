import { useState, useEffect, useCallback, useRef } from 'react'
import { Map, Users, Navigation, Shield, Compass, Plus, Play, Pause, Activity, Filter, MapPin, User, Check, ListFilter, HelpCircle, Phone, X, CheckCircle2, RefreshCw, Wifi, Eye, EyeOff, Search, Info } from 'lucide-react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../../lib/api'
import 'leaflet/dist/leaflet.css'

// Pulsing Volunteer Avatar Icon (Responsive to Dark/Light mode)
const createPulsingMarker = (name, isDarkMode, color = '#FF7A00') => {
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

// Colored Marker for Route Stops (Responsive to Dark/Light mode)
const createStopIcon = (isDarkMode) => {
  const centerBg = isDarkMode ? '#1e293b' : '#ffffff'
  const shadow = isDarkMode ? 'box-shadow: 0 0 6px #FF5500aa;' : 'box-shadow: 0 2px 4px rgba(0,0,0,0.25);'
  return L.divIcon({
    html: `<div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${centerBg}; border: 3px solid #FF5500; ${shadow}"></div>`,
    className: 'route-stop-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

// Custom Div Icon for Survey logs plotted on Map (High Contrast pins)
const createSurveyMarker = (status, isDarkMode) => {
  let color = '#FF7A00'
  let label = '?'
  if (status === 'Supporter') {
    color = '#10b981'
    label = '✔'
  } else if (status === 'Neutral') {
    color = '#f59e0b'
    label = '⚬'
  } else if (status === 'Undecided') {
    color = '#3b82f6'
    label = '?'
  } else if (status === 'Opponent') {
    color = '#ef4444'
    label = '✖'
  }

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

// Leaflet Map viewport and camera controller
function MapController({ selectedVol, followMode, routes, fitBoundsTrigger }) {
  const map = useMap()

  // Follow selected volunteer
  useEffect(() => {
    if (!map || !selectedVol || !followMode) return
    const loc = selectedVol.lastKnownLocation
    if (loc && loc.lat && loc.lng) {
      map.setView([loc.lat, loc.lng], map.getZoom())
    }
  }, [map, selectedVol, followMode])

  // Center/fit map to routes and volunteers bounds
  useEffect(() => {
    if (!map || fitBoundsTrigger === 0) return
    const coords = []
    routes.forEach(r => {
      if (r.points && r.points.length > 0) {
        r.points.forEach(p => coords.push([p.lat, p.lng]))
      }
    })
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40] })
    }
  }, [map, fitBoundsTrigger, routes])

  return null
}

export default function MapTab({ token, mode: dashboardMode }) {
  const [volunteers, setVolunteers] = useState([])
  const [routes, setRoutes] = useState([])
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(true)
  const [selectedVol, setSelectedVol] = useState(null)
  
  // Real-time telemetry config & Theme mode
  const [isDarkMode, setIsDarkMode] = useState(true) // Defaults to Operations Dark Mode
  const [liveTracking, setLiveTracking] = useState(true)
  const [pollingInterval, setPollingInterval] = useState(5000) // Default 5 seconds
  const [followMode, setFollowMode] = useState(false)
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sidebar Tabs & Filters
  const [sidebarTab, setSidebarTab] = useState('volunteers') // 'volunteers' | 'surveys'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSupport, setFilterSupport] = useState('all')
  const [filterIssue, setFilterIssue] = useState('all')

  // Simulator settings
  const [simSpeed, setSimSpeed] = useState(4500) // Telemetry speed in ms
  const [surveyRate, setSurveyRate] = useState(0.4) // Probability of auto-generating survey per step
  const [showSimControls, setShowSimControls] = useState(true)

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
      setIsRefreshing(true)
      const [volRes, rteRes, srvRes] = await Promise.all([
        api(`/api/election-campaign/volunteers?mode=${dashboardMode}`, { token }),
        api(`/api/election-campaign/routes?mode=${dashboardMode}`, { token }),
        api(`/api/election-campaign/surveys?mode=${dashboardMode}`, { token })
      ])
      setVolunteers(volRes.volunteers || [])
      setRoutes(rteRes.routes || [])
      setSurveys(srvRes.surveys || [])
    } catch (err) {
      console.error('Failed to load tracking details:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [token, dashboardMode])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sync selected volunteer location details when volunteers list updates
  useEffect(() => {
    if (!selectedVol) return
    const latest = volunteers.find(v => v.id === selectedVol.id)
    if (latest) {
      setSelectedVol(latest)
    }
  }, [volunteers, selectedVol])

  // Simulation walking engine: moves volunteers in simulator mode
  useEffect(() => {
    if (dashboardMode !== 'simulator' || !simulating) return
    const interval = setInterval(async () => {
      try {
        // 1. Move volunteers
        await api('/api/election-campaign/volunteers/mock-locations', { method: 'POST', token })
        
        // 2. Generate random surveys
        const activeVols = volunteers.filter(v => v.status === 'active' && v.assignedRouteId)
        if (activeVols.length > 0 && Math.random() < surveyRate) {
          const luckyVol = activeVols[Math.floor(Math.random() * activeVols.length)]
          const targetRoute = routes.find(r => r.id === luckyVol.assignedRouteId)
          if (targetRoute) {
            const feedSts = ['Supporter', 'Neutral', 'Undecided', 'Opponent']
            const feedIss = ['Road', 'Water', 'Electricity', 'Employment', 'Health', 'Education', 'Other']
            const randomSts = feedSts[Math.floor(Math.random() * feedSts.length)]
            const randomIss = feedIss[Math.floor(Math.random() * feedIss.length)]
            
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
                gpsLocation: luckyVol.lastKnownLocation || { lat: 26.8467, lng: 80.9462 },
                isSimulated: true
              }
            })
          }
        }
        await loadData()
      } catch (err) {
        console.error('Simulation step error:', err)
      }
    }, simSpeed)
    
    return () => clearInterval(interval)
  }, [simulating, volunteers, routes, token, loadData, dashboardMode, simSpeed, surveyRate])

  // Live telemetry polling for normal mode
  useEffect(() => {
    if (!liveTracking) return
    if (dashboardMode === 'simulator' && simulating) return // Skip if simulator interval is already firing

    const interval = setInterval(() => {
      loadData()
    }, pollingInterval)
    return () => clearInterval(interval)
  }, [liveTracking, pollingInterval, dashboardMode, simulating, loadData])

  // Setup initial mock seeds
  const handleSetupMockData = async () => {
    try {
      setLoading(true)
      
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
          ],
          isSimulated: true
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
          ],
          isSimulated: true
        }
      })
      
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
          lastKnownLocation: { lat: 26.8520, lng: 80.9120, index: 0, direction: 1, battery: 98, signal: 'excellent', updatedAt: new Date().toISOString() },
          isSimulated: true
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
          lastKnownLocation: { lat: 26.8467, lng: 80.9462, index: 0, direction: 1, battery: 89, signal: 'good', updatedAt: new Date().toISOString() },
          isSimulated: true
        }
      })
      
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

  const handleClearSimulatorData = async () => {
    if (!confirm('Are you sure you want to delete all simulated routes, volunteers, and survey logs?')) return
    try {
      setLoading(true)
      setSelectedVol(null)
      setFollowMode(false)
      await api('/api/election-campaign/simulation/clear', { method: 'POST', token })
      setSuccess('Simulated telemetry database successfully purged!')
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to clear simulated data')
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
    
    const matchingRoute = routes.find(r => r.id === surveyForm.routeId)
    const mockLoc = matchingRoute?.points?.[0] || { lat: 26.8467, lng: 80.9462 }
    
    try {
      await api('/api/election-campaign/surveys', {
        method: 'POST',
        token,
        body: {
          ...surveyForm,
          gpsLocation: mockLoc,
          isSimulated: dashboardMode === 'simulator'
        }
      })
      
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

  // Filtering list data
  const filteredSurveys = surveys.filter(s => {
    const stsMatch = filterSupport === 'all' || s.politicalFeedback?.supportStatus === filterSupport
    const issMatch = filterIssue === 'all' || s.politicalFeedback?.keyIssue === filterIssue
    return stsMatch && issMatch
  })

  const filteredVolunteers = volunteers.filter(v => {
    return v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           v.politicalParty.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Get signal text color
  const getSignalColorClass = (strength) => {
    if (strength === 'excellent') return isDarkMode ? 'text-emerald-400' : 'text-emerald-600 font-bold'
    if (strength === 'good') return isDarkMode ? 'text-emerald-500' : 'text-emerald-700 font-bold'
    if (strength === 'fair') return isDarkMode ? 'text-amber-400' : 'text-amber-600 font-bold'
    return isDarkMode ? 'text-red-400' : 'text-red-600 font-bold'
  }

  // Get battery level text color
  const getBatteryColorClass = (level) => {
    if (level > 50) return isDarkMode ? 'text-emerald-400' : 'text-emerald-600 font-bold'
    if (level > 20) return isDarkMode ? 'text-amber-400' : 'text-amber-600 font-bold'
    return 'text-red-400 animate-pulse font-black'
  }

  // Dynamic style bindings depending on Theme State
  const wrapperClass = isDarkMode 
    ? "space-y-6 bg-slate-950 p-6 rounded-3xl border border-slate-900 text-slate-100 shadow-2xl transition-all duration-300"
    : "space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-slate-800 shadow-xl transition-all duration-300"

  const controlBarClass = isDarkMode
    ? "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg text-slate-100 transition-all duration-300"
    : "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-md text-slate-800 transition-all duration-300"

  const sidebarClass = isDarkMode
    ? "xl:col-span-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-850 shadow-2xl p-4 overflow-hidden h-full min-h-0 text-slate-100 transition-all duration-300"
    : "xl:col-span-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-lg p-4 overflow-hidden h-full min-h-0 text-slate-800 transition-all duration-300"

  const tabBtnClass = (active) => active
    ? "flex-1 py-2 text-xs font-bold rounded-xl border transition-all " + (isDarkMode ? "bg-orange-500/10 text-[#FF7A00] border-[#FF7A00]/30" : "bg-orange-50 text-[#FF7A00] border-orange-200")
    : "flex-1 py-2 text-xs font-bold rounded-xl border border-transparent transition-all " + (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700")

  const volCardClass = (selected) => selected
    ? "border rounded-xl p-3.5 cursor-pointer transition-all " + (isDarkMode ? "bg-orange-500/10 border-[#FF7A00] shadow-md shadow-orange-500/5" : "bg-orange-50/50 border-[#FF7A00] shadow-sm")
    : "border rounded-xl p-3.5 cursor-pointer transition-all " + (isDarkMode ? "bg-slate-950/40 border-slate-850 hover:bg-slate-900/60" : "bg-white border-slate-200/80 hover:bg-slate-50")

  const searchInputClass = isDarkMode
    ? "w-full bg-slate-950 border border-slate-800 focus:border-[#FF7A00] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
    : "w-full bg-slate-50 border border-slate-200 focus:border-[#FF7A00] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 placeholder-slate-400 focus:outline-none transition-all"

  const surveySelectClass = isDarkMode
    ? "w-full border border-slate-800 bg-slate-950 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7A00]"
    : "w-full border border-slate-200 bg-white text-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7A00]"

  const surveyCardClass = isDarkMode
    ? "border border-slate-850 rounded-xl p-3.5 bg-slate-950/30 hover:bg-slate-900 hover:border-slate-800 transition-all duration-200 text-xs relative overflow-hidden"
    : "border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all duration-200 text-xs relative overflow-hidden"

  const legendClass = isDarkMode
    ? "absolute bottom-5 right-5 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl text-[11px] space-y-2 max-w-[200px] pointer-events-auto text-slate-200 transition-colors duration-300"
    : "absolute bottom-5 right-5 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-250 p-3.5 rounded-2xl shadow-xl text-[11px] space-y-2 max-w-[200px] pointer-events-auto text-slate-700 transition-colors duration-300"

  const pollClass = isDarkMode
    ? "flex items-center gap-2.5 bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl text-xs font-bold"
    : "flex items-center gap-2.5 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700"

  const btnSecondaryClass = isDarkMode
    ? "bg-slate-950 text-[#FF7A00] border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-850 hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
    : "bg-white text-[#FF7A00] border border-orange-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-50 transition-all flex items-center gap-1.5 shadow-sm"

  const mapFrameClass = isDarkMode
    ? "xl:col-span-3 bg-slate-900 rounded-2xl border border-slate-850 overflow-hidden shadow-2xl relative h-full transition-colors duration-300"
    : "xl:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md relative h-full transition-colors duration-300"

  const controlThemePanelClass = isDarkMode
    ? "flex items-center p-0.5 rounded-xl border bg-slate-950 border-slate-800"
    : "flex items-center p-0.5 rounded-xl border bg-slate-100 border-slate-200/80"

  const selectBgClass = isDarkMode ? "bg-slate-950 text-slate-200" : "bg-white text-slate-800"

  return (
    <div className={wrapperClass}>
      <style>{`
        /* Leaflet Dark Popup Overrides */
        .dark-popup .leaflet-popup-content-wrapper {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          font-family: inherit !important;
        }
        .dark-popup .leaflet-popup-tip {
          background-color: #0f172a !important;
        }
        .dark-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
        .dark-popup .leaflet-popup-close-button:hover {
          color: #f1f5f9 !important;
        }
        
        /* Scrollbar override for clean dark lists */
        .dark-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .dark-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 9999px;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
      
      {success && (
        <div className={isDarkMode ? "bg-emerald-950/60 border border-emerald-800 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-300 text-sm font-medium" : "bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-800 text-sm font-medium"}>
          <CheckCircle2 size={18} className={isDarkMode ? "text-emerald-400 flex-shrink-0" : "text-emerald-500 flex-shrink-0"} />
          {success}
        </div>
      )}
      {error && (
        <div className={isDarkMode ? "bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2 text-red-300 text-sm" : "bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm"}>
          <AlertCircle size={18} className={isDarkMode ? "text-red-400 flex-shrink-0" : "text-red-500 flex-shrink-0"} />
          {error}
        </div>
      )}

      {/* Control bar */}
      <div className={controlBarClass}>
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Activity size={18} className={`text-[#FF7A00] ${(dashboardMode === 'simulator' && simulating) || liveTracking ? 'animate-pulse' : 'opacity-70'}`} />
            {dashboardMode === 'simulator' ? 'Live Telemetry Map & Survey Simulator' : 'Live Tracking Map & Survey Stream'}
          </h3>
          <p className={`text-xs font-semibold mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {dashboardMode === 'simulator'
              ? 'Track simulated volunteers live on a premium map canvas and monitor device telemetry.'
              : 'Monitor real active campaign volunteers on the map and stream field surveys.'}
          </p>
        </div>

        {/* Telemetry and Controls integration */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Operations Theme Selector (Toggle theme mode) */}
          <div className={controlThemePanelClass}>
            <button
              type="button"
              onClick={() => setIsDarkMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isDarkMode 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ☀️ Light Map
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌙 Dark Map
            </button>
          </div>

          {/* Polling / Live controls */}
          <div className={pollClass}>
            <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Live Updates:</span>
            <button
              onClick={() => setLiveTracking(!liveTracking)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors focus:outline-none relative flex items-center ${liveTracking ? 'bg-[#FF7A00]' : 'bg-slate-700'}`}
              title="Toggle Live Polling"
            >
              <span className={`w-3 h-3 rounded-full bg-white transition-transform ${liveTracking ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>

            {liveTracking && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mx-0.5" />
                <select
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className={`bg-transparent text-[#FF7A00] font-black focus:outline-none border-none py-0 pl-1 cursor-pointer ${selectBgClass}`}
                >
                  <option value={2000} className={selectBgClass}>2s</option>
                  <option value={5000} className={selectBgClass}>5s</option>
                  <option value={10000} className={selectBgClass}>10s</option>
                  <option value={30000} className={selectBgClass}>30s</option>
                </select>
              </>
            )}

            <button
              onClick={loadData}
              disabled={isRefreshing}
              className={`ml-1 text-slate-400 hover:text-[#FF7A00] transition-colors focus:outline-none ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
              title="Force Refresh Data"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <button
            onClick={() => setFitBoundsTrigger(t => t + 1)}
            className={btnSecondaryClass}
            title="Recenter camera to show all routes"
          >
            <Compass size={13} className="text-[#FF7A00]" />
            Fit Map Bounds
          </button>

          {dashboardMode === 'simulator' && routes.length === 0 && (
            <button
              onClick={handleSetupMockData}
              className={isDarkMode ? "bg-orange-500/10 text-[#FF7A00] border border-[#FF7A00]/30 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-500/20 transition-all" : "bg-orange-50 text-[#FF7A00] border border-orange-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all"}
            >
              🚀 Setup Seeds
            </button>
          )}

          {dashboardMode === 'simulator' && (
            <button
              onClick={() => setSimulating(p => !p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                simulating ? 'bg-[#FF7A00] text-white hover:bg-[#e06e00]' : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-750 hover:bg-slate-300')
              }`}
            >
              {simulating ? (
                <>
                  <Pause size={14} /> Pause Walking
                </>
              ) : (
                <>
                  <Play size={14} /> Start Walking
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setSurveyModal(true)}
            className="bg-gradient-to-r from-[#FF7A00] to-[#FFB000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 hover:brightness-110 hover:shadow-lg transition-all"
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
          {/* Main Map View with dynamic vector layers */}
          <div className={mapFrameClass}>
            <MapContainer center={[26.8467, 80.9462]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
              {isDarkMode ? (
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
              ) : (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              )}
              
              {/* Map viewport controller */}
              <MapController 
                selectedVol={selectedVol} 
                followMode={followMode} 
                routes={routes} 
                fitBoundsTrigger={fitBoundsTrigger} 
              />

              {/* Draw Route Polylines (styled based on dark mode) */}
              {routes.map(r => (
                r.points && r.points.length > 0 && (
                  <div key={r.id}>
                    <Polyline
                      positions={r.points.map(p => [p.lat, p.lng])}
                      color={isDarkMode ? "#0f172a" : "#ffffff"}
                      weight={8}
                      opacity={0.8}
                    />
                    <Polyline
                      positions={r.points.map(p => [p.lat, p.lng])}
                      color="#FF5500"
                      weight={4}
                      opacity={0.9}
                    />
                    {r.points.map((p, stopIdx) => (
                      <Marker key={stopIdx} position={[p.lat, p.lng]} icon={createStopIcon(isDarkMode)} />
                    ))}
                  </div>
                )
              ))}

              {/* Plotted Walked Telemetry Path (Electric Cyan vs Dark Blue) */}
              {selectedVol && selectedVol.locationHistory && selectedVol.locationHistory.length > 0 && (
                <Polyline
                  positions={selectedVol.locationHistory.map(h => [h.lat, h.lng])}
                  color={isDarkMode ? "#00d2ff" : "#0284c7"}
                  weight={3}
                  dashArray="5, 8"
                  opacity={0.9}
                />
              )}

              {/* Plotted Live Volunteers */}
              {volunteers.map(v => (
                v.status === 'active' && v.lastKnownLocation && (
                  <Marker
                    key={v.id}
                    position={[v.lastKnownLocation.lat, v.lastKnownLocation.lng]}
                    icon={createPulsingMarker(v.name, isDarkMode, selectedVol?.id === v.id ? (isDarkMode ? '#00d2ff' : '#0284c7') : '#FF7A00')}
                  >
                    <Popup className={isDarkMode ? 'dark-popup' : ''}>
                      <div className={`p-2 space-y-1.5 text-xs min-w-[160px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        <p className="font-bold border-b pb-1 flex items-center justify-between gap-2 border-slate-700">
                          <span className="flex items-center gap-1 font-extrabold text-sm">
                            <User size={12} className="text-[#FF7A00]" /> {v.name}
                          </span>
                          {v.isSimulated && (
                            <span className="text-[9px] bg-orange-500/20 text-[#FF7A00] font-bold px-1.5 py-0.5 rounded border border-[#FF7A00]/20">MOCK</span>
                          )}
                        </p>
                        <p><strong>ID:</strong> {v.id}</p>
                        <p><strong>Party:</strong> {v.politicalParty}</p>
                        <p><strong>Route:</strong> {routes.find(r => r.id === v.assignedRouteId)?.name || 'None'}</p>
                        
                        {/* Live telemetry metadata inside popup */}
                        <div className={`flex justify-between items-center border p-1.5 rounded-lg mt-1 text-[10px] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={getBatteryColorClass(v.lastKnownLocation.battery)}>
                            🔋 {v.lastKnownLocation.battery || 100}%
                          </span>
                          <span className={getSignalColorClass(v.lastKnownLocation.signal)}>
                            📶 {v.lastKnownLocation.signal || 'excellent'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 pt-1 text-center font-medium">Updated: {new Date(v.lastKnownLocation.updatedAt || v.updatedAt).toLocaleTimeString()}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}

              {/* Plotted D2D Survey Logs on Map */}
              {surveys.map(s => {
                if (!s.gpsLocation || s.gpsLocation.lat === undefined) return null
                return (
                  <Marker
                    key={s.id}
                    position={[s.gpsLocation.lat, s.gpsLocation.lng]}
                    icon={createSurveyMarker(s.politicalFeedback?.supportStatus, isDarkMode)}
                  >
                    <Popup className={isDarkMode ? 'dark-popup' : ''}>
                      <div className={`p-2 space-y-1 text-xs min-w-[180px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        <p className="font-bold border-b pb-1 flex items-center justify-between border-slate-700">
                          <span className="font-bold">🏠 House: {s.houseNumber || 'H-N/A'}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold" style={{ backgroundColor: getStatusColor(s.politicalFeedback?.supportStatus) + '20', color: getStatusColor(s.politicalFeedback?.supportStatus) }}>
                            {s.politicalFeedback?.supportStatus || 'Neutral'}
                          </span>
                        </p>
                        <p><strong>Family Head:</strong> {s.familyDetails?.headName}</p>
                        <p><strong>Total Voters:</strong> {s.familyDetails?.totalVoters || 0}</p>
                        <p><strong>Key Issue:</strong> {s.politicalFeedback?.keyIssue || 'None'}</p>
                        {s.remarks && <p className={`italic mt-1 p-1.5 rounded border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>"{s.remarks}"</p>}
                        <div className="text-[9px] text-slate-400 border-t border-slate-700 pt-1 mt-1 flex justify-between font-medium">
                          <span>👤 Vol: {s.autoCaptured?.volunteerName || 'Manual'}</span>
                          <span>{new Date(s.proof?.visitTime || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>

            {/* Dynamic Map Legend Overlay */}
            <div className={legendClass}>
              <h4 className="font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                <Info size={11} className="text-[#FF7A00]" /> Map Legend
              </h4>
              <div className="space-y-1.5 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 bg-[#FF5500] rounded" />
                  <span>Planned Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 border-t border-dashed" style={{ borderTopWidth: '2px', borderTopColor: isDarkMode ? "#00d2ff" : "#0284c7" }} />
                  <span>Walked Path</span>
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
          </div>

          {/* Interactive Navigation Panel (Sidebar tab controls) */}
          <div className={sidebarClass}>
            
            {/* Sidebar sub-tab buttons */}
            <div className={`flex border-b pb-3 gap-1 flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setSidebarTab('volunteers')}
                className={tabBtnClass(sidebarTab === 'volunteers')}
              >
                👥 Volunteers ({volunteers.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('surveys')}
                className={tabBtnClass(sidebarTab === 'surveys')}
              >
                📋 Visit Feed ({filteredSurveys.length})
              </button>
            </div>

            {/* TAB 1: VOLUNTEERS STREAM LISTING */}
            {sidebarTab === 'volunteers' && (
              <div className="flex-1 flex flex-col min-h-0 pt-3">
                {/* Simulator Control Center (Only shown in Simulator Mode) */}
                {dashboardMode === 'simulator' && (
                  <div className={`border rounded-xl p-3 mb-3 space-y-3 flex-shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
                    <button
                      type="button"
                      onClick={() => setShowSimControls(!showSimControls)}
                      className={`flex items-center justify-between w-full text-left font-extrabold text-xs uppercase tracking-wider focus:outline-none ${isDarkMode ? 'text-orange-400' : 'text-[#FF7A00]'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Activity size={14} className="text-orange-500 animate-pulse" />
                        Simulator Engine
                      </span>
                      <span>{showSimControls ? 'Collapse ▲' : 'Expand ▼'}</span>
                    </button>

                    {showSimControls && (
                      <div className={`space-y-2.5 pt-1 text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {/* Speed Selector */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase mb-1 opacity-70">Telemetry Speed</label>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => setSimSpeed(10000)}
                              className={`py-1 rounded text-center transition-all text-[10px] ${
                                simSpeed === 10000 ? 'bg-[#FF7A00] text-white shadow-sm font-bold' : (isDarkMode ? 'bg-slate-900 hover:bg-slate-850 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                              }`}
                            >
                              Slow (10s)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimSpeed(4500)}
                              className={`py-1 rounded text-center transition-all text-[10px] ${
                                simSpeed === 4500 ? 'bg-[#FF7A00] text-white shadow-sm font-bold' : (isDarkMode ? 'bg-slate-900 hover:bg-slate-850 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                              }`}
                            >
                              Norm (4.5s)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimSpeed(2000)}
                              className={`py-1 rounded text-center transition-all text-[10px] ${
                                simSpeed === 2000 ? 'bg-[#FF7A00] text-white shadow-sm font-bold' : (isDarkMode ? 'bg-slate-900 hover:bg-slate-850 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                              }`}
                            >
                              Fast (2s)
                            </button>
                          </div>
                        </div>

                        {/* Survey Generation Rate */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase mb-1 opacity-70">D2D Survey Activity</label>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => setSurveyRate(0.2)}
                              className={`py-1 rounded text-center transition-all text-[10px] ${
                                surveyRate === 0.2 ? 'bg-[#FF7A00] text-white shadow-sm font-bold' : (isDarkMode ? 'bg-slate-900 hover:bg-slate-850 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                              }`}
                            >
                              Low (20%)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSurveyRate(0.5)}
                              className={`py-1 rounded text-center transition-all text-[10px] ${
                                surveyRate === 0.5 ? 'bg-[#FF7A00] text-white shadow-sm font-bold' : (isDarkMode ? 'bg-slate-900 hover:bg-slate-850 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                              }`}
                            >
                              Med (50%)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSurveyRate(0.8)}
                              className={`py-1 rounded text-center transition-all text-[10px] ${
                                surveyRate === 0.8 ? 'bg-[#FF7A00] text-white shadow-sm font-bold' : (isDarkMode ? 'bg-slate-900 hover:bg-slate-850 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                              }`}
                            >
                              High (80%)
                            </button>
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="pt-1.5 grid grid-cols-2 gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={handleClearSimulatorData}
                            className={`py-1.5 px-2 rounded text-center font-bold border transition-colors ${isDarkMode ? 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'}`}
                          >
                            🗑 Clear Sim
                          </button>
                          {routes.length === 0 ? (
                            <button
                              type="button"
                              onClick={handleSetupMockData}
                              className={`py-1.5 px-2 rounded text-center font-bold border transition-colors ${isDarkMode ? 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                            >
                              🌱 Seed Data
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className={`py-1.5 px-2 rounded text-center font-bold border cursor-not-allowed ${isDarkMode ? 'bg-slate-950 text-slate-650 border-slate-850' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                            >
                              ✓ Telemetry On
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Volunteer search box */}
                <div className="relative mb-3 flex-shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search volunteers by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={searchInputClass}
                  />
                </div>

                {/* Volunteers List */}
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1 dark-scrollbar">
                  {filteredVolunteers.length === 0 ? (
                    <div className="text-center py-10">
                      <Users size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-xs text-slate-400 font-semibold">No volunteers match search.</p>
                    </div>
                  ) : (
                    filteredVolunteers.map(v => {
                      const isSelected = selectedVol?.id === v.id
                      const loc = v.lastKnownLocation
                      const routeName = routes.find(r => r.id === v.assignedRouteId)?.name || 'No assigned route'

                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVol(v)
                            if (loc) {
                              setFollowMode(true)
                            }
                          }}
                          className={volCardClass(isSelected)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${v.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                <span className="font-bold text-xs tracking-wide">{v.name}</span>
                              </div>
                              <p className={`text-[10px] font-bold truncate max-w-[150px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{routeName}</p>
                            </div>

                            {/* Signal and battery labels */}
                            {loc && (
                              <div className="flex flex-col items-end gap-1 text-right flex-shrink-0 font-extrabold text-[10px]">
                                <span className={getBatteryColorClass(loc.battery)}>
                                  🔋 {loc.battery}%
                                </span>
                                <span className={`${getSignalColorClass(loc.signal)} uppercase tracking-wider text-[9px]`}>
                                  📶 {loc.signal}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick locate map buttons */}
                          {isSelected && (
                            <div className={`flex items-center justify-between border-t mt-3 pt-2.5 text-[10px] font-bold ${isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                              <span className="text-[9px] text-[#FF7A00] font-black">
                                {loc ? '📡 Live Updates Streaming' : '⚠️ Telemetry Missing'}
                              </span>
                              
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setFollowMode(!followMode)
                                  }}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                                    followMode ? 'bg-[#FF7A00] text-white' : (isDarkMode ? 'bg-slate-850 text-slate-300 hover:bg-slate-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
                                  }`}
                                  title="Toggle Auto Follow Camera Lock"
                                >
                                  {followMode ? <Eye size={11} /> : <EyeOff size={11} />}
                                  <span>{followMode ? 'Following' : 'Lock Cam'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: D2D SURVEY STREAM VISITS */}
            {sidebarTab === 'surveys' && (
              <div className="flex-1 flex flex-col min-h-0 pt-3">
                {/* Filter Controls Header */}
                <div className={`space-y-3 pb-3 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Filter size={14} className="text-orange-500" /> Filter Logs
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">Feedback</label>
                      <select
                        value={filterSupport}
                        onChange={e => setFilterSupport(e.target.value)}
                        className={surveySelectClass}
                      >
                        <option value="all" className={selectBgClass}>All Feedback</option>
                        <option value="Supporter" className={selectBgClass}>Supporter</option>
                        <option value="Neutral" className={selectBgClass}>Neutral</option>
                        <option value="Undecided" className={selectBgClass}>Undecided</option>
                        <option value="Opponent" className={selectBgClass}>Opponent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">Main Issue</label>
                      <select
                        value={filterIssue}
                        onChange={e => setFilterIssue(e.target.value)}
                        className={surveySelectClass}
                      >
                        <option value="all" className={selectBgClass}>All Issues</option>
                        <option value="Road" className={selectBgClass}>Road</option>
                        <option value="Water" className={selectBgClass}>Water</option>
                        <option value="Electricity" className={selectBgClass}>Electricity</option>
                        <option value="Employment" className={selectBgClass}>Employment</option>
                        <option value="Health" className={selectBgClass}>Health</option>
                        <option value="Education" className={selectBgClass}>Education</option>
                        <option value="Other" className={selectBgClass}>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Visit logs feed */}
                <div className="flex-1 overflow-y-auto pt-3 space-y-3 min-h-0 pr-1 dark-scrollbar">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>D2D Live Stream</span>
                    <span className="bg-orange-500/10 border border-[#FF7A00]/20 text-[#FF7A00] px-1.5 py-0.5 rounded text-[10px] font-black">{filteredSurveys.length} visits</span>
                  </div>
                  {filteredSurveys.length === 0 ? (
                    <div className="text-center py-16">
                      <Compass size={32} className="mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-xs text-slate-500 font-semibold">No matching survey responses found.</p>
                    </div>
                  ) : (
                    filteredSurveys.map(s => (
                      <div 
                        key={s.id} 
                        className={surveyCardClass}
                      >
                        {/* Support Indicator Badge left line */}
                        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: getStatusColor(s.politicalFeedback?.supportStatus) }}></div>
                        
                        <div className="pl-1.5 space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-bold">{s.houseNumber || 'H-N/A'} — {s.familyDetails?.headName}</span>
                            <span className="text-[10px] text-slate-450 font-medium">
                              {new Date(s.proof?.visitTime || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className={`grid grid-cols-2 gap-1 text-[10px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <div className="flex items-center gap-1">
                              <span style={{ color: getStatusColor(s.politicalFeedback?.supportStatus) }}>
                                {getStatusEmoji(s.politicalFeedback?.supportStatus)}
                              </span>
                            </div>
                            <div>🔧 Issue: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{s.politicalFeedback?.keyIssue}</strong></div>
                          </div>

                          <div className={`text-[10px] border-t pt-1 flex justify-between items-center font-bold ${isDarkMode ? 'border-slate-850/80 text-slate-500' : 'border-slate-100 text-slate-500'}`}>
                            <span>👤 Vol: {s.autoCaptured?.volunteerName || 'Manual'}</span>
                            <span>👥 Voters: {s.familyDetails?.totalVoters || 0}</span>
                          </div>
                          
                          {s.remarks && (
                            <p className={`text-[10px] border rounded p-1.5 italic truncate ${isDarkMode ? 'bg-slate-950/70 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-650'}`}>
                              "{s.remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Survey Log Dialog */}
      {surveyModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className={isDarkMode ? "w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100" : "w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-slate-850"}>
            <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>New Door-to-Door (D2D) Visit Log</h3>
              <button type="button" onClick={() => setSurveyModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-450 hover:text-slate-700 hover:bg-slate-100'}`}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSurveySubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 dark-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Route */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select Route</label>
                  <select
                    required
                    value={surveyForm.routeId}
                    onChange={e => setSurveyForm(prev => ({ ...prev, routeId: e.target.value }))}
                    className={surveySelectClass}
                  >
                    <option value="" className={selectBgClass}>Select Route</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id} className={selectBgClass}>{r.name} ({r.ward})</option>
                    ))}
                  </select>
                </div>

                {/* House Number */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>House Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H-42 / G-12"
                    value={surveyForm.houseNumber}
                    onChange={e => setSurveyForm(prev => ({ ...prev, houseNumber: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] ${isDarkMode ? 'border-slate-855 bg-slate-950 text-slate-200 placeholder-slate-650' : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400'}`}
                  />
                </div>

                {/* Head of Family Name */}
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Head of Family Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name of family representative"
                    value={surveyForm.headName}
                    onChange={e => setSurveyForm(prev => ({ ...prev, headName: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] ${isDarkMode ? 'border-slate-855 bg-slate-950 text-slate-200 placeholder-slate-650' : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400'}`}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={surveyForm.mobile}
                    onChange={e => setSurveyForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] ${isDarkMode ? 'border-slate-855 bg-slate-950 text-slate-200 placeholder-slate-650' : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400'}`}
                  />
                </div>

                {/* Total Voters */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Voters in Family</label>
                  <input
                    type="number"
                    min="1"
                    value={surveyForm.totalVoters}
                    onChange={e => setSurveyForm(prev => ({ ...prev, totalVoters: Number(e.target.value) }))}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] ${isDarkMode ? 'border-slate-855 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-800'}`}
                  />
                </div>

                {/* Support Status */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Support Status</label>
                  <select
                    value={surveyForm.supportStatus}
                    onChange={e => setSurveyForm(prev => ({ ...prev, supportStatus: e.target.value }))}
                    className={surveySelectClass}
                  >
                    <option value="Supporter" className={selectBgClass}>🟢 Supporter</option>
                    <option value="Neutral" className={selectBgClass}>🟡 Neutral</option>
                    <option value="Undecided" className={selectBgClass}>🔵 Undecided</option>
                    <option value="Opponent" className={selectBgClass}>🔴 Opponent</option>
                  </select>
                </div>

                {/* Key Issue */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Key Issue</label>
                  <select
                    value={surveyForm.keyIssue}
                    onChange={e => setSurveyForm(prev => ({ ...prev, keyIssue: e.target.value }))}
                    className={surveySelectClass}
                  >
                    <option value="Road" className={selectBgClass}>Road</option>
                    <option value="Water" className={selectBgClass}>Water</option>
                    <option value="Electricity" className={selectBgClass}>Electricity</option>
                    <option value="Employment" className={selectBgClass}>Employment</option>
                    <option value="Health" className={selectBgClass}>Health</option>
                    <option value="Education" className={selectBgClass}>Education</option>
                    <option value="Other" className={selectBgClass}>Other</option>
                  </select>
                </div>

                {/* Follow up toggles */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Candidate Visit Required?</label>
                  <select
                    value={surveyForm.candidateVisitRequired}
                    onChange={e => setSurveyForm(prev => ({ ...prev, candidateVisitRequired: e.target.value }))}
                    className={surveySelectClass}
                  >
                    <option value="No" className={selectBgClass}>No</option>
                    <option value="Yes" className={selectBgClass}>Yes</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Wants WhatsApp Updates?</label>
                  <select
                    value={surveyForm.wantsWhatsappUpdates}
                    onChange={e => setSurveyForm(prev => ({ ...prev, wantsWhatsappUpdates: e.target.value }))}
                    className={surveySelectClass}
                  >
                    <option value="No" className={selectBgClass}>No</option>
                    <option value="Yes" className={selectBgClass}>Yes</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Short Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Any comments, specifics about the visit..."
                    value={surveyForm.remarks}
                    onChange={e => setSurveyForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FF7A00] ${isDarkMode ? 'border-slate-855 bg-slate-950 text-slate-200 placeholder-slate-600' : 'border-slate-200 bg-white text-slate-850 placeholder-slate-400'}`}
                  />
                </div>
              </div>

              <div className={`pt-4 flex justify-end gap-3 flex-shrink-0 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setSurveyModal(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isDarkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
