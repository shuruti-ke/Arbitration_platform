// src/config/app-config.js
// Application configuration

require('dotenv').config({ path: '.env.oracle' });

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
    institutions: ['LCIA', 'SIAC', 'UNCITRAL', 'Kenya Arbitration Act'],
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

  // Jitsi configuration (self-hosted)
  jitsi: {
    baseUrl: process.env.JITSI_BASE_URL || 'https://meet.jit.si', // replace with self-hosted URL
    appId: process.env.JITSI_APP_ID || '',
    apiKey: process.env.JITSI_API_KEY || ''
  }
};

module.exports = config;