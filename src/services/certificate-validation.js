// src/services/certificate-validation.js
// Certificate validation service
// NOTE: This validates certificate structure and expiry locally.
// For production, replace validateCertificate() with real OCSP/CRL network calls
// to your CA's responder endpoint.

class CertificateValidationService {
  constructor() {
    this.validationCache = new Map();
  }

  /**
   * Validate a certificate by checking its structure and expiry.
   * @param {object} certificate - { id, issuer, subject, notBefore, notAfter, ... }
   * @returns {Promise<object>} Validation result
   */
  async validateCertificate(certificate) {
    const now = new Date();
    const issues = [];

    if (!certificate) {
      return { certificateId: null, valid: false, issues: ['No certificate provided'] };
    }

    // Check required fields
    if (!certificate.issuer) issues.push('Missing issuer');
    if (!certificate.subject) issues.push('Missing subject');

    // Check validity window
    if (certificate.notBefore) {
      const notBefore = new Date(certificate.notBefore);
      if (now < notBefore) issues.push('Certificate not yet valid');
    }
    if (certificate.notAfter) {
      const notAfter = new Date(certificate.notAfter);
      if (now > notAfter) issues.push('Certificate has expired');
    }

    // Check explicit revocation flag (set by revokeInCache)
    const cached = this.validationCache.get(certificate.id);
    if (cached && cached.revoked) {
      issues.push('Certificate has been revoked');
    }

    const valid = issues.length === 0;

    return {
      certificateId: certificate.id,
      valid,
      validationTime: now.toISOString(),
      issues,
      details: {
        issuer: certificate.issuer || 'Unknown Issuer',
        subject: certificate.subject || 'Unknown Subject',
        notBefore: certificate.notBefore || null,
        notAfter: certificate.notAfter || null,
        // Placeholder statuses — replace with real OCSP/CRL calls in production
        ocspStatus: valid ? 'good' : 'unknown',
        crlStatus: valid ? 'not_revoked' : 'unknown'
      }
    };
  }

  /**
   * Validate a certificate chain.
   * Validates each certificate in the provided chain array.
   * @param {object} certificate - Certificate with optional chain array
   * @returns {Promise<object>} Chain validation result
   */
  async validateCertificateChain(certificate) {
    const leafResult = await this.validateCertificate(certificate);
    const chain = certificate.chain || [];
    const chainResults = await Promise.all(chain.map(c => this.validateCertificate(c)));
    const chainValid = leafResult.valid && chainResults.every(r => r.valid);

    return {
      certificate,
      chainValid,
      leafValid: leafResult.valid,
      chain: chainResults
    };
  }

  /**
   * Check revocation status by certificate ID.
   * Checks local cache. In production, call the CA's OCSP responder.
   * @param {string} certificateId
   * @returns {Promise<object>}
   */
  async checkRevocationStatus(certificateId) {
    const cached = this.validationCache.get(certificateId);
    const revoked = cached ? !!cached.revoked : false;

    return {
      certificateId,
      revoked,
      reason: revoked ? (cached.revokedReason || 'unspecified') : null,
      checkTime: new Date().toISOString()
    };
  }

  /**
   * Mark a certificate as revoked in the local cache.
   * @param {string} certificateId
   * @param {string} reason
   */
  revokeInCache(certificateId, reason = 'unspecified') {
    this.validationCache.set(certificateId, {
      revoked: true,
      revokedReason: reason,
      revokedAt: new Date().toISOString()
    });
  }
}

module.exports = CertificateValidationService;
