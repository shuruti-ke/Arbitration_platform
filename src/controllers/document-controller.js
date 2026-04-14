// src/controllers/document-controller.js
// Document Controller for managing documents and conflicts

const AIConflictScanner = require('../services/ai-conflict-scanner');
const WORMStorage = require('../services/worm-storage');
const AuditTrail = require('../services/audit-trail');

class DocumentController {
  constructor() {
    this.aiConflictScanner = new AIConflictScanner();
    this.wormStorage = new WORMStorage();
    this.auditTrail = new AuditTrail();
  }

  /**
   * Process case documents for conflict scanning
   * @param {object} caseData - Case data to process
   * @returns {Promise<object>} Processing result
   */
  async processCaseDocuments(caseData) {
    // Log the access
    this.auditTrail.logEvent({
      type: "document_processing",
      caseId: caseData.caseId,
      timestamp: new Date().toISOString(),
      action: "process_case_documents"
    });
    
    // Scan for conflicts
    const conflictResult = await this.aiConflictScanner.scanForConflicts(caseData);
    
    // Store results in WORM storage if needed
    const storageResult = this.wormStorage.storeDocument(
      `conflict-analysis-${Date.now()}`, 
      conflictResult
    );
    
    return {
      conflictResult: conflictResult,
      storageResult: storageResult
    };
  }

  /**
   * Store document with WORM protection
   * @param {string} documentId - Document ID
   * @param {object} documentData - Document data
   * @returns {object} Storage result
   */
  storeDocumentWORM(documentId, documentData) {
    // Log the storage operation
    this.auditTrail.logEvent({
      type: "document_storage",
      documentId: documentId,
      timestamp: new Date().toISOString(),
      action: "worm_storage"
    });
    
    return this.wormStorage.storeDocument(documentId, documentData);
  }

  /**
   * Scan case for conflicts
   * @param {object} caseData - Case data to scan
   * @returns {Promise<object>} Conflict analysis
   */
  async scanCaseForConflicts(caseData) {
    // Log the scan operation
    this.auditTrail.logEvent({
      type: "conflict_scan_request",
      caseId: caseData.caseId,
      timestamp: new Date().toISOString(),
      action: "ai_conflict_scan"
    });
    
    return await this.aiConflictScanner.scanForConflicts(caseData);
  }
}

module.exports = DocumentController;