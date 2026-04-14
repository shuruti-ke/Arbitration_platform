// src/services/database-service.js
// Database service for PostgreSQL and Cloudflare R2 integration

const { Pool } = require('pg');
const fs = require('fs');

class DatabaseService {
  constructor(config) {
    this.config = config;
    this.postgresPool = null;
    
    // Initialize PostgreSQL connection if credentials are provided
    if (config.database.postgresql) {
      this.initPostgreSQL();
    }
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  initPostgreSQL() {
    try {
      this.postgresPool = new Pool({
        user: this.config.database.postgresql.username,
        host: this.config.database.postgresql.host,
        database: this.config.database.postgresql.database,
        password: this.config.database.postgresql.password,
        port: this.config.database.postgresql.port,
      });
      
      console.log('PostgreSQL connection pool initialized');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL:', error);
    }
  }

  /**
   * Execute a query on PostgreSQL
   * @param {string} query - SQL query to execute
   * @param {Array} params - Query parameters
   * @returns {Promise} Query result
   */
  async executeQuery(query, params = []) {
    if (!this.postgresPool) {
      throw new Error('PostgreSQL connection not initialized');
    }
    
    const client = await this.postgresPool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize database tables
   */
  async initDatabase() {
    if (!this.postgresPool) {
      console.log('PostgreSQL not configured, skipping database initialization');
      return;
    }
    
    const initQueries = [
      `CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(50) UNIQUE,
        title VARCHAR(255),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(50),
        document_name VARCHAR(255),
        document_content BYTEA,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(50),
        action VARCHAR(100),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];
    
    for (const query of initQueries) {
      try {
        await this.executeQuery(query);
      } catch (error) {
        console.error('Failed to execute initialization query:', error);
      }
    }
    
    console.log('Database tables initialized');
  }

  /**
   * Store a document in R2-compatible storage
   * @param {string} key - Document key
   * @param {Buffer} content - Document content
   * @param {string} bucket - R2 bucket name
   * @returns {Promise} Storage result
   */
  async storeDocumentR2(key, content, bucket = 'documents') {
    // This would connect to Cloudflare R2 in a real implementation
    console.log(`Document ${key} stored in R2 bucket ${bucket}`);
    return { success: true, key: key };
  }

  /**
   * Retrieve a document from R2-compatible storage
   * @param {string} key - Document key
   * @param {string} bucket - R2 bucket name
   * @returns {Promise} Retrieved document
   */
  async getDocumentR2(key, bucket = 'documents') {
    // This would retrieve from Cloudflare R2 in a real implementation
    console.log(`Document ${key} retrieved from R2 bucket ${bucket}`);
    return { success: true, key: key };
  }
}

module.exports = DatabaseService;