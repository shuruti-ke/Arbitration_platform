// src/pages/CaseDetail.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Paper, Tabs, Tab, Chip, Grid,
  CircularProgress, Alert, Button, Divider, LinearProgress, Stack, Breadcrumbs, Link,
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
  AutoAwesome as AutoAwesomeIcon,
  CalendarToday as CalendarIcon,
  AccountBalanceWallet as MoneyIcon,
  Timeline as TimelineIcon,
  NoteAdd as NoteAddIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { buildProofOfServicePdf } from '../utils/proofOfServicePdf';
import { openMeetingDock } from '../components/MeetingDock';

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
  const location = useLocation();
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
  const [aiAwardDraft, setAiAwardDraft] = useState(null);
  const [aiAwardLoading, setAiAwardLoading] = useState(false);
  const [aiAwardError, setAiAwardError] = useState(null);
  const tabSlugs = React.useMemo(() => ({
    overview: 0,
    parties: 1,
    counsel: 2,
    documents: 3,
    hearings: 4,
    timeline: 5,
    audit: 6,
    'award-pack': 7,
    'ai-draft': 8,
  }), []);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetTab = params.get('tab');
    const action = params.get('action');
    if (targetTab && Object.prototype.hasOwnProperty.call(tabSlugs, targetTab)) {
      const nextTab = tabSlugs[targetTab];
      setTab(nextTab);
      if (nextTab === 8 && user?.role === 'arbitrator') loadAiAwardDraft();
    }
    if (action === 'edit' && data) {
      openEdit();
    }
    if (action === 'upload' && data) {
      openUploadDialog('evidence');
    }
  }, [location.search, data]);

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
  const safeStageIndex = Math.max(stageIndex, 0);
  const progressPercent = Math.round(((safeStageIndex + 1) / STAGE_ORDER.length) * 100);

  const submissionStatus = c.SUBMISSION_STATUS || c.submissionStatus || 'draft';
  const displayCaseStatus = t(c.STATUS || c.status || '');
  const displaySubmissionStatus = t(submissionStatus);

  const caseTitle = c.TITLE || c.title || t('Untitled case');
  const caseNumber = c.CASE_ID || c.caseId;
  const disputeAmount = c.DISPUTE_AMOUNT || c.disputeAmount;
  const filingFee = c.FILING_FEE || c.filingFee;
  const filingDate = c.FILING_DATE || c.filingDate;
  const responseDeadline = c.RESPONSE_DEADLINE || c.responseDeadline;
  const submittedAt = c.SUBMITTED_AT || c.submittedAt;
  const createdAt = c.CREATED_AT || c.createdAt;

  const formatMoney = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined || amount === '') return null;
    const numeric = Number(amount);
    return `${currency} ${Number.isFinite(numeric) ? numeric.toLocaleString() : amount}`;
  };

  const relativeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const days = Math.round((date.getTime() - Date.now()) / 86400000);
    const abs = Math.abs(days);
    if (abs === 0) return t('today');
    if (abs < 30) return days > 0 ? t('in {{count}} day(s)', { count: abs }) : t('{{count}} day(s) ago', { count: abs });
    const months = Math.round(abs / 30);
    return days > 0 ? t('in {{count}} month(s)', { count: months }) : t('{{count}} month(s) ago', { count: months });
  };

  const formatDate = (value, includeRelative = true) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const rel = includeRelative ? relativeDate(value) : null;
    return rel ? `${formatted} · ${rel}` : formatted;
  };

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

  const nextActions = [
    submissionStatus === 'draft' && {
      label: t('Submit the filing package to the Registrar'),
      helper: allChecksPass ? t('Checklist is complete and ready for submission.') : t('{{count}} filing checklist item(s) remain.', { count: nciaChecks.length - passCount }),
      color: allChecksPass ? 'success' : 'warning',
      action: () => { setSubmitOpen(true); setSubmitSuccess(false); setSubmitError(null); },
      button: t('Submit')
    },
    documents.length === 0 && {
      label: t('Upload the contract, clause, or evidence'),
      helper: t('Documents are needed for the case record and later award drafting.'),
      color: 'info',
      action: () => openUploadDialog('contract'),
      button: t('Upload')
    },
    hearings.length === 0 && {
      label: t('Schedule the first procedural hearing'),
      helper: t('Add the hearing once the parties are ready to proceed.'),
      color: 'primary',
      action: () => setTab(4),
      button: t('Hearings')
    },
    submissionStatus === 'submitted' && {
      label: t('Awaiting next procedural step'),
      helper: responseDeadline ? `${t('Response deadline')}: ${formatDate(responseDeadline)}` : t('No response deadline has been set yet.'),
      color: 'success',
      action: () => openEdit(),
      button: t('Edit dates')
    },
  ].filter(Boolean).slice(0, 3);

  const keyDates = [
    { label: t('Filed'), value: filingDate, tone: 'primary' },
    { label: t('Response due'), value: responseDeadline, tone: responseDeadline && new Date(responseDeadline) < new Date() ? 'error' : 'warning' },
    { label: t('Submitted'), value: submittedAt, tone: 'success' },
    { label: t('Created'), value: createdAt, tone: 'default' },
  ].filter(item => item.value);

  const recentActivity = [
    ...auditLog.slice(0, 3).map((a) => ({
      title: a.ACTION || a.action || a.EVENT_TYPE || a.eventType || t('Case activity'),
      meta: formatDate(a.CREATED_AT || a.createdAt) || t('Date unavailable')
    })),
    submittedAt && { title: t('Submitted to Registrar'), meta: formatDate(submittedAt) },
    documents[0] && { title: t('Latest document added'), meta: documents[0].DOCUMENT_NAME || documents[0].documentName },
  ].filter(Boolean).slice(0, 4);

  const numArbitrators = c.NUM_ARBITRATORS || c.numArbitrators || 1;
  const requiredCopies = parseInt(numArbitrators) === 1 ? 2 : 4;

  const handleJoinHearing = async (hearingId) => {
    setJoiningHearing(hearingId);
    try {
      const res = await apiService.joinHearing(hearingId);
      const hearing = hearings.find(h => (h.HEARING_ID || h.hearingId) === hearingId);
      const title = hearing ? (hearing.TITLE || hearing.title || t('Hearing room')) : t('Hearing room');
      openMeetingDock({ url: res.data.videoUrl || res.data.jitsiUrl, title });
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to join hearing.'));
    } finally {
      setJoiningHearing(null);
    }
  };

  const normalizeAiDraft = (draft) => draft ? {
    draftId: draft.DRAFT_ID || draft.draftId || draft.draft_id,
    caseId: draft.CASE_ID || draft.caseId || draft.case_id,
    sourceSnapshotHash: draft.SOURCE_SNAPSHOT_HASH || draft.sourceSnapshotHash || draft.source_snapshot_hash,
    draftText: draft.DRAFT_TEXT || draft.draftText || draft.draft_text,
    status: draft.STATUS || draft.status,
    createdAt: draft.CREATED_AT || draft.createdAt || draft.created_at,
  } : null;

  const loadAiAwardDraft = async () => {
    if (user?.role !== 'arbitrator') return;
    setAiAwardLoading(true);
    setAiAwardError(null);
    try {
      const res = await apiService.getAIAwardDraft(caseId);
      setAiAwardDraft(normalizeAiDraft(res.data?.draft));
    } catch (err) {
      setAiAwardError(err.response?.data?.error || t('Failed to load AI draft award.'));
    } finally {
      setAiAwardLoading(false);
    }
  };

  const generateAiAwardDraft = async () => {
    setAiAwardLoading(true);
    setAiAwardError(null);
    try {
      const res = await apiService.generateAIAwardDraft(caseId);
      setAiAwardDraft(normalizeAiDraft(res.data?.draft));
    } catch (err) {
      setAiAwardError(err.response?.data?.error || t('Failed to generate AI draft award.'));
    } finally {
      setAiAwardLoading(false);
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

  const MAX_UPLOAD_SIZE = 3.5 * 1024 * 1024;
  const handleSelectFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_UPLOAD_SIZE) {
      setUploadError(t(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 3.5 MB.`));
      event.target.value = '';
      return;
    }
    setUploadFile(file);
    setUploadError(null);
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
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/cases')}>
            {t('Cases')}
          </Link>
          <Typography color="text.primary">{caseTitle}</Typography>
        </Breadcrumbs>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <IconButton onClick={() => navigate('/cases')}><BackIcon /></IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={800} noWrap>{caseTitle}</Typography>
                <IconButton
                  size="medium"
                  color="primary"
                  onClick={openEdit}
                  title={t('Edit Case')}
                  sx={{ border: '1px solid', borderColor: 'primary.light' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack direction="row" gap={1} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                <Chip label={caseNumber} size="small" variant="outlined" />
                <Chip label={displayCaseStatus} size="small" color={statusColor(c.STATUS || c.status)} />
                <Chip label={displayStage(currentStage)} size="small" variant="outlined" color="info" />
                {(c.CASE_TYPE || c.caseType) && <Chip label={displayCaseType(c.CASE_TYPE || c.caseType)} size="small" variant="outlined" />}
                {(c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel) &&
                  <Chip label={displayConfidentiality(c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel)} size="small" color="warning" variant="outlined" />}
                <Chip
                  label={displaySubmissionStatus}
                  size="small"
                  color={submissionStatus === 'submitted' ? 'success' : submissionStatus === 'commenced' ? 'info' : 'default'}
                  icon={submissionStatus === 'submitted' ? <CheckCircleIcon /> : undefined}
                />
              </Stack>
            </Box>
          </Stack>
        {submissionStatus === 'draft' && (
          <Button variant="contained" color="success" startIcon={<SendIcon />}
            onClick={() => { setSubmitOpen(true); setSubmitSuccess(false); setSubmitError(null); }}>
            {t('Submit to Registrar')}
          </Button>
        )}
        {submissionStatus === 'submitted' && (
              <Chip label={t('Submitted to Registrar')} color="success" icon={<CheckCircleIcon />} />
        )}
        </Stack>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => {
          setTab(v);
          if (v === 8 && user?.role === 'arbitrator') loadAiAwardDraft();
        }} variant="scrollable" scrollButtons="auto">
          <Tab label={t('Overview')} />
          <Tab label={`${t('Parties')} (${parties.length})`} />
          <Tab label={`${t('Counsel')} (${counsel.length})`} sx={{ display: counsel.length ? undefined : 'none' }} />
          <Tab label={`${t('Documents')} (${documents.length})`} sx={{ display: documents.length ? undefined : 'none' }} />
          <Tab label={`${t('Hearings')} (${hearings.length})`} sx={{ display: hearings.length ? undefined : 'none' }} />
          <Tab label={t('Timeline')} />
          <Tab label={t('Audit Log')} />
          {['admin', 'secretariat', 'arbitrator'].includes(user?.role) && (
            <Tab label={t('Award Pack')} icon={<GavelIcon fontSize="small" />} iconPosition="start" />
          )}
          {user?.role === 'arbitrator' && (
            <Tab label={t('AI Draft Award')} icon={<AutoAwesomeIcon fontSize="small" />} iconPosition="start" />
          )}
        </Tabs>
      </Paper>

      {/* OVERVIEW */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2.25, borderRadius: 2, border: '1px solid', borderColor: 'primary.light', height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MoneyIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('Dispute Amount')}</Typography>
                  <Typography variant="h5" fontWeight={850}>{formatMoney(disputeAmount, c.CURRENCY || c.currency || 'USD') || t('Not set')}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">{t('Current Stage')}</Typography>
              <Typography variant="h6" fontWeight={800}>{displayStage(currentStage)}</Typography>
              <LinearProgress variant="determinate" value={progressPercent} sx={{ mt: 1, height: 8, borderRadius: 1 }} />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">{t('Parties')}</Typography>
              <Typography variant="h6" fontWeight={800}>{claimants.length} {t('claimant(s)')} / {respondents.length} {t('respondent(s)')}</Typography>
              <Typography variant="body2" color="text.secondary">{counsel.length ? `${counsel.length} ${t('counsel recorded')}` : t('No counsel recorded')}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2.25, borderRadius: 2, border: '1px solid', borderColor: responseDeadline ? 'warning.light' : 'divider', height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CalendarIcon color={responseDeadline ? 'warning' : 'disabled'} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('Response Deadline')}</Typography>
                  <Typography variant="body1" fontWeight={800}>{formatDate(responseDeadline) || t('Not set')}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <TimelineIcon color="primary" />
                    <Typography variant="h6" fontWeight={850}>{t('Case Progress')}</Typography>
                    <Chip size="small" label={`${progressPercent}%`} color="primary" variant="outlined" />
                  </Stack>
                  <Stepper activeStep={safeStageIndex} alternativeLabel sx={{ display: { xs: 'none', md: 'flex' } }}>
                    {STAGE_ORDER.map((stage) => (
                      <Step key={stage} completed={STAGE_ORDER.indexOf(stage) < safeStageIndex}>
                        <StepLabel>{displayStage(stage)}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                  <Stepper activeStep={safeStageIndex} orientation="vertical" sx={{ display: { xs: 'block', md: 'none' } }}>
                    {STAGE_ORDER.map((stage) => (
                      <Step key={stage} completed={STAGE_ORDER.indexOf(stage) < safeStageIndex}>
                        <StepLabel>{displayStage(stage)}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button variant="contained" startIcon={<UploadIcon />} onClick={() => openUploadDialog('contract')}>{t('Upload Document')}</Button>
                  <Button variant="outlined" startIcon={<NoteAddIcon />} onClick={openEdit}>{t('Add / Edit Note')}</Button>
                  <Button variant="outlined" startIcon={<CalendarIcon />} onClick={() => setTab(4)}>{t('Schedule Hearing')}</Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={850} sx={{ mb: 2 }}>{t('Case Details')}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Field label={t('Case Type')} value={displayCaseType(c.CASE_TYPE || c.caseType)} /></Grid>
                <Grid item xs={12} sm={6}><Field label={t('Sector / Industry')} value={displayCaseType(c.SECTOR || c.sector)} /></Grid>
                <Grid item xs={12} sm={6}><Field label={t('Dispute Category')} value={displayDisputeCategory(c.DISPUTE_CATEGORY || c.disputeCategory)} /></Grid>
                <Grid item xs={12} sm={6}><Field label={t('Status')} value={displayStatus(c.STATUS || c.status)} /></Grid>
                <Grid item xs={12}><Field label={t('Description')} value={c.DESCRIPTION || c.description} /></Grid>
                {(c.RELIEF_SOUGHT || c.reliefSought) && (
                  <Grid item xs={12}><Field label={t('Relief Sought')} value={c.RELIEF_SOUGHT || c.reliefSought} /></Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={850} sx={{ mb: 2 }}>{t('Key Dates')}</Typography>
              {keyDates.length === 0 ? (
                <Alert severity="info">{t('No key dates have been recorded yet.')}</Alert>
              ) : (
                <Stack spacing={1.5}>
                  {keyDates.map((item) => (
                    <Stack key={item.label} direction="row" spacing={1.5} alignItems="center">
                      <Chip size="small" color={item.tone} label=" " sx={{ width: 10, minWidth: 10, height: 10, '& .MuiChip-label': { p: 0 } }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDate(item.value)}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
              {filingFee && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Field label={t('Filing Fee')} value={formatMoney(filingFee, c.FILING_FEE_CURRENCY || c.filingFeeCurrency || 'KES')} />
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={850} sx={{ mb: 2 }}>{t('Procedural')}</Typography>
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
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={850} sx={{ mb: 2 }}>{t('Agreement Record')}</Typography>
              <Field label={t('Agreement Status')} value={agreement?.AGREEMENT_STATUS || agreement?.agreement_status || c.AGREEMENT_STATUS || c.agreementStatus || 'none'} />
              <Field label={t('Agreement Document')} value={agreement?.SOURCE_DOCUMENT_NAME || agreement?.source_document_name || c.AGREEMENT_DOCUMENT_NAME || c.agreementDocumentName} />
              <Field label={t('Agreement Template')} value={agreement?.TEMPLATE_NAME || agreement?.template_name} />
              <Field label={t('Signed At')} value={agreement?.SIGNED_AT || agreement?.signed_at ? new Date(agreement.SIGNED_AT || agreement.signed_at).toLocaleString() : null} />
              <Field label={t('Effective Date')} value={agreement?.EFFECTIVE_DATE || agreement?.effective_date ? new Date(agreement.EFFECTIVE_DATE || agreement.effective_date).toLocaleDateString() : null} />
              <Field label={t('Agreement Parties')} value={agreementParties.length ? `${agreementParties.length} ${t('record(s)')}` : t('None recorded')} />
              <Field label={t('Agreement Signatures')} value={agreementSignatures.length ? `${agreementSignatures.length} ${t('record(s)')}` : t('None recorded')} />
              <Field label={t('Agreement Extractions')} value={agreementExtractions.length ? `${agreementExtractions.length} ${t('record(s)')}` : t('None recorded')} />
              {agreementExtractions[0]?.EXTRACTED_SUMMARY || agreementExtractions[0]?.extracted_summary ? (
                <Field label={t('Summary')} value={agreementExtractions[0].EXTRACTED_SUMMARY || agreementExtractions[0].extracted_summary} />
              ) : null}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={850} sx={{ mb: 2 }}>{t('Next Actions')}</Typography>
              <Stack spacing={1.5}>
                {nextActions.length ? nextActions.map((item) => (
                  <Paper key={item.label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={800}>{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.helper}</Typography>
                      </Box>
                      <Button size="small" variant="contained" color={item.color} onClick={item.action}>{item.button}</Button>
                    </Stack>
                  </Paper>
                )) : (
                  <Alert severity="success">{t('No urgent case actions are pending.')}</Alert>
                )}
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" fontWeight={850} sx={{ mb: 2 }}>{t('Recent Activity')}</Typography>
              <Stack spacing={1.5}>
                {recentActivity.length ? recentActivity.map((item, i) => (
                  <Stack key={`${item.title}-${i}`} direction="row" spacing={1.5}>
                    <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: '50%', bgcolor: i === 0 ? 'primary.main' : 'divider', flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={750}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.meta}</Typography>
                    </Box>
                  </Stack>
                )) : (
                  <Alert severity="info">{t('No recent activity has been recorded for this case yet.')}</Alert>
                )}
              </Stack>
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

      {/* AI DRAFT AWARD */}
      {tab === 8 && user?.role === 'arbitrator' && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>{t('AI Draft Award')}</Typography>
            <Chip label={t('Arbitrator only')} size="small" color="primary" variant="outlined" />
          </Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('This draft is confidential and advisory only. It is visible only to the assigned arbitrator and must be reviewed, edited, and adopted independently before any actual award is issued.')}
          </Alert>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={aiAwardLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={generateAiAwardDraft}
              disabled={aiAwardLoading}
            >
              {aiAwardDraft ? t('Regenerate Draft Award') : t('Generate Draft Award')}
            </Button>
            <Button
              variant="outlined"
              onClick={loadAiAwardDraft}
              disabled={aiAwardLoading}
            >
              {t('Load Latest Draft')}
            </Button>
            {aiAwardDraft?.draftText && (
              <IconButton
                onClick={() => navigator.clipboard.writeText(aiAwardDraft.draftText).catch(() => {})}
                title={t('Copy draft')}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          {aiAwardError && <Alert severity="error" sx={{ mb: 2 }}>{aiAwardError}</Alert>}
          {aiAwardDraft ? (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`${t('Status')}: ${aiAwardDraft.status || 'draft'}`} size="small" />
                {aiAwardDraft.createdAt && <Chip label={`${t('Generated')}: ${new Date(aiAwardDraft.createdAt).toLocaleString()}`} size="small" />}
                {aiAwardDraft.sourceSnapshotHash && <Chip label={`${t('Record hash')}: ${String(aiAwardDraft.sourceSnapshotHash).slice(0, 12)}...`} size="small" variant="outlined" />}
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={18}
                value={aiAwardDraft.draftText || ''}
                InputProps={{ readOnly: true }}
                sx={{
                  '& textarea': {
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.95rem',
                    lineHeight: 1.65,
                  }
                }}
              />
            </Box>
          ) : (
            <Alert severity="info">
              {t('No AI draft award has been generated for this case yet. Generate one after the pleadings, evidence, and hearing record are ready for deliberation.')}
            </Alert>
          )}
        </Paper>
      )}

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
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.rtf,.csv,.jpg,.jpeg,.png"
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
