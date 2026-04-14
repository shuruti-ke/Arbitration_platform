// test/award-test.js
// Test script for award certification

const http = require('http');

// Test data
const awardData = {
  caseId: "CASE-2026-001",
  arbitrators: [
    {
      name: "Dr. Jane Smith",
      role: "Chair",
      signature: "signature-hash-123"
    }
  ],
  seat: "Kenya",
  aiLevel: "scaffolding",
  aiOptOut: false
};

// Make a request to the award certification endpoint
const postData = JSON.stringify(awardData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/award/certify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing award certification endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status code:', res.statusCode);
    console.log('Response data:', data);
    console.log('Award certification test completed');
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();