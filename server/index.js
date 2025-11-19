const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json())

// CORS middleware for Chrome extension compatibility
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers','*')
  res.setHeader('Access-Control-Max-Age','86400')
  
  // Handle preflight requests
  if(req.method === 'OPTIONS'){
    return res.status(200).end()
  }
  next()
})

const startedAt = Date.now()
let stats = { 
  active_attacks: 0,  // High/Medium severity attacks only
  total_events: 0,     // All events (traffic + attacks)
  total_attacks: 0,    // All attack events (any severity)
  bandwidth_in: 0, 
  bandwidth_out: 0, 
  bytes_total: 0 
}
let topIps = {}
let protocolCounts = {}
let portCounts = {}
let submittedUrls = []
let isMonitoring = true // Global monitoring state
let geoCache = {} // Cache for geolocation data
let recentAttacks = [] // Track recent attacks for active count

// Suricata EVE log file path (adjust as needed)
const eveLogPath = 'C:\\Program Files\\Suricata\\log\\eve.json'

// Watch for Suricata EVE logs
let logStream = null
let lastLogPosition = 0

function startLogWatching() {
  if (logStream) return // Already watching

  try {
    // Check if file exists
    if (!fs.existsSync(eveLogPath)) {
      console.log('Suricata EVE log file not found. Waiting for it to be created...')
      return
    }

    logStream = fs.createReadStream(eveLogPath, { start: lastLogPosition, encoding: 'utf8' })

    logStream.on('data', (chunk) => {
      const lines = chunk.split('\n')
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const event = JSON.parse(line)
            processSuricataEvent(event)
          } catch (e) {
            console.error('Error parsing Suricata event:', e.message)
          }
        }
      })
      lastLogPosition += chunk.length
    })

    logStream.on('error', (err) => {
      console.error('Error reading Suricata log:', err.message)
      logStream = null
    })

    logStream.on('end', () => {
      console.log('Suricata log stream ended. Restarting watch...')
      logStream = null
      setTimeout(startLogWatching, 1000) // Retry after 1 second
    })

    console.log('Started watching Suricata EVE logs')
  } catch (e) {
    console.error('Failed to start log watching:', e.message)
  }
}

function stopLogWatching() {
  if (logStream) {
    logStream.destroy()
    logStream = null
    console.log('Stopped watching Suricata logs')
  }
}

