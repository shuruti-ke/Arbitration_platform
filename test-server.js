// test/server-test.js
// Simple test script to verify the server is working

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Test completed');
  });
});

req.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});

req.end();