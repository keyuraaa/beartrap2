const API = 'http://localhost:5173'
let isMonitoring = true
let refreshInterval = null
let serverCheckInterval = null
let serverRunning = false
let currentUrlInfo = null

// Handle Admin Dashboard button click
document.getElementById('dashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5174' })
})

// Handle Start Server button click
document.getElementById('startServerBtn').addEventListener('click', () => {
  // Show instructions modal
  const instructions = document.getElementById('instructionsModal')
  instructions.style.display = 'flex'
})

// Handle close instructions
document.getElementById('closeInstructions')?.addEventListener('click', () => {
  document.getElementById('instructionsModal').style.display = 'none'
})

// Copy path to clipboard
document.getElementById('copyPath')?.addEventListener('click', () => {
  const path = 'C:\\Users\\User\\Documents\\GitHub\\beartrap2\\start-beartrap.bat'
  navigator.clipboard.writeText(path).then(() => {
    const btn = document.getElementById('copyPath')
    btn.textContent = '✓ Copied!'
    setTimeout(() => {
      btn.textContent = '📋 Copy Path'
    }, 2000)
  })
})

// Handle Start Monitoring button
document.getElementById('startMonitoringBtn').addEventListener('click', async () => {
  try {
    // Call server API to start monitoring
    const response = await fetch(API + '/api/start-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    
    if (result.success) {
      isMonitoring = true
      updateMonitoringButtons()
      
      // Start refresh interval
      if (!refreshInterval) {
        refreshInterval = setInterval(refresh, 5000)
      }
      
      // Immediately refresh
      await refresh()
      
      // Show status
      document.getElementById('live').textContent = 'Monitoring started...'
    }
  } catch(e) {
    console.error('Failed to start monitoring:', e)
    document.getElementById('live').textContent = 'Error starting monitoring'
  }
})

// Handle Stop Monitoring button
document.getElementById('stopMonitoringBtn').addEventListener('click', async () => {
  try {
    // Call server API to stop monitoring
    const response = await fetch(API + '/api/stop-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    
    if (result.success) {
      isMonitoring = false
      updateMonitoringButtons()
      
      // Stop refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
      
      // Update status
      document.getElementById('live').textContent = 'Monitoring stopped'
    }
  } catch(e) {
    console.error('Failed to stop monitoring:', e)
    document.getElementById('live').textContent = 'Error stopping monitoring'
  }
})

// Update button states
function updateMonitoringButtons() {
  const startBtn = document.getElementById('startMonitoringBtn')
  const stopBtn = document.getElementById('stopMonitoringBtn')
  
  if (isMonitoring) {
    startBtn.disabled = true
    stopBtn.disabled = false
  } else {
    startBtn.disabled = false
    stopBtn.disabled = true
  }
}

// Handle URL submission
document.getElementById('urlForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const urlInput = document.getElementById('urlInput')
  const statusMsg = document.getElementById('submitStatus')
  const url = urlInput.value.trim()
  
  if(!url){
    statusMsg.textContent = 'Please enter a URL'
    statusMsg.className = 'status-msg error'
    return
  }
  
  try{
    const response = await fetch(API + '/api/submit-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    
    const result = await response.json()
    
    if(response.ok && result.success){
      statusMsg.textContent = '✓ URL submitted successfully!'
      statusMsg.className = 'status-msg success'
      urlInput.value = ''
      setTimeout(() => { statusMsg.textContent = '' }, 3000)
    } else {
      statusMsg.textContent = '✗ Failed to submit URL'
      statusMsg.className = 'status-msg error'
    }
  }catch(e){
    statusMsg.textContent = '✗ Error: ' + e.message
    statusMsg.className = 'status-msg error'
  }
})

async function refresh(){
  try{
    const r = await fetch(API + '/api/stats')
    const stats = await r.json()
    document.getElementById('live').textContent = `Active: ${stats.active_attacks || 0}  Total Events: ${stats.total_events || 0}  In:${stats.bandwidth_in} B Out:${stats.bandwidth_out} B`
  }catch(e){ document.getElementById('live').textContent = 'API unreachable' }
}

// Get current tab URL info
async function getCurrentUrlInfo() {
  try {
    // Check if server is running first
    if (!serverRunning) {
      document.getElementById('urlInfoSection').style.display = 'none'
      return
    }
    
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.url) return
    
    const url = tab.url
    
    // Only check http/https URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      document.getElementById('urlInfoSection').style.display = 'none'
      return
    }
    
    // Fetch events from API to find matching URL data
    const response = await fetch(API + '/api/events', {
      signal: AbortSignal.timeout(2000)
    })
    
    if (!response.ok) {
      document.getElementById('urlInfoSection').style.display = 'none'
      return
    }
    
    // Get response as text first to check if it's HTML
    const responseText = await response.text()
    
    // Check if response looks like HTML (starts with <!DOCTYPE or <html)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      document.getElementById('urlInfoSection').style.display = 'none'
      return
    }
    
    // Try to parse as JSON
    let events
    try {
      events = JSON.parse(responseText)
    } catch(parseError) {
      // Not valid JSON, silently hide section
      document.getElementById('urlInfoSection').style.display = 'none'
      return
    }
    
    // Validate events is an array
    if (!Array.isArray(events)) {
      document.getElementById('urlInfoSection').style.display = 'none'
      return
    }
    
    // Find most recent event for this hostname
    const hostname = new URL(url).hostname
    const matchingEvent = events.find(e => e.hostname === hostname || e.url === url)
    
    if (matchingEvent) {
      displayUrlInfo(matchingEvent)
    } else {
      // Show that URL hasn't been monitored yet
      document.getElementById('urlInfoSection').style.display = 'block'
      document.getElementById('urlInfo').innerHTML = `
        <div class="info-item">
          <span class="info-label">🌐 URL:</span>
          <span class="info-value">${hostname}</span>
        </div>
        <div class="info-status not-monitored">Not monitored yet - Submit below to analyze</div>
      `
    }
  } catch(e) {
    // Silently hide URL info section if there's any error (don't log to avoid console spam)
    const urlInfoSection = document.getElementById('urlInfoSection')
    if (urlInfoSection) {
      urlInfoSection.style.display = 'none'
    }
  }
}

