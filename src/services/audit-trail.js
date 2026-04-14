// src/services/audit-trail.js
// Audit Trail service for immutable logging

class AuditTrail {
  constructor() {
    this.logs = [];
    this.retentionPeriod = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
  }

  /**
   * Log an event to the audit trail
   * @param {object} eventData - Event data to log
   * @returns {string} Log entry ID
   */
  logEvent(eventData) {
    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const logEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      ...eventData
    };
    
    this.logs.push(logEntry);
    
    console.log(`Audit event logged: ${logId}`);
    return logId;
  }

  /**
   * Get logs for a specific case
   * @param {string} caseId - Case identifier
   * @returns {Array} Case logs
   */
  getCaseLogs(caseId) {
    return this.logs.filter(log => log.caseId === caseId);
  }

  /**
   * Get logs by user
   * @param {string} userId - User identifier
   * @returns {Array} User logs
   */
  getUserLogs(userId) {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get logs by time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {Array} Logs in time range
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Purge old logs based on retention policy
   * @param {number} retentionDays - Retention period in days
   * @returns {number} Number of purged logs
   */
  purgeOldLogs(retentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    
    return initialCount - this.logs.length;
  }

  /**
   * Export audit trail for compliance
   * @param {object} options - Export options
   * @returns {object} Export data
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

  /**
   * Get all logs
   * @returns {Array} All logs
   */
  getAllLogs() {
    return this.logs;
  }

  /**
   * Get log statistics
   * @returns {object} Log statistics
   */
  getLogStatistics() {
    const stats = {
      totalLogs: this.logs.length,
      logTypes: {},
      userActivity: {}
    };
    
    this.logs.forEach(log => {
      // Count log types
      const type = log.type || 'unknown';
      stats.logTypes[type] = (stats.logTypes[type] || 0) + 1;
      
      // Count user activity
      if (log.userId) {
        stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
      }
    });
    
    return stats;
  }
}

module.exports = AuditTrail;