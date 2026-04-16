'use strict';

const crypto = require('crypto');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can', 'could',
  'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into',
  'is', 'it', 'its', 'may', 'me', 'must', 'not', 'of', 'on', 'or', 'our', 'should',
  'that', 'the', 'their', 'this', 'to', 'was', 'we', 'what', 'when', 'where', 'which',
  'who', 'why', 'will', 'with', 'would', 'you', 'your'
]);

class DocumentAnalysisService {
  constructor(dbService = null) {
    this.dbService = dbService;
    this.memory = new Map();
  }

  normalizePrompt(prompt) {
    return String(prompt || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token))
      .join(' ');
  }

  buildSignature(prompt) {
    const tokens = Array.from(new Set(this.normalizePrompt(prompt).split(/\s+/).filter(Boolean)));
    return tokens.sort().join(' ');
  }

  hashPrompt(prompt) {
    return crypto.createHash('sha256').update(this.normalizePrompt(prompt)).digest('hex');
  }

  scoreOverlap(a, b) {
    const setA = new Set(String(a || '').split(/\s+/).filter(Boolean));
    const setB = new Set(String(b || '').split(/\s+/).filter(Boolean));
    if (setA.size === 0 || setB.size === 0) return 0;

    let overlap = 0;
    for (const token of setA) {
      if (setB.has(token)) overlap += 1;
    }
    return overlap / Math.max(setA.size, setB.size);
  }

  async ensureTable() {
    if (!this.dbService || !this.dbService.isConnected()) return;
    await this.dbService.executeQuery(`
      BEGIN
        EXECUTE IMMEDIATE '
          CREATE TABLE ai_document_analyses (
            id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            analysis_id      VARCHAR2(100) UNIQUE NOT NULL,
            document_id      VARCHAR2(50) NOT NULL,
            case_id          VARCHAR2(50),
            prompt           CLOB,
            prompt_normalized CLOB,
            prompt_hash      VARCHAR2(64),
            prompt_signature CLOB,
            analysis_text    CLOB,
            analysis_summary CLOB,
            keywords         CLOB,
            model_name       VARCHAR2(120),
            language         VARCHAR2(20),
            access_level     VARCHAR2(20),
            created_by       VARCHAR2(100),
            usage_count      NUMBER DEFAULT 1,
            last_used_at     TIMESTAMP,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);
  }

  async findCachedAnalysis({ documentId, prompt }) {
    const normalizedPrompt = this.normalizePrompt(prompt);
    const promptHash = this.hashPrompt(prompt);
    const promptSignature = this.buildSignature(prompt);

    if (this.dbService && this.dbService.isConnected()) {
      const exact = await this.dbService.executeQuery(
        `SELECT * FROM ai_document_analyses
         WHERE document_id = :documentId AND prompt_hash = :promptHash
         ORDER BY usage_count DESC, created_at DESC`,
        { documentId, promptHash }
      );
      if (exact.rows && exact.rows[0]) {
        return { record: exact.rows[0], cached: true, matchType: 'exact' };
      }

      const candidates = await this.dbService.executeQuery(
        `SELECT * FROM ai_document_analyses
         WHERE document_id = :documentId
         ORDER BY usage_count DESC, created_at DESC`,
        { documentId }
      );
      const rows = candidates.rows || [];
      let best = null;
      let bestScore = 0;
      for (const row of rows) {
        const score = this.scoreOverlap(promptSignature, row.PROMPT_SIGNATURE || row.prompt_signature);
        if (score > bestScore) {
          bestScore = score;
          best = row;
        }
      }
      if (best && bestScore >= 0.7) {
        return { record: best, cached: true, matchType: 'similar', similarity: bestScore };
      }
      return { cached: false, promptHash, promptSignature, normalizedPrompt };
    }

    const entries = Array.from(this.memory.values()).filter((item) => item.documentId === documentId);
    const exact = entries.find((item) => item.promptHash === promptHash);
    if (exact) return { record: exact, cached: true, matchType: 'exact' };

    let best = null;
    let bestScore = 0;
    for (const item of entries) {
      const score = this.scoreOverlap(promptSignature, item.promptSignature);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
    if (best && bestScore >= 0.7) {
      return { record: best, cached: true, matchType: 'similar', similarity: bestScore };
    }

    return { cached: false, promptHash, promptSignature, normalizedPrompt };
  }

  async storeAnalysis({
    documentId,
    caseId = null,
    prompt,
    analysisText,
    analysisSummary = null,
    keywords = [],
    modelName = null,
    language = 'en',
    accessLevel = 'case',
    createdBy = null
  }) {
    const normalizedPrompt = this.normalizePrompt(prompt);
    const promptHash = this.hashPrompt(prompt);
    const promptSignature = this.buildSignature(prompt);
    const analysisId = `da-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const record = {
      analysisId,
      documentId,
      caseId,
      prompt,
      promptNormalized: normalizedPrompt,
      promptHash,
      promptSignature,
      analysisText,
      analysisSummary: analysisSummary || String(analysisText || '').slice(0, 1000),
      keywords,
      modelName,
      language,
      accessLevel,
      createdBy,
      usageCount: 1,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    if (this.dbService && this.dbService.isConnected()) {
      await this.dbService.executeQuery(
        `INSERT INTO ai_document_analyses
         (analysis_id, document_id, case_id, prompt, prompt_normalized, prompt_hash, prompt_signature,
          analysis_text, analysis_summary, keywords, model_name, language, access_level, created_by,
          usage_count, last_used_at)
         VALUES
         (:analysisId, :documentId, :caseId, :prompt, :promptNormalized, :promptHash, :promptSignature,
          :analysisText, :analysisSummary, :keywords, :modelName, :language, :accessLevel, :createdBy,
          1, CURRENT_TIMESTAMP)`,
        {
          analysisId,
          documentId,
          caseId,
          prompt,
          promptNormalized: normalizedPrompt,
          promptHash,
          promptSignature,
          analysisText,
          analysisSummary: record.analysisSummary,
          keywords: JSON.stringify(keywords || []),
          modelName,
          language,
          accessLevel,
          createdBy
        }
      );
    } else {
      this.memory.set(analysisId, record);
    }

    return record;
  }

  async touchAnalysis(record) {
    if (!record) return;
    const analysisId = record.ANALYSIS_ID || record.analysisId;
    if (!analysisId) return;

    if (this.dbService && this.dbService.isConnected()) {
      await this.dbService.executeQuery(
        `UPDATE ai_document_analyses
         SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
         WHERE analysis_id = :analysisId`,
        { analysisId }
      );
      return;
    }

    const cached = this.memory.get(analysisId);
    if (cached) {
      cached.usageCount = (cached.usageCount || 1) + 1;
      cached.lastUsedAt = new Date().toISOString();
      this.memory.set(analysisId, cached);
    }
  }

  async listForDocument(documentId) {
    if (this.dbService && this.dbService.isConnected()) {
      const result = await this.dbService.executeQuery(
        `SELECT * FROM ai_document_analyses WHERE document_id = :documentId ORDER BY usage_count DESC, created_at DESC`,
        { documentId }
      );
      return result.rows || [];
    }
    return Array.from(this.memory.values())
      .filter((entry) => entry.documentId === documentId)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }
}

module.exports = DocumentAnalysisService;
