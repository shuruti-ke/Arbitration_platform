'use strict';
// Load env vars from .env.oracle before anything else
require('dotenv').config({ path: '.env.oracle' });

const http = require('http');
const url = require('url');
const crypto = require('crypto');

// AI client — uses NVIDIA Nemotron first, with Groq/Gemini as fallbacks
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.NGC_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callAI(prompt) {
  // Try NVIDIA Nemotron first
  if (NVIDIA_API_KEY) {
    const res = await fetch(`${NVIDIA_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    if (!res.ok) throw new Error(data.message || data.error?.message || `NVIDIA request failed with ${res.status}`);
    return data.choices?.[0]?.message?.content || null;
  }

  // Try Groq as a fallback
  if (GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
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
      const PDFParser = require('pdf2json');
      const text = await new Promise((resolve, reject) => {
        const parser = new PDFParser(null, 1);
        parser.on('pdfParser_dataReady', (data) => {
          try {
            const pages = (data.Pages || []);
            const extracted = pages.map(page =>
              (page.Texts || []).map(t => decodeURIComponent(t.R.map(r => r.T).join(' '))).join(' ')
            ).join('\n');
            resolve(extracted);
          } catch (e) { resolve(''); }
        });
        parser.on('pdfParser_dataError', (e) => reject(e.parserError || e));
        parser.parseBuffer(buffer);
      });
      return text.slice(0, 100000);
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
const LegalSourceRegistry = require('./services/legal-source-registry');
const ComplianceGapMapService = require('./services/compliance-gap-map');
const NeonDatabaseService = require('./services/neon-database-service');
const OracleDatabaseService = process.env.DATABASE_URL ? null : require('./services/oracle-database-service');
const IntelligenceService = require('./services/intelligence-service');
const DocumentAnalysisService = require('./services/document-analysis-service');
const { UserService, ROLES } = require('./services/user-service');
const AuthService = require('./services/auth-service');
const HearingService = require('./services/hearing-service');
const EmailService = require('./services/email-service');
const emailService = new EmailService();

// Models
const ConflictGraph = require('./models/conflict-graph');

// In-memory award hash store: hash -> metadata
const awardHashStore = new Map();

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

function cleanModelText(value) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function normalizeRuleGuidanceKey({ seatOfArbitration, caseType, arbitrationRules }) {
  const raw = [seatOfArbitration, caseType, arbitrationRules]
    .map((value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' '))
    .join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function buildRuleGuidanceSummary(data = {}) {
  const summaryParts = [
    data.notes,
    data.proceduralGuidance,
    data.tribunalGuidance,
  ].filter(Boolean);
  return cleanModelText(summaryParts.join(' '));
}

// --- Server factory ---

function createServer(services) {
  const {
    oracleDb, auditTrail, consentService,
    aiOrchestrator, ruleEngine, caService,
    aiConflictScanner, certificateValidator,
    authService, userService, hearingService,
    metricsDashboard, riskMonitoring, intelligenceService,
    documentAnalysisService,
    disclosureWorkflow,
    legalSourceRegistry,
    complianceGapMapService,
    eSignatureController
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
            institutions: ['LCIA', 'SIAC', 'Arbitration Act (Cap. 49)']
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
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const requestData = await parseBody(req);
        if (!requestData.caseId) {
          return sendJSON(res, 400, { error: 'caseId is required' });
        }
        const disclosureId = disclosureWorkflow.createDisclosure({
          ...requestData,
          createdBy: user.userId
        });
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

      // --- POST /api/disclosure/challenge ---
      if (path === '/api/disclosure/challenge' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const requestData = await parseBody(req);
        if (!requestData.disclosureId) {
          return sendJSON(res, 400, { error: 'disclosureId is required' });
        }
        const challengeId = disclosureWorkflow.createChallenge(requestData.disclosureId, {
          ...requestData,
          submittedBy: user.userId
        });
        await auditTrail.logEvent({
          type: 'disclosure_challenge',
          caseId: requestData.caseId,
          action: 'create',
          challengeId,
          disclosureId: requestData.disclosureId
        });
        return sendJSON(res, 200, {
          success: true,
          message: 'Challenge request received',
          challengeId
        });
      }

      // --- POST /api/disclosure/challenge/:challengeId/resolve ---
      if (path.startsWith('/api/disclosure/challenge/') && path.endsWith('/resolve') && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const challengeId = path.split('/')[4];
        const requestData = await parseBody(req);
        disclosureWorkflow.updateChallengeStatus(challengeId, requestData.status || 'resolved', {
          resolvedBy: user.userId,
          reason: requestData.reason || '',
          note: requestData.note || ''
        });
        return sendJSON(res, 200, {
          success: true,
          challengeId,
          status: requestData.status || 'resolved'
        });
      }

      // --- GET /api/compliance ---
      if (path === '/api/compliance' && method === 'GET') {
        return sendJSON(res, 200, {
          message: 'ODPC compliance reporting endpoint',
          status: 'operational'
        });
      }

      // --- GET /api/legal-sources ---
      if (path === '/api/legal-sources' && method === 'GET') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        return sendJSON(res, 200, {
          sources: legalSourceRegistry.getCurrentSources(),
          citationSummary: legalSourceRegistry.getCitationSummary()
        });
      }

      // --- GET /api/compliance/gap-map ---
      if (path === '/api/compliance/gap-map' && method === 'GET') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        return sendJSON(res, 200, complianceGapMapService.getGapMap());
      }

      // --- POST /api/compliance/arbitrability-check ---
      if (path === '/api/compliance/arbitrability-check' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const body = await parseBody(req);
        return sendJSON(res, 200, complianceGapMapService.assessArbitrability(body.case || body));
      }

      // --- GET /api/signing/readiness ---
      if (path === '/api/signing/readiness' && method === 'GET') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        return sendJSON(res, 200, eSignatureController.getSigningReadiness({ type: parsedUrl.query.type || 'legal document' }));
      }

      // --- POST /api/awards/pack ---
      if (path === '/api/awards/pack' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const body = await parseBody(req);
        const pack = AwardController.buildSection32AwardPack(body);
        // Generate SHA-256 verification hash
        const hashInput = JSON.stringify({ caseId: body.caseId, title: pack.title, generatedAt: pack.generatedAt, packType: pack.packType });
        const verificationHash = crypto.createHash('sha256').update(hashInput).digest('hex');
        awardHashStore.set(verificationHash, {
          hash: verificationHash,
          caseId: body.caseId || null,
          title: pack.title,
          status: pack.status,
          generatedAt: pack.generatedAt,
          generatedBy: user.userId,
          seat: body.seat || null,
        });
        return sendJSON(res, 200, { ...pack, verificationHash });
      }

      // --- GET /api/awards/verify ---
      if (path === '/api/awards/verify' && method === 'GET') {
        const { hash } = parsedUrl.query;
        if (!hash) return sendJSON(res, 400, { error: 'hash query parameter required' });
        const record = awardHashStore.get(hash);
        if (!record) return sendJSON(res, 404, { verified: false, message: 'Hash not found in registry' });
        return sendJSON(res, 200, { verified: true, ...record });
      }

      // =============================================
      // --- TRAINING ROUTES ---
      // =============================================

      // --- POST /api/training/generate-module ---
      if (path === '/api/training/generate-module' && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const { topic } = await parseBody(req);
        if (!topic) return sendJSON(res, 400, { error: 'topic is required' });
        const prompt = `You are an expert international arbitration trainer. Generate a comprehensive training module on: "${topic}".
Audience: legal professionals working in international arbitration.
Respond with ONLY a valid JSON object (no markdown fences, no explanation outside the JSON):
{
  "title": "Concise module title (max 8 words)",
  "description": "One sentence describing what participants will learn",
  "level": "Beginner",
  "duration": "25 min",
  "topics": ["Subtopic 1","Subtopic 2","Subtopic 3","Subtopic 4","Subtopic 5"],
  "content": "Detailed module text (400-600 words) covering key concepts, practical applications, and important considerations."
}
level must be one of: Beginner, Intermediate, Advanced. duration between 15-60 min.`;
        try {
          const raw = await callAI(prompt);
          const match = raw.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('No JSON in AI response');
          const mod = JSON.parse(match[0]);
          mod.id = `ai_${Date.now()}`;
          mod.aiGenerated = true;
          mod.generatedAt = new Date().toISOString();
          return sendJSON(res, 200, { module: mod });
        } catch (err) {
          return sendJSON(res, 500, { error: 'AI module generation failed', detail: err.message });
        }
      }

      // --- POST /api/training/trending-topics ---
      if (path === '/api/training/trending-topics' && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const prompt = `You are an expert in international arbitration. List 6 trending or emerging topics in international arbitration that would make excellent training modules for legal professionals in 2025.
Respond with ONLY a valid JSON array of short topic strings (no markdown, no explanation):
["Topic 1","Topic 2","Topic 3","Topic 4","Topic 5","Topic 6"]`;
        try {
          const raw = await callAI(prompt);
          const match = raw.match(/\[[\s\S]*\]/);
          if (!match) throw new Error('No JSON array in AI response');
          const topics = JSON.parse(match[0]);
          return sendJSON(res, 200, { topics });
        } catch (err) {
          return sendJSON(res, 500, { error: 'AI topic generation failed', detail: err.message });
        }
      }

      // --- POST /api/training/exam/question ---
      if (path === '/api/training/exam/question' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const { moduleTitle, moduleTopics = [], difficulty = 3, coveredTopics = [] } = await parseBody(req);
        const diffLabel = { 1: 'basic recall', 2: 'foundational conceptual', 3: 'intermediate application', 4: 'advanced analytical', 5: 'expert scenario-based' }[difficulty] || 'intermediate';
        const topicsStr = moduleTopics.join(', ') || moduleTitle;
        const avoidStr = coveredTopics.length > 0 ? `Avoid repeating these already-covered subtopics: ${coveredTopics.join(', ')}.` : '';
        const prompt = `You are an arbitration examiner. Generate a ${diffLabel} multiple-choice question about "${moduleTitle}".
Topics to draw from: ${topicsStr}.
${avoidStr}
The question must test practical knowledge for legal professionals. Make the wrong options plausible but clearly distinguishable.
Respond with ONLY a valid JSON object (no markdown fences):
{
  "text": "Full question text?",
  "options": ["A. option","B. option","C. option","D. option"],
  "correctIndex": 0,
  "explanation": "Brief explanation of the correct answer and why the others are wrong.",
  "topic": "Specific subtopic this question covers"
}
correctIndex must be 0, 1, 2, or 3.`;
        try {
          const raw = await callAI(prompt);
          const match = raw.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('No JSON in AI response');
          const q = JSON.parse(match[0]);
          q.questionId = `q_${Date.now()}`;
          q.difficulty = difficulty;
          return sendJSON(res, 200, { question: q });
        } catch (err) {
          return sendJSON(res, 500, { error: 'AI question generation failed', detail: err.message });
        }
      }

      // --- POST /api/court-filing/compliance-check ---
      if (path === '/api/court-filing/compliance-check' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator', 'counsel']);
        if (!user) return;
        const { jurisdiction, documentText } = await parseBody(req);
        if (!jurisdiction || !documentText) return sendJSON(res, 400, { error: 'jurisdiction and documentText are required' });

        const reqList  = (jurisdiction.requirements || []).map((r, i) => `${i+1}. ${r}`).join('\n');
        const gndList  = (jurisdiction.grounds || []).map((g, i) => `${i+1}. ${g}`).join('\n');
        const docSnip  = documentText.slice(0, 6000); // cap to avoid token limits

        const prompt = `You are an expert arbitration lawyer specialising in award enforcement under the New York Convention.

Analyse the following document for compliance with the filing requirements for enforcing an arbitral award in ${jurisdiction.country}.

JURISDICTION:
Court: ${jurisdiction.court}
Time limit: ${jurisdiction.timeLimit}
Notes: ${jurisdiction.notes || ''}

FILING REQUIREMENTS:
${reqList}

GROUNDS TO REFUSE ENFORCEMENT:
${gndList}

DOCUMENT:
"""
${docSnip}
"""

Provide a detailed compliance assessment. Respond with ONLY a valid JSON object (no markdown fences):
{
  "overallCompliance": "compliant",
  "score": 85,
  "summary": "One paragraph summary of the assessment.",
  "checks": [
    { "requirement": "requirement text", "status": "met", "finding": "specific finding from the document" }
  ],
  "potentialGrounds": [
    { "ground": "ground text", "risk": "low", "finding": "assessment" }
  ],
  "recommendations": ["Action item 1", "Action item 2"]
}
overallCompliance must be one of: compliant, partial, non-compliant.
status must be one of: met, partial, missing.
risk must be one of: low, medium, high.
score is 0-100.`;

        try {
          const raw = await callAI(prompt);
          const match = raw.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('No JSON in AI response');
          const report = JSON.parse(match[0]);
          report.jurisdiction = jurisdiction.country;
          report.checkedAt = new Date().toISOString();
          return sendJSON(res, 200, { report });
        } catch (err) {
          return sendJSON(res, 500, { error: 'AI compliance check failed', detail: err.message });
        }
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
        // Send welcome email with credentials
        emailService.sendWelcomeEmail({
          toEmail: body.email,
          firstName: body.firstName || '',
          password: body.password,
          role: body.role
        }).catch(err => console.error('Welcome email error:', err.message));
        return sendJSON(res, 201, { success: true, user: newUser });
      }

      // --- POST /api/auth/login ---
      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await parseBody(req);
        if (!email || !password) {
          return sendJSON(res, 400, { error: 'email and password are required' });
        }
        try {
          const result = await authService.login(email, password, req.socket.remoteAddress);
          return sendJSON(res, 200, result);
        } catch (error) {
          if (error.message === 'Invalid credentials') {
            return sendJSON(res, 401, { error: 'Invalid credentials' });
          }
          if (error.message === 'Account is deactivated') {
            return sendJSON(res, 403, { error: 'Account is deactivated' });
          }
          if (error.message === 'Email and password are required') {
            return sendJSON(res, 400, { error: 'Email and password are required' });
          }
          throw error;
        }
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

      // --- PUT /api/users/:userId ---
      if (path.startsWith('/api/users/') && !path.includes('/reset-password') && method === 'PUT') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const targetId = path.split('/api/users/')[1];
        const body = await parseBody(req);
        if (body.role && user.role !== 'admin') {
          return sendJSON(res, 403, { error: 'Only admin can change user roles' });
        }
        let sql = 'UPDATE users SET first_name = :firstName, last_name = :lastName';
        const params = { firstName: body.firstName || null, lastName: body.lastName || null, userId: targetId };
        if (body.role && user.role === 'admin') { sql += ', role = :role'; params.role = body.role; }
        if (body.email && user.role === 'admin') { sql += ', email = :email'; params.email = body.email; }
        sql += ' WHERE user_id = :userId';
        await oracleDb.executeQuery(sql, params);
        await auditTrail.logEvent({ type: 'user_updated', userId: user.userId, action: 'update', details: { targetId } });
        return sendJSON(res, 200, { success: true });
      }

      // --- POST /api/users/:userId/reset-password ---
      if (path.match(/^\/api\/users\/[^/]+\/reset-password$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const targetId = path.split('/')[3];
        const body = await parseBody(req);
        if (!body.newPassword || body.newPassword.length < 6) {
          return sendJSON(res, 400, { error: 'newPassword must be at least 6 characters' });
        }
        await userService.resetPassword(targetId, body.newPassword);
        await auditTrail.logEvent({ type: 'password_reset', userId: user.userId, action: 'reset_password', details: { targetId } });
        return sendJSON(res, 200, { success: true });
      }

      // --- GET /api/admin/arbitrators ---
      if (path === '/api/admin/arbitrators' && method === 'GET') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        // Fetch all arbitrators
        const arbResult = await oracleDb.executeQuery(
          `SELECT user_id, first_name, last_name, email, is_active, created_at FROM users WHERE role = 'arbitrator' ORDER BY last_name, first_name`,
          {}
        );
        const arbitrators = (arbResult.rows || []);
        // For each arbitrator fetch their cases (no content — just metadata)
        const arbIds = arbitrators.map(a => a.user_id || a.USER_ID).filter(Boolean);
        const casesMap = {};
        if (arbIds.length > 0) {
          const caseResult = await oracleDb.executeQuery(
            `SELECT case_id, title, status, payment_status, platform_fee, platform_fee_currency, created_by, created_at FROM cases WHERE created_by = ANY(:arbIds::text[]) ORDER BY created_at DESC`,
            { arbIds }
          ).catch(async () => {
            // Fallback for databases that don't support ANY(:array)
            const rows = [];
            for (const arbId of arbIds) {
              const r = await oracleDb.executeQuery(
                `SELECT case_id, title, status, payment_status, platform_fee, platform_fee_currency, created_by, created_at FROM cases WHERE created_by = :arbId ORDER BY created_at DESC`,
                { arbId }
              );
              rows.push(...(r.rows || []));
            }
            return { rows };
          });
          for (const c of (caseResult.rows || [])) {
            const owner = c.created_by || c.CREATED_BY;
            if (!casesMap[owner]) casesMap[owner] = [];
            // Fetch participants for this case
            const caseId = c.case_id || c.CASE_ID;
            const [partyResult, counselResult, docResult] = await Promise.all([
              oracleDb.executeQuery(`SELECT party_id, full_name, party_type, email FROM parties WHERE case_id = :caseId`, { caseId }),
              oracleDb.executeQuery(`SELECT counsel_id, full_name, email, law_firm FROM case_counsel WHERE case_id = :caseId`, { caseId }),
              oracleDb.executeQuery(`SELECT id, document_name, category, uploaded_by, created_at FROM documents WHERE case_id = :caseId ORDER BY created_at DESC`, { caseId })
            ]);
            casesMap[owner].push({
              caseId,
              title: c.title || c.TITLE || '',
              status: c.status || c.STATUS || '',
              paymentStatus: c.payment_status || c.PAYMENT_STATUS || '',
              platformFee: c.platform_fee || c.PLATFORM_FEE || null,
              currency: c.platform_fee_currency || c.PLATFORM_FEE_CURRENCY || 'KES',
              createdAt: c.created_at || c.CREATED_AT,
              documents: (docResult.rows || []).map(d => ({
                id: d.id || d.ID,
                name: d.document_name || d.DOCUMENT_NAME || '',
                category: d.category || d.CATEGORY || '',
                uploadedAt: d.created_at || d.CREATED_AT,
              })),
              participants: [
                ...(partyResult.rows || []).map(p => ({
                  type: 'party',
                  id: p.party_id || p.PARTY_ID,
                  name: p.full_name || p.FULL_NAME || '',
                  role: p.party_type || p.PARTY_TYPE || 'party',
                  email: p.email || p.EMAIL || ''
                })),
                ...(counselResult.rows || []).map(cc => ({
                  type: 'counsel',
                  id: cc.counsel_id || cc.COUNSEL_ID,
                  name: cc.full_name || cc.FULL_NAME || '',
                  role: 'counsel',
                  lawFirm: cc.law_firm || cc.LAW_FIRM || '',
                  email: cc.email || cc.EMAIL || ''
                }))
              ]
            });
          }
        }
        const result = arbitrators.map(a => {
          const arbId = a.user_id || a.USER_ID;
          return {
            userId: arbId,
            firstName: a.first_name || a.FIRST_NAME || '',
            lastName: a.last_name || a.LAST_NAME || '',
            email: a.email || a.EMAIL || '',
            isActive: (a.is_active ?? a.IS_ACTIVE) !== 0,
            createdAt: a.created_at || a.CREATED_AT,
            cases: casesMap[arbId] || []
          };
        });
        return sendJSON(res, 200, { arbitrators: result });
      }

      // --- DELETE /api/users/:userId ---
      if (path.startsWith('/api/users/') && method === 'DELETE') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const targetId = path.split('/api/users/')[1];
        if (targetId === user.userId) {
          return sendJSON(res, 400, { error: 'You cannot delete your own account' });
        }
        try {
          await userService.deleteUser(targetId);
        } catch (err) {
          if (err.message === 'User not found') {
            return sendJSON(res, 404, { error: 'User not found' });
          }
          throw err;
        }
        await auditTrail.logEvent({ type: 'user_delete', userId: user.userId, action: 'delete', details: { targetId } });
        return sendJSON(res, 200, { success: true });
      }

      // --- POST /api/users/:userId/archive ---
      if (path.match(/^\/api\/users\/[^/]+\/archive$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const targetId = path.split('/')[3];
        if (targetId === user.userId) {
          return sendJSON(res, 400, { error: 'You cannot archive your own account' });
        }
        try {
          await userService.deactivateUser(targetId);
        } catch (err) {
          if (err.message === 'User not found') {
            return sendJSON(res, 404, { error: 'User not found' });
          }
          throw err;
        }
        await auditTrail.logEvent({ type: 'user_archive', userId: user.userId, action: 'archive', details: { targetId } });
        return sendJSON(res, 200, { success: true });
      }

      // --- POST /api/users/:userId/restore ---
      if (path.match(/^\/api\/users\/[^/]+\/restore$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const targetId = path.split('/')[3];
        try {
          await userService.restoreUser(targetId);
        } catch (err) {
          if (err.message === 'User not found') {
            return sendJSON(res, 404, { error: 'User not found' });
          }
          throw err;
        }
        await auditTrail.logEvent({ type: 'user_restore', userId: user.userId, action: 'restore', details: { targetId } });
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

      // --- GET /api/hearings ---
      if (path === '/api/hearings' && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const hearings = await hearingService.getAllHearings(user);
        return sendJSON(res, 200, { hearings });
      }

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
        // Notify participants of the scheduled hearing (fire-and-forget)
        setImmediate(async () => {
          try {
            const caseRes = await oracleDb.executeQuery('SELECT title FROM cases WHERE case_id = :caseId', { caseId: body.caseId });
            const caseTitle = caseRes.rows?.[0]?.TITLE || caseRes.rows?.[0]?.title || body.caseId;
            const admins = await userService.listUsers({ role: 'admin' });
            const toEmails = admins.map(u => u.email || u.EMAIL).filter(Boolean);
            if (toEmails.length) {
              const startDate = body.startTime ? new Date(body.startTime) : null;
              await emailService.sendHearingScheduled({
                toEmails,
                caseTitle,
                caseId: body.caseId,
                hearingDate: startDate ? startDate.toLocaleDateString() : '—',
                hearingTime: startDate ? startDate.toLocaleTimeString() : '—',
                location: body.location || body.jitsiRoom || 'Virtual (platform)',
                hearingType: body.hearingType || body.type || 'Procedural',
                notes: body.notes || null,
              });
            }
          } catch (e) { console.warn('Hearing scheduled email failed:', e.message); }
        });
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

      // --- DELETE /api/hearings/:hearingId ---
      if (path.match(/^\/api\/hearings\/[^/]+$/) && method === 'DELETE' &&
          !path.includes('/assign') && !path.includes('/panel')) {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const hearingId = path.split('/api/hearings/')[1];
        const hearing = await hearingService.getHearing(hearingId);
        if (!hearing) return sendJSON(res, 404, { error: 'Hearing not found' });
        const deleted = await hearingService.deleteHearing(hearingId);
        await auditTrail.logEvent({
          type: 'hearing_delete',
          userId: user.userId,
          action: 'delete',
          details: {
            hearingId,
            caseId: hearing.caseId || hearing.CASE_ID || null
          }
        });
        return sendJSON(res, 200, { success: true, hearing: deleted });
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
        const isModerator = ['admin', 'secretariat', 'arbitrator'].includes(user.role);
        let jitsiUrl;
        if (config.jitsi.appId && config.jitsi.apiKeyId && config.jitsi.privateKey) {
          // Use JaaS authenticated URL with platform branding
          const userProfile = await userService.findById(user.userId);
          jitsiUrl = hearingService.getJaaSRoomUrl({
            appId: config.jitsi.appId,
            apiKeyId: config.jitsi.apiKeyId,
            privateKey: config.jitsi.privateKey,
            jitsiRoom,
            user: userProfile || user,
            isModerator
          });
        } else {
          jitsiUrl = hearingService.getJitsiRoomUrl(config.jitsi.baseUrl, jitsiRoom);
        }
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
        const params = {};
        let sql;

        if (user.role === 'admin') {
          // Admin sees limited invoice/payment info only — no case content
          // JOIN users to get arbitrator name
          sql = `SELECT c.case_id, c.title, c.status, c.payment_status, c.platform_fee, c.platform_fee_currency,
                   c.created_by, c.created_at,
                   COALESCE(u.first_name || ' ' || u.last_name, '') AS arbitrator_name,
                   u.email AS arbitrator_email
                 FROM cases c
                 LEFT JOIN users u ON u.user_id = c.created_by AND u.role = 'arbitrator'
                 ORDER BY c.created_at DESC`;
        } else if (user.role === 'secretariat') {
          // Secretariat manages procedural side — can see all cases
          sql = 'SELECT * FROM cases ORDER BY created_at DESC';
          if (status) { sql = 'SELECT * FROM cases WHERE status = :status ORDER BY created_at DESC'; params.status = status; }
        } else if (user.role === 'arbitrator') {
          // Arbitrators see their own cases only
          sql = 'SELECT * FROM cases WHERE created_by = :userId ORDER BY created_at DESC';
          params.userId = user.userId;
        } else {
          // Party / counsel — cases where they appear as a participant
          // Match by user email against parties and case_counsel tables
          const profile = await userService.findById(user.userId);
          const email = profile?.email || profile?.EMAIL || user.email || '';
          sql = `SELECT DISTINCT c.* FROM cases c
            LEFT JOIN parties p ON p.case_id = c.case_id AND LOWER(p.email) = LOWER(:email)
            LEFT JOIN case_counsel cc ON cc.case_id = c.case_id AND LOWER(cc.email) = LOWER(:email2)
            WHERE p.party_id IS NOT NULL OR cc.counsel_id IS NOT NULL
            ORDER BY c.created_at DESC`;
          params.email = email;
          params.email2 = email;
        }

        const result = await oracleDb.executeQuery(sql, params);
        return sendJSON(res, 200, { cases: result.rows || [] });
      }

      // --- GET /api/cases/:caseId ---
      if (path.match(/^\/api\/cases\/[^/]+$/) && method === 'GET') {
        const user = authenticate(req, res);
        if (!user) return;
        const caseId = path.split('/api/cases/')[1];

        // Admin cannot view case details — confidentiality wall
        if (user.role === 'admin') {
          return sendJSON(res, 403, { error: 'Administrators cannot access case details to preserve confidentiality. Use the dashboard for aggregate information.' });
        }

        const caseResult = await oracleDb.executeQuery('SELECT * FROM cases WHERE case_id = :caseId', { caseId });
        if (!caseResult.rows || caseResult.rows.length === 0) return sendJSON(res, 404, { error: 'Case not found' });

        // For party/counsel — verify they are actually a participant in this case, and the case is active
        if (user.role === 'party' || user.role === 'counsel') {
          const caseStatus = (caseResult.rows[0].STATUS || caseResult.rows[0].status || '').toLowerCase();
          if (['closed', 'completed', 'terminated'].includes(caseStatus)) {
            return sendJSON(res, 403, { error: 'This case has concluded. Your access has expired. Contact the arbitrator for any further communications.' });
          }
          const profile = await userService.findById(user.userId);
          const email = profile?.email || profile?.EMAIL || '';
          const partyCheck = await oracleDb.executeQuery(
            'SELECT party_id FROM parties WHERE case_id = :caseId AND LOWER(email) = LOWER(:email)',
            { caseId, email }
          );
          const counselCheck = await oracleDb.executeQuery(
            'SELECT counsel_id FROM case_counsel WHERE case_id = :caseId AND LOWER(email) = LOWER(:email)',
            { caseId, email }
          );
          const isParticipant = (partyCheck.rows?.length > 0) || (counselCheck.rows?.length > 0);
          if (!isParticipant) return sendJSON(res, 403, { error: 'Access denied. You are not a participant in this case.' });
        }
        // For arbitrator — verify they are the case creator or assigned arbitrator
        if (user.role === 'arbitrator') {
          const caseRow = caseResult.rows[0];
          const createdBy = caseRow.CREATED_BY || caseRow.created_by;
          if (createdBy && createdBy !== user.userId) {
            const assignCheck = await oracleDb.executeQuery(
              'SELECT assignment_id FROM arbitrator_assignments WHERE case_id = :caseId AND arbitrator_id = :userId',
              { caseId, userId: user.userId }
            );
            if (!assignCheck.rows?.length) return sendJSON(res, 403, { error: 'Access denied. You are not assigned to this case.' });
          }
        }
        const agreementResult = await oracleDb.executeQuery(
          'SELECT * FROM case_agreements WHERE case_id = :caseId ORDER BY created_at DESC',
          { caseId }
        );
        const agreementId = agreementResult.rows?.[0]?.AGREEMENT_ID || agreementResult.rows?.[0]?.agreement_id || null;
        const agreementPartiesResult = agreementId
          ? await oracleDb.executeQuery('SELECT * FROM case_agreement_parties WHERE agreement_id = :agreementId ORDER BY created_at', { agreementId })
          : { rows: [] };
        const agreementSignaturesResult = agreementId
          ? await oracleDb.executeQuery('SELECT * FROM case_agreement_signatures WHERE agreement_id = :agreementId ORDER BY created_at', { agreementId })
          : { rows: [] };
        const agreementExtractionResult = agreementId
          ? await oracleDb.executeQuery('SELECT * FROM case_agreement_extractions WHERE agreement_id = :agreementId ORDER BY created_at DESC', { agreementId })
          : { rows: [] };
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
          agreement: agreementResult.rows?.[0] || null,
          agreementParties: agreementPartiesResult.rows || [],
          agreementSignatures: agreementSignaturesResult.rows || [],
          agreementExtractions: agreementExtractionResult.rows || [],
          ruleGuidance: caseResult.rows?.[0] || null,
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
        const user = authenticate(req, res, ['arbitrator', 'admin', 'secretariat']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.title) return sendJSON(res, 400, { error: 'title is required' });
        const caseId = 'case-' + Date.now();
        const ruleGuidance = body.ruleGuidance || {};
        await oracleDb.executeQuery(
          `INSERT INTO cases (case_id, title, status, case_type, sector, dispute_category,
            description, dispute_amount, currency, governing_law, seat_of_arbitration,
            arbitration_rules, language_of_proceedings, institution_ref, filing_date,
            response_deadline, case_stage, num_arbitrators, confidentiality_level, third_party_funding,
            relief_sought, arbitrator_nominee, nominee_qualifications,
            filing_fee, filing_fee_currency, service_confirmed,
            rule_guidance_summary, rule_guidance_json, rule_guidance_model,
            rule_guidance_cache_key, rule_guidance_cached, rule_guidance_source,
            rule_guidance_generated_at, created_by, payment_status)
           VALUES (:caseId, :title, :status, :caseType, :sector, :disputeCategory,
            :description, :disputeAmount, :currency, :governingLaw, :seatOfArbitration,
            :arbitrationRules, :languageOfProceedings, :institutionRef, :filingDate,
            :responseDeadline, :caseStage, :numArbitrators, :confidentialityLevel, :thirdPartyFunding,
            :reliefSought, :arbitratorNominee, :nomineeQualifications,
            :filingFee, :filingFeeCurrency, :serviceConfirmed,
            :ruleGuidanceSummary, :ruleGuidanceJson, :ruleGuidanceModel,
            :ruleGuidanceCacheKey, :ruleGuidanceCached, :ruleGuidanceSource,
            :ruleGuidanceGeneratedAt, :createdBy, :paymentStatus)`,
          {
            caseId,
            title: body.title,
            status: user.role === 'arbitrator' ? 'pending_payment' : (body.status || 'active'),
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
            thirdPartyFunding: body.thirdPartyFunding ? 1 : 0,
            reliefSought: body.reliefSought || null,
            arbitratorNominee: body.arbitratorNominee || null,
            nomineeQualifications: body.nomineeQualifications || null,
            filingFee: body.filingFee || null,
            filingFeeCurrency: body.filingFeeCurrency || 'KES',
            serviceConfirmed: body.serviceConfirmed ? 1 : 0,
            ruleGuidanceSummary: ruleGuidance.summary || null,
            ruleGuidanceJson: Object.keys(ruleGuidance).length > 0 ? JSON.stringify(ruleGuidance) : null,
            ruleGuidanceModel: ruleGuidance.modelName || ruleGuidance.model || null,
            ruleGuidanceCacheKey: ruleGuidance.cacheKey || null,
            ruleGuidanceCached: ruleGuidance.cached ? 1 : 0,
            ruleGuidanceSource: ruleGuidance.source || (ruleGuidance.cached ? 'cache' : (Object.keys(ruleGuidance).length > 0 ? 'ai' : null)),
            ruleGuidanceGeneratedAt: ruleGuidance.generatedAt ? new Date(ruleGuidance.generatedAt) : (Object.keys(ruleGuidance).length > 0 ? new Date() : null),
            createdBy: user.userId,
            paymentStatus: user.role === 'arbitrator' ? 'pending_invoice' : 'paid'
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
        // Notify admin + secretariat of new case (fire-and-forget)
        setImmediate(async () => {
          try {
            const admins = await userService.listUsers({ role: 'admin' });
            const secs = await userService.listUsers({ role: 'secretariat' });
            const toEmails = [...admins, ...secs].map(u => u.email || u.EMAIL).filter(Boolean);
            if (toEmails.length) {
              await emailService.sendCaseCreated({
                toEmails,
                caseTitle: body.title,
                caseId,
                claimant: body.claimantName || null,
                respondent: body.respondentName || null,
                arbitrator: body.arbitratorNominee || null,
                seat: body.seatOfArbitration || null,
              });
            }
          } catch (e) { console.warn('Case created email failed:', e.message); }
        });
        return sendJSON(res, 201, { success: true, caseId, title: body.title });
      }

      // --- PUT /api/cases/:caseId ---
      if (path.match(/^\/api\/cases\/[^/]+$/) && method === 'PUT') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const caseId = path.split('/api/cases/')[1];
        const body = await parseBody(req);
        const ruleGuidance = body.ruleGuidance || {};
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
            relief_sought = :reliefSought, arbitrator_nominee = :arbitratorNominee,
            nominee_qualifications = :nomineeQualifications, filing_fee = :filingFee,
            filing_fee_currency = :filingFeeCurrency, service_confirmed = :serviceConfirmed,
            rule_guidance_summary = :ruleGuidanceSummary,
            rule_guidance_json = :ruleGuidanceJson,
            rule_guidance_model = :ruleGuidanceModel,
            rule_guidance_cache_key = :ruleGuidanceCacheKey,
            rule_guidance_cached = :ruleGuidanceCached,
            rule_guidance_source = :ruleGuidanceSource,
            rule_guidance_generated_at = :ruleGuidanceGeneratedAt,
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
            thirdPartyFunding: body.thirdPartyFunding ? 1 : 0,
            reliefSought: body.reliefSought || null,
            arbitratorNominee: body.arbitratorNominee || null,
            nomineeQualifications: body.nomineeQualifications || null,
            filingFee: body.filingFee || null,
            filingFeeCurrency: body.filingFeeCurrency || 'KES',
            serviceConfirmed: body.serviceConfirmed ? 1 : 0,
            ruleGuidanceSummary: ruleGuidance.summary || null,
            ruleGuidanceJson: Object.keys(ruleGuidance).length > 0 ? JSON.stringify(ruleGuidance) : null,
            ruleGuidanceModel: ruleGuidance.modelName || ruleGuidance.model || null,
            ruleGuidanceCacheKey: ruleGuidance.cacheKey || null,
            ruleGuidanceCached: ruleGuidance.cached ? 1 : 0,
            ruleGuidanceSource: ruleGuidance.source || (ruleGuidance.cached ? 'cache' : (Object.keys(ruleGuidance).length > 0 ? 'ai' : null)),
            ruleGuidanceGeneratedAt: ruleGuidance.generatedAt ? new Date(ruleGuidance.generatedAt) : (Object.keys(ruleGuidance).length > 0 ? new Date() : null)
          }
        );
        await auditTrail.logEvent({ type: 'case_updated', caseId, userId: user.userId, action: 'update' });
        return sendJSON(res, 200, { success: true });
      }

      // --- POST /api/cases/:caseId/submit ---
      if (path.match(/^\/api\/cases\/[^/]+\/submit$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat']);
        if (!user) return;
        const caseId = path.split('/')[3];
        const caseResult = await oracleDb.executeQuery('SELECT * FROM cases WHERE case_id = :caseId', { caseId });
        if (!caseResult.rows || caseResult.rows.length === 0) return sendJSON(res, 404, { error: 'Case not found' });
        const c = caseResult.rows[0];
        // Validate minimum requirements
        const missing = [];
        if (!(c.DESCRIPTION || c.description)) missing.push('dispute description');
        if (!(c.RELIEF_SOUGHT || c.reliefSought)) missing.push('relief sought');
        if (!(c.SEAT_OF_ARBITRATION || c.seatOfArbitration)) missing.push('seat of arbitration');
        // Warn but allow submission even if not all items present
        await oracleDb.executeQuery(
          `UPDATE cases SET submission_status = 'submitted', submitted_at = CURRENT_TIMESTAMP,
            case_stage = CASE WHEN (case_stage = 'filing' OR case_stage IS NULL) THEN 'response' ELSE case_stage END,
            updated_at = CURRENT_TIMESTAMP WHERE case_id = :caseId`,
          { caseId }
        );
        await auditTrail.logEvent({
          type: 'case_submitted', caseId, userId: user.userId, action: 'submit_to_registrar',
          details: { missingItems: missing, submittedAt: new Date().toISOString() }
        });
        return sendJSON(res, 200, { success: true, missingItems: missing, message: 'Case submitted to registrar' });
      }

      // --- POST /api/cases/:caseId/assign --- (admin assigns a case to an arbitrator)
      if (path.match(/^\/api\/cases\/[^/]+\/assign$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const caseId = path.split('/')[3];
        const body = await parseBody(req);
        const { arbitratorId } = body;
        if (!arbitratorId) return sendJSON(res, 400, { error: 'arbitratorId is required' });
        // Verify the target user is actually an arbitrator
        const arbCheck = await oracleDb.executeQuery(
          `SELECT user_id FROM users WHERE user_id = :arbitratorId AND role = 'arbitrator'`,
          { arbitratorId }
        );
        if (!arbCheck.rows || arbCheck.rows.length === 0) {
          return sendJSON(res, 400, { error: 'Target user is not an arbitrator' });
        }
        await oracleDb.executeQuery(
          `UPDATE cases SET created_by = :arbitratorId, updated_at = CURRENT_TIMESTAMP WHERE case_id = :caseId`,
          { arbitratorId, caseId }
        );
        await auditTrail.logEvent({ type: 'case_assigned', userId: user.userId, action: 'assign_arbitrator', details: { caseId, arbitratorId } });
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
        const uploadedAt = new Date().toISOString();
        // Insert immediately with no text_content — respond fast, extract in background
        await oracleDb.executeQuery(
          `INSERT INTO documents (case_id, document_name, document_content, category, description, text_content, access_level, uploaded_by)
           VALUES (:caseId, :documentName, :content, :category, :description, NULL, :accessLevel, :uploadedBy)`,
          {
            caseId: body.caseId || null,
            documentName: body.documentName,
            content,
            category: body.category || 'Other',
            description: body.description || null,
            accessLevel,
            uploadedBy: user.userId,
          }
        );
        await auditTrail.logEvent({ type: 'document_uploaded', caseId: body.caseId, userId: user.userId, action: 'upload', details: JSON.stringify({ documentName: body.documentName, category: body.category, accessLevel }) });
        // Respond immediately — extract text + notify in background
        sendJSON(res, 201, { success: true, documentName: body.documentName, accessLevel });
        // Background: notify case participants of document upload
        setImmediate(async () => {
          try {
            if (body.caseId) {
              const caseRes = await oracleDb.executeQuery('SELECT title FROM cases WHERE case_id = :caseId', { caseId: body.caseId });
              const caseTitle = caseRes.rows?.[0]?.TITLE || caseRes.rows?.[0]?.title || body.caseId;
              const admins = await userService.listUsers({ role: 'admin' });
              const toEmails = admins.map(u => u.email || u.EMAIL).filter(Boolean);
              if (toEmails.length) {
                await emailService.sendDocumentUploaded({
                  toEmails,
                  caseTitle,
                  caseId: body.caseId,
                  documentName: body.documentName,
                  uploadedBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                  category: body.category || 'Other',
                });
              }
            }
          } catch (e) { console.warn('Document uploaded email failed:', e.message); }
        });
        // Background: extract text and update the record
        setImmediate(async () => {
          try {
            const textContent = await extractTextFromFile(body.content, body.documentName, body.mimeType);
            if (textContent) {
              await oracleDb.executeQuery(
                `UPDATE documents SET text_content = :textContent
                 WHERE document_name = :documentName AND uploaded_by = :uploadedBy
                 AND text_content IS NULL AND ROWNUM = 1`,
                { textContent, documentName: body.documentName, uploadedBy: user.userId }
              );
            }
          } catch (e) {
            console.warn('Background text extraction failed:', e.message);
          }
        });
      }

      // =============================================
      // --- PAYMENT ROUTES ---
      // =============================================

      // --- GET /api/payments ---
      if (path === '/api/payments' && method === 'GET') {
        const user = authenticate(req, res, ['admin', 'arbitrator']);
        if (!user) return;
        let sql, params = {};
        if (user.role === 'admin') {
          sql = `SELECT cp.*, c.title as case_title
                 FROM case_payments cp LEFT JOIN cases c ON c.case_id = cp.case_id
                 ORDER BY cp.created_at DESC`;
        } else {
          sql = `SELECT cp.*, c.title as case_title
                 FROM case_payments cp LEFT JOIN cases c ON c.case_id = cp.case_id
                 WHERE cp.arbitrator_id = :userId
                 ORDER BY cp.created_at DESC`;
          params.userId = user.userId;
        }
        const result = await oracleDb.executeQuery(sql, params);
        // Also include cases pending invoice (no payment record yet)
        if (user.role === 'admin') {
          const pendingSql = `SELECT case_id, title, created_by, payment_status, platform_fee, platform_fee_currency, created_at
                              FROM cases WHERE payment_status = 'pending_invoice' ORDER BY created_at DESC`;
          const pending = await oracleDb.executeQuery(pendingSql, {});
          return sendJSON(res, 200, { payments: result.rows || [], pendingCases: pending.rows || [] });
        }
        const pendingSql = `SELECT case_id, title, created_by, payment_status, platform_fee, platform_fee_currency, created_at
                            FROM cases WHERE payment_status = 'pending_invoice' AND created_by = :userId ORDER BY created_at DESC`;
        const pending = await oracleDb.executeQuery(pendingSql, { userId: user.userId });
        return sendJSON(res, 200, { payments: result.rows || [], pendingCases: pending.rows || [] });
      }

      // --- POST /api/payments/invoice --- (admin issues invoice to arbitrator for a case)
      if (path === '/api/payments/invoice' && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.caseId || !body.amount) return sendJSON(res, 400, { error: 'caseId and amount are required' });
        const caseRes = await oracleDb.executeQuery('SELECT * FROM cases WHERE case_id = :caseId', { caseId: body.caseId });
        if (!caseRes.rows?.length) return sendJSON(res, 404, { error: 'Case not found' });
        const c = caseRes.rows[0];
        const createdBy = c.CREATED_BY || c.created_by;
        const paymentId = 'pay-' + Date.now();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        await oracleDb.executeQuery(
          `INSERT INTO case_payments (payment_id, case_id, arbitrator_id, platform_fee, currency, invoice_number, invoice_issued_at, invoice_issued_by, status)
           VALUES (:paymentId, :caseId, :arbitratorId, :fee, :currency, :invoiceNumber, :now, :issuedBy, 'invoiced')`,
          {
            paymentId,
            caseId: body.caseId,
            arbitratorId: createdBy,
            fee: body.amount,
            currency: body.currency || 'KES',
            invoiceNumber,
            now: new Date(),
            issuedBy: user.userId
          }
        );
        await oracleDb.executeQuery(
          `UPDATE cases SET payment_status = 'invoiced', platform_fee = :fee, platform_fee_currency = :currency WHERE case_id = :caseId`,
          { fee: body.amount, currency: body.currency || 'KES', caseId: body.caseId }
        );
        // Notify arbitrator
        setImmediate(async () => {
          try {
            const profile = await userService.findById(createdBy);
            const email = profile?.email || profile?.EMAIL;
            if (email) {
              await emailService._send({
                to: email,
                subject: `Invoice Issued — ${c.TITLE || c.title}`,
                html: `<p>An invoice has been issued for your case <strong>${c.TITLE || c.title}</strong>.<br>
                       Invoice No: <strong>${invoiceNumber}</strong><br>
                       Amount: <strong>${body.currency || 'KES'} ${body.amount}</strong><br>
                       Payment methods: Bank Transfer, Bank Deposit, M-Pesa, Card.<br>
                       Please attach proof of payment in the Payments section of the platform.</p>`,
              });
            }
          } catch (e) { console.warn('Invoice email failed:', e.message); }
        });
        return sendJSON(res, 201, { success: true, paymentId, invoiceNumber });
      }

      // --- POST /api/payments/:paymentId/proof --- (arbitrator uploads proof of payment)
      if (path.match(/^\/api\/payments\/[^/]+\/proof$/) && method === 'POST') {
        const user = authenticate(req, res, ['arbitrator', 'admin', 'secretariat']);
        if (!user) return;
        const paymentId = path.split('/')[3];
        const body = await parseBody(req);
        if (!body.proofDocument) return sendJSON(res, 400, { error: 'proofDocument (base64) is required' });
        await oracleDb.executeQuery(
          `UPDATE case_payments SET proof_document = :proof, proof_file_name = :fileName, proof_uploaded_at = :now, status = 'proof_uploaded', updated_at = :now2
           WHERE payment_id = :paymentId`,
          {
            proof: body.proofDocument,
            fileName: body.fileName || 'proof-of-payment',
            now: new Date(),
            now2: new Date(),
            paymentId
          }
        );
        const payRes = await oracleDb.executeQuery('SELECT case_id FROM case_payments WHERE payment_id = :paymentId', { paymentId });
        if (payRes.rows?.length) {
          const caseId = payRes.rows[0].CASE_ID || payRes.rows[0].case_id;
          await oracleDb.executeQuery(
            `UPDATE cases SET payment_status = 'proof_uploaded' WHERE case_id = :caseId`,
            { caseId }
          );
        }
        return sendJSON(res, 200, { success: true });
      }

      // --- POST /api/payments/:paymentId/approve --- (admin issues receipt and activates case)
      if (path.match(/^\/api\/payments\/[^/]+\/approve$/) && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const paymentId = path.split('/')[3];
        const body = await parseBody(req);
        const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        await oracleDb.executeQuery(
          `UPDATE case_payments SET status = 'paid', receipt_number = :receiptNumber, receipt_issued_at = :now, receipt_issued_by = :issuedBy, notes = :notes, updated_at = :now2
           WHERE payment_id = :paymentId`,
          {
            receiptNumber,
            now: new Date(),
            issuedBy: user.userId,
            notes: body.notes || null,
            now2: new Date(),
            paymentId
          }
        );
        const payRes = await oracleDb.executeQuery('SELECT case_id, arbitrator_id FROM case_payments WHERE payment_id = :paymentId', { paymentId });
        let caseId;
        if (payRes.rows?.length) {
          caseId = payRes.rows[0].CASE_ID || payRes.rows[0].case_id;
          const arbitratorId = payRes.rows[0].ARBITRATOR_ID || payRes.rows[0].arbitrator_id;
          await oracleDb.executeQuery(
            `UPDATE cases SET payment_status = 'paid', status = 'active' WHERE case_id = :caseId`,
            { caseId }
          );
          await auditTrail.logEvent({ type: 'case_payment_approved', caseId, userId: user.userId, action: 'approve_payment' });
          // Notify arbitrator
          setImmediate(async () => {
            try {
              const profile = await userService.findById(arbitratorId);
              const email = profile?.email || profile?.EMAIL;
              const caseRes2 = await oracleDb.executeQuery('SELECT title FROM cases WHERE case_id = :caseId', { caseId });
              const caseTitle = caseRes2.rows?.[0]?.TITLE || caseRes2.rows?.[0]?.title || caseId;
              if (email) {
                await emailService._send({
                  to: email,
                  subject: `Payment Approved — Case Activated: ${caseTitle}`,
                  html: `<p>Your payment for case <strong>${caseTitle}</strong> has been confirmed.<br>
                         Receipt No: <strong>${receiptNumber}</strong><br>
                         Your case is now <strong>Active</strong>. You can proceed with case management.</p>`,
                });
              }
            } catch (e) { console.warn('Receipt email failed:', e.message); }
          });
        }
        return sendJSON(res, 200, { success: true, receiptNumber, caseId });
      }

      // --- POST /api/forms/agreement/share ---
      if (path === '/api/forms/agreement/share' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const body = await parseBody(req);
        const recipients = Array.isArray(body.recipients) ? body.recipients : [];
        if (recipients.length === 0 || !body.pdfBase64) {
          return sendJSON(res, 400, { error: 'recipients and pdfBase64 are required' });
        }

        const sendResult = await emailService.sendAgreementForSigningEmail({
          toEmails: recipients,
          subject: body.subject,
          message: body.message,
          fileName: body.fileName,
          pdfBase64: body.pdfBase64,
          caseId: body.caseData?.caseId || body.caseId || ''
        });

        if (!sendResult.sent) {
          return sendJSON(res, 500, { error: sendResult.error || 'Failed to email agreement template' });
        }

        await auditTrail.logEvent({
          type: 'agreement_template_shared',
          userId: user.userId,
          action: 'share_agreement_template',
          details: JSON.stringify({ recipients, caseId: body.caseData?.caseId || body.caseId || null })
        });

        return sendJSON(res, 200, { success: true, sent: true, recipients: sendResult.recipients || recipients });
      }

      // --- POST /api/intake/agreement/analyze ---
      if (path === '/api/intake/agreement/analyze' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const requestData = await parseBody(req);
        if (!requestData.documentName || !requestData.content) {
          return sendJSON(res, 400, { error: 'documentName and content are required' });
        }

        const extractedText = await extractTextFromFile(
          requestData.content,
          requestData.documentName,
          requestData.mimeType
        );
        if (!extractedText) {
          return sendJSON(res, 400, { error: 'Could not extract text from the uploaded agreement' });
        }

        const prompt = `You are an arbitration intake assistant. Extract case setup details from the agreement below.
Return valid JSON only, with this exact structure:
{
  "title": "string",
  "caseType": "string",
  "sector": "string",
  "disputeCategory": "string",
  "description": "string",
  "claimantName": "string",
  "claimantOrg": "string",
  "respondentName": "string",
  "respondentOrg": "string",
  "arbitratorNominee": "string",
  "nomineeQualifications": "string",
  "seatOfArbitration": "string",
  "governingLaw": "string",
  "arbitrationRules": "string",
  "languageOfProceedings": "string",
  "numArbitrators": number,
  "confidentialityLevel": "string",
  "reliefSought": "string",
  "summary": "string",
  "keyTerms": ["string"],
  "missingInfo": ["string"]
}

Rules:
- Use only details supported by the agreement.
- If the document is a template with blanks, infer the intended case setup and list blanks under missingInfo.
- Do not invent facts.
- Keep the language simple and practical.
- When referring to Kenyan arbitration law, use Arbitration Act, Cap. 49.

Agreement text:
---
${extractedText.slice(0, 25000)}
---`;

        const aiResult = cleanModelText(await callAI(prompt));
        const parsed = safeParseJson(aiResult);
        if (!parsed) {
          return sendJSON(res, 200, {
            success: true,
            extracted: {
              summary: aiResult || 'No structured extraction was returned.',
              missingInfo: ['Agreement details require manual review.']
            }
          });
        }

        await auditTrail.logEvent({
          type: 'agreement_analysis',
          userId: user.userId,
          action: 'intake_analyze',
          details: JSON.stringify({
            documentName: requestData.documentName,
            extractedKeys: Object.keys(parsed)
          })
        });

        return sendJSON(res, 200, {
          success: true,
          extracted: {
            title: parsed.title || '',
            caseType: parsed.caseType || '',
            sector: parsed.sector || '',
            disputeCategory: parsed.disputeCategory || '',
            description: parsed.description || '',
            claimantName: parsed.claimantName || '',
            claimantOrg: parsed.claimantOrg || '',
            respondentName: parsed.respondentName || '',
            respondentOrg: parsed.respondentOrg || '',
            arbitratorNominee: parsed.arbitratorNominee || '',
            nomineeQualifications: parsed.nomineeQualifications || '',
            seatOfArbitration: parsed.seatOfArbitration || '',
            governingLaw: parsed.governingLaw || '',
            arbitrationRules: parsed.arbitrationRules || '',
            languageOfProceedings: parsed.languageOfProceedings || '',
            numArbitrators: Number(parsed.numArbitrators || 1),
            confidentialityLevel: parsed.confidentialityLevel || '',
            reliefSought: parsed.reliefSought || '',
            summary: parsed.summary || '',
            keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
            missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : []
          }
        });
      }

      // --- POST /api/case-agreements ---
      if (path === '/api/case-agreements' && method === 'POST') {
        const user = authenticate(req, res, ['admin', 'secretariat', 'arbitrator']);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.caseId) {
          return sendJSON(res, 400, { error: 'caseId is required' });
        }

        const agreementId = body.agreementId || `agreement-${Date.now()}`;
        const agreementStatus = body.agreementStatus || 'signed';
        const extracted = body.extracted || {};
        const sourceDocumentName = body.sourceDocumentName || body.documentName || null;
        const parties = Array.isArray(body.parties) ? body.parties : [];
        const signatures = Array.isArray(body.signatures) ? body.signatures : [];
        const extractionJson = JSON.stringify(extracted);
        const keyTerms = JSON.stringify(extracted.keyTerms || []);
        const missingInfo = JSON.stringify(extracted.missingInfo || []);

        await oracleDb.executeQuery(
          `INSERT INTO case_agreements (
            agreement_id, case_id, source_document_name, source_document_type, template_name,
            agreement_status, title, case_type, sector, dispute_category, description,
            claimant_name, claimant_org, respondent_name, respondent_org, arbitrator_nominee,
            nominee_qualifications, seat_of_arbitration, governing_law, arbitration_rules,
            language_of_proceedings, num_arbitrators, confidentiality_level, relief_sought,
            extracted_summary, extracted_json, key_terms, missing_info, signed_at, effective_date,
            created_by
          ) VALUES (
            :agreementId, :caseId, :sourceDocumentName, :sourceDocumentType, :templateName,
            :agreementStatus, :title, :caseType, :sector, :disputeCategory, :description,
            :claimantName, :claimantOrg, :respondentName, :respondentOrg, :arbitratorNominee,
            :nomineeQualifications, :seatOfArbitration, :governingLaw, :arbitrationRules,
            :languageOfProceedings, :numArbitrators, :confidentialityLevel, :reliefSought,
            :extractedSummary, :extractedJson, :keyTerms, :missingInfo, :signedAt, :effectiveDate,
            :createdBy
          )`,
          {
            agreementId,
            caseId: body.caseId,
            sourceDocumentName,
            sourceDocumentType: body.sourceDocumentType || 'uploaded',
            templateName: body.templateName || null,
            agreementStatus,
            title: extracted.title || body.title || null,
            caseType: extracted.caseType || body.caseType || null,
            sector: extracted.sector || body.sector || null,
            disputeCategory: extracted.disputeCategory || body.disputeCategory || null,
            description: extracted.description || body.description || null,
            claimantName: extracted.claimantName || body.claimantName || null,
            claimantOrg: extracted.claimantOrg || body.claimantOrg || null,
            respondentName: extracted.respondentName || body.respondentName || null,
            respondentOrg: extracted.respondentOrg || body.respondentOrg || null,
            arbitratorNominee: extracted.arbitratorNominee || body.arbitratorNominee || null,
            nomineeQualifications: extracted.nomineeQualifications || body.nomineeQualifications || null,
            seatOfArbitration: extracted.seatOfArbitration || body.seatOfArbitration || null,
            governingLaw: extracted.governingLaw || body.governingLaw || null,
            arbitrationRules: extracted.arbitrationRules || body.arbitrationRules || null,
            languageOfProceedings: extracted.languageOfProceedings || body.languageOfProceedings || null,
            numArbitrators: extracted.numArbitrators || body.numArbitrators || 1,
            confidentialityLevel: extracted.confidentialityLevel || body.confidentialityLevel || null,
            reliefSought: extracted.reliefSought || body.reliefSought || null,
            extractedSummary: extracted.summary || body.summary || null,
            extractedJson: extractionJson,
            keyTerms,
            missingInfo,
            signedAt: body.signedAt ? new Date(body.signedAt) : null,
            effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
            createdBy: user.userId
          }
        );

        for (const party of parties) {
          await oracleDb.executeQuery(
            `INSERT INTO case_agreement_parties (
              agreement_id, party_role, full_name, organization_name, email, signature_status, signed_at
            ) VALUES (
              :agreementId, :partyRole, :fullName, :organizationName, :email, :signatureStatus, :signedAt
            )`,
            {
              agreementId,
              partyRole: party.partyRole || party.role || 'party',
              fullName: party.fullName || party.name || null,
              organizationName: party.organizationName || null,
              email: party.email || null,
              signatureStatus: party.signatureStatus || 'pending',
              signedAt: party.signedAt ? new Date(party.signedAt) : null
            }
          );
        }

        for (const signature of signatures) {
          await oracleDb.executeQuery(
            `INSERT INTO case_agreement_signatures (
              agreement_id, signer_role, signer_name, signature_status, signature_method, signed_at, signature_hash
            ) VALUES (
              :agreementId, :signerRole, :signerName, :signatureStatus, :signatureMethod, :signedAt, :signatureHash
            )`,
            {
              agreementId,
              signerRole: signature.signerRole || signature.role || 'party',
              signerName: signature.signerName || signature.name || null,
              signatureStatus: signature.signatureStatus || 'pending',
              signatureMethod: signature.signatureMethod || 'manual_upload',
              signedAt: signature.signedAt ? new Date(signature.signedAt) : null,
              signatureHash: signature.signatureHash || null
            }
          );
        }

        await oracleDb.executeQuery(
          `UPDATE cases SET
            agreement_id = :agreementId,
            agreement_status = :agreementStatus,
            agreement_document_name = :agreementDocumentName,
            updated_at = CURRENT_TIMESTAMP
           WHERE case_id = :caseId`,
          {
            agreementId,
            agreementStatus,
            agreementDocumentName: sourceDocumentName,
            caseId: body.caseId
          }
        );

        await oracleDb.executeQuery(
          `INSERT INTO case_agreement_extractions (
            agreement_id, source_document_name, model_name, extracted_json, extracted_summary, confidence
          ) VALUES (
            :agreementId, :sourceDocumentName, :modelName, :extractedJson, :extractedSummary, :confidence
          )`,
          {
            agreementId,
            sourceDocumentName,
            modelName: body.modelName || process.env.NVIDIA_MODEL || process.env.GROQ_MODEL || 'unknown',
            extractedJson: extractionJson,
            extractedSummary: extracted.summary || body.summary || null,
            confidence: body.confidence || 'medium'
          }
        );

        await auditTrail.logEvent({
          type: 'case_agreement_created',
          caseId: body.caseId,
          userId: user.userId,
          action: 'create_agreement',
          details: { agreementId, sourceDocumentName, agreementStatus }
        });

        return sendJSON(res, 201, {
          success: true,
          agreementId,
          agreementStatus,
          caseId: body.caseId
        });
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
        const docAccessLevel = doc.ACCESS_LEVEL || doc.access_level || 'case';
        const existing = await documentAnalysisService.findCachedAnalysis({
          documentId: id,
          prompt: body.prompt
        });

        if (existing.cached && existing.record) {
          await documentAnalysisService.touchAnalysis(existing.record);
          await auditTrail.logEvent({
            type: 'document_analysis_cache_hit',
            caseId: docCaseId,
            userId: user.userId,
            action: 'ai_analyze_cached',
            details: JSON.stringify({
              documentId: id,
              documentName: docName,
              matchType: existing.matchType,
              similarity: existing.similarity || null
            })
          });
          const cachedAnalysis = existing.record.ANALYSIS_TEXT || existing.record.analysis_text || existing.record.ANALYSIS || existing.record.analysis || '';
          return sendJSON(res, 200, {
            analysis: cachedAnalysis,
            cached: true,
            analysisId: existing.record.ANALYSIS_ID || existing.record.analysis_id || null,
            matchType: existing.matchType || 'exact'
          });
        }

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
        const aiPrompt = `You are a careful arbitration document analyst.\n\nWrite in plain English at about a 9th-grade reading level.\nReturn plain text only.\nDo not use JSON, markdown tables, code fences, or long legal jargon.\nBe direct, clear, and practical.\nTreat this as decision support only. Do not make final legal conclusions. If a point needs legal judgment, say that human review is required.\nWhen you mention Kenyan arbitration law, use the current consolidated citation: Arbitration Act, Cap. 49.\n\nUse this exact structure:\n1. Plain-English summary: 2 to 3 short sentences.\n2. Main issues: 3 bullet points maximum.\n3. Risks: 3 bullet points maximum.\n4. Missing information or next steps: 3 bullet points maximum.\n\nKeep the full answer under 300 words.\nIf you mention a law, rule, or legal concept, explain it in simple words.\n\nDocument being analyzed: "${docName}"\nCategory: ${docCategory}\n${docDesc ? `Description: ${docDesc}\n` : ''}${docSection}${libraryContext}${caseContext}\n\nUser request: ${body.prompt}\n\nFocus on the practical legal meaning, the strongest points, the weak points, and what the user should do next.`;
        const analysis = cleanModelText(await callAI(aiPrompt));
        if (!analysis) return sendJSON(res, 503, { error: 'AI not configured. Add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to .env.oracle' });
        const stored = await documentAnalysisService.storeAnalysis({
          documentId: id,
          caseId: docCaseId,
          prompt: body.prompt,
          analysisText: analysis,
          analysisSummary: analysis.slice(0, 1000),
          keywords: Array.from(new Set(
            String(body.prompt || '')
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, ' ')
              .split(/\s+/)
              .filter((token) => token && token.length > 3)
              .slice(0, 20)
          )),
          modelName: NVIDIA_API_KEY ? NVIDIA_MODEL : (GROQ_API_KEY ? GROQ_MODEL : 'gemini-2.0-flash'),
          language: 'en',
          accessLevel: docAccessLevel,
          createdBy: user.userId
        });
        await auditTrail.logEvent({ type: 'document_analyzed', caseId: docCaseId, userId: user.userId, action: 'ai_analyze', details: JSON.stringify({ documentId: id, documentName: docName }) });
        return sendJSON(res, 200, {
          analysis,
          cached: false,
          analysisId: stored.analysisId,
          indexed: true
        });
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
        const [casesByStatus, casesByType, monthlyCases, docCount, hearingsByStatus, userCount, paymentStats, usersByRole, recentActivity] = await Promise.all([
          oracleDb.executeQuery('SELECT status, COUNT(*) AS cnt FROM cases GROUP BY status', {}),
          oracleDb.executeQuery('SELECT COALESCE(case_type, \'Unspecified\') AS case_type, COUNT(*) AS cnt FROM cases GROUP BY case_type', {}),
          oracleDb.executeQuery(
            `SELECT TO_CHAR(filing_date, 'Mon') AS mon, EXTRACT(MONTH FROM filing_date) AS mnum, COUNT(*) AS cnt
             FROM cases WHERE filing_date >= CURRENT_DATE - INTERVAL '6 months'
             GROUP BY TO_CHAR(filing_date, 'Mon'), EXTRACT(MONTH FROM filing_date)
             ORDER BY mnum`, {}),
          oracleDb.executeQuery('SELECT COUNT(*) AS cnt FROM documents', {}),
          oracleDb.executeQuery('SELECT status, COUNT(*) AS cnt FROM hearings GROUP BY status', {}),
          oracleDb.executeQuery('SELECT COUNT(*) AS cnt FROM users WHERE is_active = 1', {}),
          oracleDb.executeQuery(
            `SELECT status, COUNT(*) AS cnt, SUM(platform_fee) AS total_fee FROM case_payments GROUP BY status`, {}),
          oracleDb.executeQuery('SELECT role, COUNT(*) AS cnt FROM users WHERE is_active = 1 GROUP BY role', {}),
          oracleDb.executeQuery(
            `SELECT event_type, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10`, {})
        ]);
        const totalCases = (casesByStatus.rows || []).reduce((s, r) => s + (parseInt(r.CNT || r.cnt || 0)), 0);
        const closedCases = (casesByStatus.rows || []).find(r => (r.STATUS || r.status || '').toLowerCase() === 'closed');
        const totalRevenue = (paymentStats.rows || [])
          .filter(r => (r.STATUS || r.status) === 'paid')
          .reduce((s, r) => s + parseFloat(r.TOTAL_FEE || r.total_fee || 0), 0);
        const pendingInvoices = (paymentStats.rows || [])
          .find(r => (r.STATUS || r.status) === 'pending_invoice');
        return sendJSON(res, 200, {
          casesByStatus: casesByStatus.rows || [],
          casesByType: casesByType.rows || [],
          monthlyCases: monthlyCases.rows || [],
          totalCases,
          totalDocuments: parseInt((docCount.rows[0] || {}).CNT || (docCount.rows[0] || {}).cnt || 0),
          totalHearings: (hearingsByStatus.rows || []).reduce((s, r) => s + parseInt(r.CNT || r.cnt || 0), 0),
          totalUsers: parseInt((userCount.rows[0] || {}).CNT || (userCount.rows[0] || {}).cnt || 0),
          closedCases: closedCases ? parseInt(closedCases.CNT || closedCases.cnt || 0) : 0,
          hearingsByStatus: hearingsByStatus.rows || [],
          paymentStats: paymentStats.rows || [],
          totalRevenue,
          pendingInvoicesCount: pendingInvoices ? parseInt(pendingInvoices.CNT || pendingInvoices.cnt || 0) : 0,
          usersByRole: usersByRole.rows || [],
          recentActivity: recentActivity.rows || []
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

      // --- GET /api/intelligence/summary ---
      if (path === '/api/intelligence/summary' && method === 'GET') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const days = Math.max(7, parseInt(parsedUrl.query.days || '30', 10) || 30);
        const summary = await intelligenceService.getSummary();
        return sendJSON(res, 200, {
          success: true,
          generatedAt: new Date().toISOString(),
          days,
          ...summary
        });
      }

      // --- GET /api/intelligence/history ---
      if (path === '/api/intelligence/history' && method === 'GET') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const { caseId, limit } = parsedUrl.query;
        const reports = await intelligenceService.getHistory({
          caseId: caseId || null,
          limit: Math.max(1, Math.min(parseInt(limit || '10', 10) || 10, 50))
        });
        return sendJSON(res, 200, { success: true, reports });
      }

      // --- POST /api/intelligence/companion ---
      if (path === '/api/intelligence/companion' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const body = await parseBody(req);
        if (!body.caseId || !body.question) {
          return sendJSON(res, 400, { error: 'caseId and question are required' });
        }
        if (!NVIDIA_API_KEY && !GROQ_API_KEY && !GEMINI_API_KEY) {
          return sendJSON(res, 503, { error: 'AI not configured. Add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to .env.oracle' });
        }
        try {
          const analysis = await intelligenceService.generateCompanionAnalysis({
            caseId: body.caseId,
            question: body.question,
            language: body.language || 'en',
            user
          });
          if (!analysis) {
            return sendJSON(res, 503, { error: 'AI not configured. Add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to .env.oracle' });
          }
          return sendJSON(res, 200, { success: true, analysis });
        } catch (error) {
          if (error.message === 'Case not found') {
            return sendJSON(res, 404, { error: 'Case not found' });
          }
          throw error;
        }
      }

      // --- POST /api/intelligence/report ---
      if (path === '/api/intelligence/report' && method === 'POST') {
        const user = authenticate(req, res, ['admin']);
        if (!user) return;
        const body = await parseBody(req);
        const periodDays = Math.max(7, parseInt(body.periodDays || 30, 10) || 30);
        if (!NVIDIA_API_KEY && !GROQ_API_KEY && !GEMINI_API_KEY) {
          return sendJSON(res, 503, { error: 'AI not configured. Add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to .env.oracle' });
        }
        const report = await intelligenceService.generateAdminReport({
          user,
          language: body.language || 'en',
          periodDays,
          scope: body.scope || 'platform'
        });
        if (!report) {
          return sendJSON(res, 503, { error: 'AI not configured. Add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to .env.oracle' });
        }
        return sendJSON(res, 200, { success: true, report });
      }

      // --- POST /api/ai/governing-law ---
      if (path === '/api/ai/governing-law' && method === 'POST') {
        const user = authenticate(req, res);
        if (!user) return;
        const { seatOfArbitration, caseType, jurisdiction, arbitrationRules } = await parseBody(req);
        if (!NVIDIA_API_KEY && !GROQ_API_KEY && !GEMINI_API_KEY) {
          return sendJSON(res, 200, { success: false, message: 'AI not configured. Add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to .env.oracle' });
        }
        const seat = jurisdiction || seatOfArbitration || 'Kenya';
        const cacheKey = normalizeRuleGuidanceKey({
          seatOfArbitration: seat,
          caseType: caseType || 'commercial',
          arbitrationRules: arbitrationRules || 'unspecified'
        });
        const cachedRow = await oracleDb.getRuleGuidanceCache(cacheKey);
        if (cachedRow) {
          const cachedJson = cachedRow.GUIDANCE_JSON || cachedRow.guidance_json || null;
          let cachedData = {};
          try {
            cachedData = cachedJson ? JSON.parse(cachedJson) : {};
          } catch {
            cachedData = { notes: cachedRow.GUIDANCE_SUMMARY || cachedRow.guidance_summary || '' };
          }
          const summary = cleanModelText(cachedRow.GUIDANCE_SUMMARY || cachedRow.guidance_summary || buildRuleGuidanceSummary(cachedData));
          await oracleDb.saveRuleGuidanceCache({
            cacheKey,
            seatOfArbitration: seat,
            caseType: caseType || 'commercial',
            arbitrationRules: arbitrationRules || cachedData.arbitrationRules || null,
            governingLaw: cachedData.governingLaw || null,
            guidanceJson: cachedJson,
            guidanceSummary: summary,
            modelName: cachedRow.MODEL_NAME || cachedRow.model_name || null
          });
          return sendJSON(res, 200, {
            success: true,
            cached: true,
            cacheKey,
            source: 'cache',
            modelName: cachedRow.MODEL_NAME || cachedRow.model_name || null,
            ...cachedData,
            summary,
            guidanceSummary: summary
          });
        }

        const prompt = `For a ${caseType || 'commercial'} arbitration with seat in ${seat}${arbitrationRules ? ` and selected rules ${arbitrationRules}` : ''}, provide a JSON object with:
- governingLaw: standard substantive law (e.g., "Laws of Kenya")
- arbitrationLaw: primary arbitration statute and current consolidated citation (e.g., "Arbitration Act, Cap. 49")
- arbitrationRules: top recommended institutional rules for this jurisdiction
- institutions: array of top 3 arbitration institutions
- notes: one sentence on the legal framework
- proceduralGuidance: short plain-English summary of how the selected rules should shape the case setup
- tribunalGuidance: short plain-English summary of tribunal structure for the selected rules

Respond ONLY with valid JSON, no markdown, no extra text.`;
        const text = await callAI(prompt);
        if (!text) return sendJSON(res, 500, { error: 'AI call failed' });
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { notes: text };
          const modelName = NVIDIA_API_KEY ? NVIDIA_MODEL : (GROQ_API_KEY ? GROQ_MODEL : 'gemini-2.0-flash');
          const summary = cleanModelText(buildRuleGuidanceSummary(data));
          await oracleDb.saveRuleGuidanceCache({
            cacheKey,
            seatOfArbitration: seat,
            caseType: caseType || 'commercial',
            arbitrationRules: arbitrationRules || data.arbitrationRules || null,
            governingLaw: data.governingLaw || null,
            guidanceJson: JSON.stringify(data),
            guidanceSummary: summary,
            modelName
          });
          return sendJSON(res, 200, {
            success: true,
            cached: false,
            cacheKey,
            source: 'ai',
            modelName,
            ...data,
            summary,
            guidanceSummary: summary
          });
        } catch {
          const modelName = NVIDIA_API_KEY ? NVIDIA_MODEL : (GROQ_API_KEY ? GROQ_MODEL : 'gemini-2.0-flash');
          const summary = cleanModelText(text);
          await oracleDb.saveRuleGuidanceCache({
            cacheKey,
            seatOfArbitration: seat,
            caseType: caseType || 'commercial',
            arbitrationRules: arbitrationRules || null,
            governingLaw: null,
            guidanceJson: JSON.stringify({ notes: text }),
            guidanceSummary: summary,
            modelName
          });
          return sendJSON(res, 200, { success: true, cached: false, cacheKey, source: 'ai', modelName, notes: text, summary, guidanceSummary: summary });
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
  // 1. Initialize database (Neon if DATABASE_URL set, otherwise Oracle)
  const oracleDb = process.env.DATABASE_URL
    ? new NeonDatabaseService(config)
    : new OracleDatabaseService(config);
  const dbConnected = process.env.DATABASE_URL
    ? await oracleDb.initNeonDatabase()
    : await oracleDb.initOracleDatabase();
  if (!dbConnected) {
    console.warn('Warning: DB not connected. Audit logs will be in-memory only.');
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
    const legalSourceRegistry = new LegalSourceRegistry();
    const complianceGapMapService = new ComplianceGapMapService({
      legalSourceRegistry,
      disclosureWorkflow
    });
    const conflictGraph = new ConflictGraph();
    const complianceController = new ComplianceController();
    const eSignatureController = new ESignatureController();
  const documentController = new DocumentController();
  const systemController = new SystemController();
  const intelligenceService = new IntelligenceService({
    oracleDb,
    callAI,
    metricsDashboard,
    riskMonitoring,
    auditTrail
  });
  const documentAnalysisService = new DocumentAnalysisService(oracleDb);
  await documentAnalysisService.ensureTable();

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
    authService, userService, hearingService,
      metricsDashboard, riskMonitoring, intelligenceService,
      documentAnalysisService,
      disclosureWorkflow,
      legalSourceRegistry,
      complianceGapMapService,
      eSignatureController
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
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log('Shutting down server...');
    try {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    } catch (error) {
      if (!error || error.code !== 'ERR_SERVER_NOT_RUNNING') {
        console.error('Shutdown error closing HTTP server:', error.message);
      }
    }

    try {
      await oracleDb.closePool();
    } catch (error) {
      if (!error || error.code !== 'NJS-064') {
        console.error('Shutdown error closing Oracle pool:', error.message);
      }
    }

    console.log('Server closed');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('Fatal: failed to start server:', err.message);
  process.exit(1);
});
