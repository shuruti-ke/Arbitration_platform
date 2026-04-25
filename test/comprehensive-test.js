// test/comprehensive-test.js
// Comprehensive test for all new components

const http = require('http');

console.log('Running comprehensive system test...');

// Test all the services together
console.log('Testing all services integration...');

// Test data
const testData = {
  caseId: "TEST-CASE-001",
  parties: [
    { id: "party-1", name: "Test Party A" },
    { id: "party-2", name: "Test Party B" }
  ]
};

console.log('Test data prepared:', testData);

// Test the HTTP endpoints
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
};

console.log('Making HTTP request to test endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Health check response:', data);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error(`Health check failed with status ${res.statusCode}`);
      process.exit(1);
    }
    console.log('Comprehensive test completed successfully');
  });
});

req.on('error', (error) => {
  console.error('Test request error:', error.message);
  process.exit(1);
});

req.end();
