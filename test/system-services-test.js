// test/system-services-test.js
// Test script for system services

const CertificateValidationService = require('../src/services/certificate-validation');
const NYConventionValidator = require('../src/services/ny-convention-validator');
const MetricsDashboard = require('../src/services/metrics-dashboard');
const OfflineSyncService = require('../src/services/offline-sync');

console.log('Testing system services...');

// Test Certificate Validation Service
const certValidator = new CertificateValidationService();

console.log('Testing Certificate Validation Service...');
const certValidation = certValidator.validateCertificate({
  id: 'test-cert-001',
  issuer: 'Test CA',
  subject: 'Test Subject'
});

certValidation.then(result => {
  console.log('Certificate validation result:', result);
});

// Test NY Convention Validator
const nyValidator = new NYConventionValidator();

console.log('Testing NY Convention Validator...');
const awardData = {
  id: 'award-001',
  format: 'written',
  signatures: ['sig-001'],
  seat: 'Kenya',
  reasoning: 'Detailed reasoning',
  attachments: ['att-001']
};

const nyValidation = nyValidator.validateAward(awardData);
console.log('NY Convention validation result:', nyValidation);

// Test Metrics Dashboard
const metricsDashboard = new MetricsDashboard();

console.log('Testing Metrics Dashboard...');
const metricId = metricsDashboard.collectMetrics({
  type: 'system_health',
  value: 95
});

console.log('Metrics collected with ID:', metricId);

const complianceMetrics = metricsDashboard.getComplianceMetrics();
console.log('Compliance metrics:', complianceMetrics);

// Test Offline Sync Service
const offlineSync = new OfflineSyncService();

console.log('Testing Offline Sync Service...');
const queueId = offlineSync.queueForSync({
  data: 'test data',
  priority: 'high'
});

console.log('Data queued with ID:', queueId);

const syncResults = offlineSync.processSyncQueue();
console.log('Sync results:', syncResults);

console.log('System services test completed');