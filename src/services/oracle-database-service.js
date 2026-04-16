'use strict';
// src/services/oracle-database-service.js
// Oracle Database service for Oracle Cloud Autonomous Database (Free Tier)

const oracledb = require('oracledb');
// oracledb v6+ defaults to Thin mode (no Oracle Instant Client required).
oracledb.fetchAsString = [oracledb.CLOB];

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

  // Add column safely — catches ORA-01430 (column already exists)
  async _addColumnSafe(table, column, definition) {
    try {
      await this.executeQuery(`ALTER TABLE ${table} ADD (${column} ${definition})`);
    } catch (error) {
      if (error.errorNum !== 1430) throw error;
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

    await this._createTableSafe('AI_INTELLIGENCE_REPORTS', `
      CREATE TABLE ai_intelligence_reports (
        id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        report_id     VARCHAR2(100) UNIQUE NOT NULL,
        report_type   VARCHAR2(50) NOT NULL,
        case_id       VARCHAR2(50),
        scope_key     VARCHAR2(255),
        requester_id  VARCHAR2(100),
        requester_role VARCHAR2(50),
        title         VARCHAR2(255),
        summary       CLOB,
        analysis_json CLOB,
        metrics_json  CLOB,
        question      CLOB,
        period_days   NUMBER,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Expand CASES table with comprehensive arbitration fields
    await this._addColumnSafe('cases', 'case_type', 'VARCHAR2(100)');
    await this._addColumnSafe('cases', 'sector', 'VARCHAR2(100)');
    await this._addColumnSafe('cases', 'dispute_category', 'VARCHAR2(100)');
    await this._addColumnSafe('cases', 'description', 'CLOB');
    await this._addColumnSafe('cases', 'dispute_amount', 'NUMBER');
    await this._addColumnSafe('cases', 'currency', 'VARCHAR2(10)');
    await this._addColumnSafe('cases', 'governing_law', 'VARCHAR2(255)');
    await this._addColumnSafe('cases', 'seat_of_arbitration', 'VARCHAR2(255)');
    await this._addColumnSafe('cases', 'arbitration_rules', 'VARCHAR2(100)');
    await this._addColumnSafe('cases', 'language_of_proceedings', 'VARCHAR2(100)');
    await this._addColumnSafe('cases', 'institution_ref', 'VARCHAR2(100)');
    await this._addColumnSafe('cases', 'filing_date', 'DATE');
    await this._addColumnSafe('cases', 'response_deadline', 'DATE');
    await this._addColumnSafe('cases', 'case_stage', 'VARCHAR2(50) DEFAULT \'filing\'');
    await this._addColumnSafe('cases', 'num_arbitrators', 'NUMBER(1) DEFAULT 1');
    await this._addColumnSafe('cases', 'confidentiality_level', 'VARCHAR2(50) DEFAULT \'confidential\'');
    await this._addColumnSafe('cases', 'third_party_funding', 'NUMBER(1) DEFAULT 0');

    // Expand DOCUMENTS table with category, description, text_content for AI
    await this._addColumnSafe('documents', 'category', 'VARCHAR2(100) DEFAULT \'Other\'');
    await this._addColumnSafe('documents', 'description', 'VARCHAR2(500)');
    await this._addColumnSafe('documents', 'text_content', 'CLOB');
    // access_level: 'global' = Platform Library (all users + AI), 'case' = case-specific
    await this._addColumnSafe('documents', 'access_level', 'VARCHAR2(20) DEFAULT \'case\'');
    await this._addColumnSafe('documents', 'uploaded_by', 'VARCHAR2(100)');

    // Parties table
    await this._createTableSafe('PARTIES', `
      CREATE TABLE parties (
        id                NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        party_id          VARCHAR2(100) UNIQUE NOT NULL,
        case_id           VARCHAR2(50) NOT NULL,
        party_type        VARCHAR2(20) NOT NULL,
        entity_type       VARCHAR2(50),
        full_name         VARCHAR2(255) NOT NULL,
        organization_name VARCHAR2(255),
        nationality       VARCHAR2(100),
        address           CLOB,
        email             VARCHAR2(255),
        phone             VARCHAR2(50),
        tax_id            VARCHAR2(100),
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Case counsel table
    await this._createTableSafe('CASE_COUNSEL', `
      CREATE TABLE case_counsel (
        id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        counsel_id VARCHAR2(100) UNIQUE NOT NULL,
        case_id    VARCHAR2(50) NOT NULL,
        party_id   VARCHAR2(100),
        full_name  VARCHAR2(255) NOT NULL,
        law_firm   VARCHAR2(255),
        email      VARCHAR2(255),
        phone      VARCHAR2(50),
        bar_number VARCHAR2(100),
        role       VARCHAR2(50),
        languages  VARCHAR2(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Case milestones table
    await this._createTableSafe('CASE_MILESTONES', `
      CREATE TABLE case_milestones (
        id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        milestone_id   VARCHAR2(100) UNIQUE NOT NULL,
        case_id        VARCHAR2(50) NOT NULL,
        milestone_type VARCHAR2(100),
        title          VARCHAR2(255),
        due_date       DATE,
        completed_date DATE,
        status         VARCHAR2(50) DEFAULT 'pending',
        notes          CLOB,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // NCIA / Submission fields
    await this._addColumnSafe('cases', 'arbitrator_nominee', 'VARCHAR2(255)');
    await this._addColumnSafe('cases', 'nominee_qualifications', 'CLOB');
    await this._addColumnSafe('cases', 'relief_sought', 'CLOB');
    await this._addColumnSafe('cases', 'service_confirmed', 'NUMBER(1) DEFAULT 0');
    await this._addColumnSafe('cases', 'filing_fee', 'NUMBER');
    await this._addColumnSafe('cases', 'filing_fee_currency', "VARCHAR2(10) DEFAULT 'KES'");
    await this._addColumnSafe('cases', 'submission_status', "VARCHAR2(50) DEFAULT 'draft'");
    await this._addColumnSafe('cases', 'submitted_at', 'TIMESTAMP');
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
