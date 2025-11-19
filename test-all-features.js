// Comprehensive test script for all new features
console.log('='.repeat(60));
console.log('COMPREHENSIVE FEATURE TEST');
console.log('='.repeat(60));

async function testAllFeatures() {
  const API = 'http://localhost:4000';
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Server Health Check
  console.log('\n[TEST 1] Server Health Check');
  try {
    const response = await fetch(`${API}/api/stats`);
    const data = await response.json();
    if (response.ok && data.uptime) {
      console.log('✅ PASS - Server is running');
      console.log(`   Uptime: ${data.uptime}, Active: ${data.active}, Total Attacks: ${data.total_attacks}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Server response invalid');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Server not reachable:', error.message);
    failedTests++;
  }

  // Test 2: Top IPs Endpoint
  console.log('\n[TEST 2] Top IPs Endpoint');
  try {
    const response = await fetch(`${API}/api/top-ips`);
    const data = await response.json();
    if (response.ok && Array.isArray(data)) {
      console.log('✅ PASS - Top IPs endpoint working');
      console.log(`   Found ${data.length} unique IPs`);
      if (data.length > 0) {
        console.log(`   Top attacker: ${data[0].ip} (${data[0].count} attacks)`);
      }
      passedTests++;
    } else {
      console.log('❌ FAIL - Invalid response');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 3: URL Submission - Valid URL
  console.log('\n[TEST 3] URL Submission - Valid URL');
  try {
    const testUrl = 'https://test-example.com';
    const response = await fetch(`${API}/api/submit-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });
    const data = await response.json();
    if (response.ok && data.success && data.entry.url === testUrl) {
      console.log('✅ PASS - URL submitted successfully');
      console.log(`   URL: ${data.entry.url}`);
      console.log(`   Timestamp: ${new Date(data.entry.timestamp).toLocaleString()}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Submission failed');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 4: URL Submission - Invalid Data
  console.log('\n[TEST 4] URL Submission - Invalid Data (Error Handling)');
  try {
    const response = await fetch(`${API}/api/submit-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: '' })
    });
    const data = await response.json();
    if (response.status === 400 && data.error) {
      console.log('✅ PASS - Invalid data rejected correctly');
      console.log(`   Error message: ${data.error}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Should reject invalid data');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 5: Get Submitted URLs
  console.log('\n[TEST 5] Get Submitted URLs');
  try {
    const response = await fetch(`${API}/api/submitted-urls`);
    const data = await response.json();
    if (response.ok && Array.isArray(data)) {
      console.log('✅ PASS - Submitted URLs retrieved');
      console.log(`   Total submitted URLs: ${data.length}`);
      if (data.length > 0) {
        console.log(`   Most recent: ${data[0].url}`);
      }
      passedTests++;
    } else {
      console.log('❌ FAIL - Invalid response');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 6: Multiple URL Submissions
  console.log('\n[TEST 6] Multiple URL Submissions');
  try {
    const urls = [
      'https://github.com',
      'https://stackoverflow.com',
      'https://google.com'
    ];
    let allSuccess = true;
    for (const url of urls) {
      const response = await fetch(`${API}/api/submit-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        allSuccess = false;
        break;
      }
    }
    if (allSuccess) {
      console.log('✅ PASS - Multiple URLs submitted successfully');
      console.log(`   Submitted ${urls.length} URLs`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Some submissions failed');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 7: CORS Headers
  console.log('\n[TEST 7] CORS Headers Check');
  try {
    const response = await fetch(`${API}/api/stats`);
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    if (corsHeader === '*') {
      console.log('✅ PASS - CORS headers configured correctly');
      console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - CORS headers missing or incorrect');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 8: Protocol Counts (for filtering)
  console.log('\n[TEST 8] Protocol Counts (Dashboard Filtering Data)');
  try {
    const response = await fetch(`${API}/api/stats`);
    const data = await response.json();
    if (response.ok && data.protocol_counts) {
      console.log('✅ PASS - Protocol counts available for filtering');
      console.log('   Protocols:', Object.keys(data.protocol_counts).join(', '));
      Object.entries(data.protocol_counts).forEach(([proto, count]) => {
        console.log(`   ${proto}: ${count} attacks`);
      });
      passedTests++;
    } else {
      console.log('❌ FAIL - Protocol counts missing');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 9: Port Counts (for filtering)
  console.log('\n[TEST 9] Port Counts (Dashboard Filtering Data)');
  try {
    const response = await fetch(`${API}/api/stats`);
    const data = await response.json();
    if (response.ok && data.port_counts) {
      console.log('✅ PASS - Port counts available for filtering');
      console.log('   Ports:', Object.keys(data.port_counts).join(', '));
      Object.entries(data.port_counts).forEach(([port, count]) => {
        console.log(`   Port ${port}: ${count} attacks`);
      });
      passedTests++;
    } else {
      console.log('❌ FAIL - Port counts missing');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Test 10: Geo API (for extension map)
  console.log('\n[TEST 10] Geo API Endpoint');
  try {
    const response = await fetch(`${API}/api/geo?ip=8.8.8.8`);
    const data = await response.json();
    if (response.ok) {
      console.log('✅ PASS - Geo API endpoint responding');
      if (data.error) {
        console.log('   Note: External geo service may be rate-limited (expected)');
      } else {
        console.log(`   Location data available for IP lookups`);
      }
      passedTests++;
    } else {
      console.log('❌ FAIL - Geo API not responding');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Features are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the failures above.');
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Test extension popup in Chrome browser');
  console.log('   2. Test dashboard filtering at http://localhost:5173');
  console.log('   3. Verify real-time updates and WebSocket connection');
  console.log('   4. Check UI/UX and responsiveness');
  console.log('\n   See MANUAL_TESTING_GUIDE.md for detailed testing instructions.');
}

testAllFeatures().catch(console.error);
