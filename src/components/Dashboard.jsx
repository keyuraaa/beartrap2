import React, {useEffect, useState, useRef} from 'react'
import ChartsPanel from './ChartsPanel'
import MapView from './MapView'
import AlertsPanel from './AlertsPanel'

const WS_URL = 'ws://localhost:5173'
const API_URL = 'http://localhost:5173/api'

export default function Dashboard(){
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [submittedUrls, setSubmittedUrls] = useState([])
  const [summary, setSummary] = useState({
    active:0, bandwidth_in:0, bandwidth_out:0, total_attacks:0, unique_ips:0, avg_bytes_per_attack:0, uptime: '0s', is_monitoring: true
  })
  const [filters, setFilters] = useState({
    protocol: 'all',
    port: 'all',
    severity: 'all',
    eventType: 'all',
    sslStatus: 'all',
    securityScore: 'all'
  })
  const wsRef = useRef(null)

  useEffect(()=>{
    // fetch initial summary
    const fetchStats = () => {
      fetch(`${API_URL}/stats`)
        .then(r=>r.json())
        .then(data => {
          setSummary(data)
        })
        .catch(()=>{})
    }
    
    fetchStats()
    
    // Fetch submitted URLs
    const fetchUrls = () => {
      fetch(`${API_URL}/submitted-urls`)
        .then(r=>r.json())
        .then(data => {
          setSubmittedUrls(data)
        })
        .catch(()=>{})
    }
    
    fetchUrls()
    
    // Poll stats and URLs every 2 seconds for smoother updates
    const statsInterval = setInterval(fetchStats, 2000)
    const urlsInterval = setInterval(fetchUrls, 5000)

    // connect websocket with smooth event handling
    wsRef.current = new WebSocket(WS_URL)
    wsRef.current.onmessage = (ev)=>{
      try{
        const data = JSON.parse(ev.data)
        // Handle both attack and traffic events
        if(data.type === 'attack' || data.type === 'traffic'){
          setEvents(prev=>{
            // Prevent duplicates and maintain smooth flow
            const isDuplicate = prev.some(e => 
              e.ts === data.ts && e.src === data.src && e.url === data.url
            )
            if(isDuplicate) return prev
            return [data, ...prev].slice(0,500)
          })
        }
      }catch(e){console.error(e)}
    }
    
    wsRef.current.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
    
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...')
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if(wsRef.current.readyState === WebSocket.CLOSED){
          wsRef.current = new WebSocket(WS_URL)
        }
      }, 3000)
    }
    
    return ()=> {
      clearInterval(statsInterval)
      clearInterval(urlsInterval)
      wsRef.current && wsRef.current.close()
    }
  },[])

  // Apply filters whenever events or filters change
  useEffect(()=>{
    let filtered = events
    
    if(filters.protocol !== 'all'){
      filtered = filtered.filter(e => e.proto === filters.protocol)
    }
    if(filters.port !== 'all'){
      filtered = filtered.filter(e => e.port === parseInt(filters.port))
    }
    if(filters.severity !== 'all'){
      filtered = filtered.filter(e => e.severity === filters.severity)
    }
    if(filters.eventType !== 'all'){
      filtered = filtered.filter(e => e.event_type === filters.eventType)
    }
    if(filters.sslStatus !== 'all'){
      if(filters.sslStatus === 'secure'){
        filtered = filtered.filter(e => e.ssl_info && e.ssl_info.secure)
      } else if(filters.sslStatus === 'insecure'){
        filtered = filtered.filter(e => !e.ssl_info || !e.ssl_info.secure)
      }
    }
    if(filters.securityScore !== 'all'){
      if(filters.securityScore === 'excellent'){
        filtered = filtered.filter(e => e.missing_security_headers === 0)
      } else if(filters.securityScore === 'good'){
        filtered = filtered.filter(e => e.missing_security_headers === 1 || e.missing_security_headers === 2)
      } else if(filters.securityScore === 'poor'){
        filtered = filtered.filter(e => e.missing_security_headers >= 3)
      }
    }
    
    setFilteredEvents(filtered)
  }, [events, filters])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  }

  const clearFilters = () => {
    setFilters({ protocol: 'all', port: 'all', severity: 'all', eventType: 'all', sslStatus: 'all', securityScore: 'all' })
  }

  const startMonitoring = async () => {
    try {
      const response = await fetch(`${API_URL}/start-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success) {
        setSummary(prev => ({ ...prev, is_monitoring: true }))
        console.log('Monitoring started')
      } else {
        alert('Failed to start monitoring')
      }
    } catch(e) {
      console.error('Error starting monitoring:', e)
      alert('Error: Make sure the API server is running on port 5173')
    }
  }

  const stopMonitoring = async () => {
    try {
      const response = await fetch(`${API_URL}/stop-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success) {
        setSummary(prev => ({ ...prev, is_monitoring: false }))
        console.log('Monitoring stopped')
      } else {
        alert('Failed to stop monitoring')
      }
    } catch(e) {
      console.error('Error stopping monitoring:', e)
      alert('Error: Make sure the API server is running on port 5173')
    }
  }

  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear all events and statistics? This cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/clear-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Clear local state
        setEvents([])
        setFilteredEvents([])
        setSummary({
          active:0, bandwidth_in:0, bandwidth_out:0, total_attacks:0, unique_ips:0, avg_bytes_per_attack:0, uptime: '0s', is_monitoring: true
        })
        console.log('All data cleared')
      } else {
        alert('Failed to clear data')
      }
    } catch(e) {
      console.error('Error clearing data:', e)
      alert('Error: Make sure the API server is running on port 5173')
    }
  }

  const removeUrl = async (urlId) => {
    if (!window.confirm('Are you sure you want to stop monitoring this URL?')) {
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/remove-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: urlId })
      })
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state immediately
        setSubmittedUrls(prev => prev.filter(u => u.id !== urlId))
        console.log('URL removed successfully')
      } else {
        console.error('Failed to remove URL:', result)
        alert('Failed to remove URL: ' + (result.error || 'Unknown error'))
      }
    } catch(e) {
      console.error('Error removing URL:', e)
      alert('Error: Make sure the API server is running on port 5173')
    }
  }

  const exportToPDF = () => {
    // Create a printable HTML view
    const printWindow = window.open('', '', 'width=800,height=600')
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>BearTrap Events Report - ${new Date().toLocaleString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #00f6d8; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #00f6d8; color: #071027; }
            .high { color: #ff5252; font-weight: bold; }
            .medium { color: #ffa726; font-weight: bold; }
            .low { color: #66bb6a; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>BearTrap Security Events Report</h1>
          <div class="summary">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Events:</strong> ${filteredEvents.length}</p>
            <p><strong>Total Attacks:</strong> ${summary.total_attacks}</p>
            <p><strong>Unique IPs:</strong> ${summary.unique_ips}</p>
            <p><strong>System Uptime:</strong> ${summary.uptime}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Source IP</th>
                <th>Port</th>
                <th>Protocol</th>
                <th>Severity</th>
                <th>Bytes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(e => `
                <tr>
                  <td>${new Date(e.ts).toLocaleString()}</td>
                  <td>${e.src}</td>
                  <td>${e.port}</td>
                  <td>${e.proto}</td>
                  <td class="${e.severity}">${e.severity}</td>
                  <td>${(e.bytes_in||0)+(e.bytes_out||0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
  }

  // Get unique values for filter options
  const uniqueProtocols = [...new Set(events.map(e => e.proto))].filter(Boolean)
  const uniquePorts = [...new Set(events.map(e => e.port))].filter(Boolean).sort((a,b) => a-b)
  const uniqueSeverities = [...new Set(events.map(e => e.severity))].filter(Boolean)
  const uniqueEventTypes = [...new Set(events.map(e => e.event_type))].filter(Boolean)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-medium">Realtime Overview</h2>
              <div className="mt-2 space-y-2">
                <p className="text-slate-400">
                  Active attacks (last 60s): <span className="text-red-400 font-bold">{summary.active || 0}</span>
                  {summary.is_monitoring !== undefined && (
                    <span className={`ml-3 text-xs px-2 py-1 rounded ${summary.is_monitoring ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {summary.is_monitoring ? '● Monitoring' : '⏸ Paused'}
                    </span>
                  )}
                </p>
                
                {/* Monitoring Controls */}
                <div className="flex gap-2">
                  {summary.is_monitoring ? (
                    <button
                      onClick={stopMonitoring}
                      className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded transition-colors font-medium"
                      title="Pause monitoring"
                    >
                      ⏸️ Pause Monitoring
                    </button>
                  ) : (
                    <button
                      onClick={startMonitoring}
                      className="text-xs px-3 py-1.5 bg-neon/20 text-neon hover:bg-neon/30 rounded transition-colors font-medium"
                      title="Start monitoring"
                    >
                      ▶️ Start Monitoring
                    </button>
                  )}
                  <button
                    onClick={clearAllData}
                    className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors font-medium"
                    title="Clear all events and statistics"
                  >
                    🗑️ Clear Data
                  </button>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div>Total attacks: <strong className="text-red-400">{summary.total_attacks || 0}</strong></div>
              <div>Total events: <strong>{summary.total_events || 0}</strong></div>
              <div>Unique IPs: <strong>{summary.unique_ips}</strong></div>
              <div>Avg bytes/attack: <strong>{summary.avg_bytes_per_attack}</strong></div>
              <div>Uptime: <strong>{summary.uptime}</strong></div>
            </div>
          </div>
          <ChartsPanel events={events} />
        </div>

        <div className="card">
          <h3 className="mb-3">GeoIP World Map</h3>
          <div style={{height: '420px'}} className="w-full rounded">
            <MapView events={events} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <AlertsPanel events={events} />
        
        {/* Currently Monitoring URLs */}
        <div className="card">
          <h3 className="mb-3">Currently Monitoring</h3>
          {submittedUrls.length === 0 ? (
            <p className="text-slate-400 text-sm">No URLs submitted yet</p>
          ) : (
            <div className="space-y-2">
              {submittedUrls.map((item, idx) => (
                <div key={item.id || idx} className="p-2 bg-[#07172c] rounded border border-[#00f6d8]/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#00f6d8] hover:text-[#00d4ba] text-sm break-all"
                      >
                        {item.url}
                      </a>
                      <div className="text-xs text-slate-400 mt-1">
                        Added: {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        Active
                      </span>
                      <button
                        onClick={() => removeUrl(item.id)}
                        className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                        title="Stop monitoring this URL"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="mb-0">Recent Events</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPDF}
                className="text-xs px-3 py-1.5 bg-[#00f6d8] text-[#071027] rounded font-semibold hover:bg-[#00d4ba] transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <span className="text-xs text-slate-400">
                {filteredEvents.length} of {events.length} events
              </span>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="mb-3 p-3 bg-[#07172c] rounded-lg space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400 font-semibold">Filters:</span>
              
              {/* Severity Filter - Most Important First */}
              <select 
                value={filters.severity} 
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="text-xs px-2 py-1 bg-[#071027] border border-[#00f6d8]/30 rounded text-[#cfeff3] cursor-pointer hover:border-[#00f6d8]"
              >
                <option value="all">All Severities</option>
                {uniqueSeverities.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              {/* Event Type Filter */}
              <select 
                value={filters.eventType} 
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="text-xs px-2 py-1 bg-[#071027] border border-[#00f6d8]/30 rounded text-[#cfeff3] cursor-pointer hover:border-[#00f6d8]"
              >
                <option value="all">All Events</option>
                {uniqueEventTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>

              {/* Security Score Filter */}
              <select 
                value={filters.securityScore} 
                onChange={(e) => handleFilterChange('securityScore', e.target.value)}
                className="text-xs px-2 py-1 bg-[#071027] border border-[#00f6d8]/30 rounded text-[#cfeff3] cursor-pointer hover:border-[#00f6d8]"
              >
                <option value="all">All Security Scores</option>
                <option value="excellent">⭐ Excellent (5/5)</option>
                <option value="good">✓ Good (3-4/5)</option>
                <option value="poor">⚠ Poor (0-2/5)</option>
              </select>

              {/* SSL/TLS Filter */}
              <select 
                value={filters.sslStatus} 
                onChange={(e) => handleFilterChange('sslStatus', e.target.value)}
                className="text-xs px-2 py-1 bg-[#071027] border border-[#00f6d8]/30 rounded text-[#cfeff3] cursor-pointer hover:border-[#00f6d8]"
              >
                <option value="all">All SSL Status</option>
                <option value="secure">🔒 Secure (HTTPS)</option>
                <option value="insecure">🔓 Insecure (HTTP)</option>
              </select>

              {/* Protocol Filter */}
              <select 
                value={filters.protocol} 
                onChange={(e) => handleFilterChange('protocol', e.target.value)}
                className="text-xs px-2 py-1 bg-[#071027] border border-[#00f6d8]/30 rounded text-[#cfeff3] cursor-pointer hover:border-[#00f6d8]"
              >
                <option value="all">All Protocols</option>
                {uniqueProtocols.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* Port Filter */}
              <select 
                value={filters.port} 
                onChange={(e) => handleFilterChange('port', e.target.value)}
                className="text-xs px-2 py-1 bg-[#071027] border border-[#00f6d8]/30 rounded text-[#cfeff3] cursor-pointer hover:border-[#00f6d8]"
              >
                <option value="all">All Ports</option>
                {uniquePorts.map(p => <option key={p} value={p}>Port {p}</option>)}
              </select>

              {/* Clear Filters Button */}
              {(filters.protocol !== 'all' || filters.port !== 'all' || filters.severity !== 'all' || filters.eventType !== 'all' || filters.sslStatus !== 'all' || filters.securityScore !== 'all') && (
                <button 
                  onClick={clearFilters}
                  className="text-xs px-3 py-1 bg-[#00f6d8] text-[#071027] rounded font-semibold hover:bg-[#00d4ba] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div style={{maxHeight: '400px', overflow: 'auto'}}>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 text-xs sticky top-0 bg-[#071027]">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Status</th>
                  <th>URL/Host</th>
                  <th>Server</th>
                  <th>SSL/TLS</th>
                  <th>Security</th>
                  <th>Response</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e,idx)=> (
                  <tr key={idx} className="odd:bg-transparent even:bg-[#07172c] hover:bg-[#0a1f3a]">
                    <td className="py-2 text-xs">{new Date(e.ts).toLocaleTimeString()}</td>
                    
                    {/* HTTP Response Data */}
                    <td className="text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        e.status_code >= 200 && e.status_code < 300 ? 'bg-green-500/20 text-green-400' :
                        e.status_code >= 400 && e.status_code < 500 ? 'bg-yellow-500/20 text-yellow-400' :
                        e.status_code >= 500 ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {e.status_code || '-'}
                      </span>
                      <div className="text-[10px] text-slate-500">{e.response_time}ms</div>
                    </td>
                    
                    {/* DNS/Hostname */}
                    <td className="text-xs max-w-[180px]">
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-[#00f6d8] hover:text-[#00d4ba] block truncate" title={e.url}>
                          {e.hostname || new URL(e.url).hostname}
                        </a>
                      ) : (
                        <span className="text-slate-300">{e.hostname || '-'}</span>
                      )}
                      <div className="text-[10px] text-slate-500" title={`Destination IP: ${e.dst}`}>
                        {e.dst}
                      </div>
                    </td>
                    
                    {/* Server Fingerprinting */}
                    <td className="text-xs max-w-[120px]">
                      <div className="truncate" title={e.server_type || 'Unknown'}>
                        {e.server_type || 'Unknown'}
                      </div>
                      {e.powered_by && e.powered_by !== 'Unknown' && (
                        <div className="text-[10px] text-slate-500 truncate" title={e.powered_by}>
                          {e.powered_by}
                        </div>
                      )}
                    </td>
                    
                    {/* SSL/TLS Information */}
                    <td className="text-xs">
                      {e.ssl_info ? (
                        <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400" title="HTTPS Enabled">
                          🔒 TLS
                        </span>
                      ) : e.proto === 'HTTPS' ? (
                        <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          🔒 TLS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400" title="No encryption">
                          🔓 None
                        </span>
                      )}
                    </td>
                    
                    {/* Security Headers */}
                    <td className="text-xs">
                      {e.missing_security_headers !== undefined ? (
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded ${
                            e.missing_security_headers === 0 ? 'bg-green-500/20 text-green-400' :
                            e.missing_security_headers <= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {5 - e.missing_security_headers}/5
                          </span>
                          <span className="text-[10px] text-slate-500">headers</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    
                    {/* Content Analysis */}
                    <td className="text-xs">
                      <div>{((e.bytes_in||0)+(e.bytes_out||0)).toLocaleString()}B</div>
                      {e.content_type && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[100px]" title={e.content_type}>
                          {e.content_type.split(';')[0]}
                        </div>
                      )}
                    </td>
                    
                    {/* Severity */}
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        e.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        e.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        e.severity === 'info' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {e.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
