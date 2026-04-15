'use strict';
// Load env vars from .env.oracle before anything else
require('dotenv').config({ path: '.env.oracle' });

const http = require('http');
const url = require('url');

// AI client — uses Groq (free: 14,400 req/day) with Gemini as fallback
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callAI(prompt) {
  // Try Groq first
  if (GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }
  // Fallback to Gemini
  if (GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  }
  return null;
}

// Document text extraction (PDF, DOCX, XLSX, CSV, TXT)
async function extractTextFromFile(base64Content, fileName, mimeType) {
  if (!base64Content) return null;
  const buffer = Buffer.from(base64Content, 'base64');
  const ext = (fileName || '').split('.').pop().toLowerCase();
  try {
    // Plain text / CSV / Markdown
    if (['txt', 'md', 'csv', 'tsv'].includes(ext) || (mimeType || '').startsWith('text/')) {
      return buffer.toString('utf8').slice(0, 100000);
    }
    // PDF
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return (data.text || '').slice(0, 100000);
    }
    // DOCX
    if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').slice(0, 100000);
    }
    // DOC (older Word — extract what we can)
    if (ext === 'doc' || mimeType === 'application/msword') {
      // Basic extraction: strip binary, keep printable ASCII runs
      const text = buffer.toString('binary').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/ {3,}/g, ' ').slice(0, 100000);
      return text;
    }
    // XLSX / XLS
    if (['xlsx', 'xls'].includes(ext) || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const lines = [];
      workbook.SheetNames.forEach((sheetName) => {
        lines.push(`=== Sheet: ${sheetName} ===`);
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        lines.push(csv);
      });
      return lines.join('\n').slice(0, 100000);
    }
  } catch (err) {
    console.warn(`Text extraction failed for ${fileName}: ${err.message}`);
  }
  return null;
}

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

      // =============================================
      // --- CASES ROUTES ---
      // =============================================

      // --- GET /api/cases ---
      if (path === '/api/cases' && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const { status } = parsedUrl.query;
        let sql = 'SELECT * FROM cases ORDER BY created_at DESC';
        const params = {};
        if (status) {
          sql = 'SELECT * FROM cases WHERE status = :status ORDER BY created_at DESC';
          params.status = status;
        }
        const result = await oracleDb.executeQuery(sql, params);
        return sendJSON(res, 200, { cases: result.rows || [] });
      }

      // --- GET /api/cases/:caseId ---
      if (path.match(/^\/api\/cases\/[^/]+$/) && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const caseId = path.split('/api/cases/')[1];
        const caseResult = await oracleDb.executeQuery('SELECT * FROM cases WHERE case_id = :caseId', { caseId });
        if (!caseResult.rows || caseResult.rows.length === 0) return sendJSON(res, 404, { error: 'Case not found' });
        const partiesResult = await oracleDb.executeQuery('SELECT * FROM parties WHERE case_id = :caseId ORDER BY party_type', { caseId });
        const counselResult = await oracleDb.executeQuery('SELECT * FROM case_counsel WHERE case_id = :caseId', { caseId });
        const milestonesResult = await oracleDb.executeQuery('SELECT * FROM case_milestones WHERE case_id = :caseId ORDER BY created_at', { caseId });
        const docsResult = await oracleDb.executeQuery('SELECT id, case_id, document_name, created_at FROM documents WHERE case_id = :caseId ORDER BY created_at DESC', { caseId });
        const hearingsResult = await oracleDb.executeQuery('SELECT * FROM hearings WHERE case_id = :caseId ORDER BY start_time', { caseId });
        const auditResult = await oracleDb.getAuditLogs({ caseId });
        return sendJSON(res, 200, {
          case: caseResult.rows[0],
          parties: partiesResult.rows || [],
          counsel: counselResult.rows || [],
          milestones: milestonesResult.rows || [],
          documents: docsResult.rows || [],
          hearings: hearingsResult.rows || [],
          auditLog: auditResult || []
        });
      }

      // --- POST /api/cases/:caseId/parties ---
      if (path.match(/^\/api\/cases\/[^/]+\/parties$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const caseId = path.split('/')[3];
        const body = await parseBody(req);
        if (!body.fullName || !body.partyType) return sendJSON(res, 400, { error: 'fullName and partyType are required' });
        const partyId = 'party-' + Date.now();
        await oracleDb.executeQuery(
          `INSERT INTO parties (party_id, case_id, party_type, entity_type, full_name, organization_name, nationality, address, email, phone, tax_id)
           VALUES (:partyId, :caseId, :partyType, :entityType, :fullName, :organizationName, :nationality, :address, :email, :phone, :taxId)`,
          {
            partyId, caseId,
            partyType: body.partyType,
            entityType: body.entityType || null,
            fullName: body.fullName,
            organizationName: body.organizationName || null,
            nationality: body.nationality || null,
            address: body.address || null,
            email: body.email || null,
            phone: body.phone || null,
            taxId: body.taxId || null
          }
        );
        await auditTrail.logEvent({ type: 'party_added', caseId, userId: user.userId, action: 'add_party' });
        return sendJSON(res, 201, { success: true, partyId });
      }

      // --- POST /api/cases/:caseId/counsel ---
      if (path.match(/^\/api\/cases\/[^/]+\/counsel$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const caseId = path.split('/')[3];
        const body = await parseBody(req);
        if (!body.fullName) return sendJSON(res, 400, { error: 'fullName is required' });
        const counselId = 'counsel-' + Date.now();
        await oracleDb.executeQuery(
          `INSERT INTO case_counsel (counsel_id, case_id, party_id, full_name, law_firm, email, phone, bar_number, role, languages)
           VALUES (:counselId, :caseId, :partyId, :fullName, :lawFirm, :email, :phone, :barNumber, :role, :languages)`,
          {
            counselId, caseId,
            partyId: body.partyId || null,
            fullName: body.fullName,
            lawFirm: body.lawFirm || null,
            email: body.email || null,
            phone: body.phone || null,
            barNumber: body.barNumber || null,
            role: body.role || 'lead_counsel',
            languages: body.languages || null
          }
        );
        return sendJSON(res, 201, { success: true, counselId });
      }

      // --- PUT /api/cases/:caseId/milestones/:milestoneId ---
      if (path.match(/^\/api\/cases\/[^/]+\/milestones\/[^/]+$/) && method === 'PUT') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const parts = path.split('/');
        const milestoneId = parts[5];
        const body = await parseBody(req);
        await oracleDb.executeQuery(
          `UPDATE case_milestones SET status = :status, completed_date = :completedDate, due_date = :dueDate, notes = :notes
           WHERE milestone_id = :milestoneId`,
          {
            status: body.status || 'pending',
            completedDate: body.completedDate ? new Date(body.completedDate) : null,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            notes: body.notes || null,
            milestoneId
          }
        );
        return sendJSON(res, 200, { success: true });
      }

      // --- POST /api/cases ---
      if (path === '/api/cases' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.title) return sendJSON(res, 400, { error: 'title is required' });
        const caseId = 'case-' + Date.now();
        await oracleDb.executeQuery(
          `INSERT INTO cases (case_id, title, status, case_type, sector, dispute_category,
            description, dispute_amount, currency, governing_law, seat_of_arbitration,
            arbitration_rules, language_of_proceedings, institution_ref, filing_date,
            response_deadline, case_stage, num_arbitrators, confidentiality_level, third_party_funding)
           VALUES (:caseId, :title, :status, :caseType, :sector, :disputeCategory,
            :description, :disputeAmount, :currency, :governingLaw, :seatOfArbitration,
            :arbitrationRules, :languageOfProceedings, :institutionRef, :filingDate,
            :responseDeadline, :caseStage, :numArbitrators, :confidentialityLevel, :thirdPartyFunding)`,
          {
            caseId,
            title: body.title,
            status: body.status || 'active',
            caseType: body.caseType || null,
            sector: body.sector || null,
            disputeCategory: body.disputeCategory || null,
            description: body.description || null,
            disputeAmount: body.disputeAmount || null,
            currency: body.currency || 'USD',
            governingLaw: body.governingLaw || null,
            seatOfArbitration: body.seatOfArbitration || null,
            arbitrationRules: body.arbitrationRules || null,
            languageOfProceedings: body.languageOfProceedings || 'English',
            institutionRef: body.institutionRef || null,
            filingDate: body.filingDate ? new Date(body.filingDate) : new Date(),
            responseDeadline: body.responseDeadline ? new Date(body.responseDeadline) : null,
            caseStage: body.caseStage || 'filing',
            numArbitrators: body.numArbitrators || 1,
            confidentialityLevel: body.confidentialityLevel || 'confidential',
            thirdPartyFunding: body.thirdPartyFunding ? 1 : 0
          }
        );

        // Create default milestones
        const milestones = [
          { type: 'filing', title: 'Notice of Arbitration Filed', status: 'completed' },
          { type: 'response', title: 'Response to Notice of Arbitration Due', status: 'pending' },
          { type: 'arbitrator_appointment', title: 'Arbitrator Appointment', status: 'pending' },
          { type: 'terms_of_reference', title: 'Terms of Reference', status: 'pending' },
          { type: 'hearing', title: 'Hearing', status: 'pending' },
          { type: 'award', title: 'Award', status: 'pending' }
        ];
        for (const m of milestones) {
          await oracleDb.executeQuery(
            `INSERT INTO case_milestones (milestone_id, case_id, milestone_type, title, status)
             VALUES (:milestoneId, :caseId, :milestoneType, :title, :status)`,
            { milestoneId: `ms-${caseId}-${m.type}`, caseId, milestoneType: m.type, title: m.title, status: m.status }
          );
        }

        await auditTrail.logEvent({ type: 'case_created', caseId, userId: user.userId, action: 'create' });
        return sendJSON(res, 201, { success: true, caseId, title: body.title });
      }

      // --- PUT /api/cases/:caseId ---
      if (path.match(/^\/api\/cases\/[^/]+$/) && method === 'PUT') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const caseId = path.split('/api/cases/')[1];
        const body = await parseBody(req);
        await oracleDb.executeQuery(
          `UPDATE cases SET
            title = :title, status = :status, case_type = :caseType, sector = :sector,
            dispute_category = :disputeCategory, description = :description,
            dispute_amount = :disputeAmount, currency = :currency,
            governing_law = :governingLaw, seat_of_arbitration = :seatOfArbitration,
            arbitration_rules = :arbitrationRules, language_of_proceedings = :languageOfProceedings,
            institution_ref = :institutionRef, response_deadline = :responseDeadline,
            case_stage = :caseStage, num_arbitrators = :numArbitrators,
            confidentiality_level = :confidentialityLevel, third_party_funding = :thirdPartyFunding,
            updated_at = CURRENT_TIMESTAMP
           WHERE case_id = :caseId`,
          {
            caseId,
            title: body.title,
            status: body.status || 'active',
            caseType: body.caseType || null,
            sector: body.sector || null,
            disputeCategory: body.disputeCategory || null,
            description: body.description || null,
            disputeAmount: body.disputeAmount || null,
            currency: body.currency || 'USD',
            governingLaw: body.governingLaw || null,
            seatOfArbitration: body.seatOfArbitration || null,
            arbitrationRules: body.arbitrationRules || null,
            languageOfProceedings: body.languageOfProceedings || 'English',
            institutionRef: body.institutionRef || null,
            responseDeadline: body.responseDeadline ? new Date(body.responseDeadline) : null,
            caseStage: body.caseStage || 'filing',
            numArbitrators: body.numArbitrators || 1,
            confidentialityLevel: body.confidentialityLevel || 'confidential',
            thirdPartyFunding: body.thirdPartyFunding ? 1 : 0
          }
        );
        await auditTrail.logEvent({ type: 'case_updated', caseId, userId: user.userId, action: 'update' });
        return sendJSON(res, 200, { success: true });
      }

      // --- DELETE /api/cases/:caseId ---
      if (path.match(/^\/api\/cases\/[^/]+$/) && method === 'DELETE') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const caseId = path.split('/api/cases/')[1];
        await oracleDb.executeQuery('DELETE FROM cases WHERE case_id = :caseId', { caseId });
        return sendJSON(res, 200, { success: true });
      }

      // =============================================
      // --- DOCUMENTS ROUTES ---
      // =============================================

      // --- GET /api/documents ---
      // Returns: library docs (access_level='global') + case docs the user can see
      // Query param: ?level=global|case|all (default all), ?caseId=xxx
      if (path === '/api/documents' && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const qs = parsedUrl.query || {};
        const level = qs.level || 'all';
        const caseIdFilter = qs.caseId || null;
        let sql = 'SELECT id, case_id, document_name, category, description, access_level, uploaded_by, created_at FROM documents WHERE 1=1';
        const params = {};
        if (level === 'global') { sql += ' AND access_level = \'global\''; }
        else if (level === 'case') { sql += ' AND access_level = \'case\''; }
        if (caseIdFilter) { sql += ' AND case_id = :caseId'; params.caseId = caseIdFilter; }
        sql += ' ORDER BY created_at DESC';
        const result = await oracleDb.executeQuery(sql, params);
        return sendJSON(res, 200, { documents: result.rows || [] });
      }

      // --- POST /api/documents ---
      if (path === '/api/documents' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.documentName) return sendJSON(res, 400, { error: 'documentName is required' });
        const accessLevel = body.accessLevel || (body.caseId ? 'case' : 'global');
        // Only admins/secretariat can add to the global library
        if (accessLevel === 'global' && !['admin', 'secretariat'].includes(user.role)) {
          return sendJSON(res, 403, { error: 'Only admin/secretariat can add to the Platform Library' });
        }
        const content = body.content ? Buffer.from(body.content, 'base64') : null;
        const textContent = await extractTextFromFile(body.content, body.documentName, body.mimeType);
        await oracleDb.executeQuery(
          `INSERT INTO documents (case_id, document_name, document_content, category, description, text_content, access_level, uploaded_by)
           VALUES (:caseId, :documentName, :content, :category, :description, :textContent, :accessLevel, :uploadedBy)`,
          {
            caseId: body.caseId || null,
            documentName: body.documentName,
            content,
            category: body.category || 'Other',
            description: body.description || null,
            textContent: textContent || null,
            accessLevel,
            uploadedBy: user.userId,
          }
        );
        await auditTrail.logEvent({ type: 'document_uploaded', caseId: body.caseId, userId: user.userId, action: 'upload', details: JSON.stringify({ documentName: body.documentName, category: body.category, accessLevel }) });
        return sendJSON(res, 201, { success: true, documentName: body.documentName, accessLevel });
      }

      // --- GET /api/documents/:id ---
      if (path.match(/^\/api\/documents\/[^/]+$/) && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const id = path.split('/api/documents/')[1];
        const result = await oracleDb.executeQuery(
          'SELECT id, case_id, document_name, category, description, access_level, created_at FROM documents WHERE id = :id',
          { id }
        );
        if (!result.rows || result.rows.length === 0) return sendJSON(res, 404, { error: 'Document not found' });
        return sendJSON(res, 200, { document: result.rows[0] });
      }

      // --- POST /api/documents/:id/analyze ---
      // Uses the document's own text + global library docs as AI context
      if (path.match(/^\/api\/documents\/[^/]+\/analyze$/) && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const id = path.split('/')[3];
        const body = await parseBody(req);
        if (!body.prompt) return sendJSON(res, 400, { error: 'prompt is required' });
        const result = await oracleDb.executeQuery(
          'SELECT document_name, category, description, text_content, access_level, case_id FROM documents WHERE id = :id',
          { id }
        );
        if (!result.rows || result.rows.length === 0) return sendJSON(res, 404, { error: 'Document not found' });
        const doc = result.rows[0];
        const docName = doc.DOCUMENT_NAME || doc.document_name || '';
        const docCategory = doc.CATEGORY || doc.category || '';
        const docDesc = doc.DESCRIPTION || doc.description || '';
        const textContent = doc.TEXT_CONTENT || doc.text_content || '';
        const docCaseId = doc.CASE_ID || doc.case_id || null;

        // Fetch global library context (up to 3 relevant docs with text)
        let libraryContext = '';
        const libResult = await oracleDb.executeQuery(
          'SELECT document_name, text_content FROM documents WHERE access_level = \'global\' AND text_content IS NOT NULL AND ROWNUM <= 3 ORDER BY created_at DESC',
          {}
        );
        if (libResult.rows && libResult.rows.length > 0) {
          libraryContext = '\n\nPlatform Library context:\n' + libResult.rows.map(r => {
            const name = r.DOCUMENT_NAME || r.document_name || '';
            const txt = (r.TEXT_CONTENT || r.text_content || '').slice(0, 5000);
            return `[${name}]:\n${txt}`;
          }).join('\n---\n');
        }

        // If case document, also pull sibling case docs for context
        let caseContext = '';
        if (docCaseId) {
          const caseDocsResult = await oracleDb.executeQuery(
            'SELECT document_name, text_content FROM documents WHERE case_id = :caseId AND access_level = \'case\' AND text_content IS NOT NULL AND id != :id AND ROWNUM <= 2',
            { caseId: docCaseId, id }
          );
          if (caseDocsResult.rows && caseDocsResult.rows.length > 0) {
            caseContext = '\n\nOther documents in this case:\n' + caseDocsResult.rows.map(r => {
              const name = r.DOCUMENT_NAME || r.document_name || '';
              const txt = (r.TEXT_CONTENT || r.text_content || '').slice(0, 3000);
              return `[${name}]:\n${txt}`;
            }).join('\n---\n');
          }
        }

        const docSection = textContent
          ? `Document content:\n---\n${textContent.slice(0, 20000)}\n---`
          : `Note: Binary document — analysis based on metadata and library context only.`;
        const aiPrompt = `You are an expert arbitration lawyer and legal analyst.\n\nDocument being analyzed: "${docName}"\nCategory: ${docCategory}\n${docDesc ? `Description: ${docDesc}\n` : ''}${docSection}${libraryContext}${caseContext}\n\nUser request: ${body.prompt}\n\nProvide a concise, professional legal analysis referencing relevant laws and documents where applicable.`;
        const analysis = await callAI(aiPrompt);
        if (!analysis) return sendJSON(res, 503, { error: 'AI not configured. Add GROQ_API_KEY to .env.oracle' });
        await auditTrail.logEvent({ type: 'document_analyzed', caseId: docCaseId, userId: user.userId, action: 'ai_analyze', details: JSON.stringify({ documentId: id, documentName: docName }) });
        return sendJSON(res, 200, { analysis });
      }

      // --- DELETE /api/documents/:id ---
      // Admin can delete any doc. Other users can delete their own case docs only.
      if (path.match(/^\/api\/documents\/[^/]+$/) && method === 'DELETE') {
        const user = authenticate(req, res);
        if (!user) return;
        const id = path.split('/api/documents/')[1];
        const result = await oracleDb.executeQuery(
          'SELECT access_level, uploaded_by FROM documents WHERE id = :id',
          { id }
        );
        if (!result.rows || result.rows.length === 0) return sendJSON(res, 404, { error: 'Document not found' });
        const doc = result.rows[0];
        const accessLevel = doc.ACCESS_LEVEL || doc.access_level;
        const uploadedBy = doc.UPLOADED_BY || doc.uploaded_by;
        // Platform Library: admin only
        if (accessLevel === 'global' && user.role !== 'admin') {
          return sendJSON(res, 403, { error: 'Only admin can delete Platform Library documents' });
        }
        // Case documents: owner or admin/secretariat
        if (accessLevel === 'case' && user.role !== 'admin' && user.role !== 'secretariat' && uploadedBy !== user.userId) {
          return sendJSON(res, 403, { error: 'You can only delete documents you uploaded' });
        }
        await oracleDb.executeQuery('DELETE FROM documents WHERE id = :id', { id });
        await auditTrail.logEvent({ type: 'document_deleted', caseId: null, userId: user.userId, action: 'delete', details: JSON.stringify({ documentId: id }) });
        return sendJSON(res, 200, { success: true });
      }

      // =============================================
      // --- ANALYTICS ROUTE ---
      // =============================================

      // --- GET /api/analytics ---
      if (path === '/api/analytics' && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const casesResult = await oracleDb.executeQuery('SELECT status, COUNT(*) AS count FROM cases GROUP BY status', {});
        const docsResult = await oracleDb.executeQuery('SELECT COUNT(*) AS count FROM documents', {});
        const hearingsResult = await oracleDb.executeQuery('SELECT status, COUNT(*) AS count FROM hearings GROUP BY status', {});
        return sendJSON(res, 200, {
          cases: casesResult.rows || [],
          documents: docsResult.rows || [],
          hearings: hearingsResult.rows || []
        });
      }

      // =============================================
      // --- SETTINGS ROUTE ---
      // =============================================

      // --- GET /api/settings ---
      if (path === '/api/settings' && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        return sendJSON(res, 200, { settings: { institution: 'Arbitration Platform', timezone: 'Africa/Nairobi' } });
      }

      // --- PUT /api/settings ---
      if (path === '/api/settings' && method === 'PUT') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        return sendJSON(res, 200, { success: true });
      }

      // =============================================
      // --- AI ROUTES ---
      // =============================================

      // --- POST /api/ai/governing-law ---
      if (path === '/api/ai/governing-law' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const { seatOfArbitration, caseType, jurisdiction } = await parseBody(req);
        if (!GROQ_API_KEY && !GEMINI_API_KEY) {
          return sendJSON(res, 200, { success: false, message: 'AI not configured. Add GROQ_API_KEY or GEMINI_API_KEY to .env.oracle' });
        }
        const seat = jurisdiction || seatOfArbitration || 'Kenya';
        const prompt = `For a ${caseType || 'commercial'} arbitration with seat in ${seat}, provide a JSON object with:
- governingLaw: standard substantive law (e.g., "Laws of Kenya")
- arbitrationLaw: primary arbitration statute with year
- arbitrationRules: top recommended institutional rules for this jurisdiction
- institutions: array of top 3 arbitration institutions
- notes: one sentence on the legal framework

Respond ONLY with valid JSON, no markdown, no extra text.`;
        const text = await callAI(prompt);
        if (!text) return sendJSON(res, 500, { error: 'AI call failed' });
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { notes: text };
          return sendJSON(res, 200, { success: true, ...data });
        } catch {
          return sendJSON(res, 200, { success: true, notes: text });
        }
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
