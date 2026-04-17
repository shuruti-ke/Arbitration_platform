// src/pages/Cases.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip,
  InputAdornment, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Step,
  Stepper, StepLabel, Grid, Tabs, Tab, Tooltip, IconButton,
  FormControlLabel, Checkbox, Divider
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  AutoAwesome as AiIcon, Edit as EditIcon, OpenInNew as OpenIcon,
  CheckCircle as CheckIcon, Cancel as CancelIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { buildCaseAgreementPdf } from '../utils/caseAgreementPdf';

const EMPTY_FORM = {
  // Step 0 - Agreement intake
  agreementSigned: false,
  // Step 1 - Case Details
  title: '', caseType: '', sector: '', disputeCategory: '',
  description: '', disputeAmount: '', currency: 'USD', status: 'active',
  // Step 2 - Parties
  claimantName: '', claimantOrg: '', claimantEmail: '', claimantPhone: '',
  claimantNationality: '', claimantAddress: '', claimantEntityType: 'corporation',
  respondentName: '', respondentOrg: '', respondentEmail: '', respondentPhone: '',
  respondentNationality: '', respondentAddress: '', respondentEntityType: 'corporation',
  // Step 3 - Procedural
  governingLaw: '', seatOfArbitration: '', arbitrationRules: '',
  languageOfProceedings: 'English', numArbitrators: '1',
  confidentialityLevel: 'confidential', thirdPartyFunding: false,
  responseDeadline: '',
  // Step 4 - Submission
  reliefSought: '', arbitratorNominee: '', nomineeQualifications: '',
  filingFee: '', filingFeeCurrency: 'KES',
  feeAcknowledged: false,
};

