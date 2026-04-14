// src/config/app-config.js
// Application configuration

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },
  
  // Database configuration
  database: {
    neo4j: {
      url: process.env.NEO4J_URL || 'bolt://localhost:7687',
      username: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password'
    },
    elasticsearch: {
      url: process.env.ES_URL || 'http://localhost:9200',
      index: 'arbitration-platform'
    },
    postgresql: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'arbitration_db',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres'
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
    }
  }
};

module.exports = config;