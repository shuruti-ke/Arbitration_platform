// src/pages/Cases.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip,
  InputAdornment, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Step,
  Stepper, StepLabel, Grid, Tabs, Tab, Tooltip, IconButton,
  FormControlLabel, Checkbox, Divider,
  Accordion, AccordionSummary, AccordionDetails, Badge
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  AutoAwesome as AiIcon, Edit as EditIcon, OpenInNew as OpenIcon,
  CheckCircle as CheckIcon, Cancel as CancelIcon,
  Gavel as GavelIcon, ExpandMore as ExpandMoreIcon, FolderOpen as FolderIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { buildCaseAgreementPdf } from '../utils/caseAgreementPdf';
import { getRulePreset } from '../utils/ruleLibrary';
import SearchableField from '../components/SearchableField';
import {
  AGREEMENT_SETUP_STORAGE_KEY,
  createEmptyAgreementDraft,
  createEmptyForm,
} from '../utils/agreementFlow';

const CASE_TYPE_OPTIONS = [
  'commercial',
  'employment',
  'construction',
  'ip',
  'investment',
  'consumer',
  'insurance',
  'real_estate',
  'technology',
  'other',
];

const SECTOR_OPTIONS = [
  'finance',
  'energy',
  'construction',
  'technology',
  'agriculture',
  'healthcare',
  'transport',
  'retail',
  'government',
  'other',
];

const DISPUTE_CATEGORY_OPTIONS = [
  'b2b',
  'b2c',
  'investment',
  'state',
  'cross_border',
];

const ENTITY_TYPE_OPTIONS = [
  'individual',
  'corporation',
  'partnership',
  'government',
  'ngo',
];

const ARBITRATION_RULE_OPTIONS = [
  'Arbitration Act (Cap. 49)',
  'NCIA',
  'KIAC',
  'LCIA',
  'ICC',
  'SIAC',
  'UNCITRAL',
  'AAA',
  'AFSA',
  'LCA',
  'CRCICA',
  'WIPO Rules',
  'Ad Hoc',
];

const IP_SUBTYPE_OPTIONS = [
  'patent',
  'trademark',
  'copyright',
  'trade_secret',
  'design',
  'software',
  'domain_name',
  'plant_variety',
  'other_ip',
];

const IP_TECHNICAL_FIELD_OPTIONS = [
  'Software / IT',
  'Pharmaceutical / Biotech',
  'Mechanical Engineering',
  'Electronics / Semiconductors',
  'Chemistry',
  'Design / Fashion',
  'Entertainment / Media',
  'Agricultural Technology',
  'Telecommunications',
  'Other',
];

const LANGUAGE_OPTIONS = [
  'English',
  'French',
  'Arabic',
  'Portuguese',
  'Swahili',
  'Other',
];

const CONFIDENTIALITY_OPTIONS = [
  'confidential',
  'restricted',
  'public',
];

const CURRENCY_OPTIONS = [
  'USD',
  'KES',
  'EUR',
  'GBP',
  'ZAR',
  'NGN',
  'GHS',
  'UGX',
  'TZS',
];

const CASE_STATUS_OPTIONS = [
  'active',
  'pending',
  'completed',
];

const NUM_ARBITRATORS_OPTIONS = [
  '1',
  '3',
];

const FUNDING_OPTIONS = [
  'Yes',
  'No',
];

