'use strict';

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  sw: 'Swahili',
  ar: 'Arabic'
};

const safeParseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  const text = String(value).trim();
  if (!text) return null;

  const candidates = [text];
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep trying fallbacks.
    }
  }

  return null;
};

class IntelligenceService {
  constructor({ oracleDb, callAI, metricsDashboard, riskMonitoring, auditTrail }) {
    this.oracleDb = oracleDb;
    this.callAI = callAI;
    this.metricsDashboard = metricsDashboard;
    this.riskMonitoring = riskMonitoring;
    this.auditTrail = auditTrail;
  }

  _languageName(language) {
    return LANGUAGE_NAMES[String(language || 'en').toLowerCase()] || 'English';
  }

  _normalizeRow(row) {
    if (!row) return {};
    return row;
  }

  _pick(row, ...keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    return null;
  }

  _stringifyExcerpt(value, limit = 1200) {
    if (!value) return '';
    return String(value).slice(0, limit);
  }

  _cleanText(value) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s([,.;:!?])/g, '$1')
      .trim();
  }

  _limitList(values, limit = 5) {
    return (Array.isArray(values) ? values : [])
      .map((item) => this._cleanText(item))
      .filter(Boolean)
      .slice(0, limit);
  }

  _countRows(rows = [], key = 'status') {
    return (rows || []).map((row) => ({
      [key]: this._pick(row, key, key.toUpperCase()),
      count: Number(this._pick(row, 'COUNT', 'count') || 0)
    }));
  }

  _buildAdminPromptContext(context) {
    return {
      totals: {
        caseStatuses: this._countRows(context.caseStatus || [], 'status'),
        caseStages: this._countRows(context.caseStage || [], 'case_stage'),
        hearingStatuses: this._countRows(context.hearingStatus || [], 'status'),
        documentAccess: this._countRows(context.documentAccess || [], 'access_level'),
        roles: this._countRows(context.roles || [], 'role'),
        overdueMilestones: Number(context.overdueMilestones || 0)
      },
      highlights: {
        recentCases: (context.recentCases || []).slice(0, 5).map((row) => ({
          caseId: this._pick(row, 'CASE_ID', 'case_id'),
          title: this._pick(row, 'TITLE', 'title'),
          status: this._pick(row, 'STATUS', 'status'),
          caseStage: this._pick(row, 'CASE_STAGE', 'case_stage')
        })),
        recentHearings: (context.recentHearings || []).slice(0, 5).map((row) => ({
          hearingId: this._pick(row, 'HEARING_ID', 'hearing_id'),
          title: this._pick(row, 'TITLE', 'title'),
          status: this._pick(row, 'STATUS', 'status'),
          type: this._pick(row, 'TYPE', 'type')
        }))
      },
      system: {
        compliance: context.compliance
          ? {
              status: this._pick(context.compliance, 'status', 'STATUS'),
              score: this._pick(context.compliance, 'score', 'SCORE'),
              notes: this._pick(context.compliance, 'notes', 'NOTES')
            }
          : null,
        health: context.health
          ? {
              status: this._pick(context.health, 'status', 'STATUS'),
              uptime: this._pick(context.health, 'uptime', 'UPTIME')
            }
          : null,
        risk: context.risk
          ? {
              level: this._pick(context.risk, 'level', 'LEVEL'),
              summary: this._pick(context.risk, 'summary', 'SUMMARY')
            }
          : null
      }
    };
  }

  _buildAdminFallbackReport({ context, languageName, periodDays, scope }) {
    const caseStatuses = this._countRows(context.caseStatus || [], 'status');
    const hearingStatuses = this._countRows(context.hearingStatus || [], 'status');
    const documentAccess = this._countRows(context.documentAccess || [], 'access_level');
    const roles = this._countRows(context.roles || [], 'role');
    const topCaseStatus = caseStatuses[0]?.status || 'active';
    const topHearingStatus = hearingStatuses[0]?.status || 'scheduled';
    const activeCases = caseStatuses.reduce((sum, row) => sum + (String(row.status || '').toLowerCase() === 'active' ? row.count : 0), 0);
    const pendingCases = caseStatuses.reduce((sum, row) => sum + (String(row.status || '').toLowerCase() === 'pending' ? row.count : 0), 0);
    const completedCases = caseStatuses.reduce((sum, row) => sum + (String(row.status || '').toLowerCase() === 'completed' ? row.count : 0), 0);
    const overdueMilestones = Number(context.overdueMilestones || 0);

    return {
      title: 'Platform Intelligence Report',
      executiveSummary: `Over the last ${periodDays} days, the ${scope} view shows ${activeCases} active cases, ${pendingCases} pending matters, and ${completedCases} completed matters. The platform remains operational, with ${hearingStatuses.reduce((sum, row) => sum + row.count, 0)} hearings tracked, ${documentAccess.reduce((sum, row) => sum + row.count, 0)} documents available, and ${roles.reduce((sum, row) => sum + row.count, 0)} registered users. The current portfolio is led by ${topCaseStatus} cases and ${topHearingStatus} hearings, while overdue milestones remain at ${overdueMilestones}.`,
      keyFindings: [
        `Case activity is concentrated in ${topCaseStatus} matters.`,
        `The hearing pipeline is led by ${topHearingStatus} items.`,
        `Document access and role coverage remain stable across the platform.`
      ],
      commercialHighlights: [
        'The system produces clear operational metrics suitable for premium reporting.',
        'Administrative dashboards support export-ready client briefs and management packs.'
      ],
      risks: overdueMilestones > 0
        ? [
            `${overdueMilestones} milestone${overdueMilestones === 1 ? '' : 's'} are overdue and should be reviewed promptly.`
          ]
        : ['No overdue milestones are currently flagged in the platform snapshot.'],
      recommendations: [
        'Package the report as a concise executive brief with charts and trend commentary.',
        'Track case aging, hearing conversion, and document completeness to support premium analytics.'
      ],
      dataSnapshot: {
        cases: caseStatuses,
        hearings: hearingStatuses,
        documents: documentAccess,
        roles,
        overdueMilestones
      },
      confidence: 'medium'
    };
  }

  _buildAdminReportPrompt({ context, languageName, periodDays, scope }) {
    const promptContext = this._buildAdminPromptContext(context);
    return `
You are a senior arbitration platform analyst writing a sale-ready executive report for administrators and premium clients.
Respond in ${languageName}.

Output requirements:
- Return valid JSON only.
- No markdown, no commentary, no code fences, no extra text.
- Use polished business language that is concise, clear, and professional.
- Keep the executiveSummary to 2 short paragraphs maximum.
- Keep each list to 3 to 5 items.
- Do not invent numbers. Use only the supplied data.
- Keep the tone factual, commercial, and presentation-ready.
- Prefer plain ASCII punctuation and avoid decorative characters.

Return this structure exactly:
{
  "title": "string",
  "executiveSummary": "string",
  "keyFindings": ["string"],
  "commercialHighlights": ["string"],
  "risks": ["string"],
  "recommendations": ["string"],
  "dataSnapshot": {
    "cases": [{"status":"string","count":number}],
    "hearings": [{"status":"string","count":number}],
    "documents": [{"access_level":"string","count":number}],
    "roles": [{"role":"string","count":number}],
    "overdueMilestones": number
  },
  "confidence": "high|medium|low"
}

Platform context:
${JSON.stringify(promptContext, null, 2)}

Scope:
${scope}

Period:
Last ${periodDays} days
`.trim();
  }

  async _getCaseContext(caseId) {
    const caseResult = await this.oracleDb.executeQuery('SELECT * FROM cases WHERE case_id = :caseId', { caseId });
    if (!caseResult.rows || caseResult.rows.length === 0) {
      return null;
    }

    const partiesResult = await this.oracleDb.executeQuery(
      'SELECT * FROM parties WHERE case_id = :caseId ORDER BY party_type',
      { caseId }
    );
    const counselResult = await this.oracleDb.executeQuery(
      'SELECT * FROM case_counsel WHERE case_id = :caseId ORDER BY created_at DESC',
      { caseId }
    );
    const milestonesResult = await this.oracleDb.executeQuery(
      'SELECT * FROM case_milestones WHERE case_id = :caseId ORDER BY created_at',
      { caseId }
    );
    const hearingsResult = await this.oracleDb.executeQuery(
      'SELECT * FROM hearings WHERE case_id = :caseId ORDER BY created_at DESC',
      { caseId }
    );
    const documentsResult = await this.oracleDb.executeQuery(
      'SELECT id, case_id, document_name, category, description, access_level, text_content, created_at FROM documents WHERE case_id = :caseId ORDER BY created_at DESC',
      { caseId }
    );
    const auditLog = await this.oracleDb.getAuditLogs({ caseId });

    const caseRecord = this._normalizeRow(caseResult.rows[0]);
    const parties = (partiesResult.rows || []).map((row) => ({
      partyId: this._pick(row, 'PARTY_ID', 'party_id'),
      partyType: this._pick(row, 'PARTY_TYPE', 'party_type'),
      entityType: this._pick(row, 'ENTITY_TYPE', 'entity_type'),
      fullName: this._pick(row, 'FULL_NAME', 'full_name'),
      organizationName: this._pick(row, 'ORGANIZATION_NAME', 'organization_name'),
      nationality: this._pick(row, 'NATIONALITY', 'nationality')
    }));
    const counsel = (counselResult.rows || []).map((row) => ({
      counselId: this._pick(row, 'COUNSEL_ID', 'counsel_id'),
      fullName: this._pick(row, 'FULL_NAME', 'full_name'),
      lawFirm: this._pick(row, 'LAW_FIRM', 'law_firm'),
      role: this._pick(row, 'ROLE', 'role'),
      languages: this._pick(row, 'LANGUAGES', 'languages')
    }));
    const milestones = (milestonesResult.rows || []).map((row) => ({
      milestoneId: this._pick(row, 'MILESTONE_ID', 'milestone_id'),
      milestoneType: this._pick(row, 'MILESTONE_TYPE', 'milestone_type'),
      title: this._pick(row, 'TITLE', 'title'),
      status: this._pick(row, 'STATUS', 'status'),
      dueDate: this._pick(row, 'DUE_DATE', 'due_date'),
      completedDate: this._pick(row, 'COMPLETED_DATE', 'completed_date')
    }));
    const hearings = (hearingsResult.rows || []).map((row) => ({
      hearingId: this._pick(row, 'HEARING_ID', 'hearing_id'),
      title: this._pick(row, 'TITLE', 'title'),
      status: this._pick(row, 'STATUS', 'status'),
      type: this._pick(row, 'TYPE', 'type'),
      startTime: this._pick(row, 'START_TIME', 'start_time'),
      endTime: this._pick(row, 'END_TIME', 'end_time')
    }));
    const documents = (documentsResult.rows || []).slice(0, 6).map((row) => ({
      documentId: this._pick(row, 'ID', 'id'),
      documentName: this._pick(row, 'DOCUMENT_NAME', 'document_name'),
      category: this._pick(row, 'CATEGORY', 'category'),
      description: this._pick(row, 'DESCRIPTION', 'description'),
      accessLevel: this._pick(row, 'ACCESS_LEVEL', 'access_level'),
      excerpt: this._stringifyExcerpt(this._pick(row, 'TEXT_CONTENT', 'text_content'))
    }));

    return {
      case: {
        caseId: this._pick(caseRecord, 'CASE_ID', 'case_id'),
        title: this._pick(caseRecord, 'TITLE', 'title'),
        status: this._pick(caseRecord, 'STATUS', 'status'),
        caseType: this._pick(caseRecord, 'CASE_TYPE', 'case_type'),
        sector: this._pick(caseRecord, 'SECTOR', 'sector'),
        disputeCategory: this._pick(caseRecord, 'DISPUTE_CATEGORY', 'dispute_category'),
        description: this._stringifyExcerpt(this._pick(caseRecord, 'DESCRIPTION', 'description'), 1800),
        disputeAmount: this._pick(caseRecord, 'DISPUTE_AMOUNT', 'dispute_amount'),
        currency: this._pick(caseRecord, 'CURRENCY', 'currency'),
        governingLaw: this._pick(caseRecord, 'GOVERNING_LAW', 'governing_law'),
        seatOfArbitration: this._pick(caseRecord, 'SEAT_OF_ARBITRATION', 'seat_of_arbitration'),
        arbitrationRules: this._pick(caseRecord, 'ARBITRATION_RULES', 'arbitration_rules'),
        languageOfProceedings: this._pick(caseRecord, 'LANGUAGE_OF_PROCEEDINGS', 'language_of_proceedings'),
        caseStage: this._pick(caseRecord, 'CASE_STAGE', 'case_stage'),
        confidentialityLevel: this._pick(caseRecord, 'CONFIDENTIALITY_LEVEL', 'confidentiality_level'),
        submissionStatus: this._pick(caseRecord, 'SUBMISSION_STATUS', 'submission_status'),
        filingDate: this._pick(caseRecord, 'FILING_DATE', 'filing_date'),
        responseDeadline: this._pick(caseRecord, 'RESPONSE_DEADLINE', 'response_deadline')
      },
      parties,
      counsel,
      milestones,
      hearings,
      documents,
      auditLog: (auditLog || []).slice(0, 12).map((row) => ({
        action: this._pick(row, 'ACTION', 'action'),
        eventType: this._pick(row, 'EVENT_TYPE', 'event_type'),
        details: this._stringifyExcerpt(this._pick(row, 'DETAILS', 'details'), 1200),
        createdAt: this._pick(row, 'CREATED_AT', 'created_at')
      })),
      totals: {
        parties: parties.length,
        counsel: counsel.length,
        milestones: milestones.length,
        hearings: hearings.length,
        documents: documents.length,
        openMilestones: milestones.filter((item) => String(item.status || '').toLowerCase() !== 'completed').length
      }
    };
  }

  async _getAdminContext() {
    const caseStatusResult = await this.oracleDb.executeQuery(
      'SELECT status, COUNT(*) AS count FROM cases GROUP BY status ORDER BY status',
      {}
    );
    const caseStageResult = await this.oracleDb.executeQuery(
      'SELECT case_stage, COUNT(*) AS count FROM cases GROUP BY case_stage ORDER BY case_stage',
      {}
    );
    const sectorResult = await this.oracleDb.executeQuery(
      'SELECT sector, COUNT(*) AS count FROM cases WHERE sector IS NOT NULL GROUP BY sector ORDER BY COUNT(*) DESC',
      {}
    );
    const hearingStatusResult = await this.oracleDb.executeQuery(
      'SELECT status, COUNT(*) AS count FROM hearings GROUP BY status ORDER BY status',
      {}
    );
    const documentAccessResult = await this.oracleDb.executeQuery(
      'SELECT access_level, COUNT(*) AS count FROM documents GROUP BY access_level ORDER BY access_level',
      {}
    );
    const roleResult = await this.oracleDb.executeQuery(
      'SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role',
      {}
    );
    const recentCases = await this.oracleDb.executeQuery(
      'SELECT case_id, title, status, case_stage, created_at FROM cases ORDER BY created_at DESC',
      {}
    );
    const recentHearings = await this.oracleDb.executeQuery(
      'SELECT hearing_id, case_id, title, status, type, start_time, created_at FROM hearings ORDER BY created_at DESC',
      {}
    );
    const overdueMilestones = await this.oracleDb.executeQuery(
      `SELECT COUNT(*) AS count
       FROM case_milestones
       WHERE due_date IS NOT NULL
         AND completed_date IS NULL
         AND status <> 'completed'
         AND due_date < CURRENT_DATE`,
      {}
    );

    const compliance = this.metricsDashboard ? this.metricsDashboard.getComplianceMetrics() : null;
    const health = this.metricsDashboard ? this.metricsDashboard.getSystemHealth() : null;
    const risk = this.riskMonitoring ? this.riskMonitoring.getRiskSummary() : null;

    return {
      caseStatus: caseStatusResult.rows || [],
      caseStage: caseStageResult.rows || [],
      sectors: sectorResult.rows || [],
      hearingStatus: hearingStatusResult.rows || [],
      documentAccess: documentAccessResult.rows || [],
      roles: roleResult.rows || [],
      recentCases: (recentCases.rows || []).slice(0, 8).map((row) => ({
        caseId: this._pick(row, 'CASE_ID', 'case_id'),
        title: this._pick(row, 'TITLE', 'title'),
        status: this._pick(row, 'STATUS', 'status'),
        caseStage: this._pick(row, 'CASE_STAGE', 'case_stage'),
        createdAt: this._pick(row, 'CREATED_AT', 'created_at')
      })),
      recentHearings: (recentHearings.rows || []).slice(0, 8).map((row) => ({
        hearingId: this._pick(row, 'HEARING_ID', 'hearing_id'),
        caseId: this._pick(row, 'CASE_ID', 'case_id'),
        title: this._pick(row, 'TITLE', 'title'),
        status: this._pick(row, 'STATUS', 'status'),
        type: this._pick(row, 'TYPE', 'type'),
        startTime: this._pick(row, 'START_TIME', 'start_time'),
        createdAt: this._pick(row, 'CREATED_AT', 'created_at')
      })),
      overdueMilestones: Number(this._pick(overdueMilestones.rows && overdueMilestones.rows[0], 'COUNT', 'count') || 0),
      compliance,
      health,
      risk
    };
  }

  async _storeReport({
    reportType,
    caseId = null,
    scopeKey = null,
    requesterId = null,
    requesterRole = null,
    title = null,
    summary = null,
    analysis = null,
    metrics = null,
    question = null,
    periodDays = null
  }) {
    if (!this.oracleDb.isConnected()) return null;

    const reportId = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.oracleDb.executeQuery(
      `INSERT INTO ai_intelligence_reports
       (report_id, report_type, case_id, scope_key, requester_id, requester_role, title, summary, analysis_json, metrics_json, question, period_days)
       VALUES (:reportId, :reportType, :caseId, :scopeKey, :requesterId, :requesterRole, :title, :summary, :analysisJson, :metricsJson, :question, :periodDays)`,
      {
        reportId,
        reportType,
        caseId,
        scopeKey,
        requesterId,
        requesterRole,
        title,
        summary,
        analysisJson: analysis ? JSON.stringify(analysis) : null,
        metricsJson: metrics ? JSON.stringify(metrics) : null,
        question,
        periodDays
      }
    );
    return reportId;
  }

  async generateCompanionAnalysis({ caseId, question, user, language = 'en' }) {
    if (!caseId) throw new Error('caseId is required');
    if (!question) throw new Error('question is required');

    const context = await this._getCaseContext(caseId);
    if (!context) {
      throw new Error('Case not found');
    }

    const languageName = this._languageName(language);
    const prompt = `
You are an expert arbitration companion helping a neutral decision-maker.
Respond in ${languageName}.

Return valid JSON only with this structure:
{
  "executiveSummary": "string",
  "keyFindings": ["string"],
  "risks": ["string"],
  "recommendations": ["string"],
  "dataSnapshot": {
    "parties": number,
    "counsel": number,
    "documents": number,
    "hearings": number,
    "openMilestones": number
  },
  "followUpQuestions": ["string"],
  "confidence": "high|medium|low"
}

Case context:
${JSON.stringify(context, null, 2)}

User question:
${question}

Focus on practical tribunal support, procedural posture, evidence gaps, deadlines, and next actions.
`;

    const rawText = await this.callAI(prompt);
    if (!rawText) return null;

    const parsed = safeParseJson(rawText) || {
      executiveSummary: rawText,
      keyFindings: [],
      risks: [],
      recommendations: [],
      dataSnapshot: context.totals,
      followUpQuestions: [],
      confidence: 'medium'
    };

    const response = {
      caseId,
      caseTitle: context.case.title,
      generatedAt: new Date().toISOString(),
      language,
      ...parsed,
      rawText
    };

    await this._storeReport({
      reportType: 'companion',
      caseId,
      scopeKey: `case:${caseId}`,
      requesterId: user?.userId || null,
      requesterRole: user?.role || null,
      title: context.case.title,
      summary: response.executiveSummary || rawText,
      analysis: response,
      metrics: context.totals,
      question
    });

    if (this.auditTrail) {
      await this.auditTrail.logEvent({
        type: 'ai_companion_analysis',
        caseId,
        userId: user?.userId || null,
        action: 'ai_analysis',
        details: JSON.stringify({ question, language })
      });
    }

    return response;
  }

  async generateAdminReport({ user, language = 'en', periodDays = 30, scope = 'platform' }) {
    const context = await this._getAdminContext();
    const languageName = this._languageName(language);
    const prompt = this._buildAdminReportPrompt({ context, languageName, periodDays, scope });

    const rawText = await this.callAI(prompt);
    if (!rawText) return null;

    const parsed = safeParseJson(rawText);
    const cleanedFallback = this._buildAdminFallbackReport({ context, languageName, periodDays, scope });
    const report = parsed ? {
      title: this._cleanText(parsed.title) || cleanedFallback.title,
      executiveSummary: this._cleanText(parsed.executiveSummary) || cleanedFallback.executiveSummary,
      keyFindings: this._limitList(parsed.keyFindings, 5).length ? this._limitList(parsed.keyFindings, 5) : cleanedFallback.keyFindings,
      commercialHighlights: this._limitList(parsed.commercialHighlights, 5).length ? this._limitList(parsed.commercialHighlights, 5) : cleanedFallback.commercialHighlights,
      risks: this._limitList(parsed.risks, 5).length ? this._limitList(parsed.risks, 5) : cleanedFallback.risks,
      recommendations: this._limitList(parsed.recommendations, 5).length ? this._limitList(parsed.recommendations, 5) : cleanedFallback.recommendations,
      dataSnapshot: parsed.dataSnapshot || cleanedFallback.dataSnapshot,
      confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence || '').toLowerCase())
        ? String(parsed.confidence).toLowerCase()
        : cleanedFallback.confidence
    } : cleanedFallback;

    const response = {
      generatedAt: new Date().toISOString(),
      language,
      periodDays,
      scope,
      ...report,
      rawText
    };

    await this._storeReport({
      reportType: 'admin',
      scopeKey: scope,
      requesterId: user?.userId || null,
      requesterRole: user?.role || null,
      title: response.title || 'Platform Intelligence Report',
      summary: response.executiveSummary || rawText,
      analysis: response,
      metrics: context,
      periodDays
    });

    if (this.auditTrail) {
      await this.auditTrail.logEvent({
        type: 'ai_admin_report',
        userId: user?.userId || null,
        action: 'generate_report',
        details: JSON.stringify({ periodDays, scope, language })
      });
    }

    return response;
  }

  async getHistory({ caseId = null, limit = 10 } = {}) {
    if (!this.oracleDb.isConnected()) return [];
    let sql = 'SELECT * FROM ai_intelligence_reports WHERE 1=1';
    const params = {};
    if (caseId) {
      sql += ' AND case_id = :caseId';
      params.caseId = caseId;
    }
    sql += ' ORDER BY created_at DESC';

    const result = await this.oracleDb.executeQuery(sql, params);
    return (result.rows || []).slice(0, limit).map((row) => ({
      reportId: this._pick(row, 'REPORT_ID', 'report_id'),
      reportType: this._pick(row, 'REPORT_TYPE', 'report_type'),
      caseId: this._pick(row, 'CASE_ID', 'case_id'),
      scopeKey: this._pick(row, 'SCOPE_KEY', 'scope_key'),
      requesterId: this._pick(row, 'REQUESTER_ID', 'requester_id'),
      requesterRole: this._pick(row, 'REQUESTER_ROLE', 'requester_role'),
      title: this._pick(row, 'TITLE', 'title'),
      summary: this._pick(row, 'SUMMARY', 'summary'),
      question: this._pick(row, 'QUESTION', 'question'),
      periodDays: this._pick(row, 'PERIOD_DAYS', 'period_days'),
      analysis: safeParseJson(this._pick(row, 'ANALYSIS_JSON', 'analysis_json')),
      metrics: safeParseJson(this._pick(row, 'METRICS_JSON', 'metrics_json')),
      createdAt: this._pick(row, 'CREATED_AT', 'created_at')
    }));
  }

  async getSummary() {
    return this._getAdminContext();
  }
}

module.exports = IntelligenceService;
