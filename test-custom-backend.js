const https = require('https');

// Replace this with your actual backend URL from Render dashboard
const BACKEND_URL = 'https://YOUR-BACKEND-URL.onrender.com';

async function testCustomBackend() {
  console.log('🔍 Testing custom backend URL...');
  console.log(`📍 Backend URL: ${BACKEND_URL}`);
  
  if (BACKEND_URL.includes('YOUR-BACKEND-URL')) {
    console.log('\n❌ Please update the BACKEND_URL in this file first!');
    console.log('1. Open test-custom-backend.js');
    console.log('2. Replace YOUR-BACKEND-URL with your actual backend URL');
    console.log('3. Run this script again');
    return;
  }
  
  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest(`${BACKEND_URL}/api/health`);
    console.log('✅ Health check response:', healthResponse);
    
    // Test CSRF token endpoint
    console.log('\n2️⃣ Testing CSRF token endpoint...');
    const csrfResponse = await makeRequest(`${BACKEND_URL}/api/csrf-token`);
    console.log('✅ CSRF token response:', csrfResponse);
    
    // Test room creation
    console.log('\n3️⃣ Testing room creation...');
    const roomResponse = await makeRequest(`${BACKEND_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: 'TestUser',
        password: 'TestPass123!'
      })
    });
    console.log('✅ Room creation response:', roomResponse);
    
    console.log('\n🎉 Backend is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('1. Update Netlify environment variables:');
    console.log(`   REACT_APP_API_URL=${BACKEND_URL}`);
    console.log(`   REACT_APP_SOCKET_URL=${BACKEND_URL}`);
    console.log('2. Redeploy frontend');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if backend is deployed on Render');
    console.log('2. Verify the backend URL is correct');
    console.log('3. Check Render logs for any errors');
    console.log('4. Make sure environment variables are set in Render');
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

testCustomBackend(); 