const Cases = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { t } = useLanguage();
  const [mainTab, setMainTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cases, setCases] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [agreementAnalysis, setAgreementAnalysis] = useState(null);
  const [agreementDraft, setAgreementDraft] = useState(createEmptyAgreementDraft);
  const [agreementPrepared, setAgreementPrepared] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);

  // Admin: assign-arbitrator dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCase, setAssignCase] = useState(null);
  const [arbitrators, setArbitrators] = useState([]);
  const [selectedArbitrator, setSelectedArbitrator] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const STEPS = [t('Case Details'), t('Parties'), t('Procedural'), t('Submission')];

  const fetchCases = async () => {
    try {
      const response = await apiService.getCases();
      const rows = (response.data.cases || []).map((c) => ({
        caseId: c.CASE_ID || c.case_id || c.caseId || '',
        id: c.ID || c.id || c.CASE_ID || c.case_id || c.caseId || '',
        title: c.TITLE || c.title || '',
        status: c.STATUS || c.status || '',
        caseType: c.CASE_TYPE || c.caseType || '',
        sector: c.SECTOR || c.sector || '',
        disputeAmount: c.DISPUTE_AMOUNT || c.disputeAmount || '',
        currency: c.CURRENCY || c.currency || 'USD',
        caseStage: c.CASE_STAGE || c.caseStage || '',
        submissionStatus: c.SUBMISSION_STATUS || c.submissionStatus || 'draft',
        createdAt: c.CREATED_AT ? new Date(c.CREATED_AT).toLocaleDateString() : '',
        createdBy: c.created_by || c.CREATED_BY || c.createdBy || null,
        arbitratorName: c.arbitrator_name || c.ARBITRATOR_NAME || c.arbitratorName || '',
        arbitratorEmail: c.arbitrator_email || c.ARBITRATOR_EMAIL || c.arbitratorEmail || '',
        paymentStatus: c.payment_status || c.PAYMENT_STATUS || c.paymentStatus || '',
      }));
      setCases(rows);
      setError(null);
    } catch (err) {
      setError(t('Could not load cases from server.'));
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const openAssignDialog = async (row) => {
    setAssignCase(row);
    setSelectedArbitrator(row.createdBy || '');
    setAssignError(null);
    setAssignOpen(true);
    if (arbitrators.length === 0) {
      try {
        const res = await apiService.getUsers('arbitrator');
        setArbitrators((res.data.users || []).map(u => ({
          userId: u.USER_ID || u.userId || u.user_id,
          name: `${u.FIRST_NAME || u.firstName || ''} ${u.LAST_NAME || u.lastName || ''}`.trim(),
          email: u.EMAIL || u.email || ''
        })));
      } catch (_) {}
    }
  };

  const handleAssign = async () => {
    if (!selectedArbitrator) { setAssignError('Please select an arbitrator.'); return; }
    setAssigning(true);
    setAssignError(null);
    try {
      await apiService.assignCaseArbitrator(assignCase.caseId, selectedArbitrator);
      setAssignOpen(false);
      await fetchCases();
    } catch (err) {
      setAssignError(err?.response?.data?.error || 'Failed to assign arbitrator.');
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    const pending = location.state?.agreementSetup;
    const persisted = typeof window !== 'undefined'
      ? window.sessionStorage.getItem(AGREEMENT_SETUP_STORAGE_KEY)
      : null;

    let setup = pending || null;
    if (!setup && persisted) {
      try {
        setup = JSON.parse(persisted);
      } catch (error) {
        setup = null;
      }
    }

    if (!setup) {
      return;
    }

    if (setup.form) {
      setForm((prev) => ({ ...prev, ...setup.form }));
    }
    if (setup.agreementDraft) {
      setAgreementDraft((prev) => ({ ...prev, ...setup.agreementDraft }));
    }
    if (setup.agreementAnalysis) {
      setAgreementAnalysis(setup.agreementAnalysis);
    }
    if (typeof setup.agreementSigned === 'boolean') {
      setAgreementSigned(setup.agreementSigned);
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AGREEMENT_SETUP_STORAGE_KEY);
    }

    setAgreementPrepared(true);
    setDialogOpen(true);
    setActiveStep(0);
  }, [location.state]);

  useEffect(() => {
    if (form.arbitrationRules) {
      applyRulePreset(form.arbitrationRules);
    }
  }, [form.arbitrationRules]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setCheck = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

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

    setAiSuggestion((prev) => (prev ? {
      ...prev,
      notes: prev.notes || preset.notes || prev.notes,
    } : prev));
  };

  const validateStep = () => {
    if (activeStep === 0 && !form.title.trim()) {
      setFormError(t('Case title is required.'));
      return false;
    }
    if (activeStep === 1 && (!form.claimantName.trim() || !form.respondentName.trim())) {
      setFormError(t('Claimant and Respondent names are required.'));
      return false;
    }
    if (activeStep === 3 && !form.reliefSought.trim()) {
      setFormError(t('Relief Sought is required — describe the remedy you seek from the Tribunal.'));
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleNext = () => { if (validateStep()) setActiveStep((s) => s + 1); };
  const handleBack = () => { setFormError(null); setActiveStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await apiService.createCase({
        title: form.title, status: form.status,
        caseType: form.caseType, sector: form.sector,
        disputeCategory: form.disputeCategory, description: form.description,
        disputeAmount: form.disputeAmount || null, currency: form.currency,
        governingLaw: form.governingLaw, seatOfArbitration: form.seatOfArbitration,
        arbitrationRules: form.arbitrationRules,
        languageOfProceedings: form.languageOfProceedings,
        numArbitrators: parseInt(form.numArbitrators) || 1,
        confidentialityLevel: form.confidentialityLevel,
        thirdPartyFunding: form.thirdPartyFunding,
        responseDeadline: form.responseDeadline || null,
        filingDate: new Date().toISOString(),
        // Submission fields
        reliefSought: form.reliefSought || null,
        arbitratorNominee: form.arbitratorNominee || null,
        nomineeQualifications: form.nomineeQualifications || null,
        filingFee: form.filingFee || null,
        filingFeeCurrency: form.filingFeeCurrency || 'KES',
        ruleGuidance: aiSuggestion ? {
          cacheKey: aiSuggestion.cacheKey || null,
          caseType: form.caseType || null,
          seatOfArbitration: form.seatOfArbitration || null,
          arbitrationRules: form.arbitrationRules || null,
          governingLaw: aiSuggestion.governingLaw || form.governingLaw || null,
          summary: aiSuggestion.summary || aiSuggestion.guidanceSummary || aiSuggestion.notes || null,
          notes: aiSuggestion.notes || null,
          proceduralGuidance: aiSuggestion.proceduralGuidance || null,
          tribunalGuidance: aiSuggestion.tribunalGuidance || null,
          arbitrationLaw: aiSuggestion.arbitrationLaw || null,
          institutions: aiSuggestion.institutions || [],
          modelName: aiSuggestion.modelName || null,
          cached: !!aiSuggestion.cached,
          source: aiSuggestion.source || (aiSuggestion.cached ? 'cache' : 'ai'),
          generatedAt: new Date().toISOString(),
        } : null,
      });

      const newCaseId = res.data.caseId;

      if (form.claimantName) {
        await apiService.addParty(newCaseId, {
          partyType: 'claimant', fullName: form.claimantName,
          organizationName: form.claimantOrg, email: form.claimantEmail,
          phone: form.claimantPhone, nationality: form.claimantNationality,
          address: form.claimantAddress, entityType: form.claimantEntityType
        });
      }
      if (form.respondentName) {
        await apiService.addParty(newCaseId, {
          partyType: 'respondent', fullName: form.respondentName,
          organizationName: form.respondentOrg, email: form.respondentEmail,
          phone: form.respondentPhone, nationality: form.respondentNationality,
          address: form.respondentAddress, entityType: form.respondentEntityType
        });
      }

      const filledAgreement = {
        title: form.title,
        effectiveDate: agreementDraft.effectiveDate || new Date().toLocaleDateString(),
        claimantName: form.claimantName,
        claimantOrg: form.claimantOrg,
        respondentName: form.respondentName,
        respondentOrg: form.respondentOrg,
        arbitratorNominee: form.arbitratorNominee,
        nomineeQualifications: form.nomineeQualifications,
        seatOfArbitration: form.seatOfArbitration,
        governingLaw: form.governingLaw,
        arbitrationRules: form.arbitrationRules,
        languageOfProceedings: form.languageOfProceedings,
        numArbitrators: parseInt(form.numArbitrators, 10) || 1,
        confidentialityLevel: form.confidentialityLevel,
        reliefSought: form.reliefSought,
        agreementDraft: {
          ...agreementDraft,
        },
        summary: agreementAnalysis?.summary || '',
        keyTerms: agreementAnalysis?.keyTerms || [],
        missingInfo: agreementAnalysis?.missingInfo || [],
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      buildCaseAgreementPdf({ pdf, caseData: filledAgreement, user: null });
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const agreementFileName = `${(form.title || 'arbitration-agreement').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-agreement.pdf`;

      await apiService.uploadDocument({
        documentName: agreementFileName,
        caseId: newCaseId,
        category: 'Arbitration Agreement',
        description: 'Arbitration agreement generated from the arbitrator-filled draft',
        accessLevel: 'case',
        content: pdfBase64,
        mimeType: 'application/pdf'
      });

      await apiService.createCaseAgreement({
        caseId: newCaseId,
        sourceDocumentName: agreementFileName,
        sourceDocumentType: 'platform_generated',
        templateName: 'Arbitration Agreement',
        agreementStatus: agreementSigned ? 'signed' : 'draft',
        extracted: filledAgreement,
        parties: [
          { partyRole: 'claimant', fullName: form.claimantName, organizationName: form.claimantOrg, email: form.claimantEmail, signatureStatus: agreementSigned ? 'signed' : 'pending' },
          { partyRole: 'respondent', fullName: form.respondentName, organizationName: form.respondentOrg, email: form.respondentEmail, signatureStatus: agreementSigned ? 'signed' : 'pending' },
        ],
        signatures: [
          { signerRole: 'claimant', signerName: form.claimantName, signatureStatus: agreementSigned ? 'signed' : 'pending', signatureMethod: 'platform_generated' },
          { signerRole: 'respondent', signerName: form.respondentName, signatureStatus: agreementSigned ? 'signed' : 'pending', signatureMethod: 'platform_generated' },
          { signerRole: 'arbitrator', signerName: form.arbitratorNominee, signatureStatus: 'signed', signatureMethod: 'platform_generated' },
        ],
        signedAt: agreementSigned ? new Date().toISOString() : null,
        effectiveDate: agreementDraft.effectiveDate || new Date().toLocaleDateString(),
        modelName: 'agreement-draft'
      });

      setDialogOpen(false);
      setActiveStep(0);
      setForm(createEmptyForm());
      setAgreementDraft(createEmptyAgreementDraft());
      setAgreementPrepared(false);
      setAgreementSigned(false);
      await fetchCases();
      navigate(`/cases/${newCaseId}`);
    } catch (err) {
      setFormError(err.response?.data?.error || t('Failed to create case.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!form.seatOfArbitration) { setFormError(t('Enter a seat of arbitration first.')); return; }
    setAiLoading(true);
    setFormError(null);
    try {
      const res = await apiService.getGoverningLaw({
        seatOfArbitration: form.seatOfArbitration,
        caseType: form.caseType,
        arbitrationRules: form.arbitrationRules,
      });
      const s = res.data;
      setAiSuggestion(s);
      setForm(prev => ({
        ...prev,
        governingLaw: s.governingLaw || prev.governingLaw,
        arbitrationRules: s.arbitrationRules || prev.arbitrationRules,
      }));
      setAgreementDraft((prev) => ({
        ...prev,
        governingRulesText: prev.governingRulesText || s.proceduralGuidance || '',
        tribunalDetails: prev.tribunalDetails || s.tribunalGuidance || '',
      }));
    } catch (err) {
      setFormError(t('AI suggestion failed. Check server configuration.'));
    } finally {
      setAiLoading(false);
    }
  };

  const activeCases = cases.filter((c) => c.status !== 'completed');
  const repositoryCases = cases.filter((c) => c.status === 'completed');

  const displayCases = (mainTab === 0 ? activeCases : repositoryCases).filter((c) => {
    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.caseId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = isAdmin ? [
    { field: 'caseId', headerName: t('Case ID'), width: 180 },
    { field: 'title', headerName: t('Title'), width: 220 },
    {
      field: 'status', headerName: t('Status'), width: 110,
      renderCell: (params) => (
        <Chip label={t(params.value)}
          color={params.value === 'active' ? 'primary' : params.value === 'completed' ? 'success' : 'warning'}
          size="small" variant="outlined" />
      )
    },
    {
      field: 'paymentStatus', headerName: t('Payment'), width: 130,
      renderCell: (params) => (
        <Chip label={t(params.value || 'pending')}
          color={params.value === 'paid' ? 'success' : params.value === 'invoiced' ? 'info' : 'warning'}
          size="small" variant="outlined" />
      )
    },
    {
      field: 'arbitratorName', headerName: t('Arbitrator'), width: 180,
      renderCell: (params) => params.value
        ? <Box><Typography variant="body2" fontSize="0.8rem">{params.value}</Typography><Typography variant="caption" color="text.secondary">{params.row.arbitratorEmail}</Typography></Box>
        : <Chip label="Unassigned" size="small" color="error" variant="outlined" />
    },
    { field: 'createdAt', headerName: t('Filed'), width: 100 },
    {
      field: 'assign', headerName: '', width: 120, sortable: false,
      renderCell: (params) => (
        <Button size="small" variant={params.row.createdBy ? 'outlined' : 'contained'}
          color={params.row.createdBy ? 'inherit' : 'primary'}
          onClick={(e) => { e.stopPropagation(); openAssignDialog(params.row); }}>
          {params.row.createdBy ? t('Reassign') : t('Assign')}
        </Button>
      )
    },
  ] : [
    { field: 'caseId', headerName: t('Case ID'), width: 160 },
    { field: 'title', headerName: t('Title'), width: 240 },
    { field: 'caseType', headerName: t('Type'), width: 110 },
    { field: 'sector', headerName: t('Sector'), width: 110 },
    {
      field: 'status', headerName: t('Status'), width: 100,
      renderCell: (params) => (
        <Chip label={t(params.value)}
          color={params.value === 'active' ? 'primary' : params.value === 'completed' ? 'success' : 'warning'}
          size="small" variant="outlined" />
      )
    },
    {
      field: 'submissionStatus', headerName: t('Submission'), width: 110,
      renderCell: (params) => (
        <Chip label={t(params.value || 'draft')}
          color={params.value === 'submitted' ? 'success' : params.value === 'commenced' ? 'info' : 'default'}
          size="small" />
      )
    },
    { field: 'caseStage', headerName: t('Stage'), width: 120 },
    { field: 'disputeAmount', headerName: t('Amount'), width: 100 },
    { field: 'createdAt', headerName: t('Filed'), width: 100 },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={t('Open case')}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${params.row.caseId}`); }}>
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Edit case')}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${params.row.caseId}`); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
  ];

  // NCIA checklist for Step 4 preview
  const nciaChecks = [
    { label: t('Case title provided'), ok: !!form.title.trim() },
    { label: t('Dispute description provided'), ok: !!form.description.trim() },
    { label: t('Claimant details provided'), ok: !!form.claimantName.trim() },
    { label: t('Respondent details provided'), ok: !!form.respondentName.trim() },
    { label: t('Seat of arbitration specified'), ok: !!form.seatOfArbitration.trim() },
    { label: t('Language of proceedings specified'), ok: !!form.languageOfProceedings },
    { label: t('Relief sought stated'), ok: !!form.reliefSought.trim() },
    { label: t('Arbitrator nominee provided'), ok: !!form.arbitratorNominee.trim() },
    { label: t('Service on all parties confirmed'), ok: !!form.serviceConfirmed },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('Case Management')}</Typography>
        {!isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cases/agreement')}>
            {t('New Case')}
          </Button>
        )}
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label={`${t('Active Cases')} (${activeCases.length})`} />
          <Tab label={`${t('Repository')} (${repositoryCases.length})`} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label={t('Search Cases')} variant="outlined" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ flex: 1 }} />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>{t('Status Filter')}</InputLabel>
            <Select value={filterStatus} label={t('Status Filter')} onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="all">{t('All Statuses')}</MenuItem>
              <MenuItem value="active">{t('Active')}</MenuItem>
              <MenuItem value="pending">{t('Pending')}</MenuItem>
              <MenuItem value="completed">{t('Completed')}</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setFilterStatus('all')}>
            {t('Reset')}
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
      ) : isAdmin ? (
        // Admin view: cases grouped by arbitrator in accordions
        (() => {
          const groups = {};
          displayCases.forEach((c) => {
            const key = c.createdBy || '__unassigned__';
            if (!groups[key]) groups[key] = { name: c.arbitratorName || 'Unassigned', email: c.arbitratorEmail || '', cases: [] };
            groups[key].cases.push(c);
          });
          const sorted = Object.entries(groups).sort(([ka, a], [kb, b]) => {
            if (ka === '__unassigned__') return 1;
            if (kb === '__unassigned__') return -1;
            return (a.name || '').localeCompare(b.name || '');
          });
          if (sorted.length === 0) return (
            <Box sx={{ textAlign: 'center', pt: 6, color: 'text.secondary' }}>
              <Typography>{t('No cases found.')}</Typography>
            </Box>
          );
          return sorted.map(([arbId, group]) => (
            <Accordion key={arbId} defaultExpanded={sorted.length === 1} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                  <GavelIcon color={arbId === '__unassigned__' ? 'disabled' : 'warning'} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{group.name}</Typography>
                    {group.email && <Typography variant="caption" color="text.secondary">{group.email}</Typography>}
                  </Box>
                  <Badge badgeContent={group.cases.length} color="primary" showZero>
                    <Chip icon={<FolderIcon />} label={`${group.cases.length} case${group.cases.length !== 1 ? 's' : ''}`} size="small" variant="outlined" />
                  </Badge>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {group.cases.map((c, i) => (
                  <Box key={c.caseId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, borderTop: i === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
                    <FolderIcon fontSize="small" color="action" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>{c.title || c.caseId}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.caseId}</Typography>
                    </Box>
                    <Chip label={t(c.status)} size="small" variant="outlined"
                      color={c.status === 'active' ? 'primary' : c.status === 'completed' ? 'success' : 'warning'} />
                    <Chip label={t(c.paymentStatus || 'pending')} size="small" variant="outlined"
                      color={c.paymentStatus === 'paid' ? 'success' : c.paymentStatus === 'invoiced' ? 'info' : 'warning'} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{c.createdAt}</Typography>
                    <Button size="small" variant="outlined" onClick={() => openAssignDialog(c)}>
                      {c.createdBy ? t('Reassign') : t('Assign')}
                    </Button>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ));
        })()
      ) : (
        <Paper sx={{ height: 450, width: '100%' }}>
          <DataGrid rows={displayCases} columns={columns}
            getRowId={(row) => row.id || row.caseId}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25]}
            onRowClick={(params) => navigate(`/cases/${params.row.caseId}`)}
            sx={{ cursor: 'pointer' }}
          />
        </Paper>
      )}

      {/* New Case Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setActiveStep(0);
          setForm(createEmptyForm());
          setAgreementDraft(createEmptyAgreementDraft());
          setAgreementPrepared(false);
          setAgreementSigned(false);
          setAgreementAnalysis(null);
          setFormError(null);
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(AGREEMENT_SETUP_STORAGE_KEY);
          }
        }}
        maxWidth="md" fullWidth>
        <DialogTitle>{t('New Arbitration Case')}</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          {/* Step 0: Case Details */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  {t('Enter the case details after the agreement draft has been prepared in the full-page editor.')}
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Case Type')}
                  value={form.caseType}
                  onChange={(value) => setForm({ ...form, caseType: value })}
                  options={CASE_TYPE_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Sector / Industry')}
                  value={form.sector}
                  onChange={(value) => setForm({ ...form, sector: value })}
                  options={SECTOR_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Dispute Category')}
                  value={form.disputeCategory}
                  onChange={(value) => setForm({ ...form, disputeCategory: value })}
                  options={DISPUTE_CATEGORY_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Status')}
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  options={CASE_STATUS_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Dispute Amount')} fullWidth type="number"
                  value={form.disputeAmount} onChange={set('disputeAmount')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Currency')}
                  value={form.currency}
                  onChange={(value) => setForm({ ...form, currency: value })}
                  options={CURRENCY_OPTIONS}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t('Description of Dispute / Nature of Claim')} fullWidth multiline rows={3}
                  value={form.description} onChange={set('description')} />
              </Grid>

              {/* IP-specific fields */}
              {form.caseType === 'ip' && (<>
                <Grid item xs={12}>
                  <Alert severity="info" icon={false} sx={{ borderLeft: '4px solid #1976d2' }}>
                    <strong>IP Arbitration</strong> — Complete the fields below to enable IP-specific compliance checks, WIPO rule recommendations, and specialist arbitrator matching.
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SearchableField
                    label={t('IP Dispute Subtype *')}
                    value={form.ipSubtype || ''}
                    onChange={(value) => setForm({ ...form, ipSubtype: value })}
                    options={IP_SUBTYPE_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SearchableField
                    label={t('Technical Field')}
                    value={form.ipTechnicalField || ''}
                    onChange={(value) => setForm({ ...form, ipTechnicalField: value })}
                    options={IP_TECHNICAL_FIELD_OPTIONS}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={!!form.ipTradeSecret} onChange={setCheck('ipTradeSecret')} />}
                    label={t('Trade Secret Protection Required')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={!!form.ipRequiresInjunction} onChange={setCheck('ipRequiresInjunction')} />}
                    label={t('Injunctive Relief Sought')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField label={t('IP Rights at Issue (Registration numbers, titles, or brief description)')}
                    fullWidth multiline rows={2} value={form.ipRightsDescription || ''}
                    onChange={set('ipRightsDescription')}
                    placeholder="e.g. Patent EP1234567 — Method for data compression; Trademark 'Rafiki' Class 42" />
                </Grid>
              </>)}
            </Grid>
          )}

          {/* Step 1: Parties */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle1" fontWeight="bold">{t('Claimant')}</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Full Name *')} fullWidth value={form.claimantName} onChange={set('claimantName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Organization / Company')} fullWidth value={form.claimantOrg} onChange={set('claimantOrg')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Entity Type')}
                  value={form.claimantEntityType}
                  onChange={(value) => setForm({ ...form, claimantEntityType: value })}
                  options={ENTITY_TYPE_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Nationality / Country')} fullWidth value={form.claimantNationality} onChange={set('claimantNationality')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Email')} fullWidth value={form.claimantEmail} onChange={set('claimantEmail')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Phone')} fullWidth value={form.claimantPhone} onChange={set('claimantPhone')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t('Address')} fullWidth multiline rows={2} value={form.claimantAddress} onChange={set('claimantAddress')} />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>{t('Respondent')}</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Full Name *')} fullWidth value={form.respondentName} onChange={set('respondentName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Organization / Company')} fullWidth value={form.respondentOrg} onChange={set('respondentOrg')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Entity Type')}
                  value={form.respondentEntityType}
                  onChange={(value) => setForm({ ...form, respondentEntityType: value })}
                  options={ENTITY_TYPE_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Nationality / Country')} fullWidth value={form.respondentNationality} onChange={set('respondentNationality')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Email')} fullWidth value={form.respondentEmail} onChange={set('respondentEmail')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Phone')} fullWidth value={form.respondentPhone} onChange={set('respondentPhone')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t('Address')} fullWidth multiline rows={2} value={form.respondentAddress} onChange={set('respondentAddress')} />
              </Grid>
            </Grid>
          )}

          {/* Step 2: Procedural */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                  <AiIcon color="primary" />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {t('Enter the seat of arbitration below, then let AI suggest applicable laws and rules.')}
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<AiIcon />}
                    onClick={handleAiSuggest} disabled={aiLoading}>
                    {aiLoading ? t('Thinking...') : t('AI Suggest')}
                  </Button>
                </Box>
                {aiSuggestion && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <strong>{t('AI Suggestion:')}</strong> {aiSuggestion.notes || ''}<br />
                    {t('Law')}: {aiSuggestion.arbitrationLaw || '—'} | {t('Institutions')}: {(aiSuggestion.institutions || []).join(', ')}
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Seat of Arbitration')} fullWidth value={form.seatOfArbitration}
                  onChange={set('seatOfArbitration')}
                  placeholder={form.caseType === 'ip' ? 'e.g. Geneva (WIPO), Singapore (SIAC), London (LCIA)' : 'e.g. Nairobi, Kenya'} />
                {form.caseType === 'ip' && !form.seatOfArbitration && (
                  <Typography variant="caption" color="primary">
                    Recommended for IP: Geneva (WIPO), Singapore, London, Paris
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Arbitration Rules')}
                  value={form.arbitrationRules}
                  onChange={(value) => setForm({ ...form, arbitrationRules: value })}
                  options={ARBITRATION_RULE_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Governing Law')} fullWidth value={form.governingLaw}
                  onChange={set('governingLaw')} placeholder={t('e.g. Laws of Kenya')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Language of Proceedings')}
                  value={form.languageOfProceedings}
                  onChange={(value) => setForm({ ...form, languageOfProceedings: value })}
                  options={LANGUAGE_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Number of Arbitrators')}
                  value={form.numArbitrators}
                  onChange={(value) => setForm({ ...form, numArbitrators: value })}
                  options={NUM_ARBITRATORS_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Confidentiality Level')}
                  value={form.confidentialityLevel}
                  onChange={(value) => setForm({ ...form, confidentialityLevel: value })}
                  options={CONFIDENTIALITY_OPTIONS}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Response Deadline')} fullWidth type="date"
                  value={form.responseDeadline} onChange={set('responseDeadline')}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Third Party Funding')}
                  value={form.thirdPartyFunding ? 'Yes' : 'No'}
                  onChange={(value) => setForm({ ...form, thirdPartyFunding: String(value).toLowerCase() === 'yes' })}
                  options={FUNDING_OPTIONS}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 3: Submission Details */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              {/* NCIA Checklist preview */}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <strong>{t('Arbitration Filing Checklist')}</strong> — {t('Items needed for a valid Request for Arbitration')}
                </Alert>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    {nciaChecks.map((chk, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {chk.ok
                            ? <CheckIcon fontSize="small" color="success" />
                            : <CancelIcon fontSize="small" color="error" />}
                          <Typography variant="body2" color={chk.ok ? 'text.primary' : 'error.main'}>
                            {chk.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary">Relief & Claim</Typography></Divider>
              </Grid>

              <Grid item xs={12}>
                <TextField label={t('Relief Sought / Statement of Claim *')} fullWidth multiline rows={3}
                  value={form.reliefSought} onChange={set('reliefSought')}
                  placeholder={t('Describe the specific relief or remedy you are seeking from the Tribunal (monetary amount, specific performance, declaratory relief, etc.)')} />
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary">Arbitrator Nomination</Typography></Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label={t('Nominated Arbitrator Name')} fullWidth value={form.arbitratorNominee}
                  onChange={set('arbitratorNominee')} placeholder={t('Full name of nominated arbitrator')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Required Copies')} fullWidth disabled
                  value={form.numArbitrators === '1' ? t('2 copies required (Sole Arbitrator)') : t('4 copies required (Three-Member Tribunal)')}
                  helperText={t('Physical copies to submit to NCIA Registrar')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t('Arbitrator Qualifications & Experience')} fullWidth multiline rows={2}
                  value={form.nomineeQualifications} onChange={set('nomineeQualifications')}
                  placeholder={t("State nominee's professional qualifications, relevant experience, and confirmed availability")} />
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary">Filing Fee</Typography></Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label={t('Filing Fee Amount')} fullWidth type="number"
                  value={form.filingFee} onChange={set('filingFee')}
                  helperText={t('Per NCIA Schedule of Fees')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SearchableField
                  label={t('Fee Currency')}
                  value={form.filingFeeCurrency}
                  onChange={(value) => setForm({ ...form, filingFeeCurrency: value })}
                  options={['KES', 'USD', 'EUR', 'GBP', 'ZAR', 'NGN']}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="warning">
                  {t('Filing fees paid to NCIA are')} <strong>{t('non-refundable')}</strong>. {t('Arbitration commences only upon receipt of filing fees by the Centre.')}
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  {t('The agreement has already been prepared in the dedicated editor. When you create the case, the generated agreement record will be attached automatically for review and extraction.')}
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => {
              setDialogOpen(false);
              setActiveStep(0);
              setForm(createEmptyForm());
              setAgreementDraft(createEmptyAgreementDraft());
              setAgreementPrepared(false);
              setAgreementSigned(false);
              setAgreementAnalysis(null);
              setFormError(null);
              if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem(AGREEMENT_SETUP_STORAGE_KEY);
              }
            }}>
            {t('Cancel')}
            </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext}>{t('Next')}</Button>
            : <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                {submitting ? t('Creating...') : t('Create Case')}
              </Button>
          }
        </DialogActions>
      </Dialog>

      {/* Assign Arbitrator Dialog (admin only) */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {assignCase?.createdBy ? t('Reassign Arbitrator') : t('Assign Arbitrator')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{assignCase?.title}</strong> · {assignCase?.caseId}
            </Typography>
            {assignCase?.arbitratorName && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Currently assigned to: <strong>{assignCase.arbitratorName}</strong> ({assignCase.arbitratorEmail})
              </Alert>
            )}
            {assignError && <Alert severity="error" sx={{ mb: 2 }}>{assignError}</Alert>}
            <FormControl fullWidth>
              <InputLabel>{t('Select Arbitrator')}</InputLabel>
              <Select
                value={selectedArbitrator}
                label={t('Select Arbitrator')}
                onChange={e => setSelectedArbitrator(e.target.value)}
              >
                {arbitrators.length === 0 && (
                  <MenuItem disabled>{t('No arbitrators registered')}</MenuItem>
                )}
                {arbitrators.map(arb => (
                  <MenuItem key={arb.userId} value={arb.userId}>
                    <Box>
                      <Typography variant="body2">{arb.name || arb.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{arb.email}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleAssign} disabled={assigning || !selectedArbitrator}>
            {assigning ? t('Assigning...') : t('Assign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cases;
