// src/services/ai-optout-service.js
// AI opt-out service for per-case AI assistance control

class AIOptOutService {
  constructor() {
    this.optOuts = new Map();
  }

  /**
   * Set AI opt-out for a case
   * @param {string} caseId - Case identifier
   * @param {object} optOutData - Opt-out data
   * @returns {string} Opt-out ID
   */
  setOptOut(caseId, optOutData) {
    const optOutId = 'optout-' + Math.random().toString(36).substr(2, 9);
    
    this.optOuts.set(optOutId, {
      caseId: caseId,
      optOutData: optOutData,
      timestamp: new Date().toISOString(),
      reason: optOutData.reason || 'user_preference',
      arbitratorId: optOutData.arbitratorId || null
    });
    
    console.log(`AI opt-out set for case ${caseId}: ${optOutId}`);
    return optOutId;
  }

  /**
   * Check if AI is opted out for a case
   * @param {string} caseId - Case identifier
   * @returns {boolean} Whether AI is opted out
   */
  isOptedOut(caseId) {
    // In a real implementation, this would check against stored opt-outs
    // For now, we'll simulate a check
    return false;
  }

  /**
   * Get opt-out status for a case
   * @param {string} caseId - Case identifier
   * @returns {object} Opt-out status
   */
  getOptOutStatus(caseId) {
    // Find opt-outs for this case
    for (const [id, optOut] of this.optOuts) {
      if (optOut.caseId === caseId) {
        return {
          optedOut: true,
          optOutId: id,
          reason: optOut.reason,
          timestamp: optOut.timestamp
        };
      }
    }
    
    return {
      optedOut: false,
      reason: null
    };
  }

  /**
   * Remove opt-out for a case
   * @param {string} caseId - Case identifier
   * @returns {boolean} Whether opt-out was removed
   */
  removeOptOut(caseId) {
    // Find and remove opt-outs for this case
    let removed = false;
    
    for (const [id, optOut] of this.optOuts) {
      if (optOut.caseId === caseId) {
        this.optOuts.delete(id);
        removed = true;
      }
    }
    
    return removed;
  }
}

module.exports = AIOptOutService;