function processSuricataEvent(event) {
  if (!isMonitoring) return

  // Process multiple event types: alert, http, dns, flow, etc.
  const eventType = event.event_type
  
  // Skip if not a relevant event type
  if (!['alert', 'http', 'dns', 'tls', 'flow'].includes(eventType)) return

  const srcIp = event.src_ip || 'unknown'
  const dstIp = event.dest_ip || 'unknown'
  const dstPort = event.dest_port || 0
  const proto = event.proto || 'unknown'
  
  // Extract URL and hostname for HTTP/DNS events
  let url = null
  let hostname = null
  let method = null
  
  if (eventType === 'http' && event.http) {
    hostname = event.http.hostname || null
    url = event.http.url || null
    method = event.http.http_method || 'GET'
    
    // Construct full URL if we have hostname
    if (hostname && url) {
      const protocol = dstPort === 443 ? 'https' : 'http'
      url = `${protocol}://${hostname}${url}`
    }
  } else if (eventType === 'dns' && event.dns) {
    hostname = event.dns.rrname || null
  } else if (eventType === 'tls' && event.tls) {
    hostname = event.tls.sni || null
  }
  
  // Determine severity
  let severity = 'low'
  if (eventType === 'alert' && event.alert) {
    severity = event.alert.severity === 1 ? 'high' : event.alert.severity === 2 ? 'medium' : 'low'
  } else if (eventType === 'http' || eventType === 'dns' || eventType === 'tls') {
    // Non-alert events are informational
    severity = 'info'
  }
  
  const bytesIn = event.flow ? (event.flow.bytes_toserver || 0) : 0
  const bytesOut = event.flow ? (event.flow.bytes_toclient || 0) : 0

  // Update stats accurately
  stats.total_events += 1
  stats.bandwidth_in += bytesIn
  stats.bandwidth_out += bytesOut
  stats.bytes_total += (bytesIn + bytesOut)
  
  // Count as attack only if it's an alert or high/medium severity
  if (eventType === 'alert' || severity === 'high' || severity === 'medium') {
    stats.total_attacks += 1
    
    // Track for active attacks (attacks in last 60 seconds)
    recentAttacks.push({
      ts: event.timestamp ? new Date(event.timestamp).getTime() : Date.now(),
      src: srcIp,
      severity: severity
    })
    
    // Clean old attacks (older than 60 seconds)
    const now = Date.now()
    recentAttacks = recentAttacks.filter(a => now - a.ts < 60000)
    stats.active_attacks = recentAttacks.length
  }

  // Update top IPs
  if (!topIps[srcIp]) {
    topIps[srcIp] = { count: 0, last: 0 }
  }
  topIps[srcIp].count += 1
  topIps[srcIp].last = event.timestamp ? new Date(event.timestamp).getTime() : Date.now()

  // Update protocol and port counts
  protocolCounts[proto] = (protocolCounts[proto] || 0) + 1
  portCounts[dstPort] = (portCounts[dstPort] || 0) + 1

  // Get geolocation data asynchronously
  getGeoLocation(srcIp).then(geoData => {
    // Emit WebSocket event with real geo data
    const wsEvent = {
      type: eventType === 'alert' ? 'attack' : 'traffic',
      event_type: eventType,
      ts: event.timestamp ? new Date(event.timestamp).getTime() : Date.now(),
      src: srcIp,
      dst: dstIp,
      port: dstPort,
      proto: proto,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      severity: severity,
      url: url,
      hostname: hostname,
      method: method,
      alert_msg: event.alert ? event.alert.signature : null,
      geo: geoData,
      count: 1
    }

    // Send to all connected WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(wsEvent))
      }
    })
  })
}

app.get('/api/stats', (req,res)=>{
  const uptimeMs = Date.now() - startedAt
  const uniqueIps = Object.keys(topIps).length
  const avg_bytes_per_attack = stats.total_attacks > 0 ? Math.round(stats.bytes_total / stats.total_attacks) : 0
  
  // Clean old attacks from active count
  const now = Date.now()
  recentAttacks = recentAttacks.filter(a => now - a.ts < 60000)
  stats.active_attacks = recentAttacks.length
  
  res.json({
    uptime_ms: uptimeMs,
    uptime: `${Math.round(uptimeMs/1000)}s`,
    active: stats.active_attacks,  // Only recent attacks (last 60s)
    active_attacks: stats.active_attacks,
    total_events: stats.total_events,  // All events
    total_attacks: stats.total_attacks,  // All attack events
    unique_ips: uniqueIps,
    bandwidth_in: stats.bandwidth_in,
    bandwidth_out: stats.bandwidth_out,
    bytes_total: stats.bytes_total,
    avg_bytes_per_attack,
    protocol_counts: protocolCounts,
    port_counts: portCounts,
    is_monitoring: isMonitoring
  })
})

app.get('/api/top-ips', (req,res)=>{
  const arr = Object.entries(topIps).map(([ip,data])=>({ip, ...data}))
  arr.sort((a,b)=>b.count-a.count)
  res.json(arr.slice(0,50))
})

// Get recent events (for extension URL info)
app.get('/api/events', (req,res)=>{
  // Return recent events from recentAttacks and allEvents
  const events = [...recentAttacks, ...allEvents]
    .sort((a,b) => b.ts - a.ts)
    .slice(0, 100) // Return last 100 events
  res.json(events)
})

