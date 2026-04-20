// src/pages/CaseDetail.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Paper, Tabs, Tab, Chip, Grid,
  CircularProgress, Alert, Button, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, Stepper,
  Step, StepLabel, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Description as DocIcon,
  Edit as EditIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Gavel as GavelIcon,
  CloudUpload as UploadIcon,
  Verified as VerifiedIcon,
  Fingerprint as HashIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { buildProofOfServicePdf } from '../utils/proofOfServicePdf';

const Field = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Box>
);

const STAGE_ORDER = ['filing', 'response', 'arbitrator_appointment', 'terms_of_reference', 'hearing', 'deliberation', 'award', 'closed'];

const titleizeCode = (value) => String(value || '')
  .trim()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\b\w/g, (ch) => ch.toUpperCase());

const codeKey = (value) => String(value || '').trim().toLowerCase();

const CaseDetail = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [joiningHearing, setJoiningHearing] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPurpose, setUploadPurpose] = useState('contract');
  const [uploadCategory, setUploadCategory] = useState('Contract / Agreement');
  const [uploadDescription, setUploadDescription] = useState('');
  const fileInputRef = useRef(null);

  // Award pack state
  const [awardPack, setAwardPack] = useState(null);
  const [awardPackLoading, setAwardPackLoading] = useState(false);
  const [awardPackError, setAwardPackError] = useState(null);
  const [awardSeat, setAwardSeat] = useState('');

  const load = async () => {
    try {
      const res = await apiService.getCase(caseId);
      setData(res.data);
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('__403__');
      } else {
        setError(t('Failed to load case details.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [caseId]);

  const openEdit = () => {
    const c = data.case;
    setEditForm({
      title: c.TITLE || c.title || '',
      status: c.STATUS || c.status || 'active',
      caseType: c.CASE_TYPE || c.caseType || '',
      sector: c.SECTOR || c.sector || '',
      disputeCategory: c.DISPUTE_CATEGORY || c.disputeCategory || '',
      description: c.DESCRIPTION || c.description || '',
      disputeAmount: c.DISPUTE_AMOUNT || c.disputeAmount || '',
      currency: c.CURRENCY || c.currency || 'USD',
      governingLaw: c.GOVERNING_LAW || c.governingLaw || '',
      seatOfArbitration: c.SEAT_OF_ARBITRATION || c.seatOfArbitration || '',
      arbitrationRules: c.ARBITRATION_RULES || c.arbitrationRules || '',
      languageOfProceedings: c.LANGUAGE_OF_PROCEEDINGS || c.languageOfProceedings || 'English',
      numArbitrators: c.NUM_ARBITRATORS || c.numArbitrators || 1,
      confidentialityLevel: c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel || 'confidential',
      thirdPartyFunding: !!(c.THIRD_PARTY_FUNDING || c.thirdPartyFunding),
      caseStage: c.CASE_STAGE || c.caseStage || 'filing',
      institutionRef: c.INSTITUTION_REF || c.institutionRef || '',
      responseDeadline: c.RESPONSE_DEADLINE ? new Date(c.RESPONSE_DEADLINE).toISOString().split('T')[0] : '',
      // Submission fields
      reliefSought: c.RELIEF_SOUGHT || c.reliefSought || '',
      arbitratorNominee: c.ARBITRATOR_NOMINEE || c.arbitratorNominee || '',
      nomineeQualifications: c.NOMINEE_QUALIFICATIONS || c.nomineeQualifications || '',
      filingFee: c.FILING_FEE || c.filingFee || '',
      filingFeeCurrency: c.FILING_FEE_CURRENCY || c.filingFeeCurrency || 'KES',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await apiService.updateCase(caseId, editForm);
      setEditOpen(false);
      await load();
    } catch (err) {
      setSaveError(err.response?.data?.error || t('Failed to save changes.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitToRegistrar = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiService.submitCase(caseId);
      setSubmitSuccess(true);
      await load();
    } catch (err) {
      setSubmitError(err.response?.data?.error || t('Submission failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const setF = (field) => (e) => setEditForm({ ...editForm, [field]: e.target.value });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error === '__403__') return (
    <Container sx={{ mt: 6, maxWidth: 520 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <GavelIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>Case Contents Restricted</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Administrators manage the platform but do not have access to case contents.
          Case details are visible only to the arbitrator and parties involved,
          ensuring confidentiality of proceedings.
        </Typography>
        <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/cases')}>
          Back to Cases
        </Button>
      </Paper>
    </Container>
  );
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const c = data.case;
  const parties = data.parties || [];
  const counsel = data.counsel || [];
  const milestones = data.milestones || [];
  const documents = data.documents || [];
  const hearings = data.hearings || [];
  const agreement = data.agreement || null;
  const agreementParties = data.agreementParties || [];
  const agreementSignatures = data.agreementSignatures || [];
  const agreementExtractions = data.agreementExtractions || [];
  const auditLog = data.auditLog || [];

  const claimants = parties.filter(p => (p.PARTY_TYPE || p.partyType) === 'claimant');
  const respondents = parties.filter(p => (p.PARTY_TYPE || p.partyType) === 'respondent');

  const statusColor = (s) => s === 'active' ? 'primary' : s === 'completed' ? 'success' : 'warning';

  const displayEnum = (value, overrides = {}) => {
    const raw = codeKey(value);
    if (!raw) return '';
    return t(overrides[raw] || titleizeCode(value));
  };

  const displayCaseType = (value) => displayEnum(value, {
    commercial: 'Commercial',
    employment: 'Employment',
    construction: 'Construction',
    intellectual_property: 'Intellectual Property',
    investment: 'Investment',
    consumer: 'Consumer',
    insurance: 'Insurance',
    real_estate: 'Real Estate',
    technology: 'Technology',
    finance_banking: 'Finance & Banking',
    energy_resources: 'Energy & Resources',
    agriculture: 'Agriculture',
    healthcare: 'Healthcare',
    transport_logistics: 'Transport & Logistics',
    retail_trade: 'Retail & Trade',
    government: 'Government',
    b2b: 'Business to Business (B2B)',
    business_to_business_b2b: 'Business to Business (B2B)',
    b2c: 'Business to Consumer (B2C)',
    business_to_consumer_b2c: 'Business to Consumer (B2C)',
    investment_treaty: 'Investment Treaty',
    state_vs_private: 'State vs. Private',
    cross_border: 'Cross-Border'
  });

  const displayDisputeCategory = (value) => displayEnum(value, {
    individual: 'Individual',
    corporation: 'Corporation',
    company: 'Corporation',
    partnership: 'Partnership',
    government: 'Government / State',
    government_state: 'Government / State',
    ngo: 'NGO'
  });

  const displayConfidentiality = (value) => displayEnum(value, {
    confidential: 'confidential',
    restricted: 'restricted',
    public: 'public'
  });

  const displayEntityType = (value) => displayEnum(value, {
    individual: 'Individual',
    corporation: 'Corporation',
    company: 'Corporation',
    partnership: 'Partnership',
    government: 'Government / State',
    government_state: 'Government / State',
    ngo: 'NGO'
  });

  const displayCounselRole = (value) => displayEnum(value, {
    counsel: 'Legal Counsel',
    lead_counsel: 'Lead Counsel',
    claimant_counsel: 'Claimant Counsel',
    respondent_counsel: 'Respondent Counsel'
  });

  const displayHearingStatus = (value) => displayEnum(value, {
    scheduled: 'Scheduled',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  });

  const displayHearingType = (value) => displayEnum(value, {
    virtual: 'Virtual',
    'in-person': 'In-Person',
    hybrid: 'Hybrid'
  });

  const displayMilestoneType = (value) => displayEnum(value, {
    filing: 'Filing',
    response: 'Response',
    hearing: 'Hearing',
    award: 'Award',
    deliberation: 'Deliberation',
    order: 'Order',
    final_award: 'Final Award',
    terms_of_reference: 'Terms of Reference'
  });

  const displayMilestoneStatus = (value) => displayEnum(value, {
    pending: 'Pending',
    completed: 'Completed',
    overdue: 'Overdue',
    'in-progress': 'In Progress'
  });

  const displayStage = (value) => displayEnum(value, {
    filing: 'Filing',
    response: 'Response',
    arbitrator_appointment: 'Arbitrator Appointment',
    terms_of_reference: 'Terms of Reference',
    hearing: 'Hearing',
    deliberation: 'Deliberation',
    award: 'Award',
    closed: 'Closed'
  });

  const displayStatus = (value) => displayEnum(value, {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    archived: 'Archived'
  });

  const displayLanguage = (value) => displayEnum(value, {
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    swahili: 'Swahili',
    arabic: 'Arabic',
    portuguese: 'Portuguese'
  });

  const currentStage = c.CASE_STAGE || c.caseStage || 'filing';
  const stageIndex = STAGE_ORDER.indexOf(currentStage);

  const submissionStatus = c.SUBMISSION_STATUS || c.submissionStatus || 'draft';
  const displayCaseStatus = t(c.STATUS || c.status || '');
  const displaySubmissionStatus = t(submissionStatus);

  // Arbitration Filing Checklist
  const claimant = claimants[0];
  const respondent = respondents[0];
  const serviceDocs = documents.filter((doc) => {
    const text = `${doc.DOCUMENT_NAME || doc.documentName || ''} ${doc.CATEGORY || doc.category || ''}`.toLowerCase();
    return text.includes('proof of service') || text.includes('certificate of service') || text.includes('service document');
  });
  const nciaChecks = [
    {
      label: t('Claimant details provided (name, address, nature of business)'),
      ok: !!(claimant && (claimant.FULL_NAME || claimant.fullName))
    },
    {
      label: t('Claimant contact details (phone/email)'),
      ok: !!(claimant && ((claimant.EMAIL || claimant.email) || (claimant.PHONE || claimant.phone)))
    },
    {
      label: t('Respondent details provided'),
      ok: !!(respondent && (respondent.FULL_NAME || respondent.fullName))
    },
    {
      label: t('Contract / arbitration clause (document uploaded)'),
      ok: documents.length > 0
    },
    {
      label: t('Statement of dispute / nature of claim'),
      ok: !!(c.DESCRIPTION || c.description)
    },
    {
      label: t('Relief sought stated'),
      ok: !!(c.RELIEF_SOUGHT || c.reliefSought)
    },
    {
      label: t('Seat and language of proceedings specified'),
      ok: !!(c.SEAT_OF_ARBITRATION || c.seatOfArbitration) && !!(c.LANGUAGE_OF_PROCEEDINGS || c.languageOfProceedings)
    },
    {
      label: t('Arbitrator nominee name & qualifications provided'),
      ok: !!(c.ARBITRATOR_NOMINEE || c.arbitratorNominee)
    },
    {
      label: t('Service document generated, signed, and uploaded'),
      ok: serviceDocs.length > 0
    },
  ];

  const allChecksPass = nciaChecks.every(ch => ch.ok);
  const passCount = nciaChecks.filter(ch => ch.ok).length;

  const numArbitrators = c.NUM_ARBITRATORS || c.numArbitrators || 1;
  const requiredCopies = parseInt(numArbitrators) === 1 ? 2 : 4;

  const handleJoinHearing = async (hearingId) => {
    setJoiningHearing(hearingId);
    try {
      const res = await apiService.joinHearing(hearingId);
      window.open(res.data.jitsiUrl, '_blank');
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to join hearing.'));
    } finally {
      setJoiningHearing(null);
    }
  };

  const openUploadDialog = (purpose = 'contract') => {
    setUploadPurpose(purpose);
    setUploadCategory(purpose === 'service' ? 'Proof of Service' : 'Contract / Agreement');
    setUploadDescription(purpose === 'service' ? 'Signed proof of service' : '');
    setUploadOpen(true);
  };

  const generateProofOfServicePdf = () => {
    const pdf = new jsPDF();
    const filename = `${(c.CASE_ID || c.caseId || 'unknown-case')}-proof-of-service.pdf`
      .replace(/[^a-z0-9._-]+/gi, '-');

    buildProofOfServicePdf({
      pdf,
      caseData: c,
      claimants,
      respondents,
      counsel: data.counsel || [],
      user,
    });

    pdf.save(filename);
  };

  const resetUploadDialog = () => {
    setUploadOpen(false);
    setUploading(false);
    setUploadError(null);
    setUploadFile(null);
    setUploadPurpose('contract');
    setUploadCategory('Contract / Agreement');
    setUploadDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = (event) => {
    const file = event.target.files?.[0] || null;
    setUploadFile(file);
  };

  const handleUploadContract = async () => {
    if (!uploadFile) {
      setUploadError(t('Please choose a file to upload.'));
      return;
    }

    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = String(event.target.result || '').split(',')[1];
        await apiService.uploadDocument({
          documentName: uploadFile.name,
          caseId,
          category: uploadCategory || (uploadPurpose === 'service' ? 'Proof of Service' : 'Contract / Agreement'),
          description: uploadDescription || (uploadPurpose === 'service' ? 'Signed proof of service uploaded from case detail' : 'Uploaded from case detail'),
          accessLevel: 'case',
          content: base64,
          mimeType: uploadFile.type
        });
        await load();
        resetUploadDialog();
      } catch (err) {
        setUploadError(err.response?.data?.error || t('Upload failed.'));
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError(t('Could not read the selected file.'));
      setUploading(false);
    };
    reader.readAsDataURL(uploadFile);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={() => navigate('/cases')}><BackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight="bold">{c.TITLE || c.title}</Typography>
            <IconButton size="small" onClick={openEdit} title={t('Edit Case')}><EditIcon fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip label={c.CASE_ID || c.caseId} size="small" variant="outlined" />
            <Chip label={displayCaseStatus} size="small" color={statusColor(c.STATUS || c.status)} />
            <Chip label={`${t('Stage')}: ${displayStage(currentStage)}`} size="small" variant="outlined" color="info" />
            {(c.CASE_TYPE || c.caseType) && <Chip label={displayCaseType(c.CASE_TYPE || c.caseType)} size="small" />}
            {(c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel) &&
              <Chip label={displayConfidentiality(c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel)} size="small" color="warning" />}
            <Chip
              label={`${t('Submission')}: ${displaySubmissionStatus}`}
              size="small"
              color={submissionStatus === 'submitted' ? 'success' : submissionStatus === 'commenced' ? 'info' : 'default'}
              icon={submissionStatus === 'submitted' ? <CheckCircleIcon /> : undefined}
            />
          </Box>
        </Box>
        {submissionStatus === 'draft' && (
          <Button variant="contained" color="success" startIcon={<SendIcon />}
            onClick={() => { setSubmitOpen(true); setSubmitSuccess(false); setSubmitError(null); }}>
            {t('Submit to Registrar')}
          </Button>
        )}
        {submissionStatus === 'submitted' && (
              <Chip label={t('Submitted to Registrar')} color="success" icon={<CheckCircleIcon />} />
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label={t('Overview')} />
          <Tab label={`${t('Parties')} (${parties.length})`} />
          <Tab label={`${t('Counsel')} (${counsel.length})`} />
          <Tab label={`${t('Documents')} (${documents.length})`} />
          <Tab label={`${t('Hearings')} (${hearings.length})`} />
          <Tab label={t('Timeline')} />
          <Tab label={t('Audit Log')} />
          {['admin', 'secretariat', 'arbitrator'].includes(user?.role) && (
            <Tab label={t('Award Pack')} icon={<GavelIcon fontSize="small" />} iconPosition="start" />
          )}
        </Tabs>
      </Paper>

      {/* OVERVIEW */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('Case Details')}</Typography>
              <Field label={t('Case ID')} value={c.CASE_ID || c.caseId} />
              <Field label={t('Title')} value={c.TITLE || c.title} />
              <Field label={t('Case Type')} value={displayCaseType(c.CASE_TYPE || c.caseType)} />
              <Field label={t('Sector / Industry')} value={displayCaseType(c.SECTOR || c.sector)} />
              <Field label={t('Dispute Category')} value={displayDisputeCategory(c.DISPUTE_CATEGORY || c.disputeCategory)} />
              <Field label={t('Status')} value={displayStatus(c.STATUS || c.status)} />
              <Field label={t('Current Stage')} value={displayStage(c.CASE_STAGE || c.caseStage)} />
              <Field label={t('Description')} value={c.DESCRIPTION || c.description} />
              {(c.RELIEF_SOUGHT || c.reliefSought) && (
                <Field label={t('Relief Sought')} value={c.RELIEF_SOUGHT || c.reliefSought} />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('Financial & Dates')}</Typography>
              <Field label={t('Dispute Amount')}
                value={(c.DISPUTE_AMOUNT || c.disputeAmount)
                  ? `${c.CURRENCY || c.currency || 'USD'} ${Number(c.DISPUTE_AMOUNT || c.disputeAmount).toLocaleString()}`
                  : null} />
              <Field label={t('Filing Fee')}
                value={(c.FILING_FEE || c.filingFee)
                  ? `${c.FILING_FEE_CURRENCY || c.filingFeeCurrency || 'KES'} ${Number(c.FILING_FEE || c.filingFee).toLocaleString()}`
                  : null} />
              <Divider sx={{ my: 1.5 }} />
              <Field label={t('Filing Date')} value={c.FILING_DATE ? new Date(c.FILING_DATE).toLocaleDateString() : null} />
              <Field label={t('Response Deadline')} value={c.RESPONSE_DEADLINE ? new Date(c.RESPONSE_DEADLINE).toLocaleDateString() : null} />
              {(c.SUBMITTED_AT || c.submittedAt) && (
                <Field label={t('Submitted to Registrar')} value={new Date(c.SUBMITTED_AT || c.submittedAt).toLocaleDateString()} />
              )}
              <Field label={t('Created At')} value={c.CREATED_AT ? new Date(c.CREATED_AT).toLocaleDateString() : null} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('Procedural')}</Typography>
              <Field label={t('Arbitration Rules')} value={c.ARBITRATION_RULES || c.arbitrationRules} />
              <Field label={t('Seat of Arbitration')} value={c.SEAT_OF_ARBITRATION || c.seatOfArbitration} />
              <Field label={t('Governing Law')} value={c.GOVERNING_LAW || c.governingLaw} />
              <Field label={t('Language of Proceedings')} value={displayLanguage(c.LANGUAGE_OF_PROCEEDINGS || c.languageOfProceedings)} />
              <Field label={t('Number of Arbitrators')} value={c.NUM_ARBITRATORS || c.numArbitrators} />
              <Field label={t('Institution Reference')} value={c.INSTITUTION_REF || c.institutionRef} />
              <Field label={t('Third Party Funding')} value={(c.THIRD_PARTY_FUNDING || c.thirdPartyFunding) ? t('Yes') : t('No')} />
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('Arbitrator Nomination')}</Typography>
              <Field label={t('Nominated Arbitrator')} value={c.ARBITRATOR_NOMINEE || c.arbitratorNominee} />
              <Field label={t('Qualifications')} value={c.NOMINEE_QUALIFICATIONS || c.nomineeQualifications} />
              <Field
                label={t('Service Document')}
                value={serviceDocs.length > 0 ? t('Uploaded and ready for signing / filing') : t('Not yet uploaded')}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('Agreement Record')}</Typography>
              <Field label={t('Agreement Status')} value={agreement?.AGREEMENT_STATUS || agreement?.agreement_status || c.AGREEMENT_STATUS || c.agreementStatus || 'none'} />
              <Field label={t('Agreement Document')} value={agreement?.SOURCE_DOCUMENT_NAME || agreement?.source_document_name || c.AGREEMENT_DOCUMENT_NAME || c.agreementDocumentName || '—'} />
              <Field label={t('Agreement Template')} value={agreement?.TEMPLATE_NAME || agreement?.template_name || '—'} />
              <Field label={t('Signed At')} value={agreement?.SIGNED_AT || agreement?.signed_at ? new Date(agreement.SIGNED_AT || agreement.signed_at).toLocaleString() : '—'} />
              <Field label={t('Effective Date')} value={agreement?.EFFECTIVE_DATE || agreement?.effective_date ? new Date(agreement.EFFECTIVE_DATE || agreement.effective_date).toLocaleDateString() : '—'} />
              <Field label={t('Agreement Parties')} value={agreementParties.length ? `${agreementParties.length} ${t('record(s)')}` : t('None recorded')} />
              <Field label={t('Agreement Signatures')} value={agreementSignatures.length ? `${agreementSignatures.length} ${t('record(s)')}` : t('None recorded')} />
              <Field label={t('Agreement Extractions')} value={agreementExtractions.length ? `${agreementExtractions.length} ${t('record(s)')}` : t('None recorded')} />
              {agreementExtractions[0]?.EXTRACTED_SUMMARY || agreementExtractions[0]?.extracted_summary ? (
                <Field label={t('Summary')} value={agreementExtractions[0].EXTRACTED_SUMMARY || agreementExtractions[0].extracted_summary} />
              ) : null}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('Case Progression')}</Typography>
              <Stepper activeStep={stageIndex} orientation="vertical">
                {STAGE_ORDER.map((stage) => (
                  <Step key={stage} completed={STAGE_ORDER.indexOf(stage) < stageIndex}>
                    <StepLabel>{displayStage(stage)}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Grid>

          {/* NCIA Compliance Checklist */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GavelIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('Request for Arbitration — Filing Checklist')}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Chip
                  label={`${passCount}/${nciaChecks.length} ${t('complete')}`}
                  color={allChecksPass ? 'success' : passCount >= 6 ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
              <List dense>
                {nciaChecks.map((chk, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.3 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {chk.ok
                        ? <CheckCircleIcon color="success" fontSize="small" />
                        : <CancelIcon color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" color={chk.ok ? 'text.primary' : 'error.main'}>{chk.label}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
              {!allChecksPass && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {t('Complete all checklist items before submitting to the Registrar. The final service step is completed by generating, signing, and uploading the proof of service document.')}
                </Alert>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={generateProofOfServicePdf}
                >
                  {t('Generate branded proof of service PDF')}
                </Button>
                <Button
                  variant="text"
                  onClick={() => openUploadDialog('service')}
                >
                  {t('Upload signed service document')}
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate('/documents')}
                >
                  {t('Open Document Library')}
                </Button>
              </Box>
              <Alert severity={serviceDocs.length > 0 ? 'success' : 'info'} sx={{ mt: 2 }}>
                {serviceDocs.length > 0
                  ? t('A service document is already attached to this case. Once signed, emailed, and uploaded, it becomes the service record in the document library.')
                  : t('Generate the proof of service PDF, sign it electronically or manually, upload the signed copy, then email and archive it. The checklist uses the uploaded document as the service record instead of a manual confirmation.')}
              </Alert>
              {allChecksPass && submissionStatus === 'draft' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('All filing requirements are met. You can now submit the Request for Arbitration to the Registrar.')}
                  {parseInt(numArbitrators) > 1
                    ? ` ${t('Remember to include')} ${requiredCopies} ${t('physical copies when filing in person.')}`
                    : ` ${t('Remember to include')} ${requiredCopies} ${t('copies when filing in person.')}`}
                </Alert>
              )}
              {submissionStatus === 'submitted' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('This case has been formally submitted. Arbitration commences upon receipt of filing fees by the Registrar.')}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* PARTIES */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {parties.length === 0 && (
            <Grid item xs={12}><Alert severity="info">{t('No parties added yet.')}</Alert></Grid>
          )}
          {claimants.map((p, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">{t('Claimant')}</Typography>
                  <Chip label={displayEntityType(p.ENTITY_TYPE || p.entityType || '')} size="small" />
                </Box>
                <Field label={t('Full Name')} value={p.FULL_NAME || p.fullName} />
                <Field label={t('Organization')} value={p.ORGANIZATION_NAME || p.organizationName} />
                <Field label={t('Nationality')} value={p.NATIONALITY || p.nationality} />
                <Field label="Email" value={p.EMAIL || p.email} />
                <Field label="Phone" value={p.PHONE || p.phone} />
                <Field label="Address" value={p.ADDRESS || p.address} />
                <Field label={t('Tax / Business ID')} value={p.TAX_ID || p.taxId} />
              </Paper>
            </Grid>
          ))}
          {respondents.map((p, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="error" />
                  <Typography variant="subtitle1" fontWeight="bold">{t('Respondent')}</Typography>
                  <Chip label={displayEntityType(p.ENTITY_TYPE || p.entityType || '')} size="small" />
                </Box>
                <Field label={t('Full Name')} value={p.FULL_NAME || p.fullName} />
                <Field label={t('Organization')} value={p.ORGANIZATION_NAME || p.organizationName} />
                <Field label={t('Nationality')} value={p.NATIONALITY || p.nationality} />
                <Field label="Email" value={p.EMAIL || p.email} />
                <Field label="Phone" value={p.PHONE || p.phone} />
                <Field label="Address" value={p.ADDRESS || p.address} />
                <Field label={t('Tax / Business ID')} value={p.TAX_ID || p.taxId} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* COUNSEL */}
      {tab === 2 && (
        <Paper>
          {counsel.length === 0
            ? <Box sx={{ p: 3 }}><Alert severity="info">{t('No counsel added yet.')}</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Name')}</TableCell>
                    <TableCell>{t('Law Firm')}</TableCell>
                    <TableCell>{t('Role')}</TableCell>
                    <TableCell>{t('Email')}</TableCell>
                    <TableCell>{t('Phone')}</TableCell>
                    <TableCell>{t('Bar No.')}</TableCell>
                    <TableCell>{t('Languages')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {counsel.map((co, i) => (
                    <TableRow key={i}>
                      <TableCell>{co.FULL_NAME || co.fullName}</TableCell>
                      <TableCell>{co.LAW_FIRM || co.lawFirm}</TableCell>
                      <TableCell><Chip label={displayCounselRole(co.ROLE || co.role || 'counsel')} size="small" /></TableCell>
                      <TableCell>{co.EMAIL || co.email}</TableCell>
                      <TableCell>{co.PHONE || co.phone}</TableCell>
                      <TableCell>{co.BAR_NUMBER || co.barNumber}</TableCell>
                      <TableCell>{co.LANGUAGES || co.languages}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </Paper>
      )}

      {/* DOCUMENTS */}
      {tab === 3 && (
        <Paper>
          {documents.length === 0
            ? <Box sx={{ p: 3 }}><Alert severity="info">{t('No documents uploaded yet. Use the Document Library to upload the contract/arbitration clause and other supporting documents.')}</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Document Name')}</TableCell>
                    <TableCell>{t('Case ID')}</TableCell>
                    <TableCell>{t('Uploaded')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DocIcon fontSize="small" />{d.DOCUMENT_NAME || d.documentName}</Box></TableCell>
                      <TableCell>{d.CASE_ID || d.caseId}</TableCell>
                      <TableCell>{d.CREATED_AT ? new Date(d.CREATED_AT).toLocaleDateString() : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </Paper>
      )}

      {/* HEARINGS */}
      {tab === 4 && (
        <Paper>
          {hearings.length === 0
            ? <Box sx={{ p: 3 }}><Alert severity="info">{t('No hearings scheduled yet.')}</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Hearing ID')}</TableCell>
                    <TableCell>{t('Title')}</TableCell>
                    <TableCell>{t('Type')}</TableCell>
                    <TableCell>{t('Start Time')}</TableCell>
                    <TableCell>{t('End Time')}</TableCell>
                    <TableCell>{t('Status')}</TableCell>
                    <TableCell>{t('Action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hearings.map((h, i) => {
                    const hId = h.HEARING_ID || h.hearingId;
                    return (
                    <TableRow key={i}>
                      <TableCell>{hId}</TableCell>
                      <TableCell>{h.TITLE || h.title}</TableCell>
                      <TableCell>{displayHearingType(h.TYPE || h.type)}</TableCell>
                      <TableCell>{h.START_TIME || h.startTime}</TableCell>
                      <TableCell>{h.END_TIME || h.endTime}</TableCell>
                      <TableCell><Chip label={displayHearingStatus(h.STATUS || h.status)} size="small" /></TableCell>
                      <TableCell>
                        <Button size="small" variant="contained" color="success"
                          disabled={joiningHearing === hId}
                          onClick={() => handleJoinHearing(hId)}>
                          {joiningHearing === hId ? t('Joining…') : t('Join')}
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          }
        </Paper>
      )}

      {/* TIMELINE */}
      {tab === 5 && (
        <Paper sx={{ p: 3 }}>
          {milestones.length === 0
            ? <Alert severity="info">{t('No milestones found.')}</Alert>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Milestone')}</TableCell>
                    <TableCell>{t('Type')}</TableCell>
                    <TableCell>{t('Due Date')}</TableCell>
                    <TableCell>{t('Completed')}</TableCell>
                    <TableCell>{t('Status')}</TableCell>
                    <TableCell>{t('Notes')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {milestones.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{m.TITLE || m.title}</TableCell>
                      <TableCell>{displayMilestoneType(m.MILESTONE_TYPE || m.milestoneType || '')}</TableCell>
                      <TableCell>{m.DUE_DATE ? new Date(m.DUE_DATE).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{m.COMPLETED_DATE ? new Date(m.COMPLETED_DATE).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Chip label={displayMilestoneStatus(m.STATUS || m.status)}
                          color={(m.STATUS || m.status) === 'completed' ? 'success' : (m.STATUS || m.status) === 'overdue' ? 'error' : 'default'}
                          size="small" />
                      </TableCell>
                      <TableCell>{m.NOTES || m.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </Paper>
      )}

      {/* AUDIT LOG */}
      {tab === 6 && (
        <Paper>
          {auditLog.length === 0
            ? <Box sx={{ p: 3 }}><Alert severity="info">{t('No audit log entries.')}</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Event Type')}</TableCell>
                    <TableCell>{t('Action')}</TableCell>
                    <TableCell>{t('User')}</TableCell>
                    <TableCell>{t('Date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLog.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>{a.EVENT_TYPE || a.eventType}</TableCell>
                      <TableCell>{a.ACTION || a.action}</TableCell>
                      <TableCell>{a.USER_ID || a.userId}</TableCell>
                      <TableCell>{a.CREATED_AT ? new Date(a.CREATED_AT).toLocaleString() : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </Paper>
      )}

      {/* AWARD PACK */}
      {tab === 7 && ['admin', 'secretariat', 'arbitrator'].includes(user?.role) && (() => {
        const handleBuildPack = async () => {
          setAwardPackLoading(true);
          setAwardPackError(null);
          setAwardPack(null);
          try {
            const cData = data?.case || {};
            const res = await apiService.buildAwardPack({
              caseId: cData.CASE_ID || cData.caseId,
              title: cData.TITLE || cData.title,
              seat: awardSeat || 'Kenya',
              date: new Date().toISOString().split('T')[0],
              reasons: true,
              delivery: true,
              signatures: ['Arbitrator'],
            });
            setAwardPack(res.data);
          } catch (err) {
            setAwardPackError(t('Failed to generate award pack.'));
          } finally {
            setAwardPackLoading(false);
          }
        };

        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('Award Pack & Verification')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('Generate a Section 32 award pack checklist and receive a SHA-256 verification hash that can be used to authenticate this award.')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <TextField
                label={t('Juridical Seat')}
                value={awardSeat}
                onChange={e => setAwardSeat(e.target.value)}
                placeholder="e.g. Nairobi, Kenya"
                size="small"
                sx={{ width: 240 }}
              />
              <Button
                variant="contained"
                startIcon={awardPackLoading ? <CircularProgress size={16} color="inherit" /> : <GavelIcon />}
                onClick={handleBuildPack}
                disabled={awardPackLoading}
              >
                {t('Generate Award Pack')}
              </Button>
            </Box>

            {awardPackError && <Alert severity="error" sx={{ mb: 2 }}>{awardPackError}</Alert>}

            {awardPack && (
              <Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={awardPack.status === 'ready' ? t('Ready') : t('Needs Review')}
                    color={awardPack.status === 'ready' ? 'success' : 'warning'}
                  />
                  <Typography variant="body2" color="text.secondary">{awardPack.complianceNote}</Typography>
                </Box>

                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Required Fields')}</Typography>
                <List dense disablePadding sx={{ mb: 2 }}>
                  {awardPack.requiredFields?.map((f, i) => (
                    <ListItem key={i} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {f.present
                          ? <CheckCircleIcon fontSize="small" color="success" />
                          : <CancelIcon fontSize="small" color="error" />}
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{f.label}</Typography>} />
                    </ListItem>
                  ))}
                </List>

                {awardPack.verificationHash && (
                  <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <VerifiedIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle2" fontWeight={600}>{t('Verification Hash (SHA-256)')}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(awardPack.verificationHash).catch(() => {})}
                        title={t('Copy hash')}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all', color: 'text.secondary' }}>
                      {awardPack.verificationHash}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {t('Share this hash with parties to allow them to verify the award at')} /verify
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        );
      })()}

      {/* Edit Case Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('Edit Case')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {saveError && <Grid item xs={12}><Alert severity="error">{saveError}</Alert></Grid>}
            <Grid item xs={12}><TextField label={t('Title')} fullWidth value={editForm.title || ''} onChange={setF('title')} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>{t('Status')}</InputLabel>
                <Select value={editForm.status || 'active'} label={t('Status')} onChange={setF('status')}>
                  <MenuItem value="active">{t('Active')}</MenuItem>
                  <MenuItem value="pending">{t('Pending')}</MenuItem>
                  <MenuItem value="completed">{t('Completed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>{t('Stage')}</InputLabel>
                <Select value={editForm.caseStage || 'filing'} label={t('Stage')} onChange={setF('caseStage')}>
                  {STAGE_ORDER.map(s =>
                    <MenuItem key={s} value={s}>{displayStage(s)}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label={t('Case Type')} fullWidth value={editForm.caseType || ''} onChange={setF('caseType')} /></Grid>
            <Grid item xs={6}><TextField label={t('Sector')} fullWidth value={editForm.sector || ''} onChange={setF('sector')} /></Grid>
            <Grid item xs={6}><TextField label={t('Dispute Amount')} type="number" fullWidth value={editForm.disputeAmount || ''} onChange={setF('disputeAmount')} /></Grid>
            <Grid item xs={6}><TextField label={t('Currency')} fullWidth value={editForm.currency || 'USD'} onChange={setF('currency')} /></Grid>
            <Grid item xs={12}><TextField label={t('Description')} fullWidth multiline rows={2} value={editForm.description || ''} onChange={setF('description')} /></Grid>
            <Grid item xs={12}><TextField label={t('Relief Sought')} fullWidth multiline rows={2} value={editForm.reliefSought || ''} onChange={setF('reliefSought')} /></Grid>
            <Grid item xs={6}><TextField label={t('Governing Law')} fullWidth value={editForm.governingLaw || ''} onChange={setF('governingLaw')} /></Grid>
            <Grid item xs={6}><TextField label={t('Seat of Arbitration')} fullWidth value={editForm.seatOfArbitration || ''} onChange={setF('seatOfArbitration')} /></Grid>
            <Grid item xs={6}><TextField label={t('Arbitration Rules')} fullWidth value={editForm.arbitrationRules || ''} onChange={setF('arbitrationRules')} /></Grid>
            <Grid item xs={6}><TextField label={t('Language')} fullWidth value={editForm.languageOfProceedings || 'English'} onChange={setF('languageOfProceedings')} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>{t('Number of Arbitrators')}</InputLabel>
                <Select value={editForm.numArbitrators || 1} label={t('Number of Arbitrators')} onChange={setF('numArbitrators')}>
                  <MenuItem value={1}>{t('1 (Sole Arbitrator)')}</MenuItem>
                  <MenuItem value={3}>{t('3 (Tribunal)')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label={t('Institution Reference')} fullWidth value={editForm.institutionRef || ''} onChange={setF('institutionRef')} /></Grid>
            <Grid item xs={6}><TextField label={t('Response Deadline')} type="date" fullWidth value={editForm.responseDeadline || ''} onChange={setF('responseDeadline')} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>{t('Confidentiality')}</InputLabel>
                <Select value={editForm.confidentialityLevel || 'confidential'} label={t('Confidentiality')} onChange={setF('confidentialityLevel')}>
                  <MenuItem value="confidential">{t('Confidential')}</MenuItem>
                  <MenuItem value="restricted">{t('Restricted')}</MenuItem>
                  <MenuItem value="public">{t('Public')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Submission fields */}
            <Grid item xs={12}><Divider><Typography variant="caption">{t('Arbitrator Nomination & Submission')}</Typography></Divider></Grid>
            <Grid item xs={6}><TextField label={t('Nominated Arbitrator')} fullWidth value={editForm.arbitratorNominee || ''} onChange={setF('arbitratorNominee')} /></Grid>
            <Grid item xs={6}><TextField label={t('Nominee Qualifications')} fullWidth value={editForm.nomineeQualifications || ''} onChange={setF('nomineeQualifications')} /></Grid>
            <Grid item xs={6}><TextField label={t('Filing Fee')} type="number" fullWidth value={editForm.filingFee || ''} onChange={setF('filingFee')} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>{t('Fee Currency')}</InputLabel>
                <Select value={editForm.filingFeeCurrency || 'KES'} label={t('Fee Currency')} onChange={setF('filingFeeCurrency')}>
                  <MenuItem value="KES">KES</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t('Saving...') : t('Save Changes')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit to Registrar Dialog */}
      <Dialog open={submitOpen} onClose={() => { if (!submitting) setSubmitOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon color="primary" />
            {t('Submit Request for Arbitration to Registrar')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {submitSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              <strong>{t('Case submitted successfully!')}</strong><br />
              {t('The case has been marked as submitted to the Registrar.')}
              {t('Please ensure physical copies')} ({requiredCopies} {t('copies required')}) {t('are delivered to the relevant arbitration institution together with proof of filing fee payment.')}
            </Alert>
          ) : (
            <>
              {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('NCIA Requirements Checklist')} ({passCount}/{nciaChecks.length} {t('complete')}):
              </Typography>
              <List dense>
                {nciaChecks.map((chk, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.2 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {chk.ok ? <CheckCircleIcon color="success" fontSize="small" /> : <CancelIcon color="error" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2" color={chk.ok ? 'text.primary' : 'error.main'}>{chk.label}</Typography>} />
                  </ListItem>
                ))}
              </List>
              {allChecksPass ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('All requirements met. Remember to submit')} <strong>{requiredCopies} {t('physical copies')}</strong> {t('to the Registrar together with proof of filing fee payment.')}
                  {t('Filing fees are')} <strong>{t('non-refundable')}</strong>.
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {nciaChecks.length - passCount} {t('requirement(s) not yet met. You can still proceed, but the Registrar may request the missing information.')}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitOpen(false)} disabled={submitting}>
            {submitSuccess ? t('Close') : t('Cancel')}
          </Button>
          {!submitSuccess && (
            <Button variant="contained" color="success" startIcon={<SendIcon />}
              onClick={handleSubmitToRegistrar} disabled={submitting}>
              {submitting ? t('Submitting...') : t('Confirm Submission')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Upload contract / arbitration clause dialog */}
      <Dialog open={uploadOpen} onClose={() => { if (!uploading) resetUploadDialog(); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {uploadPurpose === 'service'
            ? t('Upload signed service document')
            : t('Upload contract / arbitration clause')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleSelectFile}
                accept=".pdf,.doc,.docx,.txt,.md,.rtf,.jpg,.jpeg,.png"
              />
              <UploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              <Typography sx={{ mt: 1 }}>
                {uploadFile
                  ? uploadFile.name
                  : uploadPurpose === 'service'
                    ? t('Click to choose the signed proof of service PDF')
                    : t('Click to choose a contract, clause, or supporting file')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {uploadPurpose === 'service'
                  ? t('This signed document will be attached to the case, emailed to parties, and stored in the document library.')
                  : t('This file will be attached to this case and used by the AI as case evidence.')}
              </Typography>
            </Box>
            <TextField
              label={t('Category')}
              fullWidth
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              placeholder={uploadPurpose === 'service' ? t('Proof of Service') : t('Contract / Agreement')}
            />
            <TextField
              label={t('Description (optional)')}
              fullWidth
              multiline
              rows={2}
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder={uploadPurpose === 'service'
                ? t('e.g. Signed proof of service and certificate')
                : t('e.g. Signed arbitration clause and contract bundle')}
            />
            {uploading && <CircularProgress size={24} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { if (!uploading) resetUploadDialog(); }}>
            {t('Cancel')}
          </Button>
          <Button variant="contained" onClick={handleUploadContract} disabled={uploading || !uploadFile}>
            {uploading ? t('Uploading...') : t('Upload')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CaseDetail;
