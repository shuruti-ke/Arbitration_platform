# Arbitration Facilitation Platform — Handover Document
**Last updated:** April 2026
**Purpose:** Session continuity — complete context for any new conversation or developer picking up this project

---

## 1. WHAT THIS PLATFORM IS

**An arbitration facilitation platform — NOT an arbitral institution.**

The platform assists arbitrators and provides a common digital meeting place for all parties in an
arbitration proceeding. It has zero arbitral authority. It does not:
- Make awards
- Issue binding procedural orders
- Appoint arbitrators
- Administer proceedings as an institution
- Provide legal advice

It is the technology equivalent of Opus2, Relativity, or Bundledocs — used in ICC/LCIA proceedings
without institutional accreditation. This framing is legally deliberate and must be preserved in all
future development and communications.

---

## 2. BUSINESS STRUCTURE

### Current Status
The platform is built by the developer (sole owner of all IP currently).

### Planned Structure
A **Private Limited Company** (Kenya, Companies Act 2015) will be incorporated as a joint venture:
- **Developer** — founder, CTO, majority shareholder (~60%)
- **Law firm partner** — minority shareholder (~40%), provides legal credibility, first clients,
  regulatory relationships (NCIA, CIArb, LSK)

### Critical Actions Before Go-Live
1. Agree shareholding split and board composition
2. Law firm incorporates the company (3–5 days, Registrar of Companies Kenya)
3. **Sign IP Assignment Agreement on day of incorporation** — developer assigns ALL platform IP
   (code, legal docs, domain, trademarks) to the company for nominal consideration. Without this
   the company has no asset.
4. Sign Shareholders' Agreement (anti-dilution, drag-along, tag-along, deadlock resolution,
   reserved matters veto for law firm)
