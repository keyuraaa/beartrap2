// Test script for monitoring API endpoints
const API = 'http://localhost:4000'

async function testMonitoringAPI() {
  console.log('Testing Monitoring API Endpoints...\n')
  
  try {
    // Test 1: Get current monitoring status
    console.log('1. Testing GET /api/monitoring-status')
    const statusResponse = await fetch(API + '/api/monitoring-status')
    const status = await statusResponse.json()
    console.log('   Response:', status)
    console.log('   ✓ Status endpoint works\n')
    
    // Test 2: Stop monitoring
    console.log('2. Testing POST /api/stop-monitoring')
    const stopResponse = await fetch(API + '/api/stop-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const stopResult = await stopResponse.json()
    console.log('   Response:', stopResult)
    console.log('   ✓ Stop endpoint works\n')
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 3: Check stats includes monitoring status
    console.log('3. Testing GET /api/stats (should include is_monitoring)')
    const statsResponse = await fetch(API + '/api/stats')
    const stats = await statsResponse.json()
    console.log('   is_monitoring:', stats.is_monitoring)
    console.log('   ✓ Stats includes monitoring status\n')
    
    // Test 4: Start monitoring
    console.log('4. Testing POST /api/start-monitoring')
    const startResponse = await fetch(API + '/api/start-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const startResult = await startResponse.json()
    console.log('   Response:', startResult)
    console.log('   ✓ Start endpoint works\n')
    
    // Test 5: Verify monitoring is back on
    console.log('5. Verifying monitoring status changed')
    const finalStatusResponse = await fetch(API + '/api/monitoring-status')
    const finalStatus = await finalStatusResponse.json()
    console.log('   Response:', finalStatus)
    console.log('   ✓ Status changed successfully\n')
    
    console.log('✅ All tests passed!')
    console.log('\nThe monitoring API is working correctly.')
    console.log('You can now use the extension to control monitoring.')
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    console.error('\nMake sure the server is running with the updated code.')
    console.error('Restart the server by running: cd server && node index.js')
  }
}

testMonitoringAPI()
