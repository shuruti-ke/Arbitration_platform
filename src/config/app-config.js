// src/config/app-config.js
// Application configuration

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.oracle' });

function readMultilineEnvValue(filePath, key) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const prefix = `${key}=`;
    let collecting = false;
    const parts = [];

    for (const line of lines) {
      if (!collecting) {
        if (line.startsWith(prefix)) {
          collecting = true;
          parts.push(line.slice(prefix.length).trimEnd());
        }
        continue;
      }

      if (/^[A-Z0-9_]+=/.test(line) || line.startsWith('#')) {
        break;
      }

      if (line.trim()) {
        parts.push(line.trim());
      }
    }

    return parts.join('');
  } catch (err) {
    return '';
  }
}

function normalizeJaasAppId(rawAppId) {
  const value = String(rawAppId || '').trim();
  if (!value) return '';
  return value.split('/').filter(Boolean)[0] || '';
}

function normalizeJaasApiKeyId(rawAppId, rawApiKeyId) {
  const appParts = String(rawAppId || '').trim().split('/').filter(Boolean);
  if (appParts.length > 1) {
    return appParts[1];
  }

  const value = String(rawApiKeyId || '').trim();
  if (!value) return '';
  return value.split('/').filter(Boolean).pop() || '';
}

const envFilePath = path.resolve(process.cwd(), '.env.oracle');
const reconstructedPrivateKey = readMultilineEnvValue(envFilePath, 'JAAS_PRIVATE_KEY');

const config = {
  // Server configuration — bind to 0.0.0.0 so the Oracle Cloud VM is reachable
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },

  // Database configuration
  database: {
    // Oracle Autonomous Database (primary — Always Free Tier)
    oracle: {
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      // connectString: TNS alias from tnsnames.ora OR full connection descriptor
      // Example alias (from wallet): 'arbitration_db_high'
      // Example descriptor: '(description=(address=(protocol=tcps)(host=...)(port=1522))...)'
      connectString: process.env.DB_CONNECTION_STRING || '',
      // Path to the unzipped Oracle wallet directory
      walletLocation: process.env.ORACLE_WALLET_LOCATION || '',
      walletPassword: process.env.ORACLE_WALLET_PASSWORD || ''
    },
    neo4j: {
      url: process.env.NEO4J_URL || 'bolt://localhost:7687',
      username: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || ''
    },
    elasticsearch: {
      url: process.env.ES_URL || 'http://localhost:9200',
      index: 'arbitration-platform'
    },
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiKey: process.env.CLOUDFLARE_API_KEY,
      r2Bucket: process.env.CLOUDFLARE_R2_BUCKET || 'arbitration-docs'
    }
  },
  
  // AI configuration
  ai: {
    models: {
      conflictScanner: {
        enabled: true,
        threshold: 0.3
      },
      awardGenerator: {
        enabled: true,
        templatePath: './templates/awards'
      }
    }
  },
  
  // Compliance configuration
  compliance: {
      institutions: ['LCIA', 'SIAC', 'UNCITRAL', 'Arbitration Act (Cap. 49)'],
    certification: {
      required: true,
      template: 'standard-certification-clause'
    }
  },
  
  // Security configuration
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32
    },
    certificates: {
      caRequired: true,
      hsmRequired: true
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'arbitration-platform-jwt-secret-2026-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    }
  },

  // JaaS (Jitsi as a Service) configuration
  jitsi: {
    baseUrl: process.env.JITSI_BASE_URL || 'https://8x8.vc',
    appId: normalizeJaasAppId(process.env.JAAS_APP_ID || ''),
    apiKeyId: normalizeJaasApiKeyId(process.env.JAAS_APP_ID || '', process.env.JAAS_API_KEY_ID || ''),
    privateKey: reconstructedPrivateKey || process.env.JAAS_PRIVATE_KEY || ''
  },

  // Daily.co video hearings configuration
  daily: {
    apiKey: process.env.DAILY_API_KEY || '',
    domain: (process.env.DAILY_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/+$/, ''),
    autoRecord: String(process.env.DAILY_AUTO_RECORD || 'true').toLowerCase() !== 'false',
    autoTranscribe: String(process.env.DAILY_AUTO_TRANSCRIBE || 'true').toLowerCase() !== 'false',
    closeTabOnExit: String(process.env.DAILY_CLOSE_TAB_ON_EXIT || 'true').toLowerCase() !== 'false'
  }
};

module.exports = config;
