# Arbitration Facilitation Platform
## Submission for Institutional Review
### Prepared by: Platform Legal Counsel
### Date: April 2026

---

## EXECUTIVE SUMMARY

This document is submitted in support of a review of the Arbitration Facilitation Platform ("the Platform"). It sets out the Platform's legal position, governance framework, technical architecture, and the protections in place for parties, arbitrators, and counsel who use it.

**The single most important fact for this review:** The Platform is a technology facilitation tool. It is not an arbitral institution. It makes no awards, issues no binding orders, and claims no arbitral authority of any kind. It operates in the same legal category as Opus2 Magnum, Relativity, or Bundledocs — technology platforms used in ICC, LCIA, and SIAC proceedings without requiring institutional accreditation.

The Platform exists to solve a specific problem: arbitration proceedings, particularly in East Africa, suffer from fragmented case management — documents exchanged by email, hearings on generic video platforms, no common case record, and no structured training pathway for emerging practitioners. This Platform consolidates those functions into a purpose-built, legally conscious environment.

---

## PART 1: LEGAL FRAMEWORK AND GOVERNANCE

### 1.1 Platform Charter

The Platform Charter (available at `/charter` and filed with this submission) establishes in unambiguous terms:

- The Platform is a **technology facilitation service**, not an arbitral institution
- **No arbitral authority** is claimed, held, or exercised
- All arbitral decisions are made exclusively by the appointed arbitrator(s) under the applicable arbitration agreement and rules chosen by the parties
- No output of the Platform — including any AI-assisted analysis — constitutes an arbitral award, procedural order, or ruling on jurisdiction or the merits

### 1.2 Kenya Legal Compliance

The Platform is anchored in Kenya law and operated in compliance with:

| Instrument | Relevance |
|---|---|
| **Arbitration Act, Cap. 49 of the Laws of Kenya (1995, amended 2009)** | The Platform supports proceedings governed by this Act. The Act adopts the UNCITRAL Model Law on International Commercial Arbitration (1985, as amended 2006). |
| **Kenya Data Protection Act, 2019 (Act No. 24 of 2019)** | All personal data processing is conducted under this Act. Application for registration with the Office of the Data Protection Commissioner (ODPC) is in progress. |
| **Kenya Information and Communications Act, Cap. 411A** | Applicable to the provision of electronic communications and information services. |
| **Limitation of Actions Act, Cap. 22** | Case data retention period of 7 years post-closure aligns with the applicable limitation period for contract claims. |

### 1.3 Terms of Service

The Platform's Terms of Service (filed with this submission) establish:
- Facilitation-only scope with explicit disclaimer of arbitral authority
- Five user roles: Administrator, Arbitrator, Secretariat, Legal Counsel, Party
- AI advisory-only clause — all AI outputs are expressly non-binding and subject to qualified legal review
- Confidentiality obligations on all users
- DPA 2019-compliant data protection provisions
- Governing law: Republic of Kenya; courts of Nairobi

### 1.4 Privacy and Data Protection

The Platform's Privacy Policy (filed with this submission) complies with DPA 2019, including:
- Sections 26–32: data subject rights (access, rectification, erasure, portability, restriction, objection)
- Section 31: 7-year retention period for case data
- International transfer disclosures (Oracle Cloud Infrastructure, Neon Database, AI provider APIs)
- ODPC registration application in progress

### 1.5 AI Use Policy

The Platform deploys AI tools in an explicitly advisory capacity only. The AI Use Policy (filed with this submission) establishes:
- **AI providers:** OpenAI GPT-4o-mini (primary), Alibaba Qwen (secondary), NVIDIA NIM (tertiary)
- **Prohibited uses:** AI may not make arbitral decisions, generate awards, or provide legal advice
- **Mandatory human oversight:** All AI outputs must be reviewed by a qualified legal professional before use in any proceeding
- **Hallucination acknowledgment:** The policy explicitly acknowledges AI hallucination risk and requires primary source verification
- **EU AI Act 2024/1689 principles** adopted as international best practice, including transparency and human oversight requirements
- **Opt-out right:** Parties may request that AI analysis not be applied to their case

