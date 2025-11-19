async function testUrlSubmit() {
  try {
    const response = await fetch('http://localhost:4000/api/submit-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' })
    });
    
    const result = await response.json();
    console.log('Submit URL Response:', result);
    
    // Test getting submitted URLs
    const getResponse = await fetch('http://localhost:4000/api/submitted-urls');
    const urls = await getResponse.json();
    console.log('Submitted URLs:', urls);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUrlSubmit();
