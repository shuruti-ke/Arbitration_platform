'use strict';
// src/services/oracle-database-service.js
// Oracle Database service for Oracle Cloud Autonomous Database (Free Tier)

const oracledb = require('oracledb');
// oracledb v6+ defaults to Thin mode (no Oracle Instant Client required).

class OracleDatabaseService {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  async initOracleDatabase() {
    const { oracle } = this.config.database;
    if (!oracle || !oracle.user || !oracle.password || !oracle.connectString) {
      console.warn('Oracle DB credentials not fully configured — skipping Oracle init');
      return false;
    }

    try {
      const poolConfig = {
        user: oracle.user,
        password: oracle.password,
        connectString: oracle.connectString,
        poolMin: 1,
        poolMax: 10,
        poolIncrement: 1
      };

      // Wallet required for Oracle Autonomous Database mTLS connections
      if (oracle.walletLocation) {
        poolConfig.walletLocation = oracle.walletLocation;
        if (oracle.walletPassword) {
          poolConfig.walletPassword = oracle.walletPassword;
        }
      }

      this.pool = await oracledb.createPool(poolConfig);
      console.log('Oracle Database connection pool initialized');
      await this.initTables();
      return true;
    } catch (error) {
      console.error('Failed to initialize Oracle Database:', error.message);
      return false;
    }
  }

