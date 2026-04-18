export const AGREEMENT_SETUP_STORAGE_KEY = 'arbitration-platform-pending-agreement-setup';

export const createEmptyForm = () => ({
  // Case setup
  agreementSigned: false,
  // Case Details
  title: '',
  caseType: '',
  sector: '',
  disputeCategory: '',
  description: '',
  disputeAmount: '',
  currency: 'USD',
  status: 'active',
  // Parties
  claimantName: '',
  claimantOrg: '',
  claimantEmail: '',
  claimantPhone: '',
  claimantNationality: '',
  claimantAddress: '',
  claimantEntityType: 'corporation',
  respondentName: '',
  respondentOrg: '',
  respondentEmail: '',
  respondentPhone: '',
  respondentNationality: '',
  respondentAddress: '',
  respondentEntityType: 'corporation',
  // Procedural
  governingLaw: '',
  seatOfArbitration: '',
  arbitrationRules: '',
  languageOfProceedings: 'English',
  numArbitrators: '1',
  confidentialityLevel: 'confidential',
  thirdPartyFunding: false,
  responseDeadline: '',
  // Submission
  reliefSought: '',
  arbitratorNominee: '',
  nomineeQualifications: '',
  filingFee: '',
  filingFeeCurrency: 'KES',
  feeAcknowledged: false,
});

export const createEmptyAgreementDraft = () => ({
  effectiveDate: '',
  preamble: '',
  definitions: '',
  scope: '',
  governingRulesText: '',
  tribunalDetails: '',
  procedure: '',
  evidenceHearings: '',
  powers: '',
  confidentiality: '',
  awards: '',
  costs: '',
  enforcement: '',
  miscellaneous: '',
});

