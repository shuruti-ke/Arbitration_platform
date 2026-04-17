'use strict';

class LegalSourceRegistry {
  constructor() {
    this.sources = [
      {
        key: 'kenya_arbitration_act',
        title: 'Arbitration Act, Cap. 49',
        jurisdiction: 'Kenya',
        type: 'primary_law',
        consolidatedVersion: '31 December 2022',
        current: true,
        verifiedAt: '2026-04-17',
        referenceUrl: 'https://new.kenyalaw.org/akn/ke/act/1995/4/eng@2022-12-31',
        notes: [
          'Current consolidated Kenya Law version',
          'Covers form of arbitration agreement, tribunal composition, jurisdiction, award form, setting aside, and enforcement'
        ]
      },
      {
        key: 'ncia_arbitration_rules_2015',
        title: 'NCIA (Arbitration) Rules, 2015',
        jurisdiction: 'Kenya',
        type: 'institutional_rules',
        consolidatedVersion: '2015',
        current: true,
        verifiedAt: '2026-04-17',
        referenceUrl: 'https://ncia.or.ke',
        notes: [
          'Institutional filing and appointment support',
          'Used alongside the Arbitration Act, Cap. 49'
        ]
      },
      {
        key: 'new_york_convention',
        title: 'New York Convention',
        jurisdiction: 'International',
        type: 'treaty',
        consolidatedVersion: '1958',
        current: true,
        verifiedAt: '2026-04-17',
        referenceUrl: 'https://uncitral.un.org/en/texts/arbitration/conventions/foreign_arbitral_awards',
        notes: [
          'Recognition and enforcement framework for foreign arbitral awards'
        ]
      }
    ];
  }

  getCurrentSources() {
    return this.sources;
  }

  getPrimaryAct() {
    return this.sources.find((source) => source.key === 'kenya_arbitration_act') || null;
  }

  getCitationSummary() {
    const act = this.getPrimaryAct();
    if (!act) return 'Arbitration Act, Cap. 49';
    return `${act.title} (${act.consolidatedVersion})`;
  }

  validateCitation(text) {
    const value = String(text || '').toLowerCase();
    const act = this.getPrimaryAct();
    if (!value) {
      return {
        valid: false,
        reason: 'No citation provided.',
        expected: act ? act.title : 'Arbitration Act, Cap. 49'
      };
    }

    const hasCap49 = value.includes('cap. 49') || value.includes('cap 49');
    const hasKenyaAct = value.includes('arbitration act');
    const hasCurrentVersion = value.includes('31 december 2022') || value.includes('2022-12-31');

    return {
      valid: hasCap49 && hasKenyaAct,
      current: hasCap49 && hasKenyaAct && hasCurrentVersion,
      expected: act ? act.title : 'Arbitration Act, Cap. 49',
      needsVersionUpdate: hasCap49 && hasKenyaAct && !hasCurrentVersion,
      notes: hasCap49 && hasKenyaAct
        ? ['Citation name is acceptable.', 'Use the latest consolidated version date as a follow-up.']
        : ['Use the current consolidated Kenya Law citation: Arbitration Act, Cap. 49.']
    };
  }
}

module.exports = LegalSourceRegistry;
