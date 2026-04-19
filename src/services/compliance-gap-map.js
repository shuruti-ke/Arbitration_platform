'use strict';

class ComplianceGapMapService {
  constructor({ legalSourceRegistry, disclosureWorkflow } = {}) {
    this.legalSourceRegistry = legalSourceRegistry;
    this.disclosureWorkflow = disclosureWorkflow;
  }

  _gapItem(id, title, status, details, action, priority = 'medium') {
    return { id, title, status, details, action, priority };
  }

  getGapMap() {
    return {
      title: 'Arbitration Act Alignment Map',
      act: this.legalSourceRegistry?.getPrimaryAct?.() || null,
      lastReviewedAt: new Date().toISOString(),
      sections: [
        {
          title: 'Covered',
          items: [
            this._gapItem(
              'source-versioning',
              'Legal source provenance and versioning',
              'covered',
              'The platform now points to the current consolidated Arbitration Act, Cap. 49 version and keeps the legal source registry visible.',
              'Use the legal sources registry for all UI and AI citations.',
              'low'
            ),
            this._gapItem(
              'human-review-gate',
              'Human-review gate for legal conclusions',
              'covered',
              'AI outputs are treated as assistance only. The platform should not make final legal decisions without a human review step.',
              'Keep the review gate enabled for arbitrability, awards, and enforcement packs.',
              'high'
            ),
            this._gapItem(
              'citation-language',
              'Citation language',
              'covered',
              'User-facing references now say Arbitration Act, Cap. 49 instead of older shorthand.',
              'Keep this citation format consistent across the app.',
              'low'
            ),
            this._gapItem(
              'ai-final-conclusion',
              'AI is not the final legal decision-maker',
              'covered',
              'The AI layer is limited to summaries, analysis, and drafting support.',
              'Continue requiring tribunal and admin review before filings or awards are finalized.',
              'high'
            )
          ]
        },
        {
          title: 'Partial',
          items: [
            this._gapItem(
              'arbitrability-validation',
              'Formal legal validation for arbitrability',
              'partial',
              'The platform can flag missing details and obvious risk points, but it cannot replace a legal review of arbitrability under Kenyan law.',
              'Add a human confirmation step before a case is marked legally ready.',
              'high'
            ),
            this._gapItem(
              'award-workflow',
              'Signed-award workflow under section 32',
              'partial',
              'The platform can structure an award and collect signature metadata, but final award signing and delivery still need a production signing flow.',
              'Generate a section 32 award pack with reasons, seat, date, signatures, and delivery tracking.',
              'high'
            ),
            this._gapItem(
              'e-signature-flow',
              'Certificate-backed e-signature flow',
              'partial',
              'The platform has signing scaffolding, but production signing still needs a trusted signing provider or certificate-backed service.',
              'Route final award and service documents through a trusted signing provider before release.',
              'high'
            ),
            this._gapItem(
              'disclosure-challenge',
              'Disclosure, conflict, and challenge workflow',
              'partial',
              'Disclosure requests exist, but a full statutory challenge and replacement flow should be completed for production use.',
              'Expose challenge notices, responses, and replacement arbitrator tracking in the UI.',
              'medium'
            ),
            this._gapItem(
              'service-verification',
              'Proof of service verification',
              'partial',
              'The platform can generate and store proof-of-service PDFs, but it cannot independently verify that outside service actually happened.',
              'Keep upload and audit logs mandatory and require human confirmation before close-out.',
              'medium'
            )
          ]
        },
        {
          title: 'Still Needed',
          items: [
            this._gapItem(
              'court-pack',
              'Court-facing pack generation for setting aside and enforcement',
              'missing',
              'The platform does not yet generate a complete court pack for sections 35 to 37.',
              'Add export bundles for set-aside, recognition, and enforcement proceedings.',
              'high'
            )
          ]
        }
      ],
      sourceSummary: this.legalSourceRegistry?.getCurrentSources?.() || [],
      challengeSummary: this.disclosureWorkflow?.getAllChallenges?.() || [],
      recommendations: [
        'Keep the current consolidated Kenya Law citation visible in every legal-facing template.',
        'Require a human review before any legal-ready status is issued.',
        'Separate workflow support from final legal judgment and signing.'
      ]
    };
  }

  assessArbitrability(caseData = {}) {
    const redFlags = [];
    const missing = [];
    const caseType = String(caseData.caseType || '').toLowerCase();

    if (!caseData.title) missing.push('Case title');
    if (!caseData.description) missing.push('Dispute description');
    if (!caseData.governingLaw) missing.push('Governing law');
    if (!caseData.seatOfArbitration) missing.push('Seat of arbitration');
    if (!caseData.arbitrationRules) missing.push('Arbitration rules');
    if (!caseData.languageOfProceedings) missing.push('Language of proceedings');
    if (!caseData.claimantName || !caseData.respondentName) missing.push('Party names');
    if (!caseData.reliefSought) missing.push('Relief sought');
    if (!caseData.arbitratorNominee) missing.push('Arbitrator nominee');

    if (['criminal', 'family', 'succession'].includes(caseType)) {
      redFlags.push('The dispute may involve a non-arbitrable subject matter and should be reviewed by counsel.');
    }

    if (caseType === 'ip') {
      if (!caseData.ipSubtype) missing.push('IP dispute subtype (patent, trademark, copyright, trade secret)');
      if (!caseData.ipTechnicalField) missing.push('Technical field of the IP dispute');
      if (caseData.ipSubtype === 'trademark' && !caseData.ipTrademarkJurisdiction) {
        redFlags.push('Trademark validity disputes may not be arbitrable in all jurisdictions — confirm with local IP counsel before commencing.');
      }
      if (caseData.ipSubtype === 'patent') {
        redFlags.push('Patent validity challenges (invalidity counterclaims) may require review by the relevant patent office or court — confirm scope of arbitral jurisdiction with IP counsel.');
      }
      if (!caseData.arbitrationRules) {
        redFlags.push('IP disputes benefit from specialist rules — consider WIPO Arbitration Rules, SIAC, or ICC for cross-border IP matters.');
      }
      if (caseData.arbitrationRules === 'WIPO Rules' && !caseData.seatOfArbitration) {
        missing.push('Seat of arbitration (Geneva recommended for WIPO proceedings)');
      }
      if (caseData.ipRequiresInjunction) {
        redFlags.push('Injunctive relief in IP matters may require parallel court proceedings for interim protection — advise parties accordingly.');
      }
      if (caseData.ipTradeSecret) {
        redFlags.push('Trade secret cases require enhanced confidentiality protocols — ensure protective order provisions are included in the arbitration agreement.');
      }
    }

    const needsHumanReview = missing.length > 0 || redFlags.length > 0;

    return {
      needsHumanReview,
      missingFields: missing,
      redFlags,
      assessment: needsHumanReview
        ? 'The case should be reviewed by a human before it is marked legally ready.'
        : 'The case appears ready for a legal review, but final arbitrability remains a human decision.',
      legalCaution: 'This check supports case intake only. It does not replace legal advice or a tribunal determination.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ComplianceGapMapService;
