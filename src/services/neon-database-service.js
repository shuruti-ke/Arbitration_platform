'use strict';
// src/services/neon-database-service.js
// PostgreSQL (Neon) drop-in replacement for OracleDatabaseService.
// Same public interface — all callers continue to work unchanged.

const { Pool } = require('pg');

// Convert Oracle-style named params (:name) to PostgreSQL positional ($1, $2, ...)
function convertParams(sql, params = {}) {
  const values = [];
  const nameToIndex = {};
  const converted = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    if (!(name in nameToIndex)) {
      nameToIndex[name] = values.length + 1;
      values.push(params[name] !== undefined ? params[name] : null);
    }
    return `$${nameToIndex[name]}`;
  });
  return { sql: converted, values };
}

// Normalize Oracle-specific SQL to PostgreSQL
function normalizeSql(sql) {
  let out = sql
    .replace(/\bNVL\s*\(/gi, 'COALESCE(')
    .replace(/\bVARCHAR2\b/gi, 'VARCHAR')
    .replace(/\bCLOB\b/gi, 'TEXT')
    .replace(/\bBLOB\b/gi, 'BYTEA')
    .replace(/\s+FROM\s+dual\b/gi, '');

  // AND ROWNUM <= N  →  remove from WHERE, append LIMIT at end
  let rownumLimit = null;
  out = out.replace(/\s+AND\s+ROWNUM\s*<=\s*(\d+)/gi, (_, n) => {
    rownumLimit = n;
    return '';
  });
  if (rownumLimit !== null) {
    out = out.trimEnd().replace(/;$/, '') + ` LIMIT ${rownumLimit}`;
  }

  return out;
}

// Normalize DDL (CREATE TABLE / ADD COLUMN definitions)
function normalizeDdl(ddl) {
  return ddl
    .replace(/\bVARCHAR2\b/gi, 'VARCHAR')
    .replace(/\bCLOB\b/gi, 'TEXT')
    .replace(/\bBLOB\b/gi, 'BYTEA')
    .replace(/\bNUMBER\s*\(\s*1\s*\)/gi, 'SMALLINT')
    .replace(/\bNUMBER\s*\(\s*2\s*\)/gi, 'SMALLINT')
    .replace(/\bNUMBER\s*\(\s*(\d+)\s*\)/gi, 'NUMERIC($1)')
    .replace(/\bNUMBER\b/gi, 'NUMERIC')
    .replace(/(?:NUMBER|INTEGER)\s+GENERATED\s+ALWAYS\s+AS\s+IDENTITY/gi, 'SERIAL');
}

// Return rows with uppercase keys to match Oracle OUT_FORMAT_OBJECT behaviour
function uppercaseRows(rows) {
  return rows.map(row => {
    const out = {};
    for (const [k, v] of Object.entries(row)) out[k.toUpperCase()] = v;
    return out;
  });
}

class NeonDatabaseService {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  async initNeonDatabase() {
    const url = process.env.DATABASE_URL || this.config.database?.neon?.url;
    if (!url) {
      console.warn('DATABASE_URL not set — skipping Neon init');
      return false;
    }
    try {
      this.pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 10 });
      await this.pool.query('SELECT 1');
      console.log('Neon (PostgreSQL) connection pool initialized');
      await this.initTables();
      return true;
    } catch (error) {
      console.error('Failed to initialize Neon Database:', error.message);
      return false;
    }
  }

  async executeQuery(sql, params = {}, _options = {}) {
    if (!this.pool) throw new Error('Neon connection pool not initialized');
    // Skip Oracle PL/SQL blocks — tables are already created in initTables()
    if (/^\s*BEGIN\b/i.test(sql)) return { rows: [], rowsAffected: 0 };
    const normalized = normalizeSql(sql);
    const { sql: converted, values } = convertParams(normalized, params);
    const result = await this.pool.query(converted, values);
    return {
      rows: uppercaseRows(result.rows),
      rowsAffected: result.rowCount
    };
  }

  async _createTableSafe(name, ddl) {
    const pgDdl = normalizeDdl(ddl)
      .replace(/CREATE TABLE(?!\s+IF\s+NOT\s+EXISTS)\s+(\w+)/gi, 'CREATE TABLE IF NOT EXISTS $1');
    try {
      await this.pool.query(pgDdl);
      console.log(`Table ${name} ready`);
    } catch (error) {
      console.error(`Failed to create table ${name}:`, error.message);
      throw error;
    }
  }

  // Ensure the id column has an auto-generate default (repairs tables created without one)
  async _ensureIdSequence(table) {
    try {
      const { rows } = await this.pool.query(`
        SELECT data_type, column_default, identity_generation
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'
      `, [table]);
      if (!rows.length) return;
      const { data_type, column_default, identity_generation } = rows[0];
      if (column_default || identity_generation) return; // already set
      if (data_type === 'uuid') {
        await this.pool.query(`ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT gen_random_uuid()`);
      } else {
        await this.pool.query(`CREATE SEQUENCE IF NOT EXISTS ${table}_id_seq`);
        await this.pool.query(`ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT nextval('${table}_id_seq')`);
        await this.pool.query(`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id::text::bigint) FROM ${table}), 0) + 1, false)`);
      }
    } catch (e) {
      console.error(`id sequence repair failed for ${table}:`, e.message);
    }
  }

  async _addColumnSafe(table, column, definition) {
    const pgDef = normalizeDdl(definition);
    try {
      await this.pool.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${pgDef}`
      );
    } catch (error) {
      console.error(`Failed to add column ${column} to ${table}:`, error.message);
      throw error;
    }
  }

  async initTables() {
    await this._createTableSafe('users', `
      CREATE TABLE users (
        id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id       VARCHAR(100) UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name    VARCHAR(100),
        last_name     VARCHAR(100),
        role          VARCHAR(50) NOT NULL,
        is_active     SMALLINT DEFAULT 1,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Drop NOT NULL from all non-key users columns (handles any legacy schema)
    try {
      const { rows: userCols } = await this.pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND is_nullable = 'NO' AND column_name NOT IN ('id','user_id','email','role')
      `);
      for (const { column_name } of userCols) {
        try { await this.pool.query(`ALTER TABLE users ALTER COLUMN "${column_name}" DROP NOT NULL`); } catch (_) {}
      }
    } catch (_) {}
    // Ensure all users columns exist (idempotent — safe on re-runs)
    await this._addColumnSafe('users', 'password_hash', 'VARCHAR(255)');
    await this._addColumnSafe('users', 'first_name', 'VARCHAR(100)');
    await this._addColumnSafe('users', 'last_name', 'VARCHAR(100)');
    await this._addColumnSafe('users', 'is_active', 'SMALLINT DEFAULT 1');
    try {
      await this.pool.query(`ALTER TABLE users ALTER COLUMN is_active TYPE SMALLINT USING is_active::int`);
    } catch (_) { /* already correct type */ }

    await this._createTableSafe('arbitrator_assignments', `
      CREATE TABLE IF NOT EXISTS arbitrator_assignments (
        id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        assignment_id   VARCHAR(100) UNIQUE NOT NULL,
        case_id         VARCHAR(100) NOT NULL,
        arbitrator_id   VARCHAR(100) NOT NULL,
        role            VARCHAR(50),
        appointed_by    VARCHAR(100),
        status          VARCHAR(50) DEFAULT 'pending_acceptance',
        assigned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at     TIMESTAMP,
        declined_at     TIMESTAMP
      )
    `);

    await this._createTableSafe('hearings', `
      CREATE TABLE IF NOT EXISTS hearings (
        id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        hearing_id    VARCHAR(100) UNIQUE NOT NULL,
        case_id       VARCHAR(100) NOT NULL,
        title         VARCHAR(255),
        scheduled_by  VARCHAR(100),
        start_time    VARCHAR(50),
        end_time      VARCHAR(50),
        type          VARCHAR(50) DEFAULT 'virtual',
        agenda        TEXT,
        jitsi_room    VARCHAR(255),
        status        VARCHAR(50) DEFAULT 'scheduled',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('hearing_participants', `
      CREATE TABLE IF NOT EXISTS hearing_participants (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        hearing_id  VARCHAR(100) NOT NULL,
        user_id     VARCHAR(100) NOT NULL,
        role        VARCHAR(50),
        joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('cases', `
      CREATE TABLE IF NOT EXISTS cases (
        id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        case_id    VARCHAR(50) UNIQUE NOT NULL,
        title      VARCHAR(255),
        status     VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('documents', `
      CREATE TABLE IF NOT EXISTS documents (
        id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        case_id          VARCHAR(50),
        document_name    VARCHAR(255),
        document_content BYTEA,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('audit_logs', `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        log_id     VARCHAR(100) UNIQUE NOT NULL,
        case_id    VARCHAR(50),
        user_id    VARCHAR(100),
        action     VARCHAR(100),
        event_type VARCHAR(100),
        details    TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('consents', `
      CREATE TABLE IF NOT EXISTS consents (
        id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        consent_id   VARCHAR(100) UNIQUE NOT NULL,
        user_id      VARCHAR(100) NOT NULL,
        purpose      VARCHAR(100),
        consent_data TEXT,
        revoked      SMALLINT DEFAULT 0,
        revoked_at   TIMESTAMP,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('ai_intelligence_reports', `
      CREATE TABLE IF NOT EXISTS ai_intelligence_reports (
        id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        report_id      VARCHAR(100) UNIQUE NOT NULL,
        report_type    VARCHAR(50) NOT NULL,
        case_id        VARCHAR(50),
        scope_key      VARCHAR(255),
        requester_id   VARCHAR(100),
        requester_role VARCHAR(50),
        title          VARCHAR(255),
        summary        TEXT,
        analysis_json  TEXT,
        metrics_json   TEXT,
        question       TEXT,
        period_days    NUMERIC,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('ai_document_analyses', `
      CREATE TABLE IF NOT EXISTS ai_document_analyses (
        id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        analysis_id       VARCHAR(100) UNIQUE NOT NULL,
        document_id       VARCHAR(50) NOT NULL,
        case_id           VARCHAR(50),
        prompt            TEXT,
        prompt_normalized TEXT,
        prompt_hash       VARCHAR(64),
        prompt_signature  TEXT,
        analysis_text     TEXT,
        analysis_summary  TEXT,
        keywords          TEXT,
        model_name        VARCHAR(120),
        language          VARCHAR(20),
        access_level      VARCHAR(20),
        created_by        VARCHAR(100),
        usage_count       NUMERIC DEFAULT 1,
        last_used_at      TIMESTAMP,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('rule_guidance_cache', `
      CREATE TABLE IF NOT EXISTS rule_guidance_cache (
        id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        cache_key           VARCHAR(64) UNIQUE NOT NULL,
        seat_of_arbitration VARCHAR(255),
        case_type           VARCHAR(100),
        arbitration_rules   VARCHAR(255),
        governing_law       VARCHAR(255),
        guidance_json       TEXT,
        guidance_summary    TEXT,
        model_name          VARCHAR(120),
        usage_count         NUMERIC DEFAULT 1,
        last_used_at        TIMESTAMP,
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('case_agreements', `
      CREATE TABLE IF NOT EXISTS case_agreements (
        id                      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        agreement_id            VARCHAR(100) UNIQUE NOT NULL,
        case_id                 VARCHAR(50),
        source_document_name    VARCHAR(255),
        source_document_type    VARCHAR(50) DEFAULT 'uploaded',
        template_name           VARCHAR(255),
        agreement_status        VARCHAR(50) DEFAULT 'draft',
        title                   VARCHAR(255),
        case_type               VARCHAR(100),
        sector                  VARCHAR(100),
        dispute_category        VARCHAR(100),
        description             TEXT,
        claimant_name           VARCHAR(255),
        claimant_org            VARCHAR(255),
        respondent_name         VARCHAR(255),
        respondent_org          VARCHAR(255),
        arbitrator_nominee      VARCHAR(255),
        nominee_qualifications  TEXT,
        seat_of_arbitration     VARCHAR(255),
        governing_law           VARCHAR(255),
        arbitration_rules       VARCHAR(255),
        language_of_proceedings VARCHAR(100),
        num_arbitrators         SMALLINT,
        confidentiality_level   VARCHAR(50),
        relief_sought           TEXT,
        extracted_summary       TEXT,
        extracted_json          TEXT,
        key_terms               TEXT,
        missing_info            TEXT,
        signed_at               TIMESTAMP,
        effective_date          DATE,
        created_by              VARCHAR(100),
        created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('case_agreement_parties', `
      CREATE TABLE IF NOT EXISTS case_agreement_parties (
        id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        agreement_id      VARCHAR(100) NOT NULL,
        party_role        VARCHAR(50) NOT NULL,
        full_name         VARCHAR(255),
        organization_name VARCHAR(255),
        email             VARCHAR(255),
        signature_status  VARCHAR(50) DEFAULT 'pending',
        signed_at         TIMESTAMP,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('case_agreement_signatures', `
      CREATE TABLE IF NOT EXISTS case_agreement_signatures (
        id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        agreement_id     VARCHAR(100) NOT NULL,
        signer_role      VARCHAR(50) NOT NULL,
        signer_name      VARCHAR(255),
        signature_status VARCHAR(50) DEFAULT 'pending',
        signature_method VARCHAR(100),
        signed_at        TIMESTAMP,
        signature_hash   VARCHAR(255),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('case_agreement_extractions', `
      CREATE TABLE IF NOT EXISTS case_agreement_extractions (
        id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        agreement_id         VARCHAR(100) NOT NULL,
        source_document_name VARCHAR(255),
        model_name           VARCHAR(120),
        extracted_json       TEXT,
        extracted_summary    TEXT,
        confidence           VARCHAR(20),
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Core identifier columns that may be missing from early-run tables
    await this._addColumnSafe('cases', 'case_id', 'VARCHAR(50)');
    await this._addColumnSafe('audit_logs', 'log_id', 'VARCHAR(100)');
    await this._addColumnSafe('audit_logs', 'event_type', 'VARCHAR(100)');
    await this._addColumnSafe('audit_logs', 'details', 'TEXT');

    // Cases — extra columns
    await this._addColumnSafe('cases', 'case_type', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'sector', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'dispute_category', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'description', 'TEXT');
    await this._addColumnSafe('cases', 'dispute_amount', 'NUMERIC');
    await this._addColumnSafe('cases', 'currency', 'VARCHAR(10)');
    await this._addColumnSafe('cases', 'governing_law', 'VARCHAR(255)');
    await this._addColumnSafe('cases', 'seat_of_arbitration', 'VARCHAR(255)');
    await this._addColumnSafe('cases', 'arbitration_rules', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'language_of_proceedings', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'institution_ref', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'filing_date', 'DATE');
    await this._addColumnSafe('cases', 'response_deadline', 'DATE');
    await this._addColumnSafe('cases', 'case_stage', "VARCHAR(50) DEFAULT 'filing'");
    await this._addColumnSafe('cases', 'num_arbitrators', 'SMALLINT DEFAULT 1');
    await this._addColumnSafe('cases', 'confidentiality_level', "VARCHAR(50) DEFAULT 'confidential'");
    await this._addColumnSafe('cases', 'third_party_funding', 'SMALLINT DEFAULT 0');
    await this._addColumnSafe('cases', 'arbitrator_nominee', 'VARCHAR(255)');
    await this._addColumnSafe('cases', 'nominee_qualifications', 'TEXT');
    await this._addColumnSafe('cases', 'relief_sought', 'TEXT');
    await this._addColumnSafe('cases', 'service_confirmed', 'SMALLINT DEFAULT 0');
    await this._addColumnSafe('cases', 'filing_fee', 'NUMERIC');
    await this._addColumnSafe('cases', 'filing_fee_currency', "VARCHAR(10) DEFAULT 'KES'");
    await this._addColumnSafe('cases', 'submission_status', "VARCHAR(50) DEFAULT 'draft'");
    await this._addColumnSafe('cases', 'submitted_at', 'TIMESTAMP');
    await this._addColumnSafe('cases', 'agreement_id', 'VARCHAR(100)');
    await this._addColumnSafe('cases', 'agreement_status', "VARCHAR(50) DEFAULT 'none'");
    await this._addColumnSafe('cases', 'agreement_document_name', 'VARCHAR(255)');
    await this._addColumnSafe('cases', 'rule_guidance_summary', 'TEXT');
    await this._addColumnSafe('cases', 'rule_guidance_json', 'TEXT');
    await this._addColumnSafe('cases', 'rule_guidance_model', 'VARCHAR(120)');
    await this._addColumnSafe('cases', 'rule_guidance_cache_key', 'VARCHAR(64)');
    await this._addColumnSafe('cases', 'rule_guidance_cached', 'SMALLINT DEFAULT 0');
    await this._addColumnSafe('cases', 'rule_guidance_source', 'VARCHAR(50)');
    await this._addColumnSafe('cases', 'rule_guidance_generated_at', 'TIMESTAMP');

    // Documents — extra columns
    await this._addColumnSafe('documents', 'category', "VARCHAR(100) DEFAULT 'Other'");
    await this._addColumnSafe('documents', 'description', 'VARCHAR(500)');
    await this._addColumnSafe('documents', 'text_content', 'TEXT');
    await this._addColumnSafe('documents', 'access_level', "VARCHAR(20) DEFAULT 'case'");
    await this._addColumnSafe('documents', 'uploaded_by', 'VARCHAR(100)');

    await this._createTableSafe('parties', `
      CREATE TABLE IF NOT EXISTS parties (
        id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        party_id          VARCHAR(100) UNIQUE NOT NULL,
        case_id           VARCHAR(50) NOT NULL,
        party_type        VARCHAR(20) NOT NULL,
        entity_type       VARCHAR(50),
        full_name         VARCHAR(255) NOT NULL,
        organization_name VARCHAR(255),
        nationality       VARCHAR(100),
        address           TEXT,
        email             VARCHAR(255),
        phone             VARCHAR(50),
        tax_id            VARCHAR(100),
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('case_counsel', `
      CREATE TABLE IF NOT EXISTS case_counsel (
        id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        counsel_id VARCHAR(100) UNIQUE NOT NULL,
        case_id    VARCHAR(50) NOT NULL,
        party_id   VARCHAR(100),
        full_name  VARCHAR(255) NOT NULL,
        law_firm   VARCHAR(255),
        email      VARCHAR(255),
        phone      VARCHAR(50),
        bar_number VARCHAR(100),
        role       VARCHAR(50),
        languages  VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this._createTableSafe('case_milestones', `
      CREATE TABLE IF NOT EXISTS case_milestones (
        id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        milestone_id   VARCHAR(100) UNIQUE NOT NULL,
        case_id        VARCHAR(50) NOT NULL,
        milestone_type VARCHAR(100),
        title          VARCHAR(255),
        due_date       DATE,
        completed_date DATE,
        status         VARCHAR(50) DEFAULT 'pending',
        notes          TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Repair id sequences on all tables (safe no-op if already correct)
    const allTables = [
      'users','arbitrator_assignments','hearings','hearing_participants','cases','documents',
      'audit_logs','consents','ai_intelligence_reports','ai_document_analyses',
      'rule_guidance_cache','case_agreements','case_agreement_parties',
      'case_agreement_signatures','case_agreement_extractions','parties','case_counsel','case_milestones'
    ];
    for (const t of allTables) await this._ensureIdSequence(t);
  }

  // --- Cases ---

  async storeCaseData(caseData) {
    await this.executeQuery(
      `INSERT INTO cases (case_id, title, status) VALUES (:caseId, :title, :status)`,
      { caseId: caseData.caseId, title: caseData.title || null, status: caseData.status || 'pending' }
    );
    return { success: true, caseId: caseData.caseId };
  }

  async getCaseById(caseId) {
    const result = await this.executeQuery(
      'SELECT * FROM cases WHERE case_id = :caseId',
      { caseId }
    );
    return result.rows[0] || null;
  }

  // --- Rule guidance cache (uses INSERT ON CONFLICT instead of Oracle MERGE) ---

  async getRuleGuidanceCache(cacheKey) {
    const result = await this.executeQuery(
      'SELECT * FROM rule_guidance_cache WHERE cache_key = :cacheKey',
      { cacheKey }
    );
    return result.rows[0] || null;
  }

  async saveRuleGuidanceCache(entry) {
    await this.pool.query(
      `INSERT INTO rule_guidance_cache
         (cache_key, seat_of_arbitration, case_type, arbitration_rules, governing_law,
          guidance_json, guidance_summary, model_name, usage_count, last_used_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,CURRENT_TIMESTAMP)
       ON CONFLICT (cache_key) DO UPDATE SET
         seat_of_arbitration = EXCLUDED.seat_of_arbitration,
         case_type           = EXCLUDED.case_type,
         arbitration_rules   = EXCLUDED.arbitration_rules,
         governing_law       = EXCLUDED.governing_law,
         guidance_json       = EXCLUDED.guidance_json,
         guidance_summary    = EXCLUDED.guidance_summary,
         model_name          = EXCLUDED.model_name,
         usage_count         = rule_guidance_cache.usage_count + 1,
         last_used_at        = CURRENT_TIMESTAMP`,
      [
        entry.cacheKey,
        entry.seatOfArbitration || null,
        entry.caseType || null,
        entry.arbitrationRules || null,
        entry.governingLaw || null,
        entry.guidanceJson || null,
        entry.guidanceSummary || null,
        entry.modelName || null
      ]
    );
  }

  // --- Documents ---

  async storeDocument(documentData) {
    const content = documentData.content ? Buffer.from(documentData.content) : null;
    await this.executeQuery(
      `INSERT INTO documents (case_id, document_name, document_content)
       VALUES (:caseId, :documentName, :documentContent)`,
      { caseId: documentData.caseId || null, documentName: documentData.name || null, documentContent: content }
    );
    return { success: true };
  }

  // --- Audit Logs ---

  async logAuditEvent(logEntry) {
    await this.executeQuery(
      `INSERT INTO audit_logs (log_id, case_id, user_id, action, event_type, details)
       VALUES (:logId, :caseId, :userId, :action, :eventType, :details)`,
      {
        logId: logEntry.id,
        caseId: logEntry.caseId || null,
        userId: logEntry.userId || null,
        action: logEntry.action || null,
        eventType: logEntry.type || null,
        details: JSON.stringify(logEntry)
      }
    );
  }

  async getAuditLogs(filters = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = {};
    if (filters.caseId) { sql += ' AND case_id = :caseId'; params.caseId = filters.caseId; }
    if (filters.userId) { sql += ' AND user_id = :userId'; params.userId = filters.userId; }
    sql += ' ORDER BY created_at DESC';
    const result = await this.executeQuery(sql, params);
    return result.rows || [];
  }

  // --- Consents ---

  async recordConsent(consentId, userId, purpose, consentData) {
    await this.executeQuery(
      `INSERT INTO consents (consent_id, user_id, purpose, consent_data)
       VALUES (:consentId, :userId, :purpose, :consentData)`,
      { consentId, userId, purpose: purpose || null, consentData: JSON.stringify(consentData) }
    );
  }

  async hasConsent(userId, purpose) {
    const result = await this.executeQuery(
      `SELECT COUNT(*) AS cnt FROM consents
       WHERE user_id = :userId AND purpose = :purpose AND revoked = 0`,
      { userId, purpose }
    );
    return Number(result.rows[0].CNT) > 0;
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
    if (!this.pool) return;
    const pool = this.pool;
    this.pool = null;
    await pool.end();
    console.log('Neon connection pool closed');
  }

  isConnected() {
    return this.pool !== null;
  }
}

module.exports = NeonDatabaseService;
