// src/controllers/e-signature-controller.js
// Controller for e-signature operations

const CertificateAuthorityService = require('../services/ca-service');
const HSMService = require('../services/hsm-service');
const ConsentService = require('../services/consent-service');
const AIMetadataService = require('../services/ai-metadata-service');
const AIOptOutService = require('../services/ai-optout-service');

class ESignatureController {
  constructor() {
    this.caService = new CertificateAuthorityService();
    this.hsmService = new HSMService();
    this.consentService = new ConsentService();
    this.aiMetadataService = new AIMetadataService();
    this.aiOptOutService = new AIOptOutService();
  }

  /**
   * Process document for electronic signature
   * @param {object} documentData - Document data
   * @param {object} userData - User data
   * @returns {Promise<object>} Signing result
   */
  async processDocumentForSigning(documentData, userData) {
    // Check if user has given consent
    const hasConsent = this.consentService.hasConsent(userData.userId, 'e-signature');
    
    if (!hasConsent) {
      throw new Error('User consent required for e-signature');
    }
    
    // Check if AI is opted out for this case
    const optOutStatus = this.aiOptOutService.getOptOutStatus(documentData.caseId);
    
    // Hash the document
    const documentHash = this.hsmService.hashDocument(documentData.content);
    
    // Generate keys if needed
    const keyPair = this.hsmService.generateKeyPair();
    
    // Sign the document
    const signature = this.hsmService.signData(documentData.content, keyPair.privateKey);
    
    // Request CA signing
    const caResult = await this.caService.requestSigning({
      id: documentData.id,
      hash: documentHash
    }, 'ICS Limited');
    
    return {
      success: true,
      documentId: documentData.id,
      documentHash: documentHash,
      signature: signature,
      caSignature: caResult.signature,
      caCertificate: caResult.certificate,
      optOutStatus: optOutStatus,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate tribunal certification with AI metadata
   * @param {string} caseId - Case identifier
   * @returns {object} Certification with AI metadata
   */
  generateCertificationWithMetadata(caseId) {
    // Get AI metadata for the case
    const metadata = this.aiMetadataService.getCaseMetadata(caseId);
    
    // Get opt-out status
    const optOutStatus = this.aiOptOutService.getOptOutStatus(caseId);
    
    return {
      certification: {
        caseId: caseId,
        aiMetadata: metadata,
        optOutStatus: optOutStatus,
        generatedAt: new Date().toISOString(),
        certificationId: 'cert-' + Math.random().toString(36).substr(2, 5)
      }
    };
  }

  /**
   * Validate certificate
   * @param {string} certificate - Certificate to validate
   * @returns {Promise<object>} Validation result
   */
  async validateCertificate(certificate) {
    return await this.caService.validateCertificate(certificate);
  }

  /**
   * Summarize signing readiness for a production legal document
   * @param {object} documentData
   * @returns {object}
   */
  getSigningReadiness(documentData = {}) {
    const providerList = this.caService.getProviders ? this.caService.getProviders() : [];
    return {
      productionReady: false,
      requiresTrustedProvider: true,
      providers: providerList,
      recommendedPath: 'Use a certificate-backed signing provider and keep the signed PDF in the case file.',
      fallbackPath: 'If a provider is unavailable, generate the PDF, obtain a wet signature, and upload the signed copy.',
      documentType: documentData.type || 'legal document',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ESignatureController;
