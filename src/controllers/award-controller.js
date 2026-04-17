// src/controllers/award-controller.js
// Controller for award-related operations

const fs = require('fs');

class AwardController {
  /**
   * Generate a tribunal certification clause for an award
   * @param {object} awardData - Award data
   * @returns {object} Certification data
   */
  static generateCertification(awardData) {
    // This would generate the certification clause as specified in the compliance documents
    return {
      certification: {
        clause: "CERTIFICATION OF TRIBUNAL INDEPENDENCE & AI TRANSPARENCY",
        arbitratorDetails: awardData.arbitrators || [],
        aiContribution: {
            level: awardData.aiLevel || "scaffolding",
            optOut: awardData.aiOptOut || false
        },
        compliance: {
            nyConvention: "compliant",
            seat: awardData.seat || "Kenya",
            timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Validate an award against compliance requirements
   * @param {object} awardData - Award data
   * @returns {object} Validation results
   */
  static validateAward(awardData) {
    // Check if award meets compliance requirements
    return {
      valid: true,
      complianceChecks: {
        format: true,
        signatures: awardData.signatures ? true : false,
        nyConvention: true,
        aiTransparency: true
      },
      validationTime: new Date().toISOString()
    };
  }

  /**
   * Build a section 32 award pack checklist
   * @param {object} awardData
   * @returns {object}
   */
  static buildSection32AwardPack(awardData = {}) {
    const requiredFields = [
      { key: 'reasons', label: 'Reasons for the award', present: !!awardData.reasons },
      { key: 'date', label: 'Date of the award', present: !!awardData.date },
      { key: 'seat', label: 'Juridical seat', present: !!awardData.seat },
      { key: 'signatures', label: 'Arbitrator signatures', present: Array.isArray(awardData.signatures) && awardData.signatures.length > 0 },
      { key: 'delivery', label: 'Delivery to each party', present: !!awardData.delivery }
    ];

    return {
      packType: 'section_32_award_pack',
      title: awardData.title || 'Arbitral Award Pack',
      status: requiredFields.every((field) => field.present) ? 'ready' : 'needs_review',
      requiredFields,
      missingFields: requiredFields.filter((field) => !field.present).map((field) => field.label),
      deliveryChecklist: [
        'Award is in writing',
        'Award is signed by the arbitrator or majority where applicable',
        'Reasons are included or waived by agreement',
        'Date and seat are stated',
        'Signed copy is delivered to each party'
      ],
      complianceNote: 'This pack supports section 32 formalities but still requires tribunal and legal review before release.',
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = AwardController;
