// test/ai-conflict-test.js
// Test script for AI Conflict Scanner

const AIConflictScanner = require('../src/services/ai-conflict-scanner');
const WORMStorage = require('../src/services/worm-storage');
const AuditTrail = require('../src/services/audit-trail');

console.log('Testing AI Conflict Scanner, WORM Storage, and Audit Trail...');

// Test AI Conflict Scanner
const aiConflictScanner = new AIConflictScanner();

// Test case data
const testCaseData = {
  caseId: "CASE-2026-001",
  parties: [
    { id: "party-1", name: "Acme Corporation" },
    { id: "party-2", name: "Global Industries" }
  ],
  entities: [
    { id: "entity-1", name: "John Smith" },
    { id: "entity-2", name: "Jane Doe" }
  ]
};

console.log('Testing AI Conflict Scanner...');
aiConflictScanner.scanForConflicts(testCaseData)
  .then(result => {
    console.log('Conflict scan result:', result);
  })
  .catch(error => {
    console.error('Conflict scan error:', error);
  });

// Test WORM Storage
const wormStorage = new WORMStorage();

console.log('Testing WORM Storage...');
try {
  const storageResult = wormStorage.storeDocument("doc-001", {
    content: "Sample document content",
    author: "Test User",
    caseId: "CASE-2026-001"
  });
  
  console.log('Document stored:', storageResult);
  
  // Try to store the same document again (should fail)
  try {
    wormStorage.storeDocument("doc-001", {
      content: "Modified content",
      author: "Test User"
    });
  } catch (error) {
    console.log('WORM protection working - cannot modify existing document');
  }
} catch (error) {
  console.error('WORM storage error:', error.message);
}

// Test Audit Trail
const auditTrail = new AuditTrail();

console.log('Testing Audit Trail...');
const logId = auditTrail.logEvent({
  type: "document_access",
  userId: "user-123",
  caseId: "CASE-2026-001",
  documentId: "doc-001",
  action: "view"
});

console.log('Audit event logged with ID:', logId);

// Test audit trail export
const exportData = auditTrail.exportAuditTrail({
  caseId: "CASE-2026-001"
});

console.log('Audit trail export:', exportData);

console.log('AI Conflict, WORM Storage, and Audit Trail tests completed');