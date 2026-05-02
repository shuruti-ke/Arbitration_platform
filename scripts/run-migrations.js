'use strict';

require('dotenv').config({ path: '.env.oracle' });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS = [
  'migrate-security-tables.sql',
  'migrate-tax-and-settings.sql',
  'migrate-ai-award-drafts.sql'
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run Neon migrations');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    for (const file of MIGRATIONS) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running migration: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log('Migrations completed successfully');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
