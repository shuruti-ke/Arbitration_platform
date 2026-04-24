'use strict';

/**
 * Tax Service — country-aware tax rules for arbitration platform invoicing.
 *
 * Each country entry specifies:
 *   taxType        — primary tax (VAT, GST, Sales Tax, etc.)
 *   standardRate   — decimal (0.16 = 16%)
 *   reducedRates   — array of { label, rate } for special categories
 *   arbitrationRate — the rate that applies to arbitration/professional services
 *   arbitrationExempt — true if arbitration services are zero-rated/exempt
 *   withholdingRate — WHT on professional service fees (decimal, 0 if none)
 *   currency       — ISO 4217
 *   invoiceRequirements — what must appear on a valid tax invoice
 *   taxAuthority   — full name of the tax authority
 *   legalBasis     — the statute / regulation that establishes the tax
 *   notes          — any special rules relevant to arbitration
 */

const TAX_RULES = {
  // ── East Africa ────────────────────────────────────────────────────────────
  KE: {
    country: 'Kenya', taxType: 'VAT', standardRate: 0.16,
    arbitrationRate: 0.16, arbitrationExempt: false,
    withholdingRate: 0.05,   // WHT on professional/management fees
    currency: 'KES',
    invoiceRequirements: ['KRA PIN of supplier', 'KRA PIN of recipient (if registered)', 'ETR receipt number', 'Invoice number', 'Date', 'Description of taxable supply', 'Taxable value', 'VAT amount', 'Total amount'],
    taxAuthority: 'Kenya Revenue Authority (KRA)',
    legalBasis: 'Value Added Tax Act 2013 (VAT Act), Cap. 476 Laws of Kenya; Income Tax Act Cap. 470 (WHT)',
    notes: 'Arbitration and legal services are standard-rated at 16%. WHT of 5% applies to management and professional fees paid to residents. ETR (Electronic Tax Register) receipts required for VAT-registered suppliers.'
  },
  UG: {
    country: 'Uganda', taxType: 'VAT', standardRate: 0.18,
    arbitrationRate: 0.18, arbitrationExempt: false,
    withholdingRate: 0.06,
    currency: 'UGX',
    invoiceRequirements: ['URA TIN of supplier', 'Tax invoice number', 'Date', 'Description', 'Taxable value', 'VAT amount', 'Total'],
    taxAuthority: 'Uganda Revenue Authority (URA)',
    legalBasis: 'Value Added Tax Act Cap. 349 (Uganda); Income Tax Act Cap. 340',
    notes: 'Standard rate 18%. WHT of 6% on professional services.'
  },
  TZ: {
    country: 'Tanzania', taxType: 'VAT', standardRate: 0.18,
    arbitrationRate: 0.18, arbitrationExempt: false,
    withholdingRate: 0.05,
    currency: 'TZS',
    invoiceRequirements: ['TIN of supplier', 'Tax invoice number', 'Date', 'Description', 'VAT amount', 'Total'],
    taxAuthority: 'Tanzania Revenue Authority (TRA)',
    legalBasis: 'Value Added Tax Act 2014 (Tanzania)',
    notes: 'Standard rate 18%. WHT 5% on professional services for residents.'
  },
  RW: {
    country: 'Rwanda', taxType: 'VAT', standardRate: 0.18,
    arbitrationRate: 0.18, arbitrationExempt: false,
    withholdingRate: 0.15,
    currency: 'RWF',
    invoiceRequirements: ['RRA TIN', 'Invoice number', 'Date', 'VAT amount', 'Total'],
    taxAuthority: 'Rwanda Revenue Authority (RRA)',
    legalBasis: 'Law No. 037/2012 of 09/11/2012 on Value Added Tax',
    notes: 'Standard rate 18%. WHT 15% on professional services.'
  },
  ET: {
    country: 'Ethiopia', taxType: 'VAT', standardRate: 0.15,
    arbitrationRate: 0.15, arbitrationExempt: false,
    withholdingRate: 0.02,
    currency: 'ETB',
    invoiceRequirements: ['TIN', 'Invoice number', 'Date', 'Description', 'VAT amount', 'Total'],
    taxAuthority: 'Ethiopian Tax Administration',
    legalBasis: 'Value Added Tax Proclamation No. 285/2002',
    notes: 'Standard rate 15%.'
  },

  // ── West Africa ───────────────────────────────────────────────────────────
  NG: {
    country: 'Nigeria', taxType: 'VAT', standardRate: 0.075,
    arbitrationRate: 0.075, arbitrationExempt: false,
    withholdingRate: 0.10,
    currency: 'NGN',
    invoiceRequirements: ['FIRS TIN', 'Invoice number', 'Date', 'Description', 'VAT amount', 'Total'],
    taxAuthority: 'Federal Inland Revenue Service (FIRS)',
    legalBasis: 'Value Added Tax Act Cap. V1 LFN 2004 (amended 2020); Companies Income Tax Act',
    notes: 'Rate increased from 5% to 7.5% (Finance Act 2019). WHT 10% on professional and consultancy fees.'
  },
  GH: {
    country: 'Ghana', taxType: 'VAT', standardRate: 0.15,
    arbitrationRate: 0.15, arbitrationExempt: false,
    withholdingRate: 0.08,
    currency: 'GHS',
    invoiceRequirements: ['GRA TIN', 'VAT invoice number', 'Date', 'Description', 'VAT 15%', 'NHIL 2.5%', 'GETFund 2.5%', 'COVID-19 levy', 'Total'],
    taxAuthority: 'Ghana Revenue Authority (GRA)',
    legalBasis: 'Value Added Tax Act 2013 (Act 870); National Health Insurance Levy Act; Ghana Education Trust Fund Act',
    notes: 'Effective rate higher than 15% when NHIL (2.5%) and GETFund levy (2.5%) are added. WHT 8% on professional services.'
  },
  ZA: {
    country: 'South Africa', taxType: 'VAT', standardRate: 0.15,
    arbitrationRate: 0.15, arbitrationExempt: false,
    withholdingRate: 0,
    currency: 'ZAR',
    invoiceRequirements: ['VAT registration number of supplier', 'Tax invoice number', 'Date', 'Description', 'VAT amount', 'Total'],
    taxAuthority: 'South African Revenue Service (SARS)',
    legalBasis: 'Value-Added Tax Act 89 of 1991',
    notes: 'Standard rate 15%. No general WHT on professional services for residents. Non-resident suppliers: 15% WHT on royalties/services. A valid tax invoice must be issued for supplies above ZAR 5,000.'
  },
  BW: {
    country: 'Botswana', taxType: 'VAT', standardRate: 0.14,
    arbitrationRate: 0.14, arbitrationExempt: false,
    withholdingRate: 0.10,
    currency: 'BWP',
    invoiceRequirements: ['VAT registration number', 'Invoice number', 'Date', 'Description', 'VAT amount', 'Total'],
    taxAuthority: 'Botswana Unified Revenue Service (BURS)',
    legalBasis: 'Value Added Tax Act (Cap 50:03)',
    notes: 'Standard rate 14%. WHT 10% on management fees.'
  },
  MU: {
    country: 'Mauritius', taxType: 'VAT', standardRate: 0.15,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'MUR',
    invoiceRequirements: ['MRA VAT registration number', 'Invoice number', 'Date', 'Description', 'Total'],
    taxAuthority: 'Mauritius Revenue Authority (MRA)',
    legalBasis: 'Value Added Tax Act 1998 (Mauritius)',
    notes: 'International arbitration services are zero-rated. Mauritius is a common ICSID and ICC arbitration seat — zero-rating supports this positioning.'
  },

  // ── United Kingdom & Europe ────────────────────────────────────────────────
  GB: {
    country: 'United Kingdom', taxType: 'VAT', standardRate: 0.20,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'GBP',
    invoiceRequirements: ['VAT registration number', 'Invoice number', 'Date', 'Customer name and address', 'Description of supply', 'VAT rate', 'VAT amount', 'Total'],
    taxAuthority: 'HM Revenue & Customs (HMRC)',
    legalBasis: 'Value Added Tax Act 1994 (VATA 1994); VAT Notice 742 (Arbitration services)',
    notes: 'Arbitration services supplied to non-UK businesses are outside the scope of UK VAT (Place of Supply rules — s.9 VATA 1994). Cross-border arbitration services to overseas parties are zero-rated / outside scope.'
  },
  DE: {
    country: 'Germany', taxType: 'VAT (Umsatzsteuer)', standardRate: 0.19,
    arbitrationRate: 0.19, arbitrationExempt: false,
    withholdingRate: 0,
    currency: 'EUR',
    invoiceRequirements: ['Steuernummer or USt-IdNr.', 'Rechnungsnummer', 'Date', 'Description', 'Net amount', 'VAT rate', 'VAT amount', 'Gross amount'],
    taxAuthority: 'Bundeszentralamt für Steuern (BZSt)',
    legalBasis: 'Umsatzsteuergesetz (UStG) — Value Added Tax Act',
    notes: 'Standard rate 19%; reduced rate 7% does not apply to legal/arbitration services. B2B cross-border services: reverse charge applies.'
  },
  FR: {
    country: 'France', taxType: 'TVA (VAT)', standardRate: 0.20,
    arbitrationRate: 0.20, arbitrationExempt: false,
    withholdingRate: 0,
    currency: 'EUR',
    invoiceRequirements: ['SIRET / VAT number', 'Invoice number', 'Date', 'Description', 'HT amount', 'TVA rate', 'TVA amount', 'TTC total'],
    taxAuthority: 'Direction Générale des Finances Publiques (DGFiP)',
    legalBasis: 'Code Général des Impôts (CGI) Art. 256 et seq.',
    notes: 'Standard rate 20%. B2B reverse charge applies for cross-border services. ICC arbitration seat.'
  },
  NL: {
    country: 'Netherlands', taxType: 'BTW (VAT)', standardRate: 0.21,
    arbitrationRate: 0.21, arbitrationExempt: false,
    withholdingRate: 0,
    currency: 'EUR',
    invoiceRequirements: ['BTW-identificatienummer', 'Factuurnummer', 'Date', 'Description', 'Net', 'BTW', 'Total'],
    taxAuthority: 'Belastingdienst',
    legalBasis: 'Wet op de omzetbelasting 1968',
    notes: 'Standard rate 21%. B2B reverse charge for cross-border services.'
  },
  CH: {
    country: 'Switzerland', taxType: 'MWST/TVA/IVA (VAT)', standardRate: 0.081,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'CHF',
    invoiceRequirements: ['UID / MWST number', 'Invoice number', 'Date', 'Description', 'Net', 'MWST', 'Total'],
    taxAuthority: 'Eidgenössische Steuerverwaltung (ESTV)',
    legalBasis: 'Mehrwertsteuergesetz (MWSTG) Art. 23',
    notes: 'International arbitration services supplied to foreign parties are zero-rated under Art. 23 MWSTG. Switzerland (Geneva, Zurich) is a premier arbitration seat.'
  },

  // ── Middle East ───────────────────────────────────────────────────────────
  AE: {
    country: 'United Arab Emirates', taxType: 'VAT', standardRate: 0.05,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'AED',
    invoiceRequirements: ['TRN (Tax Registration Number)', 'Tax invoice number', 'Date', 'Description', 'Net amount', 'VAT amount', 'Total'],
    taxAuthority: 'Federal Tax Authority (FTA)',
    legalBasis: 'Federal Decree-Law No. 8 of 2017 on Value Added Tax; Cabinet Decision No. 52 of 2017',
    notes: 'International arbitration services are zero-rated when supplied to non-UAE recipients. DIAC seat: zero-rating applies. Rate of 5% applies to domestic supplies only.'
  },
  SA: {
    country: 'Saudi Arabia', taxType: 'VAT', standardRate: 0.15,
    arbitrationRate: 0.15, arbitrationExempt: false,
    withholdingRate: 0.05,
    currency: 'SAR',
    invoiceRequirements: ['VAT registration number', 'Invoice number', 'Date', 'Description', 'Amount exclusive of VAT', 'VAT amount', 'Amount inclusive of VAT'],
    taxAuthority: 'Zakat, Tax and Customs Authority (ZATCA)',
    legalBasis: 'Royal Decree No. M/113 of 2/11/1438H; VAT Implementing Regulations',
    notes: 'Rate increased from 5% to 15% in 2020. E-invoicing (FATOORA) mandatory for VAT-registered suppliers.'
  },

  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  SG: {
    country: 'Singapore', taxType: 'GST', standardRate: 0.09,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'SGD',
    invoiceRequirements: ['GST registration number', 'Invoice number', 'Date', 'Description', 'Net amount', 'GST amount', 'Total'],
    taxAuthority: 'Inland Revenue Authority of Singapore (IRAS)',
    legalBasis: 'Goods and Services Tax Act (Cap. 117A)',
    notes: 'International arbitration services supplied to overseas clients are zero-rated (s.21(3)(j) GST Act). SIAC and ICC-Singapore seat: zero-rating applies. Rate rose from 8% to 9% on 1 Jan 2024.'
  },
  HK: {
    country: 'Hong Kong', taxType: 'None', standardRate: 0,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'HKD',
    invoiceRequirements: ['Invoice number', 'Date', 'Description', 'Total amount'],
    taxAuthority: 'Inland Revenue Department (IRD)',
    legalBasis: 'N/A — Hong Kong has no VAT or GST',
    notes: 'Hong Kong has no VAT, GST, or sales tax. Invoices do not require any tax disclosure. HKIAC seat.'
  },
  IN: {
    country: 'India', taxType: 'GST', standardRate: 0.18,
    arbitrationRate: 0.18, arbitrationExempt: false,
    withholdingRate: 0.10,
    currency: 'INR',
    invoiceRequirements: ['GSTIN of supplier', 'GSTIN of recipient', 'Invoice number', 'Date', 'SAC code (998211 for legal services)', 'Taxable value', 'CGST/SGST/IGST amount', 'Total'],
    taxAuthority: 'Central Board of Indirect Taxes and Customs (CBIC)',
    legalBasis: 'Central Goods and Services Tax Act 2017; Integrated Goods and Services Tax Act 2017',
    notes: 'Legal and arbitration services: SAC 998211, IGST 18% for inter-state / cross-border. Domestic: CGST 9% + SGST 9%. Export of services: zero-rated with LUT.'
  },
  AU: {
    country: 'Australia', taxType: 'GST', standardRate: 0.10,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0,
    currency: 'AUD',
    invoiceRequirements: ['ABN (Australian Business Number)', 'Tax invoice', 'Date', 'Description', 'GST amount', 'Total'],
    taxAuthority: 'Australian Taxation Office (ATO)',
    legalBasis: 'A New Tax System (Goods and Services Tax) Act 1999',
    notes: 'International arbitration services exported to non-residents are GST-free (s.38-190). Domestic arbitration: 10% GST applies.'
  },
  CN: {
    country: 'China', taxType: 'VAT (增值税)', standardRate: 0.06,
    arbitrationRate: 0.06, arbitrationExempt: false,
    withholdingRate: 0.20,
    currency: 'CNY',
    invoiceRequirements: ['Unified Social Credit Code', 'Fapiao (official invoice)', 'Date', 'Description', 'Net amount', 'VAT rate', 'VAT amount', 'Total'],
    taxAuthority: 'State Taxation Administration (STA)',
    legalBasis: 'Provisional Regulations on Value Added Tax (2017 revision); Circular on VAT Policies for Modern Service Industries',
    notes: 'Legal and arbitration services fall under "modern service industry" — 6% VAT rate. Fapiao (official tax invoice) required. CIETAC arbitration seat.'
  },

  // ── Americas ──────────────────────────────────────────────────────────────
  US: {
    country: 'United States', taxType: 'None (federal)', standardRate: 0,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0.30,  // FDAP withholding for non-residents
    currency: 'USD',
    invoiceRequirements: ['Invoice number', 'Date', 'Description', 'Amount', 'Payment terms'],
    taxAuthority: 'Internal Revenue Service (IRS)',
    legalBasis: 'No federal VAT/GST. IRC §1441–1443 (withholding on FDAP income for non-residents)',
    notes: 'No federal sales tax. State sales taxes vary (0–10.25%); legal and arbitration services are generally exempt from state sales tax. 30% FDAP withholding applies to payments to foreign persons (may be reduced by tax treaty).'
  },
  CA: {
    country: 'Canada', taxType: 'GST/HST', standardRate: 0.05,
    arbitrationRate: 0, arbitrationExempt: true,
    withholdingRate: 0.25,
    currency: 'CAD',
    invoiceRequirements: ['GST/HST registration number', 'Invoice number', 'Date', 'Description', 'Amount before tax', 'GST/HST amount', 'Total'],
    taxAuthority: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Excise Tax Act RSC 1985 c. E-15 (GST/HST)',
    notes: 'Federal GST 5%. HST in certain provinces (13–15%). International arbitration services supplied to non-residents are zero-rated. WHT 25% on fees to non-residents (may be reduced by treaty).'
  },
};

