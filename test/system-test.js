// test/system-test.js
// Comprehensive system test

const http = require('http');

const HOST = 'localhost';
const PORT = 3000;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@rafikihr.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin@2026!';

function request(path, { method = 'GET', token = null, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = http.request({ hostname: HOST, port: PORT, path, method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assertStatus(label, response, expectedStatus = 200) {
  if (response.statusCode === expectedStatus) return;
  console.error(`${label} failed with status ${response.statusCode}:`, response.data);
  process.exit(1);
}

async function main() {
  console.log('Running comprehensive system test...');

  console.log('Test 1: Health check');
  const health = await request('/api/health');
  console.log('Health check response:', health.data);
  assertStatus('Health check', health);

  console.log('Test 2: Admin login');
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });
  console.log('Login status:', login.statusCode);
  assertStatus('Admin login', login);

  let token;
  try {
    token = JSON.parse(login.data).accessToken;
  } catch (error) {
    console.error('Login response was not valid JSON:', error.message);
    process.exit(1);
  }
  if (!token) {
    console.error('Login response did not include accessToken');
    process.exit(1);
  }

  console.log('Test 3: Models endpoint');
  const models = await request('/api/models', { token });
  console.log('Models response:', models.data);
  assertStatus('Models endpoint', models);

  console.log('Test 4: Rules endpoint');
  const rules = await request('/api/rules', { token });
  console.log('Rules response:', rules.data);
  assertStatus('Rules endpoint', rules);

  console.log('Test 5: CA providers endpoint');
  const caProviders = await request('/api/ca/providers', { token });
  console.log('CA providers response:', caProviders.data);
  assertStatus('CA providers endpoint', caProviders);

  console.log('System test completed successfully');
}

main().catch((error) => {
  console.error('System test failed:', error.message);
  process.exit(1);
});