### 1.6 Facilitation Agreement Template

A template Facilitation Agreement (filed with this submission) is available for execution between the Platform and any arbitral institution or enterprise user. It explicitly provides that:
- The Platform is a technology provider only
- The institution retains all arbitral authority
- Data processing terms comply with DPA 2019
- Governing law is Kenya

---

## PART 2: PLATFORM FEATURES AND FUNCTIONALITY

### 2.1 Case Management
- Structured digital case registration with intake form (parties, dispute type, seat, applicable rules)
- Timeline and milestone tracking from commencement to award
- Role-based access: each participant sees only what their role permits
- Case status notifications by email

### 2.2 Document Repository
- Encrypted document storage per case
- Virus scanning on upload (Cloudmersive API integration)
- File size limits enforced (3.5 MB per upload)
- AI-assisted document analysis (advisory only, with disclosure)
- Document categorisation and case-level access control

### 2.3 Virtual Hearings
- Jitsi-based virtual hearing rooms generated per case
- In-person and hybrid hearing scheduling
- Hearing management: arbitrator assignment, party notification
- Session records maintained in case file

### 2.4 Training and Certification
- Six foundational training modules with full legal citations (UNCITRAL Model Law, New York Convention, IBA Rules, ICC/LCIA/SIAC/NCIA Rules, IBA Conflicts Guidelines, EU AI Act)
- AI-generated modules anchored by universal legal accuracy guardrail (prevents hallucination of legal citations)
- Certification examination system (10 questions, 70% pass mark)
- CIArb Kenya CPD alignment pathway (in development)

### 2.5 Compliance Tools
- Arbitrability assessment tool (advisory, not determinative)
- Court filing compliance checker by jurisdiction (advisory)
- Award verification with cryptographic hash (SHA-256)
- NY Convention enforceability assessment

### 2.6 AI Companion (Intelligence Module)
- Case analysis and procedural guidance (advisory)
- All outputs carry mandatory disclosure: "AI-generated. Advisory only. Verify against primary sources."
- Legal guardrail system prompt on all AI calls (enforces citation accuracy)

### 2.7 Analytics and Reporting
- Case statistics, timelines, outcomes
- Admin reporting for institutional oversight
- AI-generated periodic reports (advisory)

---

## PART 3: TECHNICAL SECURITY

### 3.1 Current Architecture

| Component | Specification |
|---|---|
| Frontend | React 18, deployed on Vercel (CDN, global edge) |
| Backend API | Node.js, Oracle Cloud Infrastructure VM (Ubuntu) |
| Database | Neon PostgreSQL (serverless, encrypted at rest) |
| Authentication | JWT with role-based access control (5 roles) |
| File transfer | HTTPS throughout (Vercel proxy eliminates HTTP/HTTPS mixed content) |
| API security | Bearer token authentication on all endpoints |

### 3.2 Security Headers Implemented

All API responses carry the following security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 3.3 Data Protection Controls
- Role-based access: parties access only their own case
- Arbitrators access only assigned cases
- Admin access is logged and restricted to platform staff
- Document uploads scanned for malicious content before storage
- JWT tokens expire; refresh token rotation implemented

### 3.4 Audit Trail
- Immutable audit log captures all significant user actions
- Accessible via `/api/audit-log` to admin, arbitrator, and secretariat roles
- Case-level audit log available per proceeding

### 3.5 Planned Security Certifications (Phase 2B)

| Certification | Timeline | Status |
|---|---|---|
| ODPC (Kenya DPA 2019) Registration | Q2 2026 | Application in preparation |
| Independent penetration test (CREST-certified firm) | Q3 2026 | Procurement in progress |
| ISO/IEC 27001:2022 | Q4 2026–Q2 2027 | Gap assessment to commence Q3 2026 |
| SOC 2 Type II | Q1–Q3 2027 | Planned post-ISO 27001 |

