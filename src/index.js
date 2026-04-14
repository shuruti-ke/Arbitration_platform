// src/index.js
// Main entry point for the Arbitration Platform

const http = require('http');
const url = require('url');
const fs = require('fs');

// Import configuration
const config = require('./config/app-config');

// Import services
const AIOrchestrator = require('./services/ai-orchestrator');
const RuleEngine = require('./services/rule-engine');
const CertificateAuthorityService = require('./services/ca-service');
const HSMService = require('./services/hsm-service');
const ConsentService = require('./services/consent-service');
const AIMetadataService = require('./services/ai-metadata-service');
const AIOptOutService = require('./services/ai-optout-service');
const AIConflictScanner = require('./services/ai-conflict-scanner');
const WORMStorage = require('./services/worm-storage');
const AuditTrail = require('./services/audit-trail');
const CertificateValidationService = require('./services/certificate-validation');
const NYConventionValidator = require('./services/ny-convention-validator');
const MetricsDashboard = require('./services/metrics-dashboard');
const OfflineSyncService = require('./services/offline-sync');
const DisclosureWorkflowService = require('./services/disclosure-workflow');
const RiskMonitoringService = require('./services/risk-monitoring');
const ODPCComplianceService = require('./services/odpc-compliance');
const DatabaseService = require('./services/database-service');

// Import models
const ConflictGraph = require('./models/conflict-graph');

// Import controllers
const ComplianceController = require('./controllers/compliance-controller');
const AwardController = require('./controllers/award-controller');
const ESignatureController = require('./controllers/e-signature-controller');
const DocumentController = require('./controllers/document-controller');
const SystemController = require('./controllers/system-controller');

// Initialize services
const aiOrchestrator = new AIOrchestrator();
const ruleEngine = new RuleEngine();
const caService = new CertificateAuthorityService();
const hsmService = new HSMService();
const consentService = new ConsentService();
const aiMetadataService = new AIMetadataService();
const aiOptOutService = new AIOptOutService();
const aiConflictScanner = new AIConflictScanner();
const wormStorage = new WORMStorage();
const auditTrail = new AuditTrail();
const certificateValidator = new CertificateValidationService();
const nyValidator = new NYConventionValidator();
const metricsDashboard = new MetricsDashboard();
const offlineSync = new OfflineSyncService();
const disclosureWorkflow = new DisclosureWorkflowService();
const riskMonitoring = new RiskMonitoringService();
const odpcCompliance = new ODPCComplianceService();
const databaseService = new DatabaseService(config);
const conflictGraph = new ConflictGraph();
const complianceController = new ComplianceController();
const eSignatureController = new ESignatureController();
const documentController = new DocumentController();
const systemController = new SystemController();

// Initialize database tables
databaseService.initDatabase().catch(console.error);

// Register sample models for testing
aiOrchestrator.registerModel('conflict-scanner', {
  version: '1.0.0',
  type: 'NLP',
  description: 'Scans for conflicts of interest'
});

aiOrchestrator.registerModel('award-generator', {
  version: '1.0.0',
  type: 'Document',
  description: 'Generates arbitration awards'
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const { query } = parsedUrl;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route handling
  if (path === '/api/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: ['AI Orchestrator', 'Rule Engine', 'CA Service', 'AI Conflict Scanner']
    }));
  } else if (path === '/api/models' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      models: ['conflict-scanner', 'award-generator'] // Simplified for demo
    }));
  } else if (path === '/api/rules' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Rule engine initialized',
      institutions: ['LCIA', 'SIAC', 'Kenya Arbitration Act']
    }));
  } else if (path === '/api/award/certify' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const awardData = JSON.parse(body);
        const certification = AwardController.generateCertification(awardData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(certification));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  } else if (path === '/api/ca/providers' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      providers: caService.getProviders()
    }));
  } else if (path === '/api/sign/document' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        // In a real implementation, this would actually process the document
        // For now, we'll return a simulated result
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Document signing request received',
          documentId: 'doc-' + Math.random().toString(36).substr(2, 5)
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  } else if (path === '/api/conflicts/scan' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        // In a real implementation, this would actually scan for conflicts
        // For now, we'll return a simulated result
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Conflict scan request received',
          caseId: requestData.caseId,
          conflicts: []
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  } else if (path === '/api/certificate/validate' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        // In a real implementation, this would actually validate the certificate
        // For now, we'll return a simulated result
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          valid: true,
          message: 'Certificate validation request received',
          certificateId: requestData.certificateId || 'cert-' + Math.random().toString(36).substr(2, 5)
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  } else if (path === '/api/metrics' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Metrics dashboard endpoint',
      status: 'operational'
    }));
  } else if (path === '/api/disclosure' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        // In a real implementation, this would actually create a disclosure
        // For now, we'll return a simulated result
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Disclosure request received',
          disclosureId: 'disclosure-' + Math.random().toString(36).substr(2, 5)
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  } else if (path === '/api/compliance' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'ODPC compliance reporting endpoint',
      status: 'operational'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Arbitration Platform server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`Models available at http://localhost:${PORT}/api/models`);
  console.log(`Rules available at http://localhost:${PORT}/api/rules`);
  console.log(`CA providers available at http://localhost:${PORT}/api/ca/providers`);
  console.log(`Conflict scanner available at http://localhost:${PORT}/api/conflicts/scan`);
  console.log(`Certificate validation available at http://localhost:${PORT}/api/certificate/validate`);
  console.log(`Metrics dashboard available at http://localhost:${PORT}/api/metrics`);
  console.log(`Disclosure workflow available at http://localhost:${PORT}/api/disclosure`);
  console.log(`Compliance reporting available at http://localhost:${PORT}/api/compliance`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});