/**
 * Returns the tax rules for a given ISO 3166-1 alpha-2 country code.
 * If the country is not in the database, returns a generic entry.
 */
function getRules(countryCode) {
  const code = (countryCode || '').trim().toUpperCase();
  return TAX_RULES[code] || null;
}

/**
 * Returns all country codes in the database.
 */
function listCountries() {
  return Object.entries(TAX_RULES).map(([code, r]) => ({
    code,
    name: r.country,
    taxType: r.taxType,
    standardRate: r.standardRate,
    currency: r.currency,
  }));
}

/**
 * Calculate tax breakdown for an invoice amount.
 * @param {number} subtotal  — pre-tax amount
 * @param {string} countryCode
 * @returns {{ subtotal, taxRate, taxAmount, total, taxType, taxLabel, exempt }}
 */
function calculateTax(subtotal, countryCode) {
  const rules = getRules(countryCode);
  if (!rules || rules.arbitrationExempt || rules.arbitrationRate === 0) {
    return {
      subtotal, taxRate: 0, taxAmount: 0,
      total: subtotal, taxType: rules?.taxType || 'N/A',
      taxLabel: rules?.arbitrationExempt ? 'Zero-rated / Exempt' : 'No tax',
      exempt: true,
    };
  }
  const taxAmount = parseFloat((subtotal * rules.arbitrationRate).toFixed(2));
  return {
    subtotal,
    taxRate: rules.arbitrationRate,
    taxAmount,
    total: parseFloat((subtotal + taxAmount).toFixed(2)),
    taxType: rules.taxType,
    taxLabel: `${rules.taxType} ${(rules.arbitrationRate * 100).toFixed(1)}%`,
    exempt: false,
  };
}

module.exports = { getRules, listCountries, calculateTax, TAX_RULES };
