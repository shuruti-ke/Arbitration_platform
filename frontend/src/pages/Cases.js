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
import { apiService } from '../services/api';

const STEPS = ['Case Details', 'Parties', 'Procedural', 'Submission'];

const EMPTY_FORM = {
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
  serviceConfirmed: false, feeAcknowledged: false,
};

const Cases = () => {
  const navigate = useNavigate();
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
      setError('Could not load cases from server.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setCheck = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

  const validateStep = () => {
    if (activeStep === 0 && !form.title.trim()) {
      setFormError('Case title is required.');
      return false;
    }
    if (activeStep === 1 && (!form.claimantName.trim() || !form.respondentName.trim())) {
      setFormError('Claimant and Respondent names are required.');
      return false;
    }
    if (activeStep === 3 && !form.reliefSought.trim()) {
      setFormError('Relief Sought is required — describe the remedy you seek from the Tribunal.');
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
        serviceConfirmed: form.serviceConfirmed,
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

      setDialogOpen(false);
      setActiveStep(0);
      setForm(EMPTY_FORM);
      await fetchCases();
      navigate(`/cases/${newCaseId}`);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!form.seatOfArbitration) { setFormError('Enter a seat of arbitration first.'); return; }
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
      setFormError('AI suggestion failed. Check server configuration.');
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

  const columns = [
    { field: 'caseId', headerName: 'Case ID', width: 160 },
    { field: 'title', headerName: 'Title', width: 240 },
    { field: 'caseType', headerName: 'Type', width: 110 },
    { field: 'sector', headerName: 'Sector', width: 110 },
    {
      field: 'status', headerName: 'Status', width: 100,
      renderCell: (params) => (
        <Chip label={params.value}
          color={params.value === 'active' ? 'primary' : params.value === 'completed' ? 'success' : 'warning'}
          size="small" variant="outlined" />
      )
    },
    {
      field: 'submissionStatus', headerName: 'Submission', width: 110,
      renderCell: (params) => (
        <Chip label={params.value || 'draft'}
          color={params.value === 'submitted' ? 'success' : params.value === 'commenced' ? 'info' : 'default'}
          size="small" />
      )
    },
    { field: 'caseStage', headerName: 'Stage', width: 120 },
    { field: 'disputeAmount', headerName: 'Amount', width: 100 },
    { field: 'createdAt', headerName: 'Filed', width: 100 },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Open case">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${params.row.caseId}`); }}>
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit case">
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
    { label: 'Case title provided', ok: !!form.title.trim() },
    { label: 'Dispute description provided', ok: !!form.description.trim() },
    { label: 'Claimant details provided', ok: !!form.claimantName.trim() },
    { label: 'Respondent details provided', ok: !!form.respondentName.trim() },
    { label: 'Seat of arbitration specified', ok: !!form.seatOfArbitration.trim() },
    { label: 'Language of proceedings specified', ok: !!form.languageOfProceedings },
    { label: 'Relief sought stated', ok: !!form.reliefSought.trim() },
    { label: 'Arbitrator nominee provided', ok: !!form.arbitratorNominee.trim() },
    { label: 'Service on all parties confirmed', ok: !!form.serviceConfirmed },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Case Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New Case
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label={`Active Cases (${activeCases.length})`} />
          <Tab label={`Repository (${repositoryCases.length})`} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Search Cases" variant="outlined" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ flex: 1 }} />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select value={filterStatus} label="Status Filter" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setFilterStatus('all')}>
            Reset
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
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setActiveStep(0); setForm(EMPTY_FORM); }}
        maxWidth="md" fullWidth>
        <DialogTitle>New Arbitration Case</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          {/* Step 1: Case Details */}
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Case Title *" fullWidth value={form.title} onChange={set('title')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Case Type</InputLabel>
                  <Select value={form.caseType} label="Case Type" onChange={set('caseType')}>
                    <MenuItem value="commercial">Commercial</MenuItem>
                    <MenuItem value="employment">Employment</MenuItem>
                    <MenuItem value="construction">Construction</MenuItem>
                    <MenuItem value="ip">Intellectual Property</MenuItem>
                    <MenuItem value="investment">Investment</MenuItem>
                    <MenuItem value="consumer">Consumer</MenuItem>
                    <MenuItem value="insurance">Insurance</MenuItem>
                    <MenuItem value="real_estate">Real Estate</MenuItem>
                    <MenuItem value="technology">Technology</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sector / Industry</InputLabel>
                  <Select value={form.sector} label="Sector / Industry" onChange={set('sector')}>
                    <MenuItem value="finance">Finance & Banking</MenuItem>
                    <MenuItem value="energy">Energy & Resources</MenuItem>
                    <MenuItem value="construction">Construction</MenuItem>
                    <MenuItem value="technology">Technology</MenuItem>
                    <MenuItem value="agriculture">Agriculture</MenuItem>
                    <MenuItem value="healthcare">Healthcare</MenuItem>
                    <MenuItem value="transport">Transport & Logistics</MenuItem>
                    <MenuItem value="retail">Retail & Trade</MenuItem>
                    <MenuItem value="government">Government</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Dispute Category</InputLabel>
                  <Select value={form.disputeCategory} label="Dispute Category" onChange={set('disputeCategory')}>
                    <MenuItem value="b2b">Business to Business (B2B)</MenuItem>
                    <MenuItem value="b2c">Business to Consumer (B2C)</MenuItem>
                    <MenuItem value="investment">Investment Treaty</MenuItem>
                    <MenuItem value="state">State vs. Private</MenuItem>
                    <MenuItem value="cross_border">Cross-Border</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={set('status')}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Dispute Amount" fullWidth type="number"
                  value={form.disputeAmount} onChange={set('disputeAmount')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select value={form.currency} label="Currency" onChange={set('currency')}>
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
                <TextField label="Description of Dispute / Nature of Claim" fullWidth multiline rows={3}
                  value={form.description} onChange={set('description')} />
              </Grid>
            </Grid>
          )}

          {/* Step 2: Parties */}
          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="subtitle1" fontWeight="bold">Claimant</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name *" fullWidth value={form.claimantName} onChange={set('claimantName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Organization / Company" fullWidth value={form.claimantOrg} onChange={set('claimantOrg')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select value={form.claimantEntityType} label="Entity Type" onChange={set('claimantEntityType')}>
                    <MenuItem value="individual">Individual</MenuItem>
                    <MenuItem value="corporation">Corporation</MenuItem>
                    <MenuItem value="partnership">Partnership</MenuItem>
                    <MenuItem value="government">Government / State</MenuItem>
                    <MenuItem value="ngo">NGO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nationality / Country" fullWidth value={form.claimantNationality} onChange={set('claimantNationality')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" fullWidth value={form.claimantEmail} onChange={set('claimantEmail')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" fullWidth value={form.claimantPhone} onChange={set('claimantPhone')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" fullWidth multiline rows={2} value={form.claimantAddress} onChange={set('claimantAddress')} />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>Respondent</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name *" fullWidth value={form.respondentName} onChange={set('respondentName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Organization / Company" fullWidth value={form.respondentOrg} onChange={set('respondentOrg')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select value={form.respondentEntityType} label="Entity Type" onChange={set('respondentEntityType')}>
                    <MenuItem value="individual">Individual</MenuItem>
                    <MenuItem value="corporation">Corporation</MenuItem>
                    <MenuItem value="partnership">Partnership</MenuItem>
                    <MenuItem value="government">Government / State</MenuItem>
                    <MenuItem value="ngo">NGO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nationality / Country" fullWidth value={form.respondentNationality} onChange={set('respondentNationality')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" fullWidth value={form.respondentEmail} onChange={set('respondentEmail')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" fullWidth value={form.respondentPhone} onChange={set('respondentPhone')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" fullWidth multiline rows={2} value={form.respondentAddress} onChange={set('respondentAddress')} />
              </Grid>
            </Grid>
          )}

          {/* Step 3: Procedural */}
          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                  <AiIcon color="primary" />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    Enter the seat of arbitration below, then let AI suggest applicable laws and rules.
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<AiIcon />}
                    onClick={handleAiSuggest} disabled={aiLoading}>
                    {aiLoading ? 'Thinking...' : 'AI Suggest'}
                  </Button>
                </Box>
                {aiSuggestion && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <strong>AI Suggestion:</strong> {aiSuggestion.notes || ''}<br />
                    Law: {aiSuggestion.arbitrationLaw || '—'} | Institutions: {(aiSuggestion.institutions || []).join(', ')}
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Seat of Arbitration" fullWidth value={form.seatOfArbitration}
                  onChange={set('seatOfArbitration')} placeholder="e.g. Nairobi, Kenya" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Arbitration Rules</InputLabel>
                  <Select value={form.arbitrationRules} label="Arbitration Rules" onChange={set('arbitrationRules')}>
                    <MenuItem value="Kenya Arbitration Act">Kenya Arbitration Act</MenuItem>
                    <MenuItem value="NCIA">NCIA Rules</MenuItem>
                    <MenuItem value="KIAC">KIAC Rules</MenuItem>
                    <MenuItem value="LCIA">LCIA Rules</MenuItem>
                    <MenuItem value="ICC">ICC Rules</MenuItem>
                    <MenuItem value="SIAC">SIAC Rules</MenuItem>
                    <MenuItem value="UNCITRAL">UNCITRAL Rules</MenuItem>
                    <MenuItem value="AAA">AAA Rules</MenuItem>
                    <MenuItem value="AFSA">AFSA Rules</MenuItem>
                    <MenuItem value="LCA">LCA Rules</MenuItem>
                    <MenuItem value="CRCICA">CRCICA Rules</MenuItem>
                    <MenuItem value="Ad Hoc">Ad Hoc</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Governing Law" fullWidth value={form.governingLaw}
                  onChange={set('governingLaw')} placeholder="e.g. Laws of Kenya" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language of Proceedings</InputLabel>
                  <Select value={form.languageOfProceedings} label="Language of Proceedings" onChange={set('languageOfProceedings')}>
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="French">French</MenuItem>
                    <MenuItem value="Arabic">Arabic</MenuItem>
                    <MenuItem value="Portuguese">Portuguese</MenuItem>
                    <MenuItem value="Swahili">Swahili</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Number of Arbitrators</InputLabel>
                  <Select value={form.numArbitrators} label="Number of Arbitrators" onChange={set('numArbitrators')}>
                    <MenuItem value="1">1 (Sole Arbitrator)</MenuItem>
                    <MenuItem value="3">3 (Tribunal)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Confidentiality Level</InputLabel>
                  <Select value={form.confidentialityLevel} label="Confidentiality Level" onChange={set('confidentialityLevel')}>
                    <MenuItem value="confidential">Confidential</MenuItem>
                    <MenuItem value="restricted">Restricted</MenuItem>
                    <MenuItem value="public">Public</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Response Deadline" fullWidth type="date"
                  value={form.responseDeadline} onChange={set('responseDeadline')}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Third Party Funding</InputLabel>
                  <Select value={form.thirdPartyFunding} label="Third Party Funding"
                    onChange={(e) => setForm({ ...form, thirdPartyFunding: e.target.value })}>
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Step 4: Submission Details */}
          {activeStep === 3 && (
            <Grid container spacing={2}>
              {/* NCIA Checklist preview */}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <strong>Arbitration Filing Checklist</strong> — Items needed for a valid Request for Arbitration
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
                <TextField label="Relief Sought / Statement of Claim *" fullWidth multiline rows={3}
                  value={form.reliefSought} onChange={set('reliefSought')}
                  placeholder="Describe the specific relief or remedy you are seeking from the Tribunal (monetary amount, specific performance, declaratory relief, etc.)" />
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary">Arbitrator Nomination</Typography></Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Nominated Arbitrator Name" fullWidth value={form.arbitratorNominee}
                  onChange={set('arbitratorNominee')} placeholder="Full name of nominated arbitrator" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Required Copies" fullWidth disabled
                  value={form.numArbitrators === '1' ? '2 copies required (Sole Arbitrator)' : '4 copies required (Three-Member Tribunal)'}
                  helperText="Physical copies to submit to NCIA Registrar" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Arbitrator Qualifications & Experience" fullWidth multiline rows={2}
                  value={form.nomineeQualifications} onChange={set('nomineeQualifications')}
                  placeholder="State nominee's professional qualifications, relevant experience, and confirmed availability" />
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary">Filing Fee</Typography></Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Filing Fee Amount" fullWidth type="number"
                  value={form.filingFee} onChange={set('filingFee')}
                  helperText="Per NCIA Schedule of Fees" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Fee Currency</InputLabel>
                  <Select value={form.filingFeeCurrency} label="Fee Currency" onChange={set('filingFeeCurrency')}>
                    <MenuItem value="KES">KES (Kenya Shillings)</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="warning">
                  Filing fees paid to NCIA are <strong>non-refundable</strong>. Arbitration commences only upon receipt of filing fees by the Centre.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Divider><Typography variant="caption" color="text.secondary">Service Confirmation</Typography></Divider>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={form.serviceConfirmed} onChange={setCheck('serviceConfirmed')} color="primary" />}
                  label="I confirm that copies of this Request for Arbitration and all attached documents have been served on all parties to the arbitration"
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  After creating the case, use the <strong>"Submit to Registrar"</strong> button on the case details page to formally submit to the relevant arbitration institution. Ensure you also deliver the required physical copies together with proof of filing fee payment.
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDialogOpen(false); setActiveStep(0); setForm(EMPTY_FORM); }}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext}>Next</Button>
            : <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Case'}
              </Button>
          }
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cases;
