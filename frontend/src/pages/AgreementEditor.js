import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Autocomplete,
  Alert, Grid, Divider, Chip, Stack, LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  FolderOpen as FolderOpenIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { buildCaseAgreementPdf } from '../utils/caseAgreementPdf';
import { getRulePreset } from '../utils/ruleLibrary';
import {
  AGREEMENT_SETUP_STORAGE_KEY,
  createEmptyAgreementDraft,
  createEmptyForm,
} from '../utils/agreementFlow';

const readPendingAgreementSetup = () => {
  if (typeof window === 'undefined') return null;

  const fromStorage = window.sessionStorage.getItem(AGREEMENT_SETUP_STORAGE_KEY);
  if (!fromStorage) return null;

  try {
    return JSON.parse(fromStorage);
  } catch (error) {
    window.sessionStorage.removeItem(AGREEMENT_SETUP_STORAGE_KEY);
    return null;
  }
};

const SearchableField = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  helperText,
  fullWidth = true,
}) => {
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  return (
    <Autocomplete
      freeSolo
      options={options}
      fullWidth={fullWidth}
      inputValue={inputValue}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === 'reset') return;
        setInputValue(nextInputValue);
        onChange(nextInputValue);
      }}
      onChange={(_, nextValue) => {
        const next = typeof nextValue === 'string' ? nextValue : nextValue || '';
        setInputValue(next);
        onChange(next);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          fullWidth={fullWidth}
        />
      )}
    />
  );
};

const AgreementEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [form, setForm] = useState(createEmptyForm);
  const [agreementDraft, setAgreementDraft] = useState(createEmptyAgreementDraft);
  const [agreementFile, setAgreementFile] = useState(null);
  const [agreementAnalyzing, setAgreementAnalyzing] = useState(false);
  const [agreementError, setAgreementError] = useState(null);
  const [agreementAnalysis, setAgreementAnalysis] = useState(null);
  const [agreementMode, setAgreementMode] = useState('draft');
  const [agreementRecipients, setAgreementRecipients] = useState('');
  const [agreementEmailing, setAgreementEmailing] = useState(false);
  const [agreementEmailError, setAgreementEmailError] = useState(null);
  const [loadedFromCaseFlow, setLoadedFromCaseFlow] = useState(false);
  const [summaryUploads, setSummaryUploads] = useState({
    claimant: { file: null, fileName: '', analyzing: false, error: null, analysis: null },
    respondent: { file: null, fileName: '', analyzing: false, error: null, analysis: null },
  });

  const baseClauseTemplateOptions = useMemo(() => ({
    preamble: [
      'Standard dispute introduction',
      'Parties and contract background',
      'Escalation to arbitration wording',
      'Custom preamble',
    ],
    definitions: [
      'Concise definitions pack',
      'Expanded interpretation section',
      'Technology and evidence terms',
      'Custom definitions',
    ],
    scope: [
      'Broad commercial dispute scope',
      'Clause-limited scope',
      'Counterclaim-inclusive scope',
      'Custom scope language',
    ],
    governingRulesText: [
      'Kenya Act + institutional rules',
      'NCIA-led procedure',
      'Ad hoc procedure under the Act',
      'Custom rules language',
    ],
    tribunalDetails: [
      'Sole arbitrator setup',
      'Three-member tribunal setup',
      'Party nomination language',
      'Custom tribunal details',
    ],
    procedure: [
      'Streamlined written procedure',
      'Standard pleadings and timetable',
      'Conference-led procedure',
      'Custom procedure',
    ],
    evidenceHearings: [
      'Document-first hearing process',
      'Virtual hearing process',
      'Witness and expert protocol',
      'Custom evidence and hearing clause',
    ],
    powers: [
      'Standard arbitrator powers',
      'Case-management powers',
      'Evidence-control powers',
      'Custom powers wording',
    ],
    confidentiality: [
      'Strong confidentiality clause',
      'Balanced confidentiality clause',
      'Protective measures clause',
      'Custom confidentiality clause',
    ],
    awards: [
      'Reasoned award clause',
      'Short-form award clause',
      'Partial award language',
      'Custom award clause',
    ],
    costs: [
      'Equal cost sharing',
      'Costs follow the event',
      'Tribunal discretion on costs',
      'Custom costs clause',
    ],
    enforcement: [
      'Standard enforcement wording',
      'Court confirmation wording',
      'NY Convention-friendly wording',
      'Custom enforcement clause',
    ],
    miscellaneous: [
      'Standard boilerplate bundle',
      'Notice and amendment package',
      'Severability and waiver package',
      'Custom miscellaneous wording',
    ],
  }), []);

  const ruleAwareClauseTemplates = useMemo(() => ({
    'NCIA Rules': {
      governingRulesText: [
        'NCIA filing and appointment wording',
        'NCIA case-management wording',
        'NCIA directions and timetable wording',
        'Custom NCIA wording',
      ],
      tribunalDetails: [
        'NCIA appointment wording',
        'NCIA sole arbitrator wording',
        'NCIA three-member tribunal wording',
        'Custom NCIA tribunal details',
      ],
      procedure: [
        'NCIA filing and response schedule',
        'NCIA prehearing conference wording',
        'NCIA procedural directions wording',
        'Custom NCIA procedure',
      ],
      evidenceHearings: [
        'NCIA evidence and hearing wording',
        'NCIA virtual hearing wording',
        'NCIA witness and expert wording',
        'Custom NCIA evidence clause',
      ],
      powers: [
        'NCIA tribunal powers wording',
        'NCIA case-management powers',
        'NCIA evidence-control powers',
        'Custom NCIA powers wording',
      ],
      costs: [
        'NCIA fees and costs wording',
        'NCIA tribunal discretion on costs',
        'NCIA equal sharing wording',
        'Custom NCIA costs clause',
      ],
      enforcement: [
        'NCIA award enforcement wording',
        'Court recognition wording',
        'NY Convention-friendly wording',
        'Custom NCIA enforcement clause',
      ],
      miscellaneous: [
        'NCIA notices and directions package',
        'NCIA amendment and waiver package',
        'NCIA confidentiality addendum',
        'Custom NCIA miscellaneous wording',
      ],
    },
    'Ad Hoc': {
      governingRulesText: [
        'Ad hoc procedure wording',
        'Party-agreed procedure wording',
        'Tribunal-managed procedure wording',
        'Custom ad hoc wording',
      ],
      tribunalDetails: [
        'Party-appointed tribunal wording',
        'Sole arbitrator ad hoc wording',
        'Three-member ad hoc wording',
        'Custom ad hoc tribunal details',
      ],
      procedure: [
        'Ad hoc timetable wording',
        'Party-agreed procedure wording',
        'Tribunal directions wording',
        'Custom ad hoc procedure',
      ],
      evidenceHearings: [
        'Ad hoc evidence and hearing wording',
        'Virtual hearing wording',
        'Witness and expert wording',
        'Custom ad hoc evidence clause',
      ],
      powers: [
        'Ad hoc arbitrator powers wording',
        'Case-management powers',
        'Evidence-control powers',
        'Custom ad hoc powers wording',
      ],
      costs: [
        'Ad hoc costs wording',
        'Tribunal discretion on costs',
        'Equal sharing wording',
        'Custom ad hoc costs clause',
      ],
      enforcement: [
        'Ad hoc enforcement wording',
        'Court recognition wording',
        'NY Convention-friendly wording',
        'Custom ad hoc enforcement clause',
      ],
      miscellaneous: [
        'Ad hoc notices and amendments',
        'Ad hoc waiver package',
        'Ad hoc severability package',
        'Custom ad hoc miscellaneous wording',
      ],
    },
  }), []);

  const clauseTemplateOptions = useMemo(() => {
    const selectedRules = ruleAwareClauseTemplates[form.arbitrationRules] || {};
    return Object.keys(baseClauseTemplateOptions).reduce((acc, fieldKey) => {
      acc[fieldKey] = selectedRules[fieldKey] || baseClauseTemplateOptions[fieldKey];
      return acc;
    }, {});
  }, [baseClauseTemplateOptions, form.arbitrationRules, ruleAwareClauseTemplates]);

  const clauseTemplateLibrary = useMemo(() => ({
    preamble: {
      'Standard dispute introduction': 'This Arbitration Agreement is entered into between the parties for the fair and final resolution of disputes arising from or connected to the underlying contract.',
      'Parties and contract background': 'The parties have a commercial relationship under the relevant contract and agree that disputes under that contract will be resolved by arbitration.',
      'Escalation to arbitration wording': 'Any dispute that cannot be resolved through good-faith discussion will be referred to arbitration under this agreement.',
      'Custom preamble': '',
    },
    definitions: {
      'Concise definitions pack': 'Key terms in this agreement include the parties, the contract, the tribunal, the seat, the rules, the claim, the response, and the award.',
      'Expanded interpretation section': 'In this agreement, defined terms are used for clarity and consistency. Singular includes plural, headings are for convenience only, and references to the arbitrator include the tribunal where applicable.',
      'Technology and evidence terms': 'Electronic communications, uploaded documents, virtual hearing tools, and electronic signatures are treated as valid procedural tools for this arbitration, subject to tribunal direction and applicable law.',
      'Custom definitions': '',
    },
    scope: {
      'Broad commercial dispute scope': 'This agreement covers all disputes, claims, counterclaims, and related issues arising out of or connected with the contract, its performance, termination, or validity.',
      'Clause-limited scope': 'This agreement applies only to the disputes expressly described by the parties in the filing record and any closely connected procedural matters.',
      'Counterclaim-inclusive scope': 'The arbitration covers the principal claim, any counterclaim, and any relief that is reasonably connected to the same facts or transaction.',
      'Custom scope language': '',
    },
    governingRulesText: {
      'Kenya Act + institutional rules': 'The arbitration shall be conducted under the Arbitration Act, Cap. 49, together with the selected institutional rules and any procedural directions issued by the tribunal.',
      'NCIA-led procedure': 'The arbitration shall proceed under the NCIA Rules and the Arbitration Act, Cap. 49, with case management and appointment steps handled in accordance with those rules.',
      'Ad hoc procedure under the Act': 'The arbitration shall proceed as an ad hoc arbitration under the Arbitration Act, Cap. 49, with the parties and tribunal agreeing the procedure in writing.',
      'Custom rules language': '',
    },
    tribunalDetails: {
      'Sole arbitrator setup': 'The dispute shall be heard by one arbitrator appointed in the manner agreed by the parties or directed by the tribunal process.',
      'Three-member tribunal setup': 'The dispute shall be heard by three arbitrators, with one appointed by each party and the presiding arbitrator appointed in the agreed manner.',
      'Party nomination language': 'Each party may nominate an arbitrator, and the nominated arbitrators shall work toward appointing the presiding arbitrator according to the agreed process.',
      'Custom tribunal details': '',
    },
    procedure: {
      'Streamlined written procedure': 'The tribunal may begin with written statements, a short timetable, and limited procedural hearings to keep the case efficient and proportionate.',
      'Standard pleadings and timetable': 'The tribunal shall set a timetable for the statement of claim, response, reply, and any further pleadings or directions it considers necessary.',
      'Conference-led procedure': 'The parties and tribunal shall hold a prehearing conference to agree the timetable, exchange of documents, hearing format, and any other procedural matters.',
      'Custom procedure': '',
    },
    evidenceHearings: {
      'Document-first hearing process': 'The parties shall exchange documents in advance, and the tribunal may decide the matter largely on the written record with hearings only where needed.',
      'Virtual hearing process': 'Hearings may be conducted virtually, with the tribunal deciding the platform, access protocol, and any recording or confidentiality safeguards.',
      'Witness and expert protocol': 'The parties shall identify witnesses and experts in advance, exchange statements where ordered, and present oral evidence only as permitted by the tribunal.',
      'Custom evidence and hearing clause': '',
    },
    powers: {
      'Standard arbitrator powers': 'The arbitrator may issue procedural directions, manage the timetable, determine the admissibility of evidence, and take any other step allowed by law or the agreed rules.',
      'Case-management powers': 'The arbitrator may control the procedure, limit unnecessary steps, protect fairness, and make directions to keep the case efficient.',
      'Evidence-control powers': 'The arbitrator may decide how evidence is exchanged, whether witnesses are heard, and what evidence is necessary for a fair outcome.',
      'Custom powers wording': '',
    },
    confidentiality: {
      'Strong confidentiality clause': 'All non-public information, filings, evidence, hearing records, and award materials shall remain confidential except where disclosure is required by law or enforcement.',
      'Balanced confidentiality clause': 'The parties shall keep the arbitration private and shall not disclose the contents of the proceedings except for enforcement, legal advice, or as required by law.',
      'Protective measures clause': 'The tribunal may order protective measures, redactions, confidentiality rings, or other safeguards to protect sensitive information.',
      'Custom confidentiality clause': '',
    },
    awards: {
      'Reasoned award clause': 'The arbitrator shall issue a written award with reasons unless the parties agree in writing that reasons are unnecessary.',
      'Short-form award clause': 'The parties agree that the award may be delivered in short form if the tribunal considers that appropriate for the dispute.',
      'Partial award language': 'The tribunal may issue partial, interim, or final awards where necessary to manage the dispute fairly and efficiently.',
      'Custom award clause': '',
    },
    costs: {
      'Equal cost sharing': 'The parties shall share arbitration costs equally unless the tribunal orders a different allocation in the award.',
      'Costs follow the event': 'The tribunal may order costs to follow the event, subject to the conduct of the parties and the circumstances of the case.',
      'Tribunal discretion on costs': 'The arbitrator may allocate filing fees, tribunal fees, legal costs, and other expenses in the manner considered fair and reasonable.',
      'Custom costs clause': '',
    },
    enforcement: {
      'Standard enforcement wording': 'The parties agree that any award may be enforced in any court of competent jurisdiction in accordance with applicable law.',
      'Court confirmation wording': 'The prevailing party may seek recognition, confirmation, or enforcement of the award in a competent court as permitted by law.',
      'NY Convention-friendly wording': 'Where applicable, the parties may rely on the New York Convention and any local enforcement law to recognize or enforce the award.',
      'Custom enforcement clause': '',
    },
    miscellaneous: {
      'Standard boilerplate bundle': 'This agreement contains the entire understanding of the parties, may be amended only in writing, and remains binding despite any invalid term that can be severed.',
      'Notice and amendment package': 'Notices, amendments, and other communications under this agreement shall be in writing and sent to the addresses or emails recorded by the parties.',
      'Severability and waiver package': 'If any provision of this agreement is invalid or unenforceable, the remaining provisions shall continue in force, and failure to enforce one right is not a waiver of that right.',
      'Custom miscellaneous wording': '',
    },
  }), []);

  const preferredClauseTemplatesByRule = useMemo(() => ({
    'NCIA Rules': {
      governingRulesText: 'NCIA filing and appointment wording',
      tribunalDetails: 'NCIA appointment wording',
      procedure: 'NCIA prehearing conference wording',
      evidenceHearings: 'NCIA evidence and hearing wording',
      powers: 'NCIA tribunal powers wording',
      costs: 'NCIA fees and costs wording',
      enforcement: 'NCIA award enforcement wording',
      miscellaneous: 'NCIA notices and directions package',
    },
    'Ad Hoc': {
      governingRulesText: 'Ad hoc procedure wording',
      tribunalDetails: 'Party-appointed tribunal wording',
      procedure: 'Ad hoc timetable wording',
      evidenceHearings: 'Ad hoc evidence and hearing wording',
      powers: 'Ad hoc arbitrator powers wording',
      costs: 'Ad hoc costs wording',
      enforcement: 'Ad hoc enforcement wording',
      miscellaneous: 'Ad hoc notices and amendments',
    },
  }), []);

  const arbitratorOptions = useMemo(() => ([
    'James Otieno',
    'To be appointed',
    'Sole Arbitrator',
    'Three-Member Tribunal',
    'Presiding Arbitrator',
    'Party Nominated Arbitrator',
  ]), []);

  const seatOptions = useMemo(() => ([
    'Nairobi, Kenya',
    'Mombasa, Kenya',
    'Kisumu, Kenya',
    'Nakuru, Kenya',
    'Eldoret, Kenya',
    'Remote / Virtual',
    'London, United Kingdom',
    'Paris, France',
    'Dubai, UAE',
    'Singapore',
  ]), []);

  const lawOptions = useMemo(() => ([
    'Laws of Kenya',
    'Arbitration Act, Cap. 49',
    'English Law',
    'New York Law',
    'South African Law',
    'Tanzanian Law',
    'Ugandan Law',
    'UAE Law',
  ]), []);

  const rulesOptions = useMemo(() => ([
    'Arbitration Act (Cap. 49)',
    'NCIA Rules',
    'KIAC Rules',
    'LCIA Rules',
    'ICC Rules',
    'SIAC Rules',
    'UNCITRAL Rules',
    'AAA Rules',
    'AFSA Rules',
    'LCA Rules',
    'CRCICA Rules',
    'Ad Hoc',
  ]), []);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const setValue = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const agreementField = (field) => (event) => {
    const value = event.target.value;
    setAgreementDraft((prev) => ({ ...prev, [field]: value }));
  };

  const applyClauseTemplate = (fieldKey, templateName) => {
    const preset = clauseTemplateLibrary[fieldKey]?.[templateName];
    if (preset === undefined) return;
    if (!preset) return;
    setAgreementDraft((prev) => ({ ...prev, [fieldKey]: preset }));
  };

  const applyRulePreset = (ruleName) => {
    const preset = getRulePreset(ruleName);
    if (!preset) return;

    setForm((prev) => ({
      ...prev,
      governingLaw: prev.governingLaw || preset.governingLaw || prev.governingLaw,
    }));

    setAgreementDraft((prev) => ({
      ...prev,
      governingRulesText: prev.governingRulesText || preset.governingRulesText || '',
      tribunalDetails: prev.tribunalDetails || preset.tribunalDetails || '',
      procedure: prev.procedure || preset.procedure || '',
      evidenceHearings: prev.evidenceHearings || preset.evidenceHearings || '',
      powers: prev.powers || preset.powers || '',
      costs: prev.costs || preset.costs || '',
      enforcement: prev.enforcement || preset.enforcement || '',
    }));
  };

  const agreementFields = useMemo(() => ([
    { key: 'effectiveDate', label: t('Effective Date'), rows: 1, inputType: 'date', placeholder: t('Date the parties and arbitrator agreed to this draft') },
    { key: 'preamble', label: t('1. Preamble / Introduction'), rows: 4, placeholder: t('Introduce the dispute, the parties, and why arbitration is being used') },
    { key: 'definitions', label: t('2. Definitions and Interpretation'), rows: 4, placeholder: t('Define key terms used throughout the agreement') },
    { key: 'scope', label: t('3. Scope of Arbitration'), rows: 4, placeholder: t('Describe the disputes, claims, and matters covered') },
    { key: 'governingRulesText', label: t('4. Governing Rules'), rows: 4, placeholder: t('State the governing arbitration rules and institutional framework') },
    { key: 'tribunalDetails', label: t('5. Arbitration Tribunal Details'), rows: 4, placeholder: t('Record the number of arbitrators, names, qualifications, and appointment method') },
    { key: 'procedure', label: t('6. Arbitration Procedure'), rows: 4, placeholder: t('Set out the procedure, timelines, filings, and hearing stages') },
    { key: 'evidenceHearings', label: t('7. Evidence and Hearings'), rows: 4, placeholder: t('Explain evidence exchange, hearing format, witness handling, and hearing location') },
    { key: 'powers', label: t('8. Powers of the Arbitrator'), rows: 4, placeholder: t('List the powers and discretion given to the arbitrator') },
    { key: 'confidentiality', label: t('9. Confidentiality'), rows: 4, placeholder: t('Record confidentiality and protective measures') },
    { key: 'awards', label: t('10. Awards'), rows: 4, placeholder: t('Describe how the award will be made, communicated, and binding effect') },
    { key: 'costs', label: t('11. Costs'), rows: 4, placeholder: t('Allocate filing fees, arbitrator fees, legal fees, and administrative costs') },
    { key: 'enforcement', label: t('12. Enforcement'), rows: 4, placeholder: t('State how the award may be enforced or confirmed') },
    { key: 'miscellaneous', label: t('13. Miscellaneous Provisions'), rows: 4, placeholder: t('Include waiver, amendments, binding effect, annexes, and notice details') },
  ]), [t]);

  const completedSections = agreementFields.filter((field) => String(agreementDraft[field.key] || '').trim().length > 0).length;
  const completionPercent = Math.round((completedSections / agreementFields.length) * 100);
  const draftModeLabel = agreementFile
    ? t('Signed agreement uploaded')
    : agreementMode === 'upload'
      ? t('Preparing upload')
      : t('Drafting mode');
  const templateModeLabel = form.arbitrationRules === 'NCIA Rules'
    ? t('NCIA drafting mode')
    : form.arbitrationRules === 'Ad Hoc'
      ? t('Ad hoc drafting mode')
      : t('General drafting mode');
  const nextClauseSection = agreementFields.find((field) => !String(agreementDraft[field.key] || '').trim()) || agreementFields[0];
  const suggestedClauseTemplateName = nextClauseSection
    ? preferredClauseTemplatesByRule[form.arbitrationRules]?.[nextClauseSection.key]
      || (clauseTemplateOptions[nextClauseSection.key] || []).find((option) => !/custom/i.test(option))
      || clauseTemplateOptions[nextClauseSection.key]?.[0]
      || null
    : null;
  const suggestedClauseText = nextClauseSection && suggestedClauseTemplateName
    ? clauseTemplateLibrary[nextClauseSection.key]?.[suggestedClauseTemplateName] || ''
    : '';
  const suggestedClauseReady = Boolean(nextClauseSection && suggestedClauseTemplateName && suggestedClauseText);

  const scrollToSection = (fieldKey) => {
    const element = document.getElementById(`agreement-${fieldKey}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const analyzeUploadedFile = async (file) => {
    const content = await fileToBase64(file);
    const response = await apiService.analyzeAgreement({
      documentName: file.name,
      content,
      mimeType: file.type,
    });
    return response.data?.extracted || null;
  };

  const applyAgreementAnalysis = (analysis) => {
    if (!analysis) return;
    setAgreementAnalysis(analysis);
    setForm((prev) => ({
      ...prev,
      title: prev.title || analysis.title || '',
      caseType: prev.caseType || analysis.caseType || '',
      sector: prev.sector || analysis.sector || '',
      disputeCategory: prev.disputeCategory || analysis.disputeCategory || '',
      description: prev.description || analysis.description || '',
      claimantName: prev.claimantName || analysis.claimantName || '',
      claimantOrg: prev.claimantOrg || analysis.claimantOrg || '',
      respondentName: prev.respondentName || analysis.respondentName || '',
      respondentOrg: prev.respondentOrg || analysis.respondentOrg || '',
      arbitratorNominee: prev.arbitratorNominee || analysis.arbitratorNominee || '',
      nomineeQualifications: prev.nomineeQualifications || analysis.nomineeQualifications || '',
      seatOfArbitration: prev.seatOfArbitration || analysis.seatOfArbitration || '',
      governingLaw: prev.governingLaw || analysis.governingLaw || '',
      arbitrationRules: prev.arbitrationRules || analysis.arbitrationRules || '',
      languageOfProceedings: prev.languageOfProceedings || analysis.languageOfProceedings || '',
      numArbitrators: String(prev.numArbitrators || analysis.numArbitrators || 1),
      confidentialityLevel: prev.confidentialityLevel || analysis.confidentialityLevel || '',
      reliefSought: prev.reliefSought || analysis.reliefSought || '',
    }));
    setAgreementDraft((prev) => ({
      ...prev,
      preamble: prev.preamble || analysis.summary || '',
      definitions: prev.definitions || (Array.isArray(analysis.keyTerms) && analysis.keyTerms.length > 0 ? `Key issues and terms: ${analysis.keyTerms.join(', ')}.` : ''),
      scope: prev.scope || analysis.description || '',
      governingRulesText: prev.governingRulesText || [analysis.governingLaw, analysis.arbitrationRules].filter(Boolean).join(' / '),
      tribunalDetails: prev.tribunalDetails || [analysis.arbitratorNominee, analysis.numArbitrators ? `${analysis.numArbitrators} arbitrator(s)` : ''].filter(Boolean).join(', '),
      procedure: prev.procedure || (Array.isArray(analysis.missingInfo) && analysis.missingInfo.length > 0 ? `Confirm the missing items noted by AI: ${analysis.missingInfo.join(', ')}.` : ''),
      evidenceHearings: prev.evidenceHearings || (Array.isArray(analysis.keyTerms) && analysis.keyTerms.length > 0 ? `Key issues raised in the uploaded summary: ${analysis.keyTerms.join(', ')}.` : ''),
    }));
  };

  const analyzeAgreementFile = async (file) => {
    if (!file) {
      setAgreementError(t('Please upload a signed agreement first.'));
      return;
    }

    setAgreementAnalyzing(true);
    setAgreementError(null);
    try {
      const analysis = await analyzeUploadedFile(file);
      if (analysis) {
        applyAgreementAnalysis(analysis);
      } else {
        setAgreementError(t('Agreement analysis could not extract structured details.'));
      }
    } catch (err) {
      setAgreementError(err.response?.data?.error || t('Agreement analysis failed.'));
    } finally {
      setAgreementAnalyzing(false);
    }
  };

  const handleAgreementFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAgreementFile(file);
    setAgreementError(null);
    if (file) {
      setAgreementMode('upload');
      analyzeAgreementFile(file);
    }
  };

  const handleSummaryFileChange = (party) => async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setSummaryUploads((prev) => ({
      ...prev,
      [party]: {
        ...prev[party],
        file,
        fileName: file.name,
        analyzing: true,
        error: null,
      },
    }));

    try {
      const analysis = await analyzeUploadedFile(file);
      if (!analysis) {
        throw new Error(t('Case summary analysis could not extract structured details.'));
      }

      applyAgreementAnalysis(analysis);
      setSummaryUploads((prev) => ({
        ...prev,
        [party]: {
          ...prev[party],
          file,
          fileName: file.name,
          analyzing: false,
          error: null,
          analysis,
        },
      }));
    } catch (err) {
      setSummaryUploads((prev) => ({
        ...prev,
        [party]: {
          ...prev[party],
          file,
          fileName: file.name,
          analyzing: false,
          error: err.response?.data?.error || err.message || t('Case summary analysis failed.'),
          analysis: null,
        },
      }));
    }
  };

  const handleGenerateAgreementTemplate = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    buildCaseAgreementPdf({
      pdf,
      caseData: {
        ...form,
        agreementDraft,
      },
      user: null,
    });
    const caseLabel = (form.title || 'arbitration-agreement').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    pdf.save(`${caseLabel}-agreement.pdf`);
  };

  const handleEmailAgreementTemplate = async () => {
    const recipients = agreementRecipients
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      setAgreementEmailError(t('Enter at least one recipient email address.'));
      return;
    }

    setAgreementEmailing(true);
    setAgreementEmailError(null);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      buildCaseAgreementPdf({
        pdf,
        caseData: {
          ...form,
          agreementDraft,
        },
        user: null,
      });
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const caseLabel = (form.title || 'arbitration-agreement').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      await apiService.shareAgreementTemplate({
        recipients,
        subject: `Agreement for signing: ${form.title || 'Arbitration Agreement'}`,
        message: 'Please review, sign, and return the attached arbitration agreement through the platform.',
        fileName: `${caseLabel}-agreement.pdf`,
        pdfBase64,
        caseData: {
          ...form,
          agreementDraft,
        },
      });
    } catch (err) {
      setAgreementEmailError(err.response?.data?.error || t('Could not email the agreement PDF.'));
    } finally {
      setAgreementEmailing(false);
    }
  };

  const saveAndContinue = () => {
    const payload = {
      form,
      agreementDraft,
      agreementAnalysis,
      caseSummaries: {
        claimant: {
          fileName: summaryUploads.claimant.fileName || null,
          analysis: summaryUploads.claimant.analysis || null,
        },
        respondent: {
          fileName: summaryUploads.respondent.fileName || null,
          analysis: summaryUploads.respondent.analysis || null,
        },
      },
      agreementRecipients,
      agreementMode,
      agreementSigned: !!agreementFile,
      agreementFileName: agreementFile?.name || null,
      preparedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AGREEMENT_SETUP_STORAGE_KEY, JSON.stringify(payload));
    }
    navigate('/cases', { state: { agreementSetup: payload } });
  };

  useEffect(() => {
    const pending = location.state?.agreementSetup || readPendingAgreementSetup();
    if (!pending) return;

    if (pending.form) setForm((prev) => ({ ...prev, ...pending.form }));
    if (pending.agreementDraft) setAgreementDraft((prev) => ({ ...prev, ...pending.agreementDraft }));
    if (pending.agreementAnalysis) setAgreementAnalysis(pending.agreementAnalysis);
    if (pending.caseSummaries) {
      setSummaryUploads((prev) => ({
        ...prev,
        claimant: {
          ...prev.claimant,
          fileName: pending.caseSummaries.claimant?.fileName || '',
          analysis: pending.caseSummaries.claimant?.analysis || null,
        },
        respondent: {
          ...prev.respondent,
          fileName: pending.caseSummaries.respondent?.fileName || '',
          analysis: pending.caseSummaries.respondent?.analysis || null,
        },
      }));
    }
    if (pending.agreementRecipients) setAgreementRecipients(pending.agreementRecipients);

    setLoadedFromCaseFlow(true);
  }, [location.state]);

  useEffect(() => {
    if (form.arbitrationRules) {
      applyRulePreset(form.arbitrationRules);
    }
  }, [form.arbitrationRules]);

  const clearAgreementFile = () => {
    setAgreementFile(null);
    setAgreementMode('draft');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 1, md: 2 } }}>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          background: 'linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(21,101,192,0.98) 58%, rgba(245,124,0,0.88) 140%)',
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.28)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 30%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 24%)',
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative' }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Chip label={t('Contract drafting')} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} />
            <Chip label={draftModeLabel} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} />
            <Chip label={templateModeLabel} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} />
            <Chip label={`${completedSections}/${agreementFields.length} ${t('sections filled')}`} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} />
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ maxWidth: 820 }}>
              <Typography variant="h4" sx={{ mb: 0.75, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {t('Agreement Editor')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', maxWidth: 760, lineHeight: 1.7 }}>
                {t('Prepare the arbitration agreement here first, then continue to case setup once the draft is ready.')}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 260, maxWidth: 360, width: '100%' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {t('Draft completion')}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={completionPercent}
                sx={{
                  mt: 0.8,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#F57C00' },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ maxWidth: 820 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em', fontWeight: 700 }}>
            {t('Drafting workspace')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
            {t('Use the navigation rail to jump between sections, then generate, email, or save the draft for case setup.')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 0.25 }}>
          <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/cases')}>
            {t('Back to Cases')}
          </Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleGenerateAgreementTemplate}>
            {t('Download Filled Agreement PDF')}
          </Button>
          <Button variant="contained" size="small" startIcon={<FolderOpenIcon />} onClick={saveAndContinue}>
            {t('Continue to case setup')}
          </Button>
        </Stack>
      </Box>

      {loadedFromCaseFlow && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('Agreement draft loaded from the full-page editor.')}
        </Alert>
      )}

      {agreementAnalysis && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>{t('Agreement Analysis')}:</strong> {agreementAnalysis.summary || t('Structured details extracted and applied to the case draft.')}
          {agreementAnalysis.missingInfo?.length > 0 && (
            <>
              <br />
              <strong>{t('Missing')}:</strong> {agreementAnalysis.missingInfo.join(', ')}
            </>
          )}
        </Alert>
      )}

      {agreementError && <Alert severity="error" sx={{ mb: 2 }}>{agreementError}</Alert>}
      {agreementEmailError && <Alert severity="error" sx={{ mb: 2 }}>{agreementEmailError}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={3}>
          <Paper variant="outlined" sx={{ p: 2.25, position: 'sticky', top: 88, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.92)' }}>
            <Typography variant="h6" sx={{ mb: 1, letterSpacing: '-0.01em' }}>{t('Section navigator')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
              {t('Jump to any clause and keep the agreement moving like a formal drafting session.')}
            </Typography>
            <Stack spacing={1}>
              {agreementFields.map((field) => (
                <Button
                  key={field.key}
                  variant="text"
                  onClick={() => scrollToSection(field.key)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  {field.label}
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.94)' }}>
            <Typography variant="h6" sx={{ mb: 2, letterSpacing: '-0.01em' }}>{t('Agreement Metadata')}</Typography>
            <Grid container spacing={2.25}>
              <Grid item xs={12}>
                <TextField
                  label={t('Effective Date')}
                  fullWidth
                  value={agreementDraft.effectiveDate}
                  onChange={agreementField('effectiveDate')}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  helperText={t('Use the calendar to choose the agreement date')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('Case Title')}
                  fullWidth
                  value={form.title}
                  onChange={set('title')}
                  helperText={t('Use the case title that will appear on the agreement PDF')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Claimant / First Party')} fullWidth value={form.claimantName} onChange={set('claimantName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Respondent / Second Party')} fullWidth value={form.respondentName} onChange={set('respondentName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Arbitrator')}
                  value={form.arbitratorNominee}
                  onChange={setValue('arbitratorNominee')}
                  options={arbitratorOptions}
                  placeholder={t('Search or type an arbitrator name')}
                  helperText={t('Search existing names or type a new one')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Seat of Arbitration')}
                  value={form.seatOfArbitration}
                  onChange={setValue('seatOfArbitration')}
                  options={seatOptions}
                  placeholder={t('Search or type a seat')}
                  helperText={t('Search by city or enter a custom seat')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Governing Law')}
                  value={form.governingLaw}
                  onChange={setValue('governingLaw')}
                  options={lawOptions}
                  placeholder={t('Search or type the governing law')}
                  helperText={t('Search by country law or choose the platform wording')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Arbitration Rules')}
                  value={form.arbitrationRules}
                  onChange={setValue('arbitrationRules')}
                  options={rulesOptions}
                  placeholder={t('Search or type the arbitration rules')}
                  helperText={t('Search an institution or choose ad hoc')}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.94)' }}>
            <Typography variant="h6" sx={{ mb: 1, letterSpacing: '-0.01em' }}>{t('Agreement Intake')}</Typography>
            <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { lineHeight: 1.65 } }}>
              {t('Fill the agreement here, then use the PDF tools to download it, email it for signing, or upload a signed copy for extraction.')}
            </Alert>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Button size="small" variant={agreementMode === 'draft' ? 'contained' : 'outlined'} onClick={() => setAgreementMode('draft')}>
                {t('Use Draft')}
              </Button>
              <Button size="small" variant={agreementMode === 'upload' ? 'contained' : 'outlined'} component="label">
                {agreementFile ? t('Replace Signed Agreement') : t('Upload Signed Agreement (Optional)')}
                <input hidden type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleAgreementFileChange} />
              </Button>
              {agreementFile && (
                <Button size="small" variant="text" onClick={clearAgreementFile}>
                  {t('Clear uploaded file')}
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {agreementFile
                ? t('Selected file: {{name}}', { name: agreementFile.name })
                : t('No signed file uploaded yet. Fill the draft and generate the agreement PDF from this page.')}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => analyzeAgreementFile(agreementFile)}
              disabled={!agreementFile || agreementAnalyzing}
              sx={{ mb: 2 }}
            >
              {agreementAnalyzing ? t('Analyzing...') : t('Extract Details from Agreement')}
            </Button>

            <TextField
              label={t('Recipient Emails')}
              fullWidth
              multiline
              rows={2}
              value={agreementRecipients}
              onChange={(e) => setAgreementRecipients(e.target.value)}
              placeholder={t('Separate multiple email addresses with commas')}
              helperText={t('The platform will email the generated agreement PDF to these recipients for signature.')}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {t('Party case summaries')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
              {t('Upload a short summary from each party and their lawyers. AI will use those documents to prefill missing case details and draft suggestions.')}
            </Typography>
            <Grid container spacing={2.25}>
              {[
                { key: 'claimant', label: t('Claimant & Counsel Summary') },
                { key: 'respondent', label: t('Respondent & Counsel Summary') },
              ].map((summaryCard) => {
                const currentSummary = summaryUploads[summaryCard.key];
                return (
                  <Grid item xs={12} md={6} key={summaryCard.key}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 3, backgroundColor: 'rgba(250,250,250,0.96)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-0.01em' }}>
                        {summaryCard.label}
                      </Typography>
                      <Stack spacing={1.2}>
                        <Button size="small" variant="outlined" component="label" fullWidth>
                          {currentSummary.file ? t('Replace summary file') : t('Upload summary file')}
                          <input
                            hidden
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            onChange={handleSummaryFileChange(summaryCard.key)}
                          />
                        </Button>
                        {currentSummary.fileName && (
                          <Typography variant="body2" color="text.secondary">
                            {t('Selected file: {{name}}', { name: currentSummary.fileName })}
                          </Typography>
                        )}
                        {currentSummary.analyzing && (
                          <Alert severity="info">{t('Analyzing case summary...')}</Alert>
                        )}
                        {currentSummary.error && (
                          <Alert severity="error">{currentSummary.error}</Alert>
                        )}
                        {!currentSummary.analyzing && !currentSummary.error && currentSummary.analysis && (
                          <Alert severity="success">
                            <strong>{t('AI draft applied')}.</strong>{' '}
                            {currentSummary.analysis.summary || t('Structured details extracted and merged into the agreement draft.')}
                          </Alert>
                        )}
                        {currentSummary.analysis?.missingInfo?.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {t('Missing')}: {currentSummary.analysis.missingInfo.join(', ')}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Button size="small" variant="contained" startIcon={<EmailIcon />} onClick={handleEmailAgreementTemplate} disabled={agreementEmailing}>
                {agreementEmailing ? t('Sending...') : t('Email for signing')}
              </Button>
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={handleGenerateAgreementTemplate}>
                {t('Download Filled Agreement PDF')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.25, position: 'sticky', top: 88, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.92)' }}>
            <Typography variant="h6" sx={{ mb: 2, letterSpacing: '-0.01em' }}>{t('Draft checklist')}</Typography>
            <Stack spacing={1.2}>
              {agreementFields.map((field) => {
                const hasContent = String(agreementDraft[field.key] || '').trim().length > 0;
                return (
                  <Box key={field.key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: hasContent ? 'text.primary' : 'text.secondary' }}>
                      {field.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={hasContent ? t('Done') : t('Pending')}
                      color={hasContent ? 'success' : 'default'}
                      variant={hasContent ? 'filled' : 'outlined'}
                    />
                  </Box>
                );
              })}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              {t('Once the agreement is ready, continue to case setup and keep the signed copy with the case record.')}
            </Typography>
            <Button fullWidth sx={{ mt: 2 }} size="small" variant="contained" startIcon={<FolderOpenIcon />} onClick={saveAndContinue}>
              {t('Continue to case setup')}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2.5, mx: 'auto', maxWidth: 1180, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="h6" sx={{ mb: 1, letterSpacing: '-0.01em' }}>{t('Agreement Clauses')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25, lineHeight: 1.7, maxWidth: 860 }}>
              {t('Write the clause text as you would in the final agreement. The PDF generator will format these sections into a formal contract layout.')}
            </Typography>
            {suggestedClauseReady && (
              <Box
                sx={{
                  mb: 2.5,
                  p: 2.25,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'rgba(21,101,192,0.22)',
                  background: 'linear-gradient(180deg, rgba(21,101,192,0.045) 0%, rgba(21,101,192,0.02) 100%)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ display: 'inline-block', mb: 0.5, letterSpacing: '0.14em', fontWeight: 700, color: 'primary.main' }}>
                      {t('Next suggested clause')}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.5 }}>
                      {t('{{section}}: {{template}}', {
                        section: nextClauseSection.label,
                        template: suggestedClauseTemplateName,
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 760 }}>
                      {t('This suggestion follows the selected arbitration rules and can be inserted before you edit the text.')}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: { xs: 0, sm: 0.25 } }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => applyClauseTemplate(nextClauseSection.key, suggestedClauseTemplateName)}
                    >
                      {t('Use suggested clause')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => scrollToSection(nextClauseSection.key)}
                    >
                      {t('Jump to next section')}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
            <Grid container spacing={2.25}>
              {agreementFields.map((field) => (
                <Grid item xs={12} md={6} key={field.key}>
                  <Stack spacing={0.9}>
                    {clauseTemplateOptions[field.key] && (
                      <SearchableField
                        label={t(`${field.label} template`)}
                        value=""
                        onChange={(value) => applyClauseTemplate(field.key, value)}
                        options={clauseTemplateOptions[field.key]}
                        placeholder={t('Search a clause starter')}
                        helperText={t('Select a starter clause, then edit the text below')}
                      />
                    )}
                    <TextField
                      id={`agreement-${field.key}`}
                      label={field.label}
                      fullWidth
                      multiline={field.inputType !== 'date'}
                      minRows={field.inputType === 'date' ? undefined : field.rows}
                      type={field.inputType || 'text'}
                      InputLabelProps={field.inputType === 'date' ? { shrink: true } : undefined}
                      value={agreementDraft[field.key]}
                      onChange={agreementField(field.key)}
                      placeholder={field.placeholder}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AgreementEditor;
