// src/controllers/compliance-controller.js
// Compliance Controller for managing compliance services

const DisclosureWorkflowService = require('../services/disclosure-workflow');
const RiskMonitoringService = require('../services/risk-monitoring');
const ODPCComplianceService = require('../services/odpc-compliance');

class ComplianceController {
  constructor() {
    this.disclosureWorkflow = new DisclosureWorkflowService();
    this.riskMonitoring = new RiskMonitoringService();
    this.odpcCompliance = new ODPCComplianceService();
  }

  /**
   * Create disclosure request
   * @param {object} disclosureData - Disclosure data
   * @returns {string} Disclosure ID
   */
  createDisclosure(disclosureData) {
    return this.disclosureWorkflow.createDisclosure(disclosureData);
  }

  /**
   * Generate compliance report
   * @param {object} reportData - Report data
   * @returns {string} Report ID
   */
  generateComplianceReport(reportData) {
    return this.odpcCompliance.generateComplianceReport(reportData);
  }

  /**
   * Check system risks
   * @param {object} riskData - Risk data
   * @returns {object} Risk assessment
   */
  checkSystemRisks(riskData) {
    // Check different types of risks
    let riskAssessment = {};
    
    if (riskData.caStatus) {
      riskAssessment.caRisk = this.riskMonitoring.checkCADowntimeRisk(riskData.caStatus);
    }
    
    if (riskData.aiStatus) {
      riskAssessment.aiRisk = this.riskMonitoring.checkAIDriftRisk(riskData.aiStatus);
    }
    
    if (riskData.syncStatus) {
      riskAssessment.syncRisk = this.riskMonitoring.checkSyncFailureRisk(riskData.syncStatus);
    }
    
    return riskAssessment;
  }

  /**
   * Get compliance statistics
   * @returns {object} Compliance statistics
   */
  getComplianceStats() {
    return {
      disclosureStats: this.disclosureWorkflow.getAllDisclosures().length,
      riskStats: this.riskMonitoring.getRiskSummary(),
      odpcStats: this.odpcCompliance.getComplianceStats()
    };
  }
}

module.exports = ComplianceController;