// Enhanced geo proxy with caching: /api/geo?ip=1.2.3.4
app.get('/api/geo', async (req,res)=>{
  const ip = req.query.ip || req.ip
  
  // Check cache first
  if (geoCache[ip]) {
    return res.json(geoCache[ip])
  }
  
  try{
    // Using ip-api.com - free, no key required, more accurate
    const r = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {timeout:5000})
    
    if (r.data.status === 'success') {
      const geoData = {
        ip: r.data.query,
        country: r.data.country,
        country_code: r.data.countryCode,
        region: r.data.regionName,
        city: r.data.city,
        latitude: r.data.lat,
        longitude: r.data.lon,
        lat: r.data.lat,
        lon: r.data.lon,
        timezone: r.data.timezone,
        isp: r.data.isp,
        org: r.data.org,
        as: r.data.as
      }
      
      // Cache for 1 hour
      geoCache[ip] = geoData
      setTimeout(() => delete geoCache[ip], 3600000)
      
      res.json(geoData)
    } else {
      res.json({error: 'geo-failed', ip, message: r.data.message})
    }
  }catch(e){ 
    res.json({error: 'geo-failed', ip, message: e.message}) 
  }
})

// URL submission endpoint
app.post('/api/submit-url', (req,res)=>{
  const { url } = req.body
  if(!url || typeof url !== 'string'){
    return res.status(400).json({error: 'Invalid URL'})
  }
  
  // Validate URL format
  try {
    new URL(url) // This will throw if invalid
  } catch(e) {
    return res.status(400).json({error: 'Invalid URL format'})
  }
  
  const entry = {
    url,
    timestamp: Date.now(),
    id: Date.now() + Math.random()
  }
  submittedUrls.push(entry)
  
  console.log(`📌 New URL submitted for monitoring: ${url}`)
  if (useMockData) {
    console.log(`   Real HTTP monitoring active - making actual requests every 5 seconds`)
  }
  
  res.json({success: true, entry})
})

// Get submitted URLs
app.get('/api/submitted-urls', (req,res)=>{
  res.json(submittedUrls.slice(-20).reverse())
})

// Remove submitted URL (using POST for better compatibility)
app.post('/api/remove-url', (req,res)=>{
  const { id } = req.body
  const index = submittedUrls.findIndex(u => u.id == id)
  
  if (index === -1) {
    return res.status(404).json({error: 'URL not found'})
  }
  
  const removed = submittedUrls.splice(index, 1)[0]
  console.log(`🗑️  Removed URL from monitoring: ${removed.url}`)
  
  res.json({success: true, removed})
})

// Also keep DELETE for REST compliance
app.delete('/api/submit-url/:id', (req,res)=>{
  const { id } = req.params
  const index = submittedUrls.findIndex(u => u.id == id)
  
  if (index === -1) {
    return res.status(404).json({error: 'URL not found'})
  }
  
  const removed = submittedUrls.splice(index, 1)[0]
  console.log(`🗑️  Removed URL from monitoring: ${removed.url}`)
  
  res.json({success: true, removed})
})

// Get monitoring status
app.get('/api/monitoring-status', (req,res)=>{
  res.json({ is_monitoring: isMonitoring })
})

// Start monitoring
app.post('/api/start-monitoring', (req,res)=>{
  isMonitoring = true
  startLogWatching()
  console.log('Monitoring started')
  res.json({ success: true, is_monitoring: isMonitoring })
})

// Stop monitoring
app.post('/api/stop-monitoring', (req,res)=>{
  isMonitoring = false
  stopLogWatching()
  console.log('Monitoring stopped')
  res.json({ success: true, is_monitoring: isMonitoring })
})

// Clear all data
app.post('/api/clear-data', (req,res)=>{
  // Reset all stats and data
  stats = { 
    active_attacks: 0,
    total_events: 0,
    total_attacks: 0,
    bandwidth_in: 0, 
    bandwidth_out: 0, 
    bytes_total: 0 
  }
  topIps = {}
  protocolCounts = {}
  portCounts = {}
  recentAttacks = []
  geoCache = {}
  
  console.log('🗑️  All data cleared')
  res.json({ success: true, message: 'All data cleared' })
})

