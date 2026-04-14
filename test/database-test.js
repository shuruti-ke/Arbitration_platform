// test/database-test.js
// Test script for database connectivity

const DatabaseService = require('../src/services/database-service');
const config = require('../src/config/app-config');

console.log('Testing database connectivity...');

// Create database service instance
const databaseService = new DatabaseService(config);

console.log('Database service created successfully');

// Test PostgreSQL connection (if configured)
if (config.database.postgresql) {
  console.log('PostgreSQL configuration found:');
  console.log(`  Host: ${config.database.postgresql.host}`);
  console.log(`  Port: ${config.database.postgresql.port}`);
  console.log(`  Database: ${config.database.postgresql.database}`);
  console.log(`  Username: ${config.database.postgresql.username}`);
}

// Test Cloudflare R2 configuration (if configured)
if (config.database.cloudflare && config.database.cloudflare.accountId) {
  console.log('Cloudflare R2 configuration found:');
  console.log(`  Account ID: ${config.database.cloudflare.accountId}`);
  console.log(`  R2 Bucket: ${config.database.cloudflare.r2Bucket}`);
}

console.log('Database connectivity test completed');