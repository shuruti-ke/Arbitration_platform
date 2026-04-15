// src/services/audit-trail.js
// Audit Trail service — persists to Oracle DB with in-memory fallback

class AuditTrail {
  /**
   * @param {object|null} dbService - OracleDatabaseService instance (optional)
   */
  constructor(dbService = null) {
    this.dbService = dbService;
    this.logs = []; // in-memory fallback / cache
    this.retentionPeriod = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years
  }

  /**
   * Log an event to the audit trail.
   * Persists to Oracle DB when connected; falls back to in-memory.
   * @param {object} eventData
   * @returns {Promise<string>} Log entry ID
   */
  async logEvent(eventData) {
    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const logEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      ...eventData
    };

    // Always keep in memory for fast reads within this session
    this.logs.push(logEntry);

    // Persist to Oracle when available
    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.logAuditEvent(logEntry);
      } catch (error) {
        console.error(`Audit log DB write failed for ${logId}:`, error.message);
        // Entry stays in memory; don't throw — audit failure must not break request flow
      }
    }

    console.log(`Audit event logged: ${logId}`);
    return logId;
  }

  /**
   * Get logs for a specific case.
   * Queries Oracle DB when connected; falls back to in-memory cache.
   * @param {string} caseId
   * @returns {Promise<Array>}
   */
  async getCaseLogs(caseId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        return await this.dbService.getAuditLogs({ caseId });
      } catch (error) {
        console.error('DB read failed, using in-memory fallback:', error.message);
      }
    }
    return this.logs.filter(log => log.caseId === caseId);
  }

  /**
   * Get logs by user.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserLogs(userId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        return await this.dbService.getAuditLogs({ userId });
      } catch (error) {
        console.error('DB read failed, using in-memory fallback:', error.message);
      }
    }
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get logs by time range (in-memory only — use DB queries for large ranges).
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns {Array}
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Purge old logs from the in-memory cache.
   * Does NOT delete from Oracle DB (use DB-level retention policies for that).
   * @param {number} retentionDays
   * @returns {number} Number of purged entries
   */
  purgeOldLogs(retentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    return initialCount - this.logs.length;
  }

  /**
   * Export audit trail for compliance.
   * @param {object} options - { caseId, startTime, endTime }
   * @returns {object}
   */
  exportAuditTrail(options = {}) {
    const { caseId, startTime, endTime } = options;
    let filteredLogs = this.logs;

    if (caseId) {
      filteredLogs = filteredLogs.filter(log => log.caseId === caseId);
    }
    if (startTime && endTime) {
      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= startTime && logTime <= endTime;
      });
    }

    return {
      logs: filteredLogs,
      exportTimestamp: new Date().toISOString(),
      totalLogs: filteredLogs.length
    };
  }

  getAllLogs() {
    return this.logs;
  }

  getLogStatistics() {
    const stats = {
      totalLogs: this.logs.length,
      logTypes: {},
      userActivity: {}
    };
    this.logs.forEach(log => {
      const type = log.type || 'unknown';
      stats.logTypes[type] = (stats.logTypes[type] || 0) + 1;
      if (log.userId) {
        stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
      }
    });
    return stats;
  }
}

module.exports = AuditTrail;
