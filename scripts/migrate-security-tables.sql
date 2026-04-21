-- Security hardening migration (pentest remediation)
-- F-004: Token blacklist table — persists logout tokens across server restarts
-- F-011: Award hashes table — persists verification hashes across server restarts

-- Run against your Neon DB:
--   psql $DATABASE_URL -f scripts/migrate-security-tables.sql

CREATE TABLE IF NOT EXISTS token_blacklist (
  id          SERIAL PRIMARY KEY,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hex of the raw JWT
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist (token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist (expires_at);

-- Automatic cleanup: delete expired entries (run as a cron or manually)
-- DELETE FROM token_blacklist WHERE expires_at < NOW();

CREATE TABLE IF NOT EXISTS award_hashes (
  id           SERIAL PRIMARY KEY,
  hash         VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hex of the award pack
  case_id      TEXT,
  title        TEXT,
  status       TEXT,
  generated_at TIMESTAMPTZ,
  generated_by TEXT,
  seat         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_hashes_hash ON award_hashes (hash);
