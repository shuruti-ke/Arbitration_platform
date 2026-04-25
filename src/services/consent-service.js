// src/services/consent-service.js
// Consent management service for PII handling and compliance

const STRICT_DB = process.env.NODE_ENV === 'production';

class ConsentService {
  /**
   * @param {object|null} dbService - OracleDatabaseService instance (optional)
   */
  constructor(dbService = null) {
    this.dbService = dbService;
    this.consents = new Map(); // in-memory store / cache
  }

  /**
   * Record consent for data processing.
   * Persists to Oracle DB when connected.
   * @param {string} userId
   * @param {object} consentData
   * @returns {Promise<string>} Consent ID
   */
  async recordConsent(userId, consentData) {
    const consentId = 'consent-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const purpose = consentData.purpose || 'e-signature';

    const entry = {
      userId,
      consentData,
      purpose,
      timestamp: new Date().toISOString(),
      revoked: false
    };

    this.consents.set(consentId, entry);

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.recordConsent(consentId, userId, purpose, consentData);
      } catch (error) {
        console.error(`Consent DB write failed for ${consentId}:`, error.message);
        if (STRICT_DB) throw error;
      }
    } else if (STRICT_DB) {
      throw new Error('Consent DB is not connected');
    }

    console.log(`Consent recorded for user ${userId}: ${consentId}`);
    return consentId;
  }

  /**
   * Check if a user has active consent for a given purpose.
   * Uses Oracle DB when connected; falls back to in-memory Map.
   * @param {string} userId
   * @param {string} purpose
   * @returns {Promise<boolean>}
   */
  async hasConsent(userId, purpose) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        return await this.dbService.hasConsent(userId, purpose);
      } catch (error) {
        console.error('Consent DB check failed:', error.message);
        if (STRICT_DB) throw error;
      }
    } else if (STRICT_DB) {
      throw new Error('Consent DB is not connected');
    }

    // In-memory fallback: check the Map
    for (const entry of this.consents.values()) {
      if (
        entry.userId === userId &&
        (entry.purpose === purpose || !purpose) &&
        !entry.revoked
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Revoke consent by ID.
   * @param {string} consentId
   * @returns {Promise<boolean>}
   */
  async revokeConsent(consentId) {
    const entry = this.consents.get(consentId);
    if (entry) {
      entry.revoked = true;
      entry.revokedAt = new Date().toISOString();
      this.consents.set(consentId, entry);
    }

    if (this.dbService && this.dbService.isConnected()) {
      try {
        return await this.dbService.revokeConsent(consentId);
      } catch (error) {
        console.error(`Consent revocation DB write failed for ${consentId}:`, error.message);
        if (STRICT_DB) throw error;
      }
    } else if (STRICT_DB) {
      throw new Error('Consent DB is not connected');
    }

    return entry !== undefined;
  }

  /**
   * Get all consents for a user.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserConsents(userId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        return await this.dbService.getUserConsents(userId);
      } catch (error) {
        console.error('Consent DB read failed:', error.message);
        if (STRICT_DB) throw error;
      }
    } else if (STRICT_DB) {
      throw new Error('Consent DB is not connected');
    }

    const results = [];
    for (const [consentId, entry] of this.consents) {
      if (entry.userId === userId) {
        results.push({ consentId, ...entry });
      }
    }
    return results;
  }
}

module.exports = ConsentService;
