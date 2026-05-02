-- Arbitrator-only AI draft award support

CREATE TABLE IF NOT EXISTS ai_award_drafts (
  id                   SERIAL PRIMARY KEY,
  draft_id             VARCHAR(100) NOT NULL UNIQUE,
  case_id              VARCHAR(50) NOT NULL,
  arbitrator_id        VARCHAR(100) NOT NULL,
  prompt_version       VARCHAR(50) NOT NULL,
  source_snapshot_hash VARCHAR(64) NOT NULL,
  draft_text           TEXT NOT NULL,
  draft_json           TEXT,
  status               VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_award_drafts_case_arbitrator
  ON ai_award_drafts (case_id, arbitrator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_award_drafts_snapshot
  ON ai_award_drafts (source_snapshot_hash);
