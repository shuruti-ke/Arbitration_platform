// test/e-signature-test.js
// Test script for e-signature components

const CertificateAuthorityService = require('../src/services/ca-service');
const HSMService = require('../src/services/hsm-service');
const ConsentService = require('../src/services/consent-service');
const AIMetadataService = require('../src/services/ai-metadata-service');
const AIOptOutService = require('../src/services/ai-optout-service');

console.log('Testing e-signature components...');

(async () => {
  // Test Certificate Authority Service
  const caService = new CertificateAuthorityService();
  console.log('CA Providers:', caService.getProviders());

  // Test HSM Service
  const hsmService = new HSMService();
  const keyPair = hsmService.generateKeyPair();
  console.log('HSM Key Pair generated:', keyPair.algorithm);

  const testData = 'Test document for signing';
  const hash = hsmService.hashDocument(testData);
  console.log('Document hash:', hash);

  const signature = hsmService.signData(testData, keyPair.privateKey);
  console.log('Document signed with signature:', signature);

  // Test Consent Service
  const consentService = new ConsentService();
  const consentId = await consentService.recordConsent('user-123', {
    purpose: 'e-signature',
    scope: 'document_signing'
  });
  console.log('Consent recorded with ID:', consentId);

  // Test AI Metadata Service
  const aiMetadataService = new AIMetadataService();
  const metadataId = aiMetadataService.captureMetadata('case-456', {
    modelVersion: '1.2.0',
    prompt: 'Generate award conclusion',
    output: 'The tribunal concludes that...'
  });
  console.log('AI metadata captured with ID:', metadataId);

  // Test AI Opt-Out Service
  const aiOptOutService = new AIOptOutService();
  const optOutId = aiOptOutService.setOptOut('case-456', {
    reason: 'arbitrator_preference',
    arbitratorId: 'arb-789'
  });
  console.log('AI opt-out set with ID:', optOutId);

  console.log('E-signature components test completed successfully');
})().catch(error => {
  console.error('E-signature components test failed:', error);
  process.exitCode = 1;
});
