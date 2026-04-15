'use strict';
// Load env vars from .env.oracle before anything else
require('dotenv').config({ path: '.env.oracle' });

const http = require('http');
const url = require('url');

// Configuration
const config = require('./config/app-config');

// Services
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
const OracleDatabaseService = require('./services/oracle-database-service');
const { UserService, ROLES } = require('./services/user-service');
const AuthService = require('./services/auth-service');
const HearingService = require('./services/hearing-service');

// Models
const ConflictGraph = require('./models/conflict-graph');

// Controllers
const AwardController = require('./controllers/award-controller');
const ComplianceController = require('./controllers/compliance-controller');
const ESignatureController = require('./controllers/e-signature-controller');
const DocumentController = require('./controllers/document-controller');
const SystemController = require('./controllers/system-controller');

// --- Helpers ---

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// --- Server factory ---

function createServer(services) {
  const {
    oracleDb, auditTrail, consentService,
    aiOrchestrator, ruleEngine, caService,
    aiConflictScanner, certificateValidator,
    authService, userService, hearingService
  } = services;

  // Auth middleware helper
  function authenticate(req, res, roles = []) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      sendJSON(res, 401, { error: 'Authentication required' });
      return null;
    }
    try {
      const token = auth.slice(7);
      const decoded = authService.verifyToken(token);
      if (roles.length > 0 && !roles.includes(decoded.role) && decoded.role !== 'admin') {
        sendJSON(res, 403, { error: 'Insufficient permissions' });
        return null;
      }
      return decoded;
    } catch (err) {
      sendJSON(res, 401, { error: 'Invalid or expired token' });
      return null;
    }
  }

  const corsOrigin = process.env.CORS_ORIGIN || '*';

  return http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // --- GET /api/health ---
      if (path === '/api/health' && method === 'GET') {
        return sendJSON(res, 200, {
          status: 'OK',
          timestamp: new Date().toISOString(),
          database: oracleDb.isConnected() ? 'connected' : 'disconnected',
          services: ['AI Orchestrator', 'Rule Engine', 'CA Service', 'AI Conflict Scanner']
        });
      }

      // --- GET /api/models ---
      if (path === '/api/models' && method === 'GET') {
        return sendJSON(res, 200, { models: ['conflict-scanner', 'award-generator'] });
      }

      // --- GET /api/rules ---
      if (path === '/api/rules' && method === 'GET') {
        return sendJSON(res, 200, {
          message: 'Rule engine initialized',
          institutions: ['LCIA', 'SIAC', 'Kenya Arbitration Act']
        });
      }

      // --- POST /api/award/certify ---
      if (path === '/api/award/certify' && method === 'POST') {
        const awardData = await parseBody(req);
        const certification = AwardController.generateCertification(awardData);
        await auditTrail.logEvent({
          type: 'award_certify',
          caseId: awardData.caseId,
          action: 'certify'
        });
        return sendJSON(res, 200, certification);
      }

      // --- GET /api/ca/providers ---
      if (path === '/api/ca/providers' && method === 'GET') {
        return sendJSON(res, 200, { providers: caService.getProviders() });
      }

      // --- POST /api/sign/document ---
      if (path === '/api/sign/document' && method === 'POST') {
        const requestData = await parseBody(req);
        if (!requestData.documentId && !requestData.content) {
          return sendJSON(res, 400, { error: 'documentId or content is required' });
        }
        await auditTrail.logEvent({
          type: 'document_sign',
          caseId: requestData.caseId,
          action: 'sign',
          documentId: requestData.documentId
        });
        return sendJSON(res, 200, {
          success: true,
          message: 'Document signing request received',
          documentId: requestData.documentId || ('doc-' + Date.now())
        });
      }

      // --- POST /api/conflicts/scan ---
      if (path === '/api/conflicts/scan' && method === 'POST') {
        const requestData = await parseBody(req);
        if (!requestData.caseId) {
          return sendJSON(res, 400, { error: 'caseId is required' });
        }
        await auditTrail.logEvent({
          type: 'conflict_scan',
          caseId: requestData.caseId,
          action: 'scan'
        });
        return sendJSON(res, 200, {
          success: true,
          message: 'Conflict scan request received',
          caseId: requestData.caseId,
          conflicts: []
        });
      }

      // --- POST /api/certificate/validate ---
      if (path === '/api/certificate/validate' && method === 'POST') {
        const requestData = await parseBody(req);
        const result = await certificateValidator.validateCertificate(requestData.certificate || requestData);
        return sendJSON(res, 200, result);
      }

      // --- GET /api/metrics ---
      if (path === '/api/metrics' && method === 'GET') {
        return sendJSON(res, 200, {
          message: 'Metrics dashboard endpoint',
          status: 'operational',
          auditStats: auditTrail.getLogStatistics()
        });
      }

      // --- POST /api/disclosure ---
      if (path === '/api/disclosure' && method === 'POST') {
        const requestData = await parseBody(req);
        if (!requestData.caseId) {
          return sendJSON(res, 400, { error: 'caseId is required' });
        }
        const disclosureId = 'disclosure-' + Date.now();
        await auditTrail.logEvent({
          type: 'disclosure',
          caseId: requestData.caseId,
          action: 'create',
          disclosureId
        });
        return sendJSON(res, 200, {
          success: true,
          message: 'Disclosure request received',
          disclosureId
        });
      }

      // --- GET /api/compliance ---
      if (path === '/api/compliance' && method === 'GET') {
        return sendJSON(res, 200, {
          message: 'ODPC compliance reporting endpoint',
          status: 'operational'
        });
      }

      // --- POST /api/consent/record ---
      if (path === '/api/consent/record' && method === 'POST') {
        const { userId, consentData } = await parseBody(req);
        if (!userId || !consentData) {
          return sendJSON(res, 400, { error: 'userId and consentData are required' });
        }
        const consentId = await consentService.recordConsent(userId, consentData);
        return sendJSON(res, 200, { success: true, consentId });
      }

      // --- GET /api/consent/check?userId=...&purpose=... ---
      if (path === '/api/consent/check' && method === 'GET') {
        const { userId, purpose } = parsedUrl.query;
        if (!userId || !purpose) {
          return sendJSON(res, 400, { error: 'userId and purpose query params are required' });
        }
        const hasConsent = await consentService.hasConsent(userId, purpose);
        return sendJSON(res, 200, { userId, purpose, hasConsent });
      }

      // =============================================
      // --- AUTH ROUTES ---
      // =============================================

      // --- POST /api/auth/register ---
      if (path === '/api/auth/register' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.email || !body.password || !body.role) {
          return sendJSON(res, 400, { error: 'email, password, and role are required' });
        }
        const newUser = await userService.createUser(body);
        await auditTrail.logEvent({ type: 'user_register', userId: user.userId, action: 'register', details: { email: body.email, role: body.role } });
        return sendJSON(res, 201, { success: true, user: newUser });
      }

      // --- POST /api/auth/login ---
      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await parseBody(req);
        if (!email || !password) {
          return sendJSON(res, 400, { error: 'email and password are required' });
        }
        const result = await authService.login(email, password, req.socket.remoteAddress);
        return sendJSON(res, 200, result);
      }

      // --- POST /api/auth/logout ---
      if (path === '/api/auth/logout' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const token = req.headers['authorization'].slice(7);
        await authService.logout(token, user.userId);
        return sendJSON(res, 200, { success: true, message: 'Logged out successfully' });
      }

      // --- POST /api/auth/refresh ---
      if (path === '/api/auth/refresh' && method === 'POST') {
        const { refreshToken } = await parseBody(req);
        if (!refreshToken) return sendJSON(res, 400, { error: 'refreshToken is required' });
        const result = await authService.refreshToken(refreshToken);
        return sendJSON(res, 200, result);
      }

      // --- GET /api/auth/me ---
      if (path === '/api/auth/me' && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const profile = await userService.findById(user.userId);
        return sendJSON(res, 200, { user: userService._safeUser(profile) });
      }

      // =============================================
      // --- USER MANAGEMENT ROUTES ---
      // =============================================

      // --- GET /api/users ---
      if (path === '/api/users' && method === 'GET') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const { role } = parsedUrl.query;
        const users = await userService.listUsers(role ? { role } : {});
        return sendJSON(res, 200, { users });
      }

      // --- DELETE /api/users/:userId ---
      if (path.startsWith('/api/users/') && method === 'DELETE') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const targetId = path.split('/api/users/')[1];
        await userService.deactivateUser(targetId);
        await auditTrail.logEvent({ type: 'user_deactivate', userId: user.userId, action: 'deactivate', details: { targetId } });
        return sendJSON(res, 200, { success: true });
      }

      // =============================================
      // --- ARBITRATOR ASSIGNMENT ROUTES ---
      // =============================================

      // --- POST /api/hearings/assign ---
      if (path === '/api/hearings/assign' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.caseId || !body.arbitratorId) {
          return sendJSON(res, 400, { error: 'caseId and arbitratorId are required' });
        }
        const assignment = await hearingService.assignArbitrator({ ...body, appointedBy: user.userId });
        await auditTrail.logEvent({ type: 'arbitrator_assigned', caseId: body.caseId, userId: user.userId, action: 'assign', details: body });
        return sendJSON(res, 201, { success: true, assignment });
      }

      // --- POST /api/hearings/assign/:assignmentId/respond ---
      if (path.match(/^\/api\/hearings\/assign\/[^/]+\/respond$/) && method === 'POST') {
        const user = authenticate(req, res, ['arbitrator']);
        if (!user) return;
        const assignmentId = path.split('/')[4];
        const { caseId, response, reason } = await parseBody(req);
        const result = await hearingService.respondToAssignment(assignmentId, caseId, response, reason);
        await auditTrail.logEvent({ type: 'assignment_response', caseId, userId: user.userId, action: response });
        return sendJSON(res, 200, { success: true, assignment: result });
      }

      // --- GET /api/hearings/panel/:caseId ---
      if (path.match(/^\/api\/hearings\/panel\/[^/]+$/) && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const caseId = path.split('/api/hearings/panel/')[1];
        const panel = await hearingService.getPanel(caseId);
        return sendJSON(res, 200, { caseId, panel });
      }

      // =============================================
      // --- HEARING ROUTES ---
      // =============================================

      // --- POST /api/hearings ---
      if (path === '/api/hearings' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.caseId || !body.startTime || !body.endTime) {
          return sendJSON(res, 400, { error: 'caseId, startTime, and endTime are required' });
        }
        const hearing = await hearingService.scheduleHearing({ ...body, scheduledBy: user.userId });
        await auditTrail.logEvent({ type: 'hearing_scheduled', caseId: body.caseId, userId: user.userId, action: 'schedule', details: { hearingId: hearing.hearingId } });
        return sendJSON(res, 201, { success: true, hearing });
      }

      // --- GET /api/hearings/:hearingId ---
      if (path.match(/^\/api\/hearings\/[^/]+$/) && method === 'GET' &&
          !path.includes('/assign') && !path.includes('/panel')) {
        const user = authenticate(req, res);
        if (!user) return;
        const hearingId = path.split('/api/hearings/')[1];
        const hearing = await hearingService.getHearing(hearingId);
        if (!hearing) return sendJSON(res, 404, { error: 'Hearing not found' });
        const jitsiUrl = hearingService.getJitsiRoomUrl(
          config.jitsi.baseUrl,
          hearing.jitsiRoom || hearing.JITSI_ROOM
        );
        return sendJSON(res, 200, { hearing, jitsiUrl });
      }

      // --- GET /api/hearings/case/:caseId ---
      if (path.match(/^\/api\/hearings\/case\/[^/]+$/) && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const caseId = path.split('/api/hearings/case/')[1];
        const hearings = await hearingService.getCaseHearings(caseId);
        return sendJSON(res, 200, { caseId, hearings });
      }

      // --- PUT /api/hearings/:hearingId/status ---
      if (path.match(/^\/api\/hearings\/[^/]+\/status$/) && method === 'PUT') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const hearingId = path.split('/')[3];
        const { status } = await parseBody(req);
        const result = await hearingService.updateHearingStatus(hearingId, status);
        await auditTrail.logEvent({ type: 'hearing_status', userId: user.userId, action: 'status_update', details: { hearingId, status } });
        return sendJSON(res, 200, { success: true, hearing: result });
      }

      // --- POST /api/hearings/:hearingId/join ---
      if (path.match(/^\/api\/hearings\/[^/]+\/join$/) && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const hearingId = path.split('/')[3];
        const hearing = await hearingService.getHearing(hearingId);
        if (!hearing) return sendJSON(res, 404, { error: 'Hearing not found' });
        await hearingService.addParticipant(hearingId, user.userId, user.role);
        const jitsiRoom = hearing.jitsiRoom || hearing.JITSI_ROOM;
        const jitsiUrl = hearingService.getJitsiRoomUrl(config.jitsi.baseUrl, jitsiRoom);
        await auditTrail.logEvent({ type: 'hearing_join', userId: user.userId, action: 'join', details: { hearingId } });
        return sendJSON(res, 200, { success: true, jitsiUrl, jitsiRoom });
      }

      // 404
      return sendJSON(res, 404, { error: 'Not Found' });

    } catch (error) {
      console.error('Request error:', error.message);
      if (error.message === 'Invalid JSON body') {
        return sendJSON(res, 400, { error: 'Invalid JSON body' });
      }
      return sendJSON(res, 500, { error: 'Internal server error' });
    }
  });
}