const Cases = () => {
  const navigate = useNavigate();
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);
  const [agreementAnalyzing, setAgreementAnalyzing] = useState(false);
  const [agreementError, setAgreementError] = useState(null);
  const [agreementAnalysis, setAgreementAnalysis] = useState(null);
  const [agreementMode, setAgreementMode] = useState('template');

  const STEPS = [t('Agreement'), t('Case Details'), t('Parties'), t('Procedural'), t('Submission')];

  const fetchCases = async () => {
    try {
      const response = await apiService.getCases();
      const rows = (response.data.cases || []).map((c) => ({
        id: c.ID || c.id,
        caseId: c.CASE_ID || c.caseId || '',
        title: c.TITLE || c.title || '',
        status: c.STATUS || c.status || '',
        caseType: c.CASE_TYPE || c.caseType || '',
        sector: c.SECTOR || c.sector || '',
        disputeAmount: c.DISPUTE_AMOUNT || c.disputeAmount || '',
        currency: c.CURRENCY || c.currency || 'USD',
        caseStage: c.CASE_STAGE || c.caseStage || '',
        submissionStatus: c.SUBMISSION_STATUS || c.submissionStatus || 'draft',
        createdAt: c.CREATED_AT ? new Date(c.CREATED_AT).toLocaleDateString() : '',
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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setCheck = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

  const validateStep = () => {
    if (activeStep === 0 && !agreementFile) {
      setFormError(t('Please upload a signed agreement before creating the case.'));
      return false;
    }
    if (activeStep === 1 && !form.title.trim()) {
      setFormError(t('Case title is required.'));
      return false;
    }
    if (activeStep === 2 && (!form.claimantName.trim() || !form.respondentName.trim())) {
      setFormError(t('Claimant and Respondent names are required.'));
      return false;
    }
    if (activeStep === 4 && !form.reliefSought.trim()) {
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

      if (agreementFile) {
        const agreementContent = await fileToBase64(agreementFile);
        await apiService.uploadDocument({
          documentName: agreementFile.name,
          caseId: newCaseId,
          category: 'Arbitration Agreement',
          description: 'Signed arbitration agreement uploaded during case setup',
          accessLevel: 'case',
          content: agreementContent,
          mimeType: agreementFile.type
        });

        await apiService.createCaseAgreement({
          caseId: newCaseId,
          sourceDocumentName: agreementFile.name,
          sourceDocumentType: agreementMode === 'template' ? 'platform_template' : 'uploaded',
          templateName: agreementMode === 'template' ? 'Arbitration Agreement' : null,
          agreementStatus: 'signed',
          extracted: {
            title: form.title,
            caseType: form.caseType,
            sector: form.sector,
            disputeCategory: form.disputeCategory,
            description: form.description,
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
            summary: agreementAnalysis?.summary || '',
            keyTerms: agreementAnalysis?.keyTerms || [],
            missingInfo: agreementAnalysis?.missingInfo || []
          },
          parties: [
            { partyRole: 'claimant', fullName: form.claimantName, organizationName: form.claimantOrg, email: form.claimantEmail, signatureStatus: 'signed' },
            { partyRole: 'respondent', fullName: form.respondentName, organizationName: form.respondentOrg, email: form.respondentEmail, signatureStatus: 'signed' },
          ],
          signatures: [
            { signerRole: 'claimant', signerName: form.claimantName, signatureStatus: 'signed', signatureMethod: agreementMode === 'template' ? 'platform_template' : 'uploaded' },
            { signerRole: 'respondent', signerName: form.respondentName, signatureStatus: 'signed', signatureMethod: agreementMode === 'template' ? 'platform_template' : 'uploaded' },
            { signerRole: 'arbitrator', signerName: form.arbitratorNominee, signatureStatus: 'signed', signatureMethod: agreementMode === 'template' ? 'platform_template' : 'uploaded' },
          ],
          signedAt: new Date().toISOString(),
          effectiveDate: new Date().toISOString(),
          modelName: 'agreement-intake'
        });
      }

      setDialogOpen(false);
      setActiveStep(0);
      setForm(EMPTY_FORM);
      resetAgreementStep();
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
        caseType: form.caseType
      });
      const s = res.data;
      setAiSuggestion(s);
      setForm(prev => ({
        ...prev,
        governingLaw: s.governingLaw || prev.governingLaw,
        arbitrationRules: s.arbitrationRules || prev.arbitrationRules,
      }));
    } catch (err) {
      setFormError(t('AI suggestion failed. Check server configuration.'));
    } finally {
      setAiLoading(false);
    }
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

  const resetAgreementStep = () => {
    setAgreementFile(null);
    setAgreementAnalyzing(false);
    setAgreementError(null);
    setAgreementAnalysis(null);
    setAgreementMode('template');
  };

  const handleGenerateAgreementTemplate = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    buildCaseAgreementPdf({ pdf, caseData: form, user: null });
    const caseLabel = (form.title || 'arbitration-agreement').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    pdf.save(`${caseLabel}-template.pdf`);
  };

  const applyAgreementAnalysis = (analysis) => {
    if (!analysis) return;
    setAgreementAnalysis(analysis);
    setForm((prev) => ({
      ...prev,
      title: analysis.title || prev.title,
      caseType: analysis.caseType || prev.caseType,
      sector: analysis.sector || prev.sector,
      disputeCategory: analysis.disputeCategory || prev.disputeCategory,
      description: analysis.description || prev.description,
      claimantName: analysis.claimantName || prev.claimantName,
      claimantOrg: analysis.claimantOrg || prev.claimantOrg,
      respondentName: analysis.respondentName || prev.respondentName,
      respondentOrg: analysis.respondentOrg || prev.respondentOrg,
      arbitratorNominee: analysis.arbitratorNominee || prev.arbitratorNominee,
      nomineeQualifications: analysis.nomineeQualifications || prev.nomineeQualifications,
      seatOfArbitration: analysis.seatOfArbitration || prev.seatOfArbitration,
      governingLaw: analysis.governingLaw || prev.governingLaw,
      arbitrationRules: analysis.arbitrationRules || prev.arbitrationRules,
      languageOfProceedings: analysis.languageOfProceedings || prev.languageOfProceedings,
      numArbitrators: String(analysis.numArbitrators || prev.numArbitrators || 1),
      confidentialityLevel: analysis.confidentialityLevel || prev.confidentialityLevel,
      reliefSought: analysis.reliefSought || prev.reliefSought,
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
      const content = await fileToBase64(file);
      const response = await apiService.analyzeAgreement({
        documentName: file.name,
        content,
        mimeType: file.type
      });
      const analysis = response.data?.extracted || null;
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

  const handleAnalyzeAgreement = () => analyzeAgreementFile(agreementFile);

  const handleAgreementFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAgreementFile(file);
    setAgreementError(null);
    if (file) {
      setAgreementMode('upload');
      analyzeAgreementFile(file);
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

  const columns = [
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('New Case')}
        </Button>
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

      <Paper sx={{ height: 450, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
        ) : (
          <DataGrid rows={displayCases} columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25]}
            onRowClick={(params) => navigate(`/cases/${params.row.caseId}`)}
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Paper>

      {/* New Case Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setActiveStep(0); setForm(EMPTY_FORM); resetAgreementStep(); }}
        maxWidth="md" fullWidth>
        <DialogTitle>{t('New Arbitration Case')}</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          {/* Step 0: Agreement */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  {t('Start here: the case begins with a signed arbitration agreement. You can generate a platform template or upload your own signed agreement, then let AI extract the case details.')}
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button variant={agreementMode === 'template' ? 'contained' : 'outlined'} fullWidth onClick={() => { setAgreementMode('template'); handleGenerateAgreementTemplate(); }}>
                  {t('Download Agreement Template')}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button variant={agreementMode === 'upload' ? 'contained' : 'outlined'} component="label" fullWidth>
                  {t('Upload Signed Agreement')}
                  <input hidden type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleAgreementFileChange} />
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('Agreement Intake')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {agreementFile
                      ? t('Selected file: {{name}}', { name: agreementFile.name })
                      : t('No agreement uploaded yet. Use the template or upload a signed agreement to continue.')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" onClick={handleAnalyzeAgreement} disabled={!agreementFile || agreementAnalyzing}>
                      {agreementAnalyzing ? t('Analyzing...') : t('Extract Details from Agreement')}
                    </Button>
                    <Button variant="text" onClick={() => setAgreementMode('template')}>
                      {t('Use Template')}
                    </Button>
                    <Button variant="text" onClick={() => setAgreementMode('upload')}>
                      {t('Use Own Agreement')}
                    </Button>
                  </Box>
                  {agreementAnalysis && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <strong>{t('Agreement Analysis')}:</strong> {agreementAnalysis.summary || t('Structured details extracted and applied to the case draft.')}
                      {agreementAnalysis.missingInfo?.length > 0 && (
                        <>
                          <br />
                          <strong>{t('Missing')}:</strong> {agreementAnalysis.missingInfo.join(', ')}
                        </>
                      )}
                    </Alert>
                  )}
                  {agreementError && (
                    <Alert severity="error" sx={{ mt: 2 }}>{agreementError}</Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Step 1: Case Details */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
        <TextField label={t('Case Title *')} fullWidth value={form.title} onChange={set('title')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Case Type')}</InputLabel>
                  <Select value={form.caseType} label={t('Case Type')} onChange={set('caseType')}>
                    <MenuItem value="commercial">{t('Commercial')}</MenuItem>
                    <MenuItem value="employment">{t('Employment')}</MenuItem>
                    <MenuItem value="construction">{t('Construction')}</MenuItem>
                    <MenuItem value="ip">{t('Intellectual Property')}</MenuItem>
                    <MenuItem value="investment">{t('Investment')}</MenuItem>
                    <MenuItem value="consumer">{t('Consumer')}</MenuItem>
                    <MenuItem value="insurance">{t('Insurance')}</MenuItem>
                    <MenuItem value="real_estate">{t('Real Estate')}</MenuItem>
                    <MenuItem value="technology">{t('Technology')}</MenuItem>
                    <MenuItem value="other">{t('Other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Sector / Industry')}</InputLabel>
                  <Select value={form.sector} label={t('Sector / Industry')} onChange={set('sector')}>
                    <MenuItem value="finance">{t('Finance & Banking')}</MenuItem>
                    <MenuItem value="energy">{t('Energy & Resources')}</MenuItem>
                    <MenuItem value="construction">{t('Construction')}</MenuItem>
                    <MenuItem value="technology">{t('Technology')}</MenuItem>
                    <MenuItem value="agriculture">{t('Agriculture')}</MenuItem>
                    <MenuItem value="healthcare">{t('Healthcare')}</MenuItem>
                    <MenuItem value="transport">{t('Transport & Logistics')}</MenuItem>
                    <MenuItem value="retail">{t('Retail & Trade')}</MenuItem>
                    <MenuItem value="government">{t('Government')}</MenuItem>
                    <MenuItem value="other">{t('Other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Dispute Category')}</InputLabel>
                  <Select value={form.disputeCategory} label={t('Dispute Category')} onChange={set('disputeCategory')}>
                    <MenuItem value="b2b">{t('Business to Business (B2B)')}</MenuItem>
                    <MenuItem value="b2c">{t('Business to Consumer (B2C)')}</MenuItem>
                    <MenuItem value="investment">{t('Investment Treaty')}</MenuItem>
                    <MenuItem value="state">{t('State vs. Private')}</MenuItem>
                    <MenuItem value="cross_border">{t('Cross-Border')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Status')}</InputLabel>
                  <Select value={form.status} label={t('Status')} onChange={set('status')}>
                    <MenuItem value="active">{t('Active')}</MenuItem>
                    <MenuItem value="pending">{t('Pending')}</MenuItem>
                    <MenuItem value="completed">{t('Completed')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Dispute Amount')} fullWidth type="number"
                  value={form.disputeAmount} onChange={set('disputeAmount')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Currency')}</InputLabel>
                  <Select value={form.currency} label={t('Currency')} onChange={set('currency')}>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="KES">KES</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="ZAR">ZAR</MenuItem>
                    <MenuItem value="NGN">NGN</MenuItem>
                    <MenuItem value="GHS">GHS</MenuItem>
                    <MenuItem value="UGX">UGX</MenuItem>
                    <MenuItem value="TZS">TZS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label={t('Description of Dispute / Nature of Claim')} fullWidth multiline rows={3}
                  value={form.description} onChange={set('description')} />
              </Grid>
            </Grid>
          )}

          {/* Step 2: Parties */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle1" fontWeight="bold">{t('Claimant')}</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Full Name *')} fullWidth value={form.claimantName} onChange={set('claimantName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Organization / Company')} fullWidth value={form.claimantOrg} onChange={set('claimantOrg')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Entity Type')}</InputLabel>
                  <Select value={form.claimantEntityType} label={t('Entity Type')} onChange={set('claimantEntityType')}>
                    <MenuItem value="individual">{t('Individual')}</MenuItem>
                    <MenuItem value="corporation">{t('Corporation')}</MenuItem>
                    <MenuItem value="partnership">{t('Partnership')}</MenuItem>
                    <MenuItem value="government">{t('Government / State')}</MenuItem>
                    <MenuItem value="ngo">{t('NGO')}</MenuItem>
                  </Select>
                </FormControl>
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
                <FormControl fullWidth>
                  <InputLabel>{t('Entity Type')}</InputLabel>
                  <Select value={form.respondentEntityType} label={t('Entity Type')} onChange={set('respondentEntityType')}>
                    <MenuItem value="individual">{t('Individual')}</MenuItem>
                    <MenuItem value="corporation">{t('Corporation')}</MenuItem>
                    <MenuItem value="partnership">{t('Partnership')}</MenuItem>
                    <MenuItem value="government">{t('Government / State')}</MenuItem>
                    <MenuItem value="ngo">{t('NGO')}</MenuItem>
                  </Select>
                </FormControl>
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

          {/* Step 3: Procedural */}
          {activeStep === 3 && (
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
                  onChange={set('seatOfArbitration')} placeholder={t('e.g. Nairobi, Kenya')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Arbitration Rules')}</InputLabel>
                  <Select value={form.arbitrationRules} label={t('Arbitration Rules')} onChange={set('arbitrationRules')}>
                    <MenuItem value="Arbitration Act (Cap. 49)">{t('Arbitration Act (Cap. 49)')}</MenuItem>
                    <MenuItem value="NCIA">{t('NCIA Rules')}</MenuItem>
                    <MenuItem value="KIAC">{t('KIAC Rules')}</MenuItem>
                    <MenuItem value="LCIA">{t('LCIA Rules')}</MenuItem>
                    <MenuItem value="ICC">{t('ICC Rules')}</MenuItem>
                    <MenuItem value="SIAC">{t('SIAC Rules')}</MenuItem>
                    <MenuItem value="UNCITRAL">{t('UNCITRAL Rules')}</MenuItem>
                    <MenuItem value="AAA">{t('AAA Rules')}</MenuItem>
                    <MenuItem value="AFSA">{t('AFSA Rules')}</MenuItem>
                    <MenuItem value="LCA">{t('LCA Rules')}</MenuItem>
                    <MenuItem value="CRCICA">{t('CRCICA Rules')}</MenuItem>
                    <MenuItem value="Ad Hoc">{t('Ad Hoc')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Governing Law')} fullWidth value={form.governingLaw}
                  onChange={set('governingLaw')} placeholder={t('e.g. Laws of Kenya')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Language of Proceedings')}</InputLabel>
                  <Select value={form.languageOfProceedings} label={t('Language of Proceedings')} onChange={set('languageOfProceedings')}>
                    <MenuItem value="English">{t('English')}</MenuItem>
                    <MenuItem value="French">{t('French')}</MenuItem>
                    <MenuItem value="Arabic">{t('Arabic')}</MenuItem>
                    <MenuItem value="Portuguese">{t('Portuguese')}</MenuItem>
                    <MenuItem value="Swahili">{t('Swahili')}</MenuItem>
                    <MenuItem value="Other">{t('Other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Number of Arbitrators')}</InputLabel>
                  <Select value={form.numArbitrators} label={t('Number of Arbitrators')} onChange={set('numArbitrators')}>
                    <MenuItem value="1">{t('1 (Sole Arbitrator)')}</MenuItem>
                    <MenuItem value="3">{t('3 (Tribunal)')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Confidentiality Level')}</InputLabel>
                  <Select value={form.confidentialityLevel} label={t('Confidentiality Level')} onChange={set('confidentialityLevel')}>
                    <MenuItem value="confidential">{t('Confidential')}</MenuItem>
                    <MenuItem value="restricted">{t('Restricted')}</MenuItem>
                    <MenuItem value="public">{t('Public')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('Response Deadline')} fullWidth type="date"
                  value={form.responseDeadline} onChange={set('responseDeadline')}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Third Party Funding')}</InputLabel>
                  <Select value={form.thirdPartyFunding} label={t('Third Party Funding')}
                    onChange={(e) => setForm({ ...form, thirdPartyFunding: e.target.value })}>
                    <MenuItem value={false}>{t('No')}</MenuItem>
                    <MenuItem value={true}>{t('Yes')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Step 4: Submission Details */}
          {activeStep === 4 && (
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
                <FormControl fullWidth>
                  <InputLabel>{t('Fee Currency')}</InputLabel>
                  <Select value={form.filingFeeCurrency} label={t('Fee Currency')} onChange={set('filingFeeCurrency')}>
                    <MenuItem value="KES">{t('KES (Kenya Shillings)')}</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="warning">
                  {t('Filing fees paid to NCIA are')} <strong>{t('non-refundable')}</strong>. {t('Arbitration commences only upon receipt of filing fees by the Centre.')}
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  {t('After creating the case, upload the signed agreement file to the case record. The agreement becomes the setup record and the AI can use it for filing extraction and review.')}
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => { setDialogOpen(false); setActiveStep(0); setForm(EMPTY_FORM); resetAgreementStep(); }}>
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
    </Container>
  );
};

export default Cases;
