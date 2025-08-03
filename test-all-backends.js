const https = require('https');

async function testAllBackends() {
  const possibleUrls = [
    'https://chattrix-backend.onrender.com',
    'https://chattrix-chat-app.onrender.com',
    'https://chattrix-backend-xyz.onrender.com',
    'https://chattrix-chat-app-backend.onrender.com'
  ];
  
  console.log('🔍 Testing all possible backend URLs...\n');
  
  for (const url of possibleUrls) {
    console.log(`📍 Testing: ${url}`);
    
    try {
      const response = await makeRequest(`${url}/api/health`);
      console.log('✅ SUCCESS! Backend found at:', url);
      console.log('Response:', response);
      console.log('---');
      
      // Test CSRF endpoint
      try {
        const csrfResponse = await makeRequest(`${url}/api/csrf-token`);
        console.log('✅ CSRF endpoint working');
      } catch (csrfError) {
        console.log('⚠️ CSRF endpoint not working');
      }
      
      return url; // Found working backend
      
    } catch (error) {
      console.log('❌ Not found or error:', error.message);
      console.log('---');
    }
  }
  
  console.log('\n❌ No working backend found!');
  console.log('\n💡 Please check:');
  console.log('1. Go to Render.com dashboard');
  console.log('2. Find your backend service');
  console.log('3. Copy the correct URL');
  console.log('4. Update the environment variables');
  
  return null;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
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
  });
}

testAllBackends().then((workingUrl) => {
  if (workingUrl) {
    console.log(`\n🎉 Working backend found: ${workingUrl}`);
    console.log('\n📝 Next steps:');
    console.log('1. Update Netlify environment variables:');
    console.log(`   REACT_APP_API_URL=${workingUrl}`);
    console.log(`   REACT_APP_SOCKET_URL=${workingUrl}`);
    console.log('2. Redeploy frontend');
  }
}); 