// --- Bootstrap ---

async function startServer() {
  // 1. Initialize Oracle database
  const oracleDb = new OracleDatabaseService(config);
  const dbConnected = await oracleDb.initOracleDatabase();
  if (!dbConnected) {
    console.warn('Warning: Oracle DB not connected. Audit logs will be in-memory only.');
  }

  // 2. Initialize services that depend on the DB
  const auditTrail = new AuditTrail(oracleDb);
  const consentService = new ConsentService(oracleDb);
  const userService = new UserService(oracleDb);
  const authService = new AuthService(userService, auditTrail);
  const hearingService = new HearingService(oracleDb);

  // 3. Initialize remaining services
  const aiOrchestrator = new AIOrchestrator();
  const ruleEngine = new RuleEngine();
  const caService = new CertificateAuthorityService();
  const hsmService = new HSMService();
  const aiMetadataService = new AIMetadataService();
  const aiOptOutService = new AIOptOutService();
  const aiConflictScanner = new AIConflictScanner();
  const wormStorage = new WORMStorage();
  const certificateValidator = new CertificateValidationService();
  const nyValidator = new NYConventionValidator();
  const metricsDashboard = new MetricsDashboard();
  const offlineSync = new OfflineSyncService();
  const disclosureWorkflow = new DisclosureWorkflowService();
  const riskMonitoring = new RiskMonitoringService();
  const odpcCompliance = new ODPCComplianceService();
  const conflictGraph = new ConflictGraph();
  const complianceController = new ComplianceController();
  const eSignatureController = new ESignatureController();
  const documentController = new DocumentController();
  const systemController = new SystemController();

  // Register AI models
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

  // 4. Create and start HTTP server
  const server = createServer({
    oracleDb, auditTrail, consentService,
    aiOrchestrator, ruleEngine, caService,
    aiConflictScanner, certificateValidator,
    authService, userService, hearingService
  });

  const PORT = config.server.port;
  const HOST = config.server.host;

  server.listen(PORT, HOST, () => {
    console.log(`Arbitration Platform running on http://${HOST}:${PORT}`);
    console.log(`Health:       GET  /api/health`);
    console.log(`Models:       GET  /api/models`);
    console.log(`Rules:        GET  /api/rules`);
    console.log(`CA Providers: GET  /api/ca/providers`);
    console.log(`Metrics:      GET  /api/metrics`);
    console.log(`Compliance:   GET  /api/compliance`);
    console.log(`Award Certify:POST /api/award/certify`);
    console.log(`Sign Doc:     POST /api/sign/document`);
    console.log(`Conflict Scan:POST /api/conflicts/scan`);
    console.log(`Cert Validate:POST /api/certificate/validate`);
    console.log(`Disclosure:   POST /api/disclosure`);
    console.log(`Consent Rec:  POST /api/consent/record`);
    console.log(`Consent Check:GET  /api/consent/check`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    server.close(async () => {
      await oracleDb.closePool();
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('Fatal: failed to start server:', err.message);
  process.exit(1);
});