---

## PART 4: WHAT THIS PLATFORM IS NOT AND DOES NOT CLAIM

This section is reproduced verbatim from the Platform Charter and is the most important section for review purposes.

**The Platform does not:**

1. Conduct arbitration — no proceedings are "administered" by the Platform in any institutional sense
2. Make, publish, or enforce arbitral awards — the award pack builder produces a structured document template; the award is made and signed by the arbitrator(s) alone
3. Appoint arbitrators — the Platform has a user management system that assigns the arbitrator role, but appointments in any legal sense are made by the parties or appointing authority under their agreed rules
4. Provide legal advice — all content, including AI-generated content, is expressly advisory and carries a disclaimer
5. Claim recognition as an arbitral institution — the Platform does not seek and has not received recognition under the NCIA Act 2013 or any equivalent instrument as an administering institution
6. Make procedural orders — hearing schedules, timelines, and milestones are case management tools only; they have no binding procedural effect independent of the arbitrator's direction

**What gives the Platform its legitimacy:**

The Platform derives its legitimacy not from any arbitral authority but from:
- The consent of the parties and arbitrators who choose to use it
- The legal framework within which it operates (Arbitration Act Cap. 49, DPA 2019)
- The transparency of its documentation (Charter, ToS, Privacy Policy, AI Use Policy — all public)
- The accuracy and integrity of the tools it provides

---

## PART 5: NEXT STEPS FOR FULL INSTITUTIONAL ENDORSEMENT

The following steps are underway to complete the institutional positioning of the Platform:

### 5.1 Law Firm Engagement
The Platform is developed in partnership with a law firm with arbitration practice experience. The law firm:
- Reviews all legal documentation before publication
- Provides the first cases to the Platform (establishing a track record)
- Is in dialogue with NCIA regarding the Platform's use in NCIA-administered proceedings
- Has reviewed the AI Use Policy and confirms it is consistent with professional responsibility obligations

### 5.2 NCIA Engagement
Correspondence has been initiated with the Nairobi Centre for International Arbitration to position the Platform as a technology partner for NCIA-administered proceedings. We are not seeking institutional accreditation — we are seeking recognition as a trusted technology tool for use in NCIA proceedings (analogous to the ICC's use of Opus2 for virtual hearings).

### 5.3 CIArb Kenya Chapter
Discussions are ongoing with the Chartered Institute of Arbitrators Kenya Branch regarding:
- Recognition of the Platform's training modules as qualifying CPD activities
- Co-branding of training certification
- Recommendation to CIArb members as a case management tool

### 5.4 Law Society of Kenya (LSK)
Application to the LSK's ADR Committee for listing as an approved technology platform for arbitration proceedings in Kenya.

---

## PART 6: DOCUMENTS FILED WITH THIS SUBMISSION

1. Platform Charter (effective April 2026)
2. Terms of Service (effective April 2026)
3. Privacy Policy — DPA 2019 compliant (effective April 2026)
4. AI Use Policy (effective April 2026)
5. Facilitation Agreement Template
6. Training module content (6 modules, legally cited)
7. AI Legal Accuracy Guardrail (technical specification)

---

## CONCLUSION

The Arbitration Facilitation Platform is not competing with arbitral institutions — it is providing the technology infrastructure that makes their work more efficient, more accessible, and better documented. It occupies the same position in the arbitration ecosystem as the transcription services, hearing platforms, and document management systems that the ICC, LCIA, and SIAC already use and recommend.

Its legal framework is transparent, its limitations are explicit, and its AI tools operate under stricter accuracy requirements than most comparable platforms. We welcome any questions from the review panel and are available to provide further information or a live demonstration.

---

*Submitted by Platform Legal Counsel*
*April 2026*
*Governing Law: Republic of Kenya*
