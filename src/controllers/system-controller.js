// src/controllers/system-controller.js
// System Controller for managing system services

const CertificateValidationService = require('../services/certificate-validation');
const NYConventionValidator = require('../services/ny-convention-validator');
const MetricsDashboard = require('../services/metrics-dashboard');
const OfflineSyncService = require('../services/offline-sync');

class SystemController {
  constructor() {
    this.certificateValidator = new CertificateValidationService();
    this.nyValidator = new NYConventionValidator();
    this.metricsDashboard = new MetricsDashboard();
    this.offlineSync = new OfflineSyncService();
  }

  /**
   * Validate certificate with OCSP/CRL
   * @param {object} certificate - Certificate to validate
   * @returns {Promise<object>} Validation result
   */
  async validateCertificate(certificate) {
    return await this.certificateValidator.validateCertificate(certificate);
  }

  /**
   * Validate award against NY Convention requirements
   * @param {object} awardData - Award data
   * @returns {object} Validation result
   */
  validateNYConvention(awardData) {
    return this.nyValidator.validateAward(awardData);
  }

  /**
   * Collect system metrics
   * @param {object} metricData - Metric data
   * @returns {object} Collected metrics
   */
  collectSystemMetrics(metricData) {
    return this.metricsDashboard.collectMetrics(metricData);
  }

  /**
   * Queue data for offline sync
   * @param {object} data - Data to sync
   * @returns {string} Queue ID
   */
  queueForOfflineSync(data) {
    return this.offlineSync.queueForSync(data);
  }

  /**
   * Get system health status
   * @returns {object} Health status
   */
  getSystemHealth() {
    return this.metricsDashboard.getSystemHealth();
  }

  /**
   * Get compliance metrics
   * @returns {object} Compliance metrics
   */
  getComplianceMetrics() {
    return this.metricsDashboard.getComplianceMetrics();
  }
}

module.exports = SystemController;