5. Sign Director Service Agreement (developer's role and remuneration)
6. Sign Legal Services Agreement (law firm provides legal services to company at agreed rates)
7. Company registers with ODPC (Kenya Data Protection Act 2019)
8. Update all platform legal docs (`/legal/`) to replace "Platform operator" with company name

### ODPC Registration
- **Who registers:** The new company (as data controller), NOT the law firm personally, NOT the developer
- **Fee:** KES 10,000
- **Timeline:** Within 30 days of incorporation
- **Why:** Kenya Data Protection Act 2019 (Act No. 24 of 2019) — mandatory for any entity
  processing personal data
- **Portal:** https://www.odpc.go.ke

### Why a Company (Not the Law Firm Operating Directly)
- Limited liability protects both founders
- Clean IP ownership in a single entity
- Independent governance (law firm is investor, not operator)
- Better for future investment or institutional partnerships
- Stronger position with review panels — shows independent governance with legal oversight

---

## 3. TECHNICAL ARCHITECTURE

### Infrastructure
| Component | Details |
|---|---|
| Frontend | React 18, hosted on **Vercel** (auto-deploys on every git push to `main`) |
| Backend API | Node.js (raw `http` module, no Express), **Oracle Cloud VM** at `152.70.201.154:3000` |
| Database | **Neon PostgreSQL** (serverless, encrypted at rest) — NOT Oracle DB |
| Process manager | PM2 on Oracle VM — app name: `arbitration-backend` |
| Static frontend | React build also served from Oracle VM `/home/opc/arbitration-platform/public/` |
| Vercel proxy | All `/api/*` from Vercel frontend proxied to Oracle VM (avoids HTTPS→HTTP mixed content) |

### Key Files
| File | Purpose |
|---|---|
| `src/index.js` | Entire backend — all routes, AI calls, auth, services |
| `frontend/src/App.js` | React router, theme, ToS modal |
| `frontend/src/pages/` | All page components |
| `frontend/src/services/api.js` | All frontend API calls |
| `frontend/src/context/AuthContext.js` | JWT auth, token refresh |
| `frontend/vercel.json` | Vercel rewrites (API proxy + SPA fallback) |
| `.env.oracle` | Backend env vars — on Oracle VM only, NOT in git |
| `ignore/deploy.ps1` | Deploy script (git push + scp to Oracle + PM2 restart) |
| `legal/` | All legal documents (see Section 5) |
| `HANDOVER.md` | This file |

### Environment Variables (on Oracle VM in `.env.oracle`)
```
OPENAI_API_KEY=sk-proj-a8Xm5Rg52LwuTnXRTDf-...
OPENAI_MODEL=gpt-4o-mini
QWEN_API_KEY=sk-13a687289fd446789fa5f0fef004dce2
QWEN_MODEL=qwen-plus
NVIDIA_API_KEY=...
DATABASE_URL=postgresql://... (Neon connection string)
JWT_SECRET=...
```

### AI Provider Chain
1. **OpenAI GPT-4o-mini** (primary)
2. **Alibaba Qwen** (secondary fallback — 1,000,000 token limit)
3. **NVIDIA NIM** (tertiary fallback)

All calls go through `callAI(prompt, maxTokens)` in `src/index.js` with:
- Universal `LEGAL_GUARDRAIL` system prompt (prevents citation hallucination)
- Temperature: 0.2
- Try/catch per provider with fallthrough

### Deployment
```powershell
# Full deploy (git push + backend):
.\ignore\deploy.ps1

# Backend only (no git push):
.\ignore\deploy.ps1 -BackendOnly

# Frontend only (git push, triggers Vercel):
.\ignore\deploy.ps1 -FrontendOnly
```

SSH key path: `C:\Users\shuru\Documents\AIProjects\Arbitration_Platform\ssh-key-2026-04-14 (1).key`
Oracle VM: `opc@152.70.201.154`

### Admin Credentials (DO NOT expose publicly — removed from Login UI)
- Email: `admin@arbitration.platform`
- Password: `Admin@2026!`

---

## 4. USER ROLES
| Role | Access |
|---|---|
| `admin` | Full platform access, user management, audit log |
| `arbitrator` | Assigned cases only, hearing management, audit log |
| `secretariat` | Case management support, audit log |
| `counsel` | Own client's cases |
| `party` | Own case only (claimant or respondent) |

---

## 5. LEGAL DOCUMENTS (in `/legal/`)

All documents effective April 2026. **Update company name throughout when incorporated.**

| File | Contents |
|---|---|
| `platform-charter.md` | Explicit disclaimer of arbitral authority, platform scope, Kenya legal framework |
| `terms-of-service.md` | 13-section ToS, AI advisory clause, DPA 2019, governing law Kenya |
| `privacy-policy.md` | DPA 2019 ss. 26–32 rights, 7-year retention, ODPC pathway |
| `ai-use-policy.md` | Provider disclosure, advisory-only rule, EU AI Act 2024/1689 principles |
| `facilitation-agreement-template.md` | Template for institutions — they retain all arbitral authority |
| `review-submission.md` | Formal 6-part panel submission document |

---

## 6. PHASE 2 — WHAT WAS IMPLEMENTED

### Pillar 1: Legal Documentation Framework
- All 5 legal documents created in `/legal/`
- `review-submission.md` — formal panel submission covering legal, features, security, disclaimers

### Pillar 2: Platform Clarity & Institutional Positioning
- `frontend/src/pages/PlatformCharter.js` — public `/charter` page with facilitation disclaimer,
  feature cards, explicit "does not do" list, legal framework, AI transparency section
- `frontend/src/components/TosAcceptanceModal.js` — non-closeable ToS gate triggered on first
  login; stores acceptance in localStorage key `arb_tos_accepted_v1`
- `frontend/src/components/AIDisclosureBanner.js` — reusable advisory notice component
- `frontend/src/components/AIReviewGate.js` — **human oversight enforcement gate**: renders below
  every AI output; requires reviewer name + checkbox acknowledgment of professional responsibility;
  disables close/action until confirmed; resets on every new AI generation. Wired into:
  Documents (document analysis dialog), Intelligence (companion analysis), Compliance (arbitrability check)
- `App.js` — `/charter` public route added, ToS modal integrated into auth flow
- `Login.js` — facilitation-only description, info banner, **admin credentials removed**,
  Platform Charter link added

### Pillar 3: Security Hardening
- Security response headers on all API routes in `src/index.js`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `GET /api/audit-log` endpoint — admin/arbitrator/secretariat only, supports caseId/limit/page params

---

## 7. EARLIER WORK — KEY IMPLEMENTATIONS

### Training Module Generation (async job pattern)
- POST `/api/training/generate-module` returns `{jobId}` immediately (HTTP 202)
- Frontend polls GET `/api/training/generate-module/status?jobId=...` every 3 seconds
- `moduleJobStore = new Map()` in `src/index.js` (in-memory, 10-min TTL cleanup)
- Progress bar with 7 stage labels during generation
- Level selector (Beginner / Intermediate / Advanced)
- `max_tokens: 6000` — prevents JSON truncation on long modules
- `ModuleContent` component parses `##`/`###`/`**bold**`/bullets into MUI elements

### Training Modules — Legal Accuracy Rewrite
All 6 `BASE_MODULES` in `frontend/src/pages/Training.js` rewritten with verified citations:
- UNCITRAL Model Law (1985/2006), New York Convention Arts. III–V, Arts. 31/34
- ICC Rules 2021, LCIA Rules 2020, SIAC Rules 2025, NCIA Act No. 26 of 2013
- IBA Evidence Rules 2020 (Arts. 3/4/5/9), IBA Conflicts Guidelines (2014/2024)
- Kenya Arbitration Act Cap. 49, England Arbitration Act 1996 ss. 67–69
- EU AI Act Reg. (EU) 2024/1689, Prague Rules 2018
- TAR case law: *Rio Tinto v. Vale* S.D.N.Y. 2012; *Da Silva Moore v. Publicis* S.D.N.Y. 2012

### AI Hallucination Guardrail
- `LEGAL_GUARDRAIL` constant in `src/index.js` — 8 absolute rules
- Injected as `system` message on every `callAI()` call
- Per-endpoint prompt hardening on 6 endpoints
- Temperature reduced to 0.2 across all providers

### Mixed Content Fix
- Vercel HTTPS → Oracle VM HTTP was blocked by browser
- Fixed via `frontend/vercel.json` rewrites: `/api/*` → Oracle VM (server-side proxy)

### Provider History
- Removed: Groq, Gemini (no free tier)
- Added: OpenAI as primary, Qwen as secondary, NVIDIA kept as tertiary

---

## 8. OUTSTANDING TASKS

### Confirmed Owner Assignments (April 2026)
| Step | Owner | Timeline | Status |
|---|---|---|---|
| Incorporate the company | Law firm | 1 week | Confirmed — law firm to action |
| File ODPC registration | Company (law firm to file) | 1 week post-incorporation | Confirmed — law firm to action |
| Run one pilot case through the platform | Both founders | 2–4 weeks | Confirmed — joint action |
| Engage CREST-certified penetration testing firm | **Developer** | Schedule now; test 6–8 weeks | **Developer action required** |
| Request NCIA evaluation letter | Law firm | 1–2 weeks | Confirmed — law firm to action |
| Update `/legal/` docs with company name | Developer | When company name confirmed | Pending incorporation |
| CIArb Kenya Branch — CPD recognition | Law firm | Q3 2026 | Planned |
| LSK ADR Committee listing | Law firm | Q3 2026 | Planned |

### Developer's Sole Remaining Action: Penetration Test
See Section 12 for full penetration test brief.

### Security Certification Roadmap
| Certification | Timeline | Budget |
|---|---|---|
| ODPC registration | Q2 2026 | KES 10,000 |
| Penetration test (CREST-certified) | Q2–Q3 2026 | $5,000–$15,000 |
| ISO/IEC 27001:2022 | Q4 2026–Q2 2027 | $20,000–$50,000 |
| SOC 2 Type II | Q1–Q3 2027 | $30,000–$80,000 |

### Infrastructure (Phase 3)
- Oracle VM is single point of failure — containerise with Docker/ECS before ISO 27001
- Move secrets to AWS Secrets Manager or HashiCorp Vault
- Multi-region or cross-AZ redundancy

---

## 9. REVIEW PANEL — HOW PLATFORM ANSWERS KEY QUESTIONS

| Panel Question | Platform Answer |
|---|---|
| Is this an arbitral institution? | No — facilitation platform only; charter is explicit at `/charter` |
| Does it claim arbitral authority? | No — multi-layer disclaimer in Charter, ToS, and Login |
| What rules govern proceedings on it? | Parties bring their own (ICC, LCIA, NCIA, UNCITRAL etc.) |
| Is AI used in proceedings? | Advisory only — AI Use Policy published; human oversight required; opt-out available |
| Is data protected? | DPA 2019 compliant; ODPC registration in progress |
| Is it secure? | Security headers, JWT auth, RBAC, encrypted DB, pentest planned Q3 2026 |
| Who is legally responsible? | The company (once incorporated) — limited liability entity |
| What legal framework governs it? | Kenya Arbitration Act Cap. 49, UNCITRAL Model Law, DPA 2019 |
| Does training content meet standards? | Yes — all 6 modules cite verified statutes, conventions, and institutional rules |

---

## 10. PLATFORM URLS

| Environment | URL |
|---|---|
| Frontend (live) | https://arbitration-platform.vercel.app |
| API (direct) | http://152.70.201.154:3000 (do not call from frontend — use Vercel proxy) |
| Platform Charter | https://arbitration-platform.vercel.app/charter |
| Award Verification | https://arbitration-platform.vercel.app/verify |
| GitHub | https://github.com/shuruti-ke/Arbitration_platform |

---

## 11. DOCUMENTS FOR LAW FIRM TO PREPARE

1. Memorandum & Articles of Association (company incorporation)
2. Shareholders' Agreement (shareholding, board, founder protections, reserved matters)
3. IP Assignment Agreement (developer → company, on day of incorporation)
4. Director Service Agreement (developer's role)
5. Legal Services Agreement (law firm → company, fee arrangement)
6. Formal letter of support for platform on firm letterhead (for NCIA/CIArb approach)
7. ODPC registration application (in company name)

---

## 12. PENETRATION TEST BRIEF (Developer's Action)

This section is the complete brief to send to a CREST-certified penetration testing firm.

### What is CREST?
The Council of Registered Ethical Security Testers (CREST) is the internationally recognised
accreditation body for penetration testing firms. CREST-certified testers have passed rigorous
examinations and their firms are independently audited. ISO 27001 certification bodies and
institutional clients require CREST (or equivalent — CHECK, Cyber Essentials in UK; OSCP
qualifications are acceptable evidence of individual tester competence).

### Finding a Firm
Search for CREST-accredited firms with East Africa operations:
- **CREST member search:** https://www.crest-approved.org/members
- Firms active in Kenya/East Africa: Serianu (Nairobi), Symbion (regional), or international
  firms with remote delivery capability (NCC Group, Trustwave, WithSecure)
- Request quotes from at least 3 firms

### Scope to Specify in the Brief

**Application type:** Web application + REST API
**Target environments:**
- Production frontend: https://arbitration-platform.vercel.app
- Production API: via Vercel proxy /api/* (do NOT test Oracle VM IP directly — test through Vercel)
- Provide a dedicated test user account for each role: admin, arbitrator, secretariat, counsel, party

**Testing methodology:** OWASP Web Security Testing Guide (WSTG) v4.2 + OWASP API Security Top 10

**Specific areas to test:**

| Area | What to test |
|---|---|
| Authentication | JWT implementation, token expiry, refresh token rotation, brute force protection |
| Authorisation | Role-based access control — can a party role access another party's case? Can counsel access admin endpoints? |
| Session management | Token storage (localStorage — known risk), session fixation, logout effectiveness |
| Input validation | XSS in all text fields, SQL injection via API parameters, command injection |
| File upload | Malicious file bypass (the Cloudmersive scanner), file type validation, path traversal |
| API security | Broken object-level authorisation (BOLA/IDOR) — can user A access user B's documents by changing the ID? |
| Sensitive data exposure | Are API responses leaking data beyond what the role should see? |
| Security headers | Verify all 6 headers are present on all responses |
| Business logic | Can a party submit a case without payment? Can a non-arbitrator assign an arbitrator? |
| AI endpoints | Can AI endpoints be abused with prompt injection via document content? |

**Out of scope:**
- Oracle VM operating system / network layer (infrastructure test — separate engagement later)
- Neon database direct access
- Vercel platform infrastructure
- Denial of service testing

**Deliverables to require:**
1. Executive summary (suitable for board / institutional presentation)
2. Technical findings report — every vulnerability with: severity (Critical/High/Medium/Low/Info),
   CVSS score, evidence (screenshot/request-response), remediation recommendation
3. Remediation verification retest — after developer fixes findings, firm retests Critical and High
   findings at no extra cost (negotiate this upfront)
4. Certificate of test completion — for submission to NCIA and ISO 27001 auditors

**Timeline:** Allow 2 weeks for the test, 2 weeks for remediation, 1 week for retest = 5 weeks total

**Budget:** Budget $5,000–$10,000 for a focused web app + API test of this scope. Get 3 quotes.

### What to Fix Before the Test (Reduces Finding Count)
- Remove any debug endpoints or test routes from `src/index.js`
- Ensure all API error responses do not leak stack traces (check `catch` blocks return generic messages)
- Confirm the Cloudmersive virus scanner is active (check `CLOUDMERSIVE_API_KEY` is set in `.env.oracle`)
- Remove or disable any development/test accounts that are not needed

### After the Test
- Fix all Critical and High findings immediately before any institutional meeting
- Medium findings: fix within 30 days
- Low/Info: document accepted risk or fix in next sprint
- Keep the final report and certificate — submit as Annex A to the review submission document

---

*Update this document after every major session or implementation change.*
