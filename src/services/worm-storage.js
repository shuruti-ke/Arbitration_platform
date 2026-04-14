// src/services/worm-storage.js
// WORM (Write-Once-Read-Many) Document Storage service

class WORMStorage {
  constructor() {
    this.documents = new Map();
    this.documentHashes = new Map();
  }

  /**
   * Store a document with WORM protection
   * @param {string} documentId - Document identifier
   * @param {object} documentData - Document data
   * @returns {object} Storage result
   */
  storeDocument(documentId, documentData) {
    // Check if document already exists (WORM protection)
    if (this.documents.has(documentId)) {
      throw new Error(`Document ${documentId} already exists and cannot be modified (WORM protection)`);
    }
    
    // Store the document
    const storedAt = new Date().toISOString();
    this.documents.set(documentId, {
      ...documentData,
      storedAt: storedAt,
      isLocked: true
    });
    
    // Generate and store hash for integrity verification
    const documentHash = this.generateHash(JSON.stringify(documentData));
    this.documentHashes.set(documentId, documentHash);
    
    return {
      documentId: documentId,
      storedAt: storedAt,
      hash: documentHash,
      success: true
    };
  }

  /**
   * Retrieve a document
   * @param {string} documentId - Document identifier
   * @returns {object} Document data
   */
  getDocument(documentId) {
    const document = this.documents.get(documentId);
    if (!document) {
      return null;
    }
    
    return {
      ...document,
      retrievedAt: new Date().toISOString()
    };
  }

  /**
   * Verify document integrity using hash
   * @param {string} documentId - Document identifier
   * @returns {boolean} Whether document is valid
   */
  verifyDocumentIntegrity(documentId) {
    const document = this.documents.get(documentId);
    if (!document) {
      return false;
    }
    
    const storedHash = this.documentHashes.get(documentId);
    if (!storedHash) {
      return false;
    }
    
    const currentHash = this.generateHash(JSON.stringify(document));
    return storedHash === currentHash;
  }

  /**
   * Generate hash for document verification
   * @param {string} data - Data to hash
   * @returns {string} Hash
   */
  generateHash(data) {
    // In a real implementation, this would use a cryptographic hash function
    // For simulation, we'll use a simple approach
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * List all stored documents
   * @returns {Array} Document identifiers
   */
  listDocuments() {
    return Array.from(this.documents.keys());
  }

  /**
   * Get document metadata
   * @param {string} documentId - Document identifier
   * @returns {object} Document metadata
   */
  getDocumentMetadata(documentId) {
    const document = this.documents.get(documentId);
    if (!document) {
      return null;
    }
    
    return {
      documentId: documentId,
      storedAt: document.storedAt,
      isLocked: document.isLocked,
      hash: this.documentHashes.get(documentId)
    };
  }
}

module.exports = WORMStorage;