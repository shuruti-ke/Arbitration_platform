'use strict';
// migrate-oracle-to-neon.js
// Run on the server: node migrate-oracle-to-neon.js
// Reads all data from Oracle ADB and inserts into Neon PostgreSQL

require('dotenv').config({ path: '.env.oracle' });

const oracledb = require('oracledb');
const { Pool } = require('pg');

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [oracledb.BLOB];

const ORACLE = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING,
  walletLocation: process.env.ORACLE_WALLET_LOCATION,
  walletPassword: process.env.ORACLE_WALLET_PASSWORD
};

const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tables to migrate in order (respects FK dependencies)
const TABLES = [
  'users',
  'cases',
  'documents',
  'audit_logs',
  'consents',
  'hearings',
  'hearing_participants',
  'arbitrator_assignments',
  'parties',
  'case_counsel',
  'case_milestones',
  'rule_guidance_cache',
  'case_agreements',
  'case_agreement_parties',
  'case_agreement_signatures',
  'case_agreement_extractions',
  'ai_intelligence_reports',
  'ai_document_analyses'
];

async function getOracleColumns(conn, table) {
  const result = await conn.execute(
    `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = UPPER(:tname) ORDER BY column_id`,
    { tname: table }
  );
  return result.rows.map(r => ({ name: r[0].toLowerCase(), type: r[1] }));
}

async function migrateTable(conn, table) {
  console.log(`\nMigrating ${table}...`);

  // Get Oracle columns
  let columns;
  try {
    columns = await getOracleColumns(conn, table);
  } catch (e) {
    console.log(`  Skipping ${table}: ${e.message}`);
    return;
  }

  if (!columns.length) {
    console.log(`  No columns found for ${table}, skipping`);
    return;
  }

  // Fetch all rows from Oracle
  const colNames = columns.map(c => c.name.toUpperCase()).join(', ');
  let rows;
  try {
    const result = await conn.execute(
      `SELECT ${colNames} FROM ${table}`,
      [],
      { outFormat: oracledb.OUT_FORMAT_ARRAY, fetchArraySize: 100 }
    );
    rows = result.rows;
  } catch (e) {
    console.log(`  Failed to fetch from Oracle: ${e.message}`);
    return;
  }

  if (!rows.length) {
    console.log(`  Empty table, skipping`);
    return;
  }

  console.log(`  Found ${rows.length} rows`);

  // Build INSERT for Neon (skip 'id' column — let identity handle it)
  const insertCols = columns.filter(c => c.name !== 'id');
  const colList = insertCols.map(c => c.name).join(', ');
  const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  // Index of each column in the Oracle result
  const idxMap = insertCols.map(c => columns.findIndex(col => col.name === c.name));

  let inserted = 0;
  let failed = 0;

  for (const row of rows) {
    const values = idxMap.map(idx => {
      const val = row[idx];
      if (val === null || val === undefined) return null;
      if (Buffer.isBuffer(val)) return val;
      // Convert Oracle Lob objects (CLOBs not fetched as string) to null
      if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        // Try to get string value from Lob
        if (typeof val.getData === 'function') return null; // skip unresolved Lobs
        return null;
      }
      return val;
    });

    try {
      await neonPool.query(insertSql, values);
      inserted++;
    } catch (e) {
      failed++;
      if (failed <= 3) console.log(`  Row error: ${e.message}`);
      // Reconnect on connection drop
      if (e.message && e.message.includes('Connection terminated')) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.log(`  Done: ${inserted} inserted, ${failed} failed`);
}

async function main() {
  console.log('Connecting to Oracle ADB...');
  let pool;
  try {
    const poolConfig = {
      user: ORACLE.user,
      password: ORACLE.password,
      connectString: ORACLE.connectString,
      poolMin: 1,
      poolMax: 3,
      poolIncrement: 1
    };
    if (ORACLE.walletLocation) {
      poolConfig.walletLocation = ORACLE.walletLocation;
      if (ORACLE.walletPassword) poolConfig.walletPassword = ORACLE.walletPassword;
    }
    pool = await oracledb.createPool(poolConfig);
    console.log('Oracle connected');
  } catch (e) {
    console.error('Failed to connect to Oracle:', e.message);
    process.exit(1);
  }

  const conn = await pool.getConnection();

  for (const table of TABLES) {
    await migrateTable(conn, table);
  }

  await conn.close();
  await pool.close();
  await neonPool.end();
  console.log('\nMigration complete.');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