// Tracking Beacon Endpoints - for websites to report visitor traffic
app.post('/api/track-visitor', async (req, res) => {
  try {
    const visitorData = req.body
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.socket.remoteAddress || 
                     randomIP() // Fallback to simulated IP
    
    // Create event from visitor data
    const ev = {
      type: 'traffic',
      event_type: 'http',
      ts: Date.now(),
      src: clientIP,
      dst: '0.0.0.0',
      port: 443,
      proto: 'HTTPS',
      bytes_in: JSON.stringify(visitorData).length,
      bytes_out: 0,
      severity: 'info',
      url: visitorData.url,
      hostname: visitorData.hostname,
      method: 'GET',
      user_agent: visitorData.userAgent,
      referrer: visitorData.referrer,
      count: 1
    }
    
    // Check for suspicious patterns
    const suspicious = [
      /script/i.test(visitorData.url),
      /eval|exec|alert/i.test(visitorData.url),
      /<|>|javascript:/i.test(visitorData.url)
    ]
    
    if (suspicious.some(x => x)) {
      ev.type = 'attack'
      ev.event_type = 'alert'
      ev.severity = 'high'
      ev.alert_msg = 'Suspicious URL pattern in visitor request'
    }
    
    // Get geolocation
    const geoData = await getGeoLocation(clientIP)
    ev.geo = geoData
    
    // Update stats
    stats.total_events += 1
    stats.bytes_total += ev.bytes_in
    
    topIps[clientIP] = topIps[clientIP] || {count:0, last:0}
    topIps[clientIP].count += 1
    topIps[clientIP].last = ev.ts
    
    protocolCounts[ev.proto] = (protocolCounts[ev.proto] || 0) + 1
    portCounts[ev.port] = (portCounts[ev.port] || 0) + 1
    
    if (ev.type === 'attack') {
      stats.total_attacks += 1
      recentAttacks.push({ ts: ev.ts, src: ev.src, severity: ev.severity })
      const now = Date.now()
      recentAttacks = recentAttacks.filter(a => now - a.ts < 60000)
      stats.active_attacks = recentAttacks.length
    }
    
    // Broadcast to WebSocket clients
    const payload = JSON.stringify(ev)
    wss.clients.forEach(c => { if(c.readyState === WebSocket.OPEN) c.send(payload) })
    
    res.json({ success: true })
  } catch(e) {
    console.error('Error tracking visitor:', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

app.post('/api/track-event', (req, res) => {
  // Simple event tracking endpoint
  console.log('Tracked event:', req.body.type, req.body.url)
  res.json({ success: true })
})

// Serve tracking beacon script
app.get('/tracking-beacon.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.sendFile(path.join(__dirname, '../tracking-beacon.js'))
})

// Friendly root handler so visiting http://localhost:5173/ doesn't return "Cannot GET /"
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(`
    <html>
      <head><title>IDS Server</title></head>
      <body style="background:#071027;color:#cfeff3;font-family:Arial;padding:20px;">
        <h1>IDS Server</h1>
        <p>Server is running. Available endpoints:</p>
        <ul>
          <li><a href="/api/stats">/api/stats</a></li>
          <li><a href="/api/top-ips">/api/top-ips</a></li>
          <li><a href="/api/geo?ip=8.8.8.8">/api/geo?ip=8.8.8.8</a> (geo proxy)</li>
        </ul>
        <p>WebSocket endpoint: <code>ws://localhost:5173</code></p>
      </body>
    </html>
  `)
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws)=>{
  console.log('ws conn')
  ws.send(JSON.stringify({type:'welcome', ts: Date.now()}))
})

// Generate realistic source IP addresses with regional focus
// Each URL gets assigned a primary region with some variation
const urlRegionCache = new Map()

function getRegionForUrl(url) {
  if (!urlRegionCache.has(url)) {
    // Assign a primary region to this URL (70% traffic from this region)
    const regions = ['asia', 'europe', 'north-america', 'asia-pacific']
    urlRegionCache.set(url, regions[Math.floor(Math.random() * regions.length)])
  }
  return urlRegionCache.get(url)
}

function randomIP(url = null){ 
  // If URL provided, use its primary region 70% of the time
  let primaryRegion = url ? getRegionForUrl(url) : null
  const useRegional = primaryRegion && Math.random() < 0.7
  
  const regionalRanges = {
    'asia': [
      () => `103.${Math.floor(Math.random()*50)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `210.${Math.floor(Math.random()*30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `118.${Math.floor(Math.random()*40)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`
    ],
    'asia-pacific': [
      () => `103.${Math.floor(Math.random()*50)+50}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `139.${Math.floor(Math.random()*30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`
    ],
    'europe': [
      () => `185.${Math.floor(Math.random()*50)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `91.${Math.floor(Math.random()*50)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `176.${Math.floor(Math.random()*30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`
    ],
    'north-america': [
      () => `45.${Math.floor(Math.random()*50)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `198.${Math.floor(Math.random()*30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
      () => `24.${Math.floor(Math.random()*50)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`
    ]
  }
  
  if (useRegional && regionalRanges[primaryRegion]) {
    const regionIPs = regionalRanges[primaryRegion]
    return regionIPs[Math.floor(Math.random() * regionIPs.length)]()
  }
  
  // Random global IP (30% of the time, or when no URL specified)
  const allRanges = Object.values(regionalRanges).flat()
  return allRanges[Math.floor(Math.random() * allRanges.length)]()
}
function randomGeo(){ const lat = (Math.random()-0.5)*160; const lon = (Math.random()-0.5)*360; return {lat, lon, country: 'Unknown'} }

// Async geolocation lookup with caching
async function getGeoLocation(ip) {
  // Check cache first
  if (geoCache[ip]) {
    return geoCache[ip]
  }
  
  try {
    const r = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon,isp`, {timeout:3000})
    
    if (r.data.status === 'success') {
      const geoData = {
        lat: r.data.lat,
        lon: r.data.lon,
        country: r.data.country,
        country_code: r.data.countryCode,
        city: r.data.city,
        isp: r.data.isp
      }
      
      // Cache for 1 hour
      geoCache[ip] = geoData
      setTimeout(() => delete geoCache[ip], 3600000)
      
      return geoData
    }
  } catch(e) {
    // Silent fail, return default
  }
  
  return { lat: 0, lon: 0, country: 'Unknown', city: 'Unknown' }
}

// Simulated traffic generator ONLY for submitted URLs
// This generates mock traffic that correlates with user-submitted URLs for testing
let useMockData = true

// Check if we should use real Suricata data
try {
  if (fs.existsSync(eveLogPath)) {
    useMockData = false
    console.log('Suricata logs found - using real-time monitoring')
  } else {
    console.log('No Suricata logs found - using simulated mode for submitted URLs')
  }
} catch(e) {
  console.log('Using simulated mode')
}

// Watch for Suricata logs appearing
fs.watch(path.dirname(eveLogPath), (eventType, filename) => {
  if (filename === path.basename(eveLogPath) && !useMockData) {
    useMockData = false
    console.log('Suricata logs detected - switching to real-time monitoring')
  }
})

// Real-time URL monitoring - makes actual HTTP requests to submitted URLs
// Shows realistic traffic data while Suricata is being configured
setInterval(async ()=>{
  if (!isMonitoring || !useMockData) return // Skip if monitoring is stopped or using real data
  
  // Only monitor if there are submitted URLs
  if (submittedUrls.length === 0) return
  
  // Pick a random submitted URL to check
  const urlEntry = submittedUrls[Math.floor(Math.random() * submittedUrls.length)]
  let url = urlEntry.url
  
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)
    const protocol = urlObj.protocol === 'https:' ? 'HTTPS' : 'HTTP'
    
    // Make actual HTTP request to the URL with full header capture
    const startTime = Date.now()
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: () => true, // Accept any status code
      headers: {
        'User-Agent': 'BearTrap-IDS/1.0'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false // Allow self-signed certs for analysis
      })
    })
    const responseTime = Date.now() - startTime
    
    // Extract public server information from headers
    const serverType = response.headers['server'] || 'Unknown'
    const poweredBy = response.headers['x-powered-by'] || 'Unknown'
    const contentType = response.headers['content-type'] || 'Unknown'
    
    // Security headers analysis
    const securityHeaders = {
      'Content-Security-Policy': response.headers['content-security-policy'] || 'Missing',
      'X-Frame-Options': response.headers['x-frame-options'] || 'Missing',
      'X-Content-Type-Options': response.headers['x-content-type-options'] || 'Missing',
      'Strict-Transport-Security': response.headers['strict-transport-security'] || 'Missing',
      'X-XSS-Protection': response.headers['x-xss-protection'] || 'Missing'
    }
    
    // Count missing security headers
    const missingSecHeaders = Object.values(securityHeaders).filter(v => v === 'Missing').length
    
    // SSL/TLS information (if HTTPS)
    let sslInfo = null
    if (protocol === 'HTTPS') {
      sslInfo = {
        protocol: 'TLS',
        secure: true,
        hasCert: true
      }
    }
    
    // Resolve hostname to IP
    const dns = require('dns').promises
    let destIP = '0.0.0.0'
    try {
      const addresses = await dns.resolve4(hostname)
      destIP = addresses[0] || '0.0.0.0'
    } catch(e) {
      console.log(`DNS resolution failed for ${hostname}`)
    }
    
    // Calculate actual data sizes
    const requestSize = Buffer.byteLength(JSON.stringify(response.config.headers))
    const responseSize = response.data ? Buffer.byteLength(JSON.stringify(response.data)) : 0
    
    // Analyze response for potential threats
    let severity = 'info'
    let eventType = 'http'
    let alertMsg = null
    
    // Threat detection heuristics
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /eval\(/i,
      /document\.cookie/i,
      /onerror=/i,
      /onload=/i
    ]
    
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(responseText))
    
    // Check for security issues
    if (hasSuspiciousContent) {
      severity = 'high'
      eventType = 'alert'
      alertMsg = `Suspicious JavaScript patterns detected in response from ${hostname}`
    } else if (response.status >= 400 && response.status < 500) {
      severity = 'medium'
      eventType = 'alert'
      alertMsg = `HTTP ${response.status} error from ${hostname}`
    } else if (response.status >= 500) {
      severity = 'high'
      eventType = 'alert'
      alertMsg = `Server error (${response.status}) from ${hostname}`
    } else if (responseSize > 1000000) {
      severity = 'medium'
      eventType = 'alert'
      alertMsg = `Unusually large response (${Math.round(responseSize/1024)}KB) from ${hostname}`
    } else if (responseTime > 3000) {
      severity = 'low'
      alertMsg = `Slow response time (${responseTime}ms) from ${hostname}`
    }
    
    // Reduce severity if site has excellent security headers (5/5)
    if (missingSecHeaders === 0 && severity !== 'info') {
      // Downgrade severity one level for sites with perfect security
      if (severity === 'high') severity = 'medium'
      else if (severity === 'medium') severity = 'low'
      else if (severity === 'low') severity = 'info'
      
      if (alertMsg) {
        alertMsg += ' (Security headers: Excellent)'
      }
    } else if (missingSecHeaders >= 4 && severity === 'info') {
      // Normal traffic but poor security headers - warn user
      severity = 'low'
      alertMsg = `Missing ${missingSecHeaders}/5 security headers on ${hostname}`
    }
    
    // Use destination server IP for accurate geolocation of where the website is hosted
    const sourceIP = destIP // Use real server IP for accurate location
    
    const ev = {
      type: severity === 'info' ? 'traffic' : 'attack',
      event_type: eventType,
      ts: Date.now(),
      src: sourceIP, // Real server IP (shows where website is hosted)
      dst: destIP,   // Real destination server IP
      port: port,
      proto: protocol,
      bytes_in: requestSize,
      bytes_out: responseSize,
      severity: severity,
      url: url,
      hostname: hostname,
      method: 'GET',
      status_code: response.status,
      response_time: responseTime,
      count: 1,
      // Public data extraction
      server_type: serverType,
      powered_by: poweredBy,
      content_type: contentType,
      security_headers: securityHeaders,
      missing_security_headers: missingSecHeaders,
      ssl_info: sslInfo
    }
    
    if (alertMsg) {
      ev.alert_msg = alertMsg
    }
    
    // Get ACCURATE geolocation for the real server IP
    const geoData = await getGeoLocation(destIP)
    ev.geo = geoData
    ev.server_location = `${geoData.city || 'Unknown'}, ${geoData.country || 'Unknown'}`
    
    // Update stats
    stats.total_events += 1
    stats.bandwidth_in += ev.bytes_in
    stats.bandwidth_out += ev.bytes_out
    stats.bytes_total += (ev.bytes_in || 0) + (ev.bytes_out || 0)
    
    // Track source IPs (simulated clients)
    if (!topIps[sourceIP]) {
      topIps[sourceIP] = {count:0, last:0}
    }
    topIps[sourceIP].count += 1
    topIps[sourceIP].last = ev.ts

    // Aggregate protocol/port stats
    protocolCounts[ev.proto] = (protocolCounts[ev.proto] || 0) + 1
    portCounts[ev.port] = (portCounts[ev.port] || 0) + 1
    
    // Count as attack if threat detected
    if (ev.type === 'attack' || ev.severity === 'high' || ev.severity === 'medium') {
      stats.total_attacks += 1
      
      // Track for active attacks
      recentAttacks.push({
        ts: ev.ts,
        src: ev.src,
        severity: ev.severity
      })
      
      // Clean old attacks (last 60 seconds)
      const now = Date.now()
      recentAttacks = recentAttacks.filter(a => now - a.ts < 60000)
      stats.active_attacks = recentAttacks.length
    }

    const payload = JSON.stringify(ev)
    wss.clients.forEach(c=>{ if(c.readyState === WebSocket.OPEN) c.send(payload) })
    
    console.log(`Monitored ${url} - Status: ${response.status}, Size: ${responseSize}B, Time: ${responseTime}ms`)
    
  } catch(e) {
    // Network errors or timeouts
    console.error(`Error monitoring ${url}:`, e.message)
    
    // Still create an event for the error
    const ev = {
      type: 'attack',
      event_type: 'alert',
      ts: Date.now(),
      src: '0.0.0.0',
      dst: '127.0.0.1',
      port: 0,
      proto: 'HTTP',
      bytes_in: 0,
      bytes_out: 0,
      severity: 'high',
      url: url,
      hostname: new URL(url).hostname,
      method: 'GET',
      alert_msg: `Connection failed: ${e.message}`,
      count: 1
    }
    
    stats.total_events += 1
    stats.total_attacks += 1
    
    recentAttacks.push({
      ts: ev.ts,
      src: ev.src,
      severity: ev.severity
    })
    
    const now = Date.now()
    recentAttacks = recentAttacks.filter(a => now - a.ts < 60000)
    stats.active_attacks = recentAttacks.length
    
    const payload = JSON.stringify(ev)
    wss.clients.forEach(c=>{ if(c.readyState === WebSocket.OPEN) c.send(payload) })
  }
}, 3000 + Math.random() * 1000) // Check every 3-4 seconds with randomization for smooth flow

// Initialize log watching on startup
startLogWatching()

const PORT = 5173
server.listen(PORT, ()=> console.log('IDS server running on http://localhost:'+PORT))