// Display URL information
function displayUrlInfo(event) {
  const urlInfoSection = document.getElementById('urlInfoSection')
  const urlInfoDiv = document.getElementById('urlInfo')
  
  // Calculate security score
  const securityScore = 5 - (event.missing_security_headers || 5)
  const securityEmoji = securityScore === 5 ? '⭐' : securityScore >= 3 ? '✓' : '⚠️'
  const securityClass = securityScore === 5 ? 'excellent' : securityScore >= 3 ? 'good' : 'poor'
  
  // SSL status
  const sslSecure = event.ssl_info && event.ssl_info.secure
  const sslIcon = sslSecure ? '🔒' : '🔓'
  const sslText = sslSecure ? 'HTTPS Secure' : 'HTTP Insecure'
  const sslClass = sslSecure ? 'secure' : 'insecure'
  
  // Server info
  const serverType = event.server_type || 'Unknown'
  const poweredBy = event.powered_by || ''
  
  // Location
  const location = event.server_location || (event.geo ? `${event.geo.city || 'Unknown'}, ${event.geo.country || 'Unknown'}` : 'Unknown')
  
  // Response status
  const statusCode = event.status_code || 'N/A'
  const statusClass = statusCode >= 200 && statusCode < 300 ? 'success' : statusCode >= 400 ? 'error' : 'normal'
  
  // Build HTML
  urlInfoDiv.innerHTML = `
    <div class="info-item">
      <span class="info-label">🌐 URL:</span>
      <span class="info-value" title="${event.url || event.hostname}">${event.hostname || 'N/A'}</span>
    </div>
    
    <div class="info-item">
      <span class="info-label">🛡️ Security:</span>
      <span class="info-value security-score ${securityClass}">${securityEmoji} ${securityScore}/5</span>
    </div>
    
    <div class="info-item">
      <span class="info-label">${sslIcon} SSL/TLS:</span>
      <span class="info-value ssl-status ${sslClass}">${sslText}</span>
    </div>
    
    <div class="info-item">
      <span class="info-label">🖥️ Server:</span>
      <span class="info-value">${serverType}${poweredBy ? ' (' + poweredBy + ')' : ''}</span>
    </div>
    
    <div class="info-item">
      <span class="info-label">📍 Location:</span>
      <span class="info-value">${location}</span>
    </div>
    
    <div class="info-item">
      <span class="info-label">📊 Status:</span>
      <span class="info-value status-${statusClass}">${statusCode}</span>
    </div>
    
    <div class="info-item">
      <span class="info-label">⚠️ Severity:</span>
      <span class="info-value severity-${event.severity || 'info'}">${(event.severity || 'info').toUpperCase()}</span>
    </div>
  `
  
  urlInfoSection.style.display = 'block'
}

// Check server status
async function checkServerStatus() {
  const startServerBtn = document.getElementById('startServerBtn')
  const dashboardBtn = document.getElementById('dashboardBtn')
  const monitoringControls = document.querySelector('.monitoring-controls')
  
  try {
    const response = await fetch(API + '/api/stats', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    })
    if (response.ok) {
      serverRunning = true
      document.getElementById('serverStatusText').textContent = '🟢 Server Running'
      document.getElementById('serverStatus').className = 'server-status online'
      startServerBtn.style.display = 'none'
      dashboardBtn.style.display = 'block'
      monitoringControls.style.display = 'flex'
      return true
    }
  } catch(e) {
    serverRunning = false
    document.getElementById('serverStatusText').textContent = '🔴 Server Offline'
    document.getElementById('serverStatus').className = 'server-status offline'
    startServerBtn.style.display = 'block'
    dashboardBtn.style.display = 'none'
    monitoringControls.style.display = 'none'
  }
  return false
}

// Initialize monitoring state
async function initialize() {
  try {
    const isServerRunning = await checkServerStatus()
    updateMonitoringButtons()
    
    if (isServerRunning) {
      refresh()
      getCurrentUrlInfo()
    }
  } catch(e) {
    // Silently handle initialization errors
  }
}

initialize()
refreshInterval = setInterval(refresh, 5000)
serverCheckInterval = setInterval(() => {
  checkServerStatus().then(isRunning => {
    if (isRunning) {
      getCurrentUrlInfo().catch(() => {})
    }
  }).catch(() => {})
}, 3000)

// Listen for tab changes to update URL info
chrome.tabs.onActivated.addListener(() => {
  if (serverRunning) {
    getCurrentUrlInfo().catch(() => {})
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && serverRunning) {
    getCurrentUrlInfo().catch(() => {})
  }
})
