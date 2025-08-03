const fetch = require('node-fetch');

async function testConnection() {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  
  console.log('🔍 Testing backend connection...');
  console.log(`📍 Testing URL: ${baseUrl}`);
  
  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test CSRF token endpoint
    console.log('\n2️⃣ Testing CSRF token endpoint...');
    const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`, {
      credentials: 'include'
    });
    
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      console.log('✅ CSRF token received:', csrfData.csrfToken ? 'Yes' : 'No');
    } else {
      console.log('❌ CSRF token failed:', csrfResponse.status);
    }
    
    console.log('\n🎉 Connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure the backend server is running (cd server && npm start)');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify the backend URL is correct');
  }
}

testConnection(); 