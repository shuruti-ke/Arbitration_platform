// test/compliance-services-test.js
// Test script for compliance services

const DisclosureWorkflowService = require('../src/services/disclosure-workflow');
const RiskMonitoringService = require('../src/services/risk-monitoring');
const ODPCComplianceService = require('../src/services/odpc-compliance');

console.log('Testing compliance services...');

// Test Disclosure Workflow Service
const disclosureWorkflow = new DisclosureWorkflowService();

console.log('Testing Disclosure Workflow Service...');
const disclosureId = disclosureWorkflow.createDisclosure({
  caseId: 'test-case-001',
  parties: ['party-1', 'party-2'],
  slaHours: 48
});

console.log('Disclosure created with ID:', disclosureId);

// Test Risk Monitoring Service
const riskMonitoring = new RiskMonitoringService();

console.log('Testing Risk Monitoring Service...');
const riskAlertId = riskMonitoring.generateAlert({
  type: 'test_alert',
  message: 'Test risk alert',
  severity: 'medium'
});

console.log('Risk alert generated with ID:', riskAlertId);

// Check risks
const riskAssessment = riskMonitoring.checkCADowntimeRisk({
  failureRate: 0.03
});

console.log('Risk assessment result:', riskAssessment);

// Test ODPC Compliance Service
const odpcCompliance = new ODPCComplianceService();

console.log('Testing ODPC Compliance Service...');
const reportId = odpcCompliance.generateComplianceReport({
  period: 'Q1-2026',
  scope: 'full_system'
});

console.log('Compliance report generated with ID:', reportId);

// Check data residency
const residencyCheck = odpcCompliance.checkDataResidency('Nairobi', 'Nairobi');
console.log('Data residency check:', residencyCheck);

// Test compliance statistics
const complianceStats = odpcCompliance.getComplianceStats();
console.log('Compliance statistics:', complianceStats);

console.log('Compliance services test completed');