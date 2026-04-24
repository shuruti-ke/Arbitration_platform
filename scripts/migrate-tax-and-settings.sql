-- Migration: org settings table + tax columns on case_payments
-- Run once against Neon DB

-- Org-wide key-value settings (home country, institution name, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  TEXT
);

-- Seed defaults (idempotent)
INSERT INTO platform_settings (key, value) VALUES
  ('homeCountry',    'KE'),
  ('homeCurrency',   'KES'),
  ('institutionName','Nairobi Centre for International Arbitration'),
  ('taxRegistrationNumber', ''),
  ('invoiceFooter',  'This invoice is issued subject to the laws of Kenya.')
ON CONFLICT (key) DO NOTHING;

-- Add tax columns to case_payments (safe — idempotent via IF NOT EXISTS workaround)
ALTER TABLE case_payments ADD COLUMN IF NOT EXISTS subtotal_amount  NUMERIC(14,2);
ALTER TABLE case_payments ADD COLUMN IF NOT EXISTS tax_type         TEXT;
ALTER TABLE case_payments ADD COLUMN IF NOT EXISTS tax_rate         NUMERIC(6,4);
ALTER TABLE case_payments ADD COLUMN IF NOT EXISTS tax_amount       NUMERIC(14,2);
ALTER TABLE case_payments ADD COLUMN IF NOT EXISTS tax_exempt       BOOLEAN DEFAULT FALSE;
ALTER TABLE case_payments ADD COLUMN IF NOT EXISTS invoice_description TEXT;
