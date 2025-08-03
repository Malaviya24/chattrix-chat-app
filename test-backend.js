const https = require('https');

async function testBackend() {
  const backendUrl = 'https://chattrix-backend.onrender.com';
  
  console.log('🔍 Testing backend connection...');
  console.log(`📍 Backend URL: ${backendUrl}`);
  
  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest(`${backendUrl}/api/health`);
    console.log('✅ Health check response:', healthResponse);
    
    // Test CSRF token endpoint
    console.log('\n2️⃣ Testing CSRF token endpoint...');
    const csrfResponse = await makeRequest(`${backendUrl}/api/csrf-token`);
    console.log('✅ CSRF token response:', csrfResponse);
    
    console.log('\n🎉 Backend is working correctly!');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if backend is deployed on Render');
    console.log('2. Verify the backend URL is correct');
    console.log('3. Check Render logs for any errors');
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

testBackend(); 