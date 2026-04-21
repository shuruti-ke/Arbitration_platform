// src/pages/Training.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, Chip, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Divider, TextField, CircularProgress,
  Paper, IconButton, Tooltip, List, ListItem, ListItemIcon,
  ListItemText, RadioGroup, FormControlLabel, Radio, Collapse,
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  PlayArrow as StartIcon,
  EmojiEvents as CertIcon,
  AutoAwesome as AIIcon,
  TrendingUp as TrendingIcon,
  Quiz as QuizIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Replay as RetakeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiService from '../services/api';

// ─── Static base modules ──────────────────────────────────────────────────────
const BASE_MODULES = [
  {
    id: 'intro', title: 'Introduction to Arbitration', level: 'Beginner', duration: '20 min',
    description: 'Core concepts: what arbitration is, how it differs from litigation, and when to use it.',
    topics: ['What is arbitration?', 'Arbitration vs. litigation vs. mediation', 'Types of disputes suitable for arbitration', 'Key principles: confidentiality, finality, neutrality', 'When to choose arbitration'],
    content: `## What is Arbitration?

Arbitration is a private, binding method of dispute resolution in which parties agree — by contract (an arbitration clause) or a separate submission agreement — to refer their dispute to one or more neutral arbitrators whose decision (the award) is final and legally binding. It is governed by national arbitration legislation and, for international matters, by treaty.

**Legal Foundation**

The primary international legislative instrument is the **UNCITRAL Model Law on International Commercial Arbitration (1985, as amended 2006)**, adopted in whole or in part by over 80 states including Kenya (Arbitration Act, Cap. 49, 1995), Singapore (International Arbitration Act, Cap. 143A), and India (Arbitration and Conciliation Act, 1996). This Model Law standardises key rules on arbitral agreements, composition of tribunals, conduct of proceedings, and grounds for challenge or non-enforcement of awards.

## How Arbitration Differs from Litigation and Mediation

**Arbitration vs. Litigation:** Parties choose their decision-maker, seat, language, and procedural rules — none of which apply in court. Arbitral awards are final with narrow appeal grounds; court judgments are subject to multi-tier appeals. Confidentiality is the norm in arbitration; court proceedings are generally public. Crucially, foreign arbitral awards are enforceable in over 170 countries under the 1958 New York Convention; foreign court judgments lack an equivalent multilateral treaty.

**Arbitration vs. Mediation:** Mediation (conciliation) produces a negotiated settlement only if both parties agree; the mediator has no power to impose a decision. Arbitration produces a binding award whether or not the losing party cooperates. Mediation is governed by the **UNCITRAL Model Law on International Commercial Mediation and International Settlement Agreements Resulting from Mediation (2018)** and, where adopted, the Singapore Convention on Mediation (2019).

## Types of Disputes Suitable for Arbitration

Arbitration is appropriate for: international commercial contracts, investor-state investment disputes (under bilateral investment treaties or the ICSID Convention, Washington 1965), construction and engineering, maritime and admiralty, intellectual property licensing, and employment (where permitted by statute). Disputes involving criminal liability, family status, or matters reserved by public policy are generally non-arbitrable.

## Core Principles

**Party Autonomy:** Parties are free to agree on the seat (legal place) of arbitration, the procedural rules, the number and method of appointment of arbitrators, the language, and the substantive law governing the dispute (UNCITRAL Model Law, Art. 19; New York Convention, Art. II).

**Confidentiality:** Unlike court hearings, arbitration proceedings, pleadings, evidence, and awards are private. Many institutional rules codify this obligation (e.g., LCIA Rules 2020, Art. 30; SIAC Rules 2016, Rule 39). Some seats impose confidentiality by statute (e.g., England — Arbitration Act 1996, s.1 general duty; specific confidentiality recognised in case law).

**Finality:** Awards are final and binding on the parties. Grounds for challenge at the seat are narrow and do not permit re-examination of the merits (UNCITRAL Model Law, Art. 34; Arbitration Act 1996 [UK], ss. 67–69).

**Neutrality:** Arbitrators must be and remain independent and impartial throughout the proceedings. The **IBA Guidelines on Conflicts of Interest in International Arbitration (2014, updated 2024)** are the internationally recognised standard for disclosure and disqualification.

**International Enforceability:** The **Convention on the Recognition and Enforcement of Foreign Arbitral Awards (New York, 1958)** — the "New York Convention" — obliges its 172 contracting states to recognise and enforce foreign arbitral awards. Refusal is permitted only on the narrow grounds listed in Article V.

## When to Choose Arbitration

Arbitration is the preferred mechanism when: the parties are from different countries; confidentiality is essential; the parties wish to choose a neutral decision-maker with subject-matter expertise; and where cross-border enforcement of any award is anticipated. Where speed or a friendly business relationship is the priority, mediation or negotiation may be more appropriate first steps.`,
  },
  {
    id: 'rules', title: 'Arbitration Rules & Procedures', level: 'Intermediate', duration: '35 min',
    description: 'Overview of major institutional rules: ICC, LCIA, UNCITRAL, NCIA, SIAC.',
    topics: ['ICC Rules overview', 'LCIA Rules overview', 'UNCITRAL Arbitration Rules', 'NCIA Rules (Kenya)', 'SIAC Rules overview', 'Choosing the right rules for your dispute'],
    content: `## What Are Institutional Arbitration Rules?

Institutional arbitration rules are procedural codes published by arbitral institutions that govern the conduct of arbitration proceedings administered by that institution. They address: how the arbitration is commenced, how arbitrators are appointed (and challenged), how the proceedings are managed, and how the institution's administrative fees are calculated. Parties incorporate a set of rules by including the institution's model arbitration clause in their contract.

## ICC Rules (International Chamber of Commerce)

**Current version:** ICC Rules of Arbitration 2021 (in force 1 January 2021).

The ICC International Court of Arbitration, Paris, does not itself decide disputes — it administers proceedings. Key features of ICC arbitration include:

- **Terms of Reference (Art. 23):** Within 30 days of transmission of the file, the tribunal and parties sign a document defining the issues, relief sought, and procedural schedule. This is unique to ICC.
- **Scrutiny of draft awards (Art. 34):** Before signature, every draft award is reviewed by the ICC Court for form and, in principle, legal soundness. This reduces enforcement challenges.
- **Case management conference (Art. 24):** Mandatory early procedural conference to set the timetable.
- **Emergency arbitrator (Art. 29 & Appendix V):** Available for urgent interim relief before the tribunal is constituted.

ICC is the most widely used institution globally for high-value international commercial disputes.

## LCIA Rules (London Court of International Arbitration)

**Current version:** LCIA Arbitration Rules 2020 (in force 1 October 2020).

The LCIA (London) is known for:
- **Institutional appointment of arbitrators (Art. 5):** The LCIA Court selects arbitrators based on objective criteria; parties may propose but the LCIA decides — this reduces tactical delays in appointment.
- **Arbitrator's ability to control the process (Art. 14):** Wide powers to manage the hearing efficiently.
- **Confidentiality (Art. 30):** Strong default confidentiality obligation on all participants.
- **Emergency arbitrator (Art. 9B):** Available from the date of commencement.

Preferred for English law-governed contracts and disputes with European parties.

## UNCITRAL Arbitration Rules

**Current version:** UNCITRAL Arbitration Rules 2013 (revised from 1976 original); used with the UNCITRAL Transparency Rules (2013) for treaty arbitrations.

UNCITRAL Rules are designed for **ad hoc arbitration** — no administering institution. Parties (or an appointing authority such as the Permanent Court of Arbitration, The Hague) handle appointments. UNCITRAL Rules are the most commonly referenced rules in **bilateral investment treaty (BIT)** arbitration and investor-state claims. The **ICSID Convention and ICSID Arbitration Rules (2022 revision)** apply to investment disputes where the host state is an ICSID member.

## NCIA Rules (Nairobi Centre for International Arbitration)

**Current version:** NCIA Arbitration Rules 2015, established under the Nairobi Centre for International Arbitration Act, No. 26 of 2013 (Kenya).

Kenya's domestic and regional institutional arbitration framework is anchored in:
- **Arbitration Act, Cap. 49 of the Laws of Kenya (1995, amended 2009)** — adopts the UNCITRAL Model Law.
- **NCIA Act 2013** — establishes the Nairobi Centre as a statutory body to administer arbitration and other ADR proceedings.

NCIA Rules mirror UNCITRAL Model Law principles and provide for a three-member or sole arbitrator tribunal, fast-track procedure, and an emergency arbitrator. The NCIA is the preferred institution for East African regional and continental investment disputes.

## SIAC Rules (Singapore International Arbitration Centre)

**Current version:** SIAC Rules 2025 (6th edition, in force 1 January 2025).

Singapore is one of the world's leading arbitral seats (International Arbitration Act 1994, Cap. 143A, as amended). SIAC features:
- **Expedited procedure (Rule 5 / Schedule 1):** For disputes under SGD 6 million or urgent cases — full award within 6 months.
- **Emergency arbitrator (Schedule 1):** Order or award within 14 days of appointment.
- **Early dismissal (Rule 29):** Tribunal can summarily dismiss manifestly unmeritorious claims or defences.

## How to Choose the Right Rules

| Factor | ICC | LCIA | UNCITRAL | NCIA | SIAC |
|---|---|---|---|---|---|
| Best for | High-value global | English law | Ad hoc / BIT | East Africa | Asia-Pacific |
| Award scrutiny | Yes | No | No | No | No |
| Emergency arbitrator | Yes | Yes | No (PCA can) | Yes | Yes |
| Typical cost | High | High | Lower | Moderate | Moderate |

Additional selection factors: the seat's national arbitration law, availability of qualified arbitrators, currency and language of proceedings, and whether an institutional backing for enforcement is desired.`,
  },
  {
    id: 'evidence', title: 'Evidence & Document Management', level: 'Intermediate', duration: '30 min',
    description: 'Best practices for organizing evidence, submissions, and case documents.',
    topics: ['Types of evidence in arbitration', 'Document exchange protocols', 'Witness statements and expert reports', 'Document confidentiality obligations', 'Using AI for document analysis'],
    content: `## Evidence in Arbitration: The Governing Framework

Evidence in international arbitration is governed by the arbitration agreement, the institutional rules chosen by the parties, the law of the seat, and—most importantly—by the tribunal's procedural directions. Unlike litigation in common law courts, there is no automatic right to wide-ranging discovery. The tribunal has broad discretion over admissibility, relevance, materiality, and the weight to be given to any evidence (UNCITRAL Model Law, Art. 19(2); ICC Rules 2021, Art. 25(6)).

## The IBA Rules on the Taking of Evidence (2020)

The **IBA Rules on the Taking of Evidence in International Arbitration (2020 revision, International Bar Association)** are the internationally recognised soft-law instrument governing evidence. They are not automatically applicable but are routinely adopted by consent or by tribunal order. Key provisions include:

- **Art. 3 — Document Production:** A party may request the tribunal to order another party to produce specific documents or categories of documents. Requests must identify the documents with reasonable specificity, explain their relevance and materiality, and confirm the requesting party does not possess them.
- **Art. 4 — Witness Statements:** Fact witnesses submit signed written statements in advance of the hearing. Witnesses are then tendered for cross-examination. Affirmations of truth are standard.
- **Art. 5 — Party-Appointed Expert Reports:** Each party may submit an expert report. The tribunal may also appoint its own expert (Art. 6). Joint expert meetings and a memorandum of agreed/disagreed issues are common.
- **Art. 9 — Admissibility and Exclusion:** The tribunal may exclude evidence that is not relevant, not material, legally privileged, of unreasonable burden to produce, or that would compromise confidentiality. "Fishing expeditions" (broad speculative requests) are excluded.

## Redfern Schedules

A **Redfern Schedule** (named after arbitration practitioner Alan Redfern) is the standard table format used to manage document production requests. It has four columns:

1. Documents requested (by the requesting party)
2. Reasons for the request (requesting party)
3. Objections (responding party)
4. Tribunal's decision

This structured format prevents scope creep, keeps production disputes manageable, and creates a clear procedural record.

## Types of Evidence

**Documentary evidence:** Contemporaneous documents — contracts, correspondence, invoices, board minutes, technical drawings — carry the greatest weight because they were not created for the purpose of litigation. Tribunals look for consistency between contemporaneous documents and witness accounts.

**Witness of fact statements:** Submitted in writing (IBA Rules, Art. 4). Must be signed by the witness. At the hearing, the witness is available for cross-examination and re-direct. Witness statements that contradict contemporaneous documents are treated with caution.

**Expert evidence:** Technical, financial, or legal expert reports. Under IBA Rules Art. 5, the report must state the expert's qualifications, instructions received, the facts relied upon, and the expert's opinions with reasons. Opposing expert reports followed by a joint memorandum identifying agreed and disputed issues is the standard practice.

**Electronic evidence:** Electronically stored information (ESI) including emails, databases, and metadata is increasingly significant. Parties must disclose relevant ESI; metadata (timestamps, author) is treated as part of the document. Forensic recovery of deleted data may be ordered.

## Confidentiality of Documents

Documents produced in the arbitration are subject to confidentiality obligations. The **LCIA Rules 2020, Art. 30** and **SIAC Rules 2025, Rule 39** impose explicit obligations on parties and their representatives. Even where rules are silent, confidentiality is implied in many seat laws. Documents produced under compulsion may not be used outside the arbitration without leave of the tribunal.

## AI-Assisted Document Review

Machine learning-based tools (e-discovery platforms such as Relativity, Everlaw, or Luminance) are routinely used in large-document arbitrations for:
- Predictive coding / technology-assisted review (TAR) for relevance and privilege screening
- Deduplication and threading of email chains
- Identification of key custodians and hot documents

Tribunals have accepted TAR as a valid production methodology (see *Rio Tinto plc v. Vale S.A.*, S.D.N.Y. 2012, which validated predictive coding in litigation — widely adopted by analogy in arbitration). Counsel must disclose the use of AI tools for document review where required by tribunal directions.`,
  },
  {
    id: 'awards', title: 'Drafting & Enforcing Awards', level: 'Advanced', duration: '40 min',
    description: 'How arbitral awards are structured, drafted, and enforced globally.',
    topics: ['Elements of a valid arbitral award', 'Award drafting best practices', 'The New York Convention (1958)', 'Cross-border enforcement procedures', 'Grounds for challenging an award'],
    content: `## Formal Requirements of a Valid Arbitral Award

Under both the **UNCITRAL Model Law on International Commercial Arbitration (Art. 31)** and most institutional rules, a valid arbitral award must:

1. **Be in writing** and signed by the arbitrator(s). Where there is more than one arbitrator and a member refuses to sign, the signatures of the majority are sufficient, provided the reason for any omission is stated.
2. **State the date** on which the award is made.
3. **State the juridical seat** (place) of arbitration — this determines the law applicable to the award and the courts with supervisory jurisdiction.
4. **Give reasons** for the decision, unless the parties have agreed otherwise or the award is on agreed terms (consent award).
5. **Be notified to each party** — delivery triggers time limits for challenge.

Additional requirements under specific institutional rules: ICC awards must pass scrutiny by the ICC Court before signature (ICC Rules 2021, Art. 34); LCIA awards must be delivered to parties through the Registrar (LCIA Rules 2020, Art. 26).

## Structure and Drafting of an Arbitral Award

A well-drafted award is self-contained and follows a logical structure:

**1. Cover page:** Case reference, institution, seat, parties, counsel, arbitrators, date.

**2. Procedural history:** Chronological summary of all procedural steps from commencement to the hearing, including significant applications and rulings. This establishes that due process was followed.

**3. Parties' positions (summary):** A neutral summary of each party's case and relief sought, drawn from the pleadings.

**4. Issues to be determined:** A numbered list of the discrete legal and factual issues the tribunal must resolve. Structuring the award around these issues ensures completeness.

**5. Applicable law:** The substantive law governing the contract/dispute (as chosen by the parties under the arbitration agreement or applicable conflict-of-laws rules). Also the law governing the arbitral procedure (lex arbitri — the law of the seat).

**6. Findings of fact:** The tribunal's determination of disputed facts, with specific references to the evidence relied upon (documentary exhibits, witness statements, expert reports).

**7. Legal analysis:** Application of the applicable law to the facts. Each issue addressed in turn. Cite statutory provisions and, where relevant, leading decisions of the seat or applicable law's courts. Do not invent cases — cite only verified authorities.

**8. Dispositif (operative part):** The binding decision. Must be precise: which party succeeds on which claim, the exact amount awarded, interest (rate, start date, compounding), costs allocation, and the deadline for payment.

**9. Costs:** Allocation of the costs of the arbitration (institution, arbitrators) and the parties' legal costs. The general principle in international arbitration is "costs follow the event" (the losing party pays), but tribunals have broad discretion.

## The New York Convention (1958): International Enforcement

The **Convention on the Recognition and Enforcement of Foreign Arbitral Awards, New York, 10 June 1958** ("New York Convention") is the cornerstone of international arbitration enforcement. As of 2024, it has **172 contracting states**.

**Article III:** Each contracting state must recognise arbitral awards as binding and enforce them in accordance with its procedural rules.

**Article IV:** The party seeking enforcement must supply: (a) the duly authenticated original award or a certified copy; (b) the original arbitration agreement or a certified copy; and (c) translations if the award/agreement are not in the official language of the enforcement country.

**Article V — Grounds for Refusal (exhaustive):**

A court may refuse enforcement only on the following grounds (burden of proof on the resisting party for V(1); court may raise V(2) of its own motion):

| Ground | Article |
|---|---|
| A party to the agreement was under some incapacity, or the agreement is invalid under the applicable law | V(1)(a) |
| The party against whom enforcement is sought was not given proper notice of the proceedings or was otherwise unable to present its case | V(1)(b) |
| The award deals with a difference not contemplated by or falling within the terms of the submission to arbitration, or beyond the scope of submission | V(1)(c) |
| The composition of the tribunal or arbitral procedure was not in accordance with the agreement of the parties | V(1)(d) |
| The award has not yet become binding, or has been set aside or suspended by a court of the country where it was made | V(1)(e) |
| The subject matter is not arbitrable under the law of the country where enforcement is sought | V(2)(a) |
| Recognition or enforcement would be contrary to the public policy of that country | V(2)(b) |

Courts in New York Convention states apply Article V narrowly and do not review the merits of the dispute.

## Setting Aside an Award at the Seat

A party may challenge an award in the courts of the seat under **UNCITRAL Model Law, Art. 34** (adopted by most Model Law states). The grounds for setting aside mirror Article V of the New York Convention and must be invoked **within 3 months** of receipt of the award (Art. 34(3)).

Courts apply this ground very narrowly: they do not act as appellate courts on the merits. The English Arbitration Act 1996, ss. 67–69 provides for challenge on jurisdiction (s.67), serious irregularity (s.68 — high threshold), and, with leave, a point of law (s.69 — opt-out available).

## Practical Enforcement Steps

1. Obtain a certified copy of the award from the institution (or authenticate the original).
2. Identify the jurisdictions where the losing party holds assets.
3. File an application to the competent court in each enforcement jurisdiction under the New York Convention and local procedural rules (e.g., in Kenya: High Court under the Arbitration Act, Cap. 49, s. 36; in England: CPR Part 62).
4. Serve the application on the award debtor.
5. Obtain a court order recognising and enforcing the award.
6. Enforce via domestic execution mechanisms (attachment of bank accounts, property, receivables).`,
  },
  {
    id: 'platform', title: 'Using the Platform', level: 'Beginner', duration: '25 min',
    description: 'Step-by-step guide to managing cases, hearings, documents, and parties.',
    topics: ['Opening a case and the payment workflow', 'Adding parties and counsel', 'Scheduling and joining virtual hearings', 'Uploading and managing documents', 'Tracking case status and milestones'],
    content: `This platform provides an end-to-end digital environment for managing international arbitration proceedings.

Opening a case: navigate to Cases → New Case. Complete the intake form including parties' details, dispute type, applicable rules, and juridical seat. The payment workflow triggers automatically—filing fees must be settled before the case is formally registered.

Adding parties and counsel: from the case detail page, use the Parties and Counsel tabs to add respondents, claimants, and their legal representatives. Each contact receives automated email notifications for key case events.

Scheduling hearings: go to Hearings → Schedule Hearing. Select virtual, in-person, or hybrid format. Virtual hearings generate a Jitsi meeting room. Live transcription is available through the browser microphone for virtual sessions.

Document management: upload submissions, evidence, and correspondence through the Documents tab within each case. Files are categorised automatically and retained in the case record. AI analysis is available for uploaded documents.

Case status and milestones: the Timeline tab in each case tracks key procedural steps from filing through to the award. Status updates trigger notifications to all parties. The dashboard provides an at-a-glance overview of active matters.`,
  },
  {
    id: 'ai', title: 'AI in Arbitration', level: 'Intermediate', duration: '20 min',
    description: 'How AI tools on this platform support analysis, scheduling, and decision support.',
    topics: ['AI document analysis and evidence review', 'Predictive analytics and case timelines', 'AI conflict of interest detection', 'Ethical considerations for AI in dispute resolution', 'Limitations of AI in arbitration'],
    content: `## AI in the Arbitration Lifecycle

Artificial intelligence tools are being deployed across all phases of international arbitration proceedings. This module surveys current applications, the emerging regulatory and ethical framework, and the firm limitations that require human oversight.

## Document Analysis and Review

Large language models (LLMs) and machine learning classification tools are used for:

- **Relevance and privilege review:** Technology-Assisted Review (TAR), also known as predictive coding, uses a human reviewer to train an AI model that then classifies large document sets. Courts and arbitral tribunals have accepted TAR as a valid methodology (see *Da Silva Moore v. Publicis Groupe*, S.D.N.Y. 2012; *Rio Tinto plc v. Vale S.A.*, S.D.N.Y. 2012).
- **Issue spotting:** LLMs can identify key contractual provisions, flag inconsistencies between witness accounts and contemporaneous documents, and surface documents responsive to Redfern Schedule requests.
- **Translation:** AI translation tools (with human verification) facilitate multilingual proceedings.

AI document review does not replace legal review — counsel remains responsible for all production decisions and bears professional responsibility for completeness and privilege calls.

## Conflict of Interest Screening

Arbitrators have a duty of disclosure under the **IBA Guidelines on Conflicts of Interest in International Arbitration (2014, updated 2024)**. The Guidelines use a traffic-light system: Red List (non-waivable and waivable conflicts), Orange List (disclosable relationships), and Green List (no disclosure required).

AI tools can assist by cross-referencing arbitrator profiles, law firm relationships, corporate ownership structures, and prior appointments against the parties, their counsel, and related entities. This accelerates the disclosure process. However, the final duty of disclosure rests with the arbitrator personally — AI screening is a starting point, not a substitute.

## Predictive Analytics

AI systems trained on historical arbitration data can generate indicative outputs on:
- Expected case duration by case type, institution, and number of arbitrators
- Estimated award quantum ranges by dispute category and jurisdiction
- Procedural delay risk factors

**Important caveat:** Predictive tools reflect patterns in historical datasets, which may embed systemic biases (e.g., over-representation of certain seats or dispute types). Predictions are statistical probabilities, not legal advice, and must not be used as the basis for legal decisions without qualified legal analysis.

## The Prague Rules: An Alternative Evidence Approach

The **Rules on the Efficient Conduct of Proceedings in International Arbitration ("Prague Rules", 2018)** offer a civil-law-oriented alternative to the IBA Rules on Taking of Evidence. The Prague Rules favour:
- Tribunal-led fact-finding (Art. 4) rather than party-driven document production
- Limitation of witness and expert evidence
- Preference for documentary evidence over witness testimony

Some parties (particularly those from civil law jurisdictions) incorporate the Prague Rules as an alternative to the more common IBA Evidence Rules.

## Ethical and Regulatory Framework for AI in Arbitration

There is no single binding international instrument regulating AI in dispute resolution as of 2024. However, the following instruments and guidance are relevant:

- **ICCA-IBA Roadmap to Data Protection in International Arbitration (2020):** Addresses personal data handling, GDPR compliance, and data localisation in arbitration.
- **EU AI Act (Regulation (EU) 2024/1689, in force August 2024):** Classifies AI systems used in the administration of justice as "high-risk" (Annex III). Providers of such systems must comply with transparency, accuracy, and human oversight requirements. While primarily applying to EU member states, this standard is being adopted by reference globally.
- **IBA Technology Committee Guidance (ongoing):** The IBA issues periodic guidance on e-disclosure, cybersecurity in arbitration, and AI tool transparency.

Tribunals increasingly require parties to disclose if AI tools were used in drafting submissions or in the production process, consistent with the general duty of good faith and the right of the other party to understand and challenge the evidence.

## Firm Limitations of AI in Arbitration

- **AI cannot make legal judgements.** Determining the weight of evidence, assessing credibility, and applying legal standards to facts require human legal reasoning and accountability.
- **AI hallucination is a real and documented risk.** LLMs can generate plausible-sounding but false legal citations, non-existent cases, and incorrect statutory provisions. All AI-generated legal content must be verified against primary sources before use in proceedings.
- **AI cannot bear professional responsibility.** Counsel and arbitrators are personally responsible for the accuracy of their work product. Reliance on AI does not diminish this responsibility.
- **Cultural and contextual nuance.** Oral hearings involve credibility assessment, cultural context, and real-time legal argument that AI tools cannot reliably interpret.
- **Data security.** Submitting confidential case materials to external AI platforms raises confidentiality and data protection concerns. Parties should use platforms that offer data processing agreements and on-premises or private-cloud processing options where possible.`,
  },
];

const STORAGE_KEYS = {
  certified: 'arb_training_certified_v2',  // { moduleId: { score, date } }
  aiModules: 'arb_ai_modules_v2',           // array of AI-generated modules
};

const levelColor  = { Beginner: 'success', Intermediate: 'warning', Advanced: 'error' };
const PASS_SCORE  = 70;   // percent to pass
const EXAM_LENGTH = 10;   // questions per exam

const diffLabel = (d) => ['', 'Basic', 'Foundational', 'Intermediate', 'Advanced', 'Expert'][d] || '';
const diffColor = (d) => ['', 'success', 'info', 'warning', 'error', 'error'][d] || 'default';

function DifficultyStars({ level }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
      {[1,2,3,4,5].map(i =>
        i <= level
          ? <StarIcon key={i} sx={{ fontSize: 14, color: 'warning.main' }} />
          : <StarBorderIcon key={i} sx={{ fontSize: 14, color: 'text.disabled' }} />
      )}
    </Box>
  );
}

// ─── Module content renderer (parses markdown-style headings, bullets, bold) ──
function renderInline(text) {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function ModuleContent({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let bulletBuffer = [];

  const flushBullets = (key) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <List key={`bullets-${key}`} dense disablePadding sx={{ mb: 1.5 }}>
        {bulletBuffer.map((b, i) => (
          <ListItem key={i} sx={{ pl: 0, py: 0.25, alignItems: 'flex-start' }}>
            <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }} />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body1" sx={{ lineHeight: 1.75 }}>{renderInline(b)}</Typography>} />
          </ListItem>
        ))}
      </List>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) { flushBullets(idx); return; }

    if (trimmed.startsWith('### ')) {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 0.75, color: 'primary.main' }}>
          {trimmed.slice(4)}
        </Typography>
      );
    } else if (trimmed.startsWith('## ')) {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="h6" fontWeight={700} sx={{ mt: 3.5, mb: 1, borderBottom: '2px solid', borderColor: 'primary.light', pb: 0.5 }}>
          {trimmed.slice(3)}
        </Typography>
      );
    } else if (trimmed.startsWith('# ')) {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="h5" fontWeight={800} sx={{ mt: 2, mb: 1.5 }}>
          {trimmed.slice(2)}
        </Typography>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      bulletBuffer.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      bulletBuffer.push(trimmed.replace(/^\d+\.\s/, ''));
    } else {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="body1" sx={{ mb: 1.5, lineHeight: 1.85 }}>
          {renderInline(trimmed)}
        </Typography>
      );
    }
  });
  flushBullets('end');

  return <Box>{elements}</Box>;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Training = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'admin';

  // Persisted state
  const [certified, setCertified] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.certified) || '{}'); } catch { return {}; }
  });
  const [aiModules, setAiModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.aiModules) || '[]'); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.certified, JSON.stringify(certified)); }, [certified]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.aiModules, JSON.stringify(aiModules)); }, [aiModules]);

  const allModules = [...BASE_MODULES, ...aiModules];

  // View state
  const [view, setView] = useState('list'); // 'list' | 'learn' | 'exam' | 'result'
  const [activeModule, setActiveModule] = useState(null);

  // Exam state
  const [examAnswers, setExamAnswers] = useState([]); // [{ questionId, correct, difficulty, topic }]
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState(3);

  // Admin - module generation
  const [genOpen, setGenOpen] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genLevel, setGenLevel] = useState('Beginner');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingSuggestions, setTrendingSuggestions] = useState([]);

  // Certificate dialog
  const [certModule, setCertModule] = useState(null);

  // ─── Computed ───────────────────────────────────────────────────────────────
  const certifiedIds = Object.keys(certified);
  const passedCount  = certifiedIds.filter(id => allModules.find(m => m.id === id)).length;
  const totalCount   = allModules.length;
  const overallPct   = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const allPassed    = passedCount === totalCount && totalCount > 0;

  // ─── Admin: Generate module ─────────────────────────────────────────────────
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');

  const handleGenerateModule = async (topic) => {
    setGenLoading(true);
    setGenError(null);
    setGenProgress(0);
    setGenStage('Submitting request…');
    try {
      const res = await apiService.generateTrainingModule(topic || genTopic, genLevel);
      const { jobId } = res.data;

      // Animated progress while polling
      const stages = [
        [10, 'Drafting introduction and legal framework…'],
        [25, 'Defining key concepts…'],
        [40, 'Writing core principles…'],
        [55, 'Building case studies…'],
        [68, 'Analysing challenges…'],
        [80, 'Compiling best practices…'],
        [90, 'Finalising and formatting…'],
      ];
      let stageIdx = 0;
      const progressTimer = setInterval(() => {
        if (stageIdx < stages.length) {
          setGenProgress(stages[stageIdx][0]);
          setGenStage(stages[stageIdx][1]);
          stageIdx++;
        }
      }, 6000);

      // Poll for result
      let mod = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await apiService.getModuleJobStatus(jobId);
        const job = statusRes.data;
        if (job.status === 'done') { mod = job.module; break; }
        if (job.status === 'error') throw new Error(job.error || 'Generation failed');
      }
      clearInterval(progressTimer);
      if (!mod) throw new Error('Generation timed out. Please try again.');

      setGenProgress(100);
      setGenStage('Module ready!');
      await new Promise(r => setTimeout(r, 600));

      setAiModules(prev => [mod, ...prev]);
      setGenOpen(false);
      setGenTopic('');
      setGenProgress(0);
      setGenStage('');
      setTrendingSuggestions([]);
    } catch (err) {
      setGenError(err.response?.data?.error || err.message || t('Failed to generate module. Try again.'));
      setGenProgress(0);
      setGenStage('');
    } finally {
      setGenLoading(false);
    }
  };

  const handleGetTrending = async () => {
    setTrendingLoading(true);
    setTrendingSuggestions([]);
    setGenError(null);
    try {
      const res = await apiService.getTrendingTopics();
      setTrendingSuggestions(res.data.topics || []);
    } catch {
      setGenError(t('Could not fetch trending topics.'));
    } finally {
      setTrendingLoading(false);
    }
  };

  const removeAiModule = (id) => {
    setAiModules(prev => prev.filter(m => m.id !== id));
  };

  // ─── Exam logic ─────────────────────────────────────────────────────────────
  const fetchNextQuestion = useCallback(async (mod, answers, difficulty) => {
    setQuestionLoading(true);
    setQuestionError(null);
    setSelectedAnswer(null);
    setAnswered(false);
    try {
      const coveredTopics = answers.map(a => a.topic).filter(Boolean);
      const res = await apiService.getExamQuestion({
        moduleTitle: mod.title,
        moduleTopics: mod.topics || [],
        difficulty,
        coveredTopics,
      });
      setCurrentQuestion(res.data.question);
    } catch (err) {
      setQuestionError(t('Failed to load question. Please try again.'));
    } finally {
      setQuestionLoading(false);
    }
  }, [t]);

  const startExam = (mod) => {
    setActiveModule(mod);
    setExamAnswers([]);
    setCurrentDifficulty(3);
    setCurrentQuestion(null);
    setExamResult(null);
    setView('exam');
    fetchNextQuestion(mod, [], 3);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;
    const correct = selectedAnswer === currentQuestion.correctIndex;
    setAnswered(true);
    const newAnswer = {
      questionId: currentQuestion.questionId,
      correct,
      difficulty: currentQuestion.difficulty,
      topic: currentQuestion.topic,
      questionText: currentQuestion.text,
      selectedIndex: selectedAnswer,
      correctIndex: currentQuestion.correctIndex,
      explanation: currentQuestion.explanation,
    };
    setExamAnswers(prev => [...prev, newAnswer]);

    // Adaptive: adjust difficulty
    const newDifficulty = correct
      ? Math.min(5, currentQuestion.difficulty + 1)
      : Math.max(1, currentQuestion.difficulty - 1);
    setCurrentDifficulty(newDifficulty);
  };

  const nextQuestion = () => {
    const newAnswers = [...examAnswers];
    // Already appended in submitAnswer; recalculate from state
    if (newAnswers.length >= EXAM_LENGTH) {
      finishExam(newAnswers);
    } else {
      fetchNextQuestion(activeModule, newAnswers, currentDifficulty);
    }
  };

  const finishExam = (answers) => {
    // Weighted score: correct at difficulty D earns D points; max = sum of all difficulties if all correct
    const earned = answers.reduce((sum, a) => sum + (a.correct ? a.difficulty : 0), 0);
    const maxPossible = answers.reduce((sum, a) => sum + a.difficulty, 0);
    const score = maxPossible > 0 ? Math.round((earned / maxPossible) * 100) : 0;
    const passed = score >= PASS_SCORE;
    const result = { score, passed, answers };
    setExamResult(result);

    if (passed) {
      setCertified(prev => ({
        ...prev,
        [activeModule.id]: { score, date: new Date().toISOString() },
      }));
    }
    setView('result');
  };

  // Check if submitAnswer has been called and exam is full
  useEffect(() => {
    if (answered && examAnswers.length === EXAM_LENGTH) {
      // slight delay to let user see the last answer feedback
      const timer = setTimeout(() => finishExam(examAnswers), 1500);
      return () => clearTimeout(timer);
    }
  }, [answered, examAnswers]); // eslint-disable-line

  // ─── Views ──────────────────────────────────────────────────────────────────

  // MODULE LIST
  if (view === 'list') return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">{t('Training & Certification')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('Study each module then pass the adaptive AI exam to earn your certificate.')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {allPassed && (
            <Button variant="contained" color="success" startIcon={<CertIcon />} onClick={() => setCertModule('all')}>
              {t('Full Certificate')}
            </Button>
          )}
          {isAdmin && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setGenOpen(true); setTrendingSuggestions([]); setGenError(null); }}>
              {t('New Module')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Overall progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{t('Overall Progress')}</Typography>
          <Typography variant="body2" fontWeight={600}>{passedCount} / {totalCount} {t('certified')}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={overallPct} sx={{ height: 8, borderRadius: 4 }} color={allPassed ? 'success' : 'primary'} />
      </Paper>

      {/* Module cards */}
      <Grid container spacing={3}>
        {allModules.map((mod) => {
          const cert = certified[mod.id];
          return (
            <Grid item xs={12} md={6} key={mod.id}>
              <Card variant={cert ? 'outlined' : 'elevation'} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: cert ? 'success.main' : undefined }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, pr: 1, fontSize: '1rem' }}>{mod.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                      {cert
                        ? <Chip label={`${cert.score}% ✓`} size="small" color="success" icon={<VerifiedIcon />} />
                        : <Chip label={mod.level} size="small" color={levelColor[mod.level]} variant="outlined" />
                      }
                      {mod.aiGenerated && <Chip label="AI" size="small" color="secondary" icon={<AIIcon />} variant="outlined" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{mod.description}</Typography>
                  <Chip label={mod.duration} size="small" variant="outlined" icon={<SchoolIcon />} />
                </CardContent>
                <CardActions sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                  <Button size="small" startIcon={<StartIcon />} onClick={() => { setActiveModule(mod); setView('learn'); }}>
                    {cert ? t('Review') : t('Study')}
                  </Button>
                  <Button
                    size="small"
                    variant={cert ? 'outlined' : 'contained'}
                    color={cert ? 'success' : 'primary'}
                    startIcon={cert ? <RetakeIcon /> : <QuizIcon />}
                    onClick={() => startExam(mod)}
                  >
                    {cert ? t('Retake Exam') : t('Take Exam')}
                  </Button>
                  {cert && (
                    <Button size="small" startIcon={<CertIcon />} color="success" onClick={() => setCertModule(mod)}>
                      {t('Certificate')}
                    </Button>
                  )}
                  {isAdmin && mod.aiGenerated && (
                    <Tooltip title={t('Remove AI module')}>
                      <IconButton size="small" color="error" onClick={() => removeAiModule(mod.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Admin: Generate Module Dialog */}
      <Dialog open={genOpen} onClose={() => { setGenOpen(false); setTrendingSuggestions([]); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="secondary" />
            {t('Generate AI Training Module')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {genError && <Alert severity="error">{genError}</Alert>}
          {genLoading && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{genStage}</Typography>
                <Typography variant="caption" color="text.secondary">{genProgress}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={genProgress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}
          <TextField
            label={t('Module Topic')}
            value={genTopic}
            onChange={e => setGenTopic(e.target.value)}
            placeholder={t('e.g. Third-Party Funding in International Arbitration')}
            fullWidth
            onKeyDown={e => e.key === 'Enter' && !genLoading && genTopic.trim() && handleGenerateModule()}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{t('Difficulty Level')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                <Chip
                  key={lvl}
                  label={lvl}
                  clickable
                  onClick={() => setGenLevel(lvl)}
                  color={genLevel === lvl ? levelColor[lvl] : 'default'}
                  variant={genLevel === lvl ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={trendingLoading ? <CircularProgress size={16} /> : <TrendingIcon />}
            onClick={handleGetTrending}
            disabled={trendingLoading}
          >
            {t('Suggest Trending Topics')}
          </Button>
          {trendingSuggestions.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>{t('Click to select a topic:')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {trendingSuggestions.map((topic, i) => (
                  <Chip
                    key={i}
                    label={topic}
                    onClick={() => { setGenTopic(topic); setTrendingSuggestions([]); }}
                    variant="outlined"
                    color="secondary"
                    clickable
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenOpen(false)}>{t('Cancel')}</Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={genLoading ? <CircularProgress size={16} color="inherit" /> : <AIIcon />}
            onClick={() => handleGenerateModule()}
            disabled={genLoading || !genTopic.trim()}
          >
            {genLoading ? t('Generating…') : t('Generate Module')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Dialog */}
      <CertificateDialog
        open={!!certModule}
        onClose={() => setCertModule(null)}
        user={user}
        mod={certModule === 'all' ? null : certModule}
        allModules={allModules}
        certified={certified}
        t={t}
      />
    </Container>
  );

  // LEARN VIEW
  if (view === 'learn' && activeModule) return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<BackIcon />} onClick={() => setView('list')} sx={{ mb: 2 }}>{t('Back to Modules')}</Button>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{activeModule.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={activeModule.level} size="small" color={levelColor[activeModule.level]} />
              <Chip label={activeModule.duration} size="small" variant="outlined" icon={<SchoolIcon />} />
              {activeModule.aiGenerated && <Chip label="AI Generated" size="small" color="secondary" icon={<AIIcon />} />}
            </Box>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{activeModule.description}</Typography>

        <Divider sx={{ mb: 3 }} />

        {activeModule.content ? (
          <ModuleContent content={activeModule.content} />
        ) : (
          <>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Topics covered:')}</Typography>
            <List dense disablePadding>
              {activeModule.topics.map((topic, i) => (
                <ListItem key={i} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}><CheckIcon fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2">{topic}</Typography>} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<QuizIcon />} onClick={() => startExam(activeModule)}>
            {certified[activeModule.id] ? t('Retake Exam') : t('Take Exam')}
          </Button>
          <Button onClick={() => setView('list')}>{t('Back')}</Button>
        </Box>
      </Paper>
    </Container>
  );

  // EXAM VIEW
  if (view === 'exam' && activeModule) {
    const questionNumber = examAnswers.length + (answered ? 0 : 1);
    const examProgress = Math.round((examAnswers.length / EXAM_LENGTH) * 100);

    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => setView('list')} sx={{ mb: 2 }}>{t('Exit Exam')}</Button>

        <Paper sx={{ p: 4 }}>
          {/* Exam header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{activeModule.title} — {t('Adaptive Exam')}</Typography>
            <Chip label={`${examAnswers.length} / ${EXAM_LENGTH}`} size="small" variant="outlined" />
          </Box>
          <LinearProgress variant="determinate" value={examProgress} sx={{ height: 6, borderRadius: 3, mb: 3 }} />

          {questionLoading && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{t('Generating next question…')}</Typography>
            </Box>
          )}

          {questionError && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>{questionError}</Alert>
              <Button variant="contained" onClick={() => fetchNextQuestion(activeModule, examAnswers, currentDifficulty)}>
                {t('Retry')}
              </Button>
            </Box>
          )}

          {currentQuestion && !questionLoading && (
            <>
              {/* Difficulty indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DifficultyStars level={currentQuestion.difficulty} />
                <Chip label={diffLabel(currentQuestion.difficulty)} size="small" color={diffColor(currentQuestion.difficulty)} />
                <Typography variant="caption" color="text.secondary">— {t('Adaptive difficulty')}</Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 3, lineHeight: 1.5 }}>
                {currentQuestion.text}
              </Typography>

              <RadioGroup value={selectedAnswer !== null ? String(selectedAnswer) : ''} onChange={e => !answered && setSelectedAnswer(Number(e.target.value))}>
                {currentQuestion.options.map((opt, i) => {
                  let color = 'text.primary';
                  let bgcolor = 'transparent';
                  if (answered) {
                    if (i === currentQuestion.correctIndex) { color = 'success.main'; bgcolor = 'success.light'; }
                    else if (i === selectedAnswer) { color = 'error.main'; bgcolor = 'error.light'; }
                  }
                  return (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        mb: 1.5, p: 1.5, cursor: answered ? 'default' : 'pointer',
                        borderColor: answered && i === currentQuestion.correctIndex ? 'success.main'
                          : answered && i === selectedAnswer ? 'error.main' : 'divider',
                        bgcolor,
                        '&:hover': !answered ? { bgcolor: 'action.hover' } : {},
                        transition: 'all 0.2s',
                      }}
                      onClick={() => !answered && setSelectedAnswer(i)}
                    >
                      <FormControlLabel
                        value={String(i)}
                        control={<Radio size="small" />}
                        label={<Typography variant="body2" color={color}>{opt}</Typography>}
                        sx={{ m: 0, width: '100%', pointerEvents: 'none' }}
                      />
                    </Paper>
                  );
                })}
              </RadioGroup>

              {/* Answer feedback */}
              <Collapse in={answered}>
                <Alert
                  severity={selectedAnswer === currentQuestion.correctIndex ? 'success' : 'error'}
                  sx={{ mt: 2, mb: 1 }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {selectedAnswer === currentQuestion.correctIndex ? t('Correct!') : t('Incorrect')}
                  </Typography>
                  <Typography variant="body2">{currentQuestion.explanation}</Typography>
                </Alert>
                {examAnswers.length < EXAM_LENGTH && (
                  <Button variant="contained" endIcon={<NextIcon />} onClick={nextQuestion} sx={{ mt: 1 }}>
                    {examAnswers.length === EXAM_LENGTH - 1 ? t('Finish Exam') : t('Next Question')}
                  </Button>
                )}
              </Collapse>

              {!answered && (
                <Button
                  variant="contained"
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  sx={{ mt: 2 }}
                >
                  {t('Submit Answer')}
                </Button>
              )}
            </>
          )}
        </Paper>
      </Container>
    );
  }

  // RESULT VIEW
  if (view === 'result' && examResult) return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {examResult.passed
            ? <CertIcon sx={{ fontSize: 72, color: 'warning.main' }} />
            : <QuizIcon sx={{ fontSize: 72, color: 'text.secondary' }} />
          }
          <Typography variant="h4" fontWeight={700} color={examResult.passed ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
            {examResult.passed ? t('Passed!') : t('Not Passed')}
          </Typography>
          <Typography variant="h2" fontWeight={800} color={examResult.passed ? 'success.main' : 'error.main'}>
            {examResult.score}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Pass mark')}: {PASS_SCORE}% · {t('Exam')}: {activeModule?.title}
          </Typography>
        </Box>

        {examResult.passed && (
          <Alert severity="success" icon={<VerifiedIcon />} sx={{ mb: 3 }}>
            {t('Certificate earned for this module. You can view it from the module list.')}
          </Alert>
        )}
        {!examResult.passed && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t('Review the module content and retake the exam to earn your certificate.')}
          </Alert>
        )}

        {/* Answer review */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Question Review')}</Typography>
        {examResult.answers.map((a, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2, mb: 1, borderColor: a.correct ? 'success.light' : 'error.light' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ flexGrow: 1, pr: 2 }}>
                <strong>Q{i + 1}.</strong> {a.questionText}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                <Chip label={a.correct ? t('Correct') : t('Wrong')} size="small" color={a.correct ? 'success' : 'error'} />
                <DifficultyStars level={a.difficulty} />
              </Box>
            </Box>
            {!a.correct && a.explanation && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {a.explanation}
              </Typography>
            )}
          </Paper>
        ))}

        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<RetakeIcon />} onClick={() => startExam(activeModule)}>
            {t('Retake Exam')}
          </Button>
          <Button startIcon={<StartIcon />} onClick={() => { setActiveModule(activeModule); setView('learn'); }}>
            {t('Review Module')}
          </Button>
          <Button variant="contained" onClick={() => setView('list')}>
            {t('Back to Modules')}
          </Button>
          {examResult.passed && (
            <Button variant="contained" color="success" startIcon={<CertIcon />} onClick={() => setCertModule(activeModule)}>
              {t('View Certificate')}
            </Button>
          )}
        </Box>
      </Paper>

      <CertificateDialog
        open={!!certModule}
        onClose={() => setCertModule(null)}
        user={user}
        mod={certModule === 'all' ? null : certModule}
        allModules={allModules}
        certified={certified}
        t={t}
      />
    </Container>
  );

  return null;
};

// ─── Certificate Dialog ────────────────────────────────────────────────────────
function CertificateDialog({ open, onClose, user, mod, allModules, certified, t }) {
  const isAll = !mod;
  const certifiedModules = allModules.filter(m => certified[m.id]);
  const score = mod ? certified[mod.id]?.score : null;
  const date = mod
    ? (certified[mod.id]?.date ? new Date(certified[mod.id].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isAll ? t('Full Programme Certificate') : t('Module Certificate')}</DialogTitle>
      <DialogContent>
        <Box
          sx={{ textAlign: 'center', py: 5, px: 4, border: '3px double', borderColor: 'primary.main', borderRadius: 2 }}
          className="printable-certificate"
        >
          <CertIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {isAll ? t('Certificate of Completion') : t('Certificate of Achievement')}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>{t('This certifies that')}</Typography>
          <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
            {user?.firstName} {user?.lastName}
          </Typography>
          {isAll ? (
            <>
              <Typography variant="body1" color="text.secondary">
                {t('has successfully passed all')} {certifiedModules.length} {t('modules of the')}
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5, mb: 2 }}>
                Arbitration Platform Training Programme
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary">{t('has successfully passed the module')}</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mt: 0.5, mb: 1 }}>{mod?.title}</Typography>
              {score !== null && (
                <Chip label={`${score}% — ${t('Passed')}`} color="success" icon={<VerifiedIcon />} sx={{ mb: 2 }} />
              )}
            </>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">{t('Date of completion')}: {date}</Typography>
          {isAll && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              {certifiedModules.map(m => m.title).join(' · ')}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
        <Button variant="contained" startIcon={<CertIcon />} onClick={() => window.print()}>
          {t('Print / Save as PDF')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Training;
