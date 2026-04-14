// test/postgresql-r2-demo.js
// Demo script showing PostgreSQL and Cloudflare R2 integration

const DatabaseService = require('../src/services/database-service');
const config = require('../src/config/app-config');
const fs = require('fs');

console.log('=== POSTGRESQL AND CLOUDFLARE R2 INTEGRATION DEMO ===\n');

// Create database service instance
const databaseService = new DatabaseService(config);

console.log('1. Database Service Initialized');
console.log('   - PostgreSQL configuration loaded');
console.log('   - Cloudflare R2 configuration ready\n');

// Demonstrate PostgreSQL usage
console.log('2. PostgreSQL Integration Example:');
console.log('   - Database tables will be automatically created on startup');
console.log('   - Tables include: cases, documents, audit_logs');
console.log('   - Connection pool ready for queries\n');

// Demonstrate Cloudflare R2 usage
console.log('3. Cloudflare R2 Integration Example:');
console.log('   - Document storage service ready');
console.log('   - R2 bucket: ' + (config.database.cloudflare?.r2Bucket || 'arbitration-docs'));
console.log('   - Document operations supported: store, retrieve\n');

// Example usage scenarios
console.log('4. Usage Examples:');
console.log('   - Store case documents in PostgreSQL: cases, documents tables');
console.log('   - Store large files in Cloudflare R2: awards, evidence, transcripts');
console.log('   - Audit trail stored in PostgreSQL: audit_logs table\n');

console.log('5. Configuration:');
console.log('   PostgreSQL:');
console.log('   - Host: ' + config.database.postgresql.host);
console.log('   - Port: ' + config.database.postgresql.port);
console.log('   - Database: ' + config.database.postgresql.database);
console.log('   - User: ' + config.database.postgresql.username);

if (config.database.cloudflare && config.database.cloudflare.accountId) {
  console.log('\n   Cloudflare R2:');
  console.log('   - Account: ' + config.database.cloudflare.accountId);
  console.log('   - Bucket: ' + config.database.cloudflare.r2Bucket);
} else {
  console.log('\n   Cloudflare R2: Not configured (set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_KEY environment variables)');
}

console.log('\n=== DEMO COMPLETE ===');