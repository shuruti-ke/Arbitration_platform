// src/services/disclosure-workflow.js
// Disclosure Workflow service for managing conflict disclosures

class DisclosureWorkflowService {
  constructor() {
    this.disclosures = new Map();
    this.timers = new Map();
    this.challenges = new Map();
  }

  /**
   * Create a new disclosure request
   * @param {object} disclosureData - Disclosure data
   * @returns {string} Disclosure ID
   */
  createDisclosure(disclosureData) {
    const disclosureId = 'disclosure-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    this.disclosures.set(disclosureId, {
      id: disclosureId,
      ...disclosureData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    // Set SLA timer if required
    if (disclosureData.slaHours) {
      this.setSLATimer(disclosureId, disclosureData.slaHours);
    }
    
    console.log(`Disclosure created: ${disclosureId}`);
    return disclosureId;
  }

  /**
   * Set SLA timer for a disclosure
   * @param {string} disclosureId - Disclosure ID
   * @param {number} hours - SLA hours
   */
  setSLATimer(disclosureId, hours) {
    // In a real implementation, this would set up actual timers
    // For now, we'll just store the SLA information
    
    const timerId = 'timer-' + disclosureId;
    this.timers.set(timerId, {
      disclosureId: disclosureId,
      slaHours: hours,
      expiresAt: new Date(Date.now() + (hours * 60 * 60 * 1000)).toISOString()
    });
    
    console.log(`SLA timer set for disclosure ${disclosureId}: ${hours} hours`);
  }

  /**
   * Update disclosure status
   * @param {string} disclosureId - Disclosure ID
   * @param {string} status - New status
   * @param {object} updateData - Additional update data
   */
  updateDisclosureStatus(disclosureId, status, updateData = {}) {
    const disclosure = this.disclosures.get(disclosureId);
    if (disclosure) {
      disclosure.status = status;
      disclosure.updatedAt = new Date().toISOString();
      
      if (updateData.response) {
        disclosure.response = updateData.response;
      }
      
      this.disclosures.set(disclosureId, disclosure);
      console.log(`Disclosure ${disclosureId} status updated to ${status}`);
    }
  }

  /**
   * Get pending disclosures
   * @returns {Array} Pending disclosures
   */
  getPendingDisclosures() {
    const pending = [];
    
    for (const [id, disclosure] of this.disclosures) {
      if (disclosure.status === 'pending') {
        pending.push(disclosure);
      }
    }
    
    return pending;
  }

  /**
   * Get SLA violations
   * @returns {Array} SLA violations
   */
  getSLAViolations() {
    const violations = [];
    const now = new Date().getTime();
    
    for (const [id, timer] of this.timers) {
      const expiresAt = new Date(timer.expiresAt).getTime();
      if (now > expiresAt) {
        violations.push({
          timerId: id,
          disclosureId: timer.disclosureId,
          expiredAt: timer.expiresAt
        });
      }
    }
    
    return violations;
  }

  /**
   * Get disclosure by ID
   * @param {string} disclosureId - Disclosure ID
   * @returns {object} Disclosure data
   */
  getDisclosure(disclosureId) {
    return this.disclosures.get(disclosureId);
  }

  /**
   * Get all disclosures
   * @returns {Array} All disclosures
   */
  getAllDisclosures() {
    return Array.from(this.disclosures.values());
  }

  /**
   * Create a challenge linked to a disclosure
   * @param {string} disclosureId
   * @param {object} challengeData
   * @returns {string} Challenge ID
   */
  createChallenge(disclosureId, challengeData = {}) {
    const challengeId = 'challenge-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const challenge = {
      id: challengeId,
      disclosureId,
      status: 'pending',
      grounds: challengeData.grounds || [],
      reason: challengeData.reason || '',
      submittedBy: challengeData.submittedBy || null,
      submittedAt: new Date().toISOString(),
      updatedAt: null,
      resolution: null
    };

    this.challenges.set(challengeId, challenge);
    console.log(`Challenge created: ${challengeId} for disclosure ${disclosureId}`);
    return challengeId;
  }

  /**
   * Update challenge status
   * @param {string} challengeId
   * @param {string} status
   * @param {object} resolution
   */
  updateChallengeStatus(challengeId, status, resolution = {}) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return;

    challenge.status = status;
    challenge.updatedAt = new Date().toISOString();
    if (resolution && Object.keys(resolution).length > 0) {
      challenge.resolution = resolution;
    }

    this.challenges.set(challengeId, challenge);
  }

  /**
   * Get all challenges
   * @returns {Array}
   */
  getAllChallenges() {
    return Array.from(this.challenges.values());
  }

  /**
   * Get challenges for a disclosure
   * @param {string} disclosureId
   * @returns {Array}
   */
  getChallengesForDisclosure(disclosureId) {
    return Array.from(this.challenges.values()).filter((challenge) => challenge.disclosureId === disclosureId);
  }
}

module.exports = DisclosureWorkflowService;