  async executeQuery(sql, params = {}, options = {}) {
    if (!this.pool) {
      throw new Error('Oracle connection pool not initialized');
    }
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.execute(sql, params, {
        autoCommit: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options
      });
      return result;
    } finally {
      await conn.close();
    }
  }

  // Create tables — Oracle 19c does not support IF NOT EXISTS, so we catch ORA-00955
  async _createTableSafe(name, ddl) {
    try {
      await this.executeQuery(ddl);
      console.log(`Table ${name} created`);
    } catch (error) {
      if (error.errorNum === 955) {
        // ORA-00955: name already used by an existing object
        console.log(`Table ${name} already exists, skipping`);
      } else {
        console.error(`Failed to create table ${name}:`, error.message);
        throw error;
      }
    }
  }

  async initTables() {
    await this._createTableSafe('USERS', `
      CREATE TABLE users (
        id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id       VARCHAR2(100) UNIQUE NOT NULL,
        email         VARCHAR2(255) UNIQUE NOT NULL,
        password_hash VARCHAR2(255) NOT NULL,
        first_name    VARCHAR2(100),
        last_name     VARCHAR2(100),
        role          VARCHAR2(50) NOT NULL,
        is_active     NUMBER(1) DEFAULT 1,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('ARBITRATOR_ASSIGNMENTS', `
      CREATE TABLE arbitrator_assignments (
        id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        assignment_id   VARCHAR2(100) UNIQUE NOT NULL,
        case_id         VARCHAR2(100) NOT NULL,
        arbitrator_id   VARCHAR2(100) NOT NULL,
        role            VARCHAR2(50),
        appointed_by    VARCHAR2(100),
        status          VARCHAR2(50) DEFAULT 'pending_acceptance',
        assigned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at     TIMESTAMP,
        declined_at     TIMESTAMP
      )
    `);

    await this._createTableSafe('HEARINGS', `
      CREATE TABLE hearings (
        id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        hearing_id    VARCHAR2(100) UNIQUE NOT NULL,
        case_id       VARCHAR2(100) NOT NULL,
        title         VARCHAR2(255),
        scheduled_by  VARCHAR2(100),
        start_time    VARCHAR2(50),
        end_time      VARCHAR2(50),
        type          VARCHAR2(50) DEFAULT 'virtual',
        agenda        CLOB,
        jitsi_room    VARCHAR2(255),
        status        VARCHAR2(50) DEFAULT 'scheduled',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('HEARING_PARTICIPANTS', `
      CREATE TABLE hearing_participants (
        id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        hearing_id  VARCHAR2(100) NOT NULL,
        user_id     VARCHAR2(100) NOT NULL,
        role        VARCHAR2(50),
        joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this._createTableSafe('CASES', `
      CREATE TABLE cases (
        id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        case_id    VARCHAR2(50)  UNIQUE NOT NULL,
        title      VARCHAR2(255),
        status     VARCHAR2(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('DOCUMENTS', `
      CREATE TABLE documents (
        id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        case_id          VARCHAR2(50),
        document_name    VARCHAR2(255),
        document_content BLOB,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('AUDIT_LOGS', `
      CREATE TABLE audit_logs (
        id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        log_id     VARCHAR2(100) UNIQUE NOT NULL,
        case_id    VARCHAR2(50),
        user_id    VARCHAR2(100),
        action     VARCHAR2(100),
        event_type VARCHAR2(100),
        details    CLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('CONSENTS', `
      CREATE TABLE consents (
        id           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        consent_id   VARCHAR2(100) UNIQUE NOT NULL,
        user_id      VARCHAR2(100)  NOT NULL,
        purpose      VARCHAR2(100),
        consent_data CLOB,
        revoked      NUMBER(1)   DEFAULT 0,
        revoked_at   TIMESTAMP,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // --- Cases ---

  async storeCaseData(caseData) {
    const sql = `
      INSERT INTO cases (case_id, title, status)
      VALUES (:caseId, :title, :status)
    `;
    await this.executeQuery(sql, {
      caseId: caseData.caseId,
      title: caseData.title || null,
      status: caseData.status || 'pending'
    });
    return { success: true, caseId: caseData.caseId };
  }

  async getCaseById(caseId) {
    const result = await this.executeQuery(
      'SELECT * FROM cases WHERE case_id = :caseId',
      { caseId }
    );
    return result.rows[0] || null;
  }

  // --- Documents ---

  async storeDocument(documentData) {
    const sql = `
      INSERT INTO documents (case_id, document_name, document_content)
      VALUES (:caseId, :documentName, :documentContent)
    `;
    const content = documentData.content
      ? Buffer.from(documentData.content)
      : null;
    await this.executeQuery(sql, {
      caseId: documentData.caseId || null,
      documentName: documentData.name || null,
      documentContent: content
    });
    return { success: true };
  }

  // --- Audit Logs ---

  async logAuditEvent(logEntry) {
    const sql = `
      INSERT INTO audit_logs (log_id, case_id, user_id, action, event_type, details)
      VALUES (:logId, :caseId, :userId, :action, :eventType, :details)
    `;
    await this.executeQuery(sql, {
      logId: logEntry.id,
      caseId: logEntry.caseId || null,
      userId: logEntry.userId || null,
      action: logEntry.action || null,
      eventType: logEntry.type || null,
      details: JSON.stringify(logEntry)
    });
  }

  async getAuditLogs(filters = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = {};

    if (filters.caseId) {
      sql += ' AND case_id = :caseId';
      params.caseId = filters.caseId;
    }
    if (filters.userId) {
      sql += ' AND user_id = :userId';
      params.userId = filters.userId;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await this.executeQuery(sql, params);
    return result.rows || [];
  }

  // --- Consents ---

  async recordConsent(consentId, userId, purpose, consentData) {
    const sql = `
      INSERT INTO consents (consent_id, user_id, purpose, consent_data)
      VALUES (:consentId, :userId, :purpose, :consentData)
    `;
    await this.executeQuery(sql, {
      consentId,
      userId,
      purpose: purpose || null,
      consentData: JSON.stringify(consentData)
    });
  }

  async hasConsent(userId, purpose) {
    const result = await this.executeQuery(
      `SELECT COUNT(*) AS CNT FROM consents
       WHERE user_id = :userId AND purpose = :purpose AND revoked = 0`,
      { userId, purpose }
    );
    return result.rows[0].CNT > 0;
  }

  async revokeConsent(consentId) {
    const result = await this.executeQuery(
      `UPDATE consents SET revoked = 1, revoked_at = CURRENT_TIMESTAMP
       WHERE consent_id = :consentId`,
      { consentId }
    );
    return result.rowsAffected > 0;
  }

  async getUserConsents(userId) {
    const result = await this.executeQuery(
      'SELECT * FROM consents WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    return result.rows || [];
  }

  // --- Lifecycle ---

  async closePool() {
    if (this.pool) {
      await this.pool.close(10);
      this.pool = null;
      console.log('Oracle connection pool closed');
    }
  }

  isConnected() {
    return this.pool !== null;
  }
}

module.exports = OracleDatabaseService;
