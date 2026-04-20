// src/pages/CourtFiling.js
import React, { useState, useRef } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Chip, TextField, InputAdornment, Accordion, AccordionSummary,
  AccordionDetails, Alert, Button, Divider, List, ListItem,
  ListItemText, ListItemIcon, Paper, Tabs, Tab, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckIcon,
  Warning as WarnIcon,
  Cancel as NoIcon,
  Public as GlobeIcon,
  AutoAwesome as AIIcon,
  CloudUpload as UploadIcon,
  TaskAlt as TaskAltIcon,
  Error as ErrorIcon,
  HelpOutline as PartialIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiService from '../services/api';
import { getApiErrorMessage } from '../services/apiErrors';

const JURISDICTIONS = [
  {
    country: 'Kenya',
    region: 'Africa',
    nyConvention: true,
    year: 1989,
    court: 'High Court of Kenya (Commercial Division)',
    timeLimit: '3 years from award date',
    requirements: [
      'Original or certified copy of the arbitration agreement',
      'Original or certified copy of the award',
      'Certified translation if award is not in English',
      'Petition to enforce filed in the Commercial Division',
    ],
    grounds: [
      'Incapacity of a party',
      'Invalid arbitration agreement',
      'Lack of proper notice',
      'Award outside scope of submission',
      'Irregular tribunal composition',
      'Award not yet binding or set aside',
      'Non-arbitrable subject matter',
      'Public policy violation',
    ],
    notes: 'Kenya enacted the Arbitration Act (Cap. 49) in 1995, amended 2010. NCIA is the primary institution.',
    institutions: ['NCIA', 'Nairobi Centre for International Arbitration'],
  },
  {
    country: 'United Kingdom',
    region: 'Europe',
    nyConvention: true,
    year: 1975,
    court: 'High Court (Commercial Court, Queen\'s Bench Division)',
    timeLimit: '6 years from award date',
    requirements: [
      'Certified copy of the award',
      'Original arbitration agreement or certified copy',
      'Evidence that award is binding',
      'Application for permission to enforce (CPR Part 62)',
    ],
    grounds: [
      'Serious irregularity affecting the tribunal, proceedings, or award',
      'Jurisdictional challenge',
      'Substantive appeal (if agreed or with court permission)',
      'Public policy grounds',
    ],
    notes: 'UK Arbitration Act 1996 governs. London is a leading arbitration seat — LCIA, ICC London, CIArb.',
    institutions: ['LCIA', 'ICC', 'CIArb', 'ICSID'],
  },
  {
    country: 'United States',
    region: 'Americas',
    nyConvention: true,
    year: 1970,
    court: 'Federal District Court or State Court',
    timeLimit: '3 years (federal), varies by state',
    requirements: [
      'Duly authenticated original award or certified copy',
      'Original arbitration agreement or certified copy',
      'Certified translation if not in English',
      'Petition to confirm filed in federal or state court',
    ],
    grounds: [
      'Award procured by corruption, fraud, or undue means',
      'Evident partiality or corruption of arbitrators',
      'Misconduct of arbitrators prejudicing party rights',
      'Arbitrators exceeded their powers',
      'NY Convention grounds (for foreign awards)',
    ],
    notes: 'Federal Arbitration Act (FAA) governs. Chapter 2 implements the New York Convention. Major seats: NY, DC, Miami.',
    institutions: ['AAA/ICDR', 'JAMS', 'ICC', 'ICSID'],
  },
  {
    country: 'Singapore',
    region: 'Asia',
    nyConvention: true,
    year: 1986,
    court: 'Singapore High Court',
    timeLimit: '6 years from award date',
    requirements: [
      'Originating summons to enforce the award',
      'Affidavit exhibiting the award and arbitration agreement',
      'Certified translation if not in English',
    ],
    grounds: [
      'Party under incapacity',
      'Invalid arbitration agreement',
      'Lack of proper notice or unable to present case',
      'Award outside scope of submission',
      'Irregular tribunal composition',
      'Award set aside or suspended',
      'Non-arbitrable subject matter',
      'Public policy violation',
    ],
    notes: 'International Arbitration Act (IAA) and Arbitration Act govern. SIAC is the premier institution. Singapore is a top-tier seat.',
    institutions: ['SIAC', 'ICC', 'ICSID'],
  },
  {
    country: 'France',
    region: 'Europe',
    nyConvention: true,
    year: 1959,
    court: 'Paris Court of Appeal (Cour d\'appel de Paris)',
    timeLimit: '1 month from exequatur (recognition order)',
    requirements: [
      'Original award or certified copy',
      'Original arbitration agreement or certified copy',
      'Certified French translation',
      'Application for exequatur (recognition)',
    ],
    grounds: [
      'Non-arbitrable subject matter',
      'Violation of international public policy (ordre public)',
      'Invalid arbitration agreement',
      'Irregular constitution of tribunal',
    ],
    notes: 'French Code of Civil Procedure (Articles 1504-1527) governs international arbitration. ICC headquartered in Paris.',
    institutions: ['ICC', 'CMAP'],
  },
  {
    country: 'UAE / DIFC',
    region: 'Middle East',
    nyConvention: true,
    year: 2006,
    court: 'DIFC Courts or onshore UAE Courts',
    timeLimit: '15 years (DIFC), varies onshore',
    requirements: [
      'Certified copy of award',
      'Certified copy of arbitration agreement',
      'Arabic translation for onshore UAE courts',
      'Application to ratify (onshore) or enforce (DIFC)',
    ],
    grounds: [
      'Federal Arbitration Law No. 6 of 2018 grounds (onshore)',
      'DIFC Arbitration Law grounds (offshore)',
      'NY Convention grounds',
      'Public policy',
    ],
    notes: 'UAE Federal Arbitration Law 2018 modernized the framework. DIFC-LCIA and DIAC are primary institutions.',
    institutions: ['DIAC', 'DIFC-LCIA', 'ICC'],
  },
  {
    country: 'Nigeria',
    region: 'Africa',
    nyConvention: true,
    year: 1970,
    court: 'Federal High Court or State High Court',
    timeLimit: '6 years from award date',
    requirements: [
      'Authenticated original award or certified copy',
      'Original arbitration agreement or certified copy',
      'Application for leave to enforce (originating motion)',
    ],
    grounds: [
      'Incapacity of a party',
      'Invalid agreement',
      'Lack of notice',
      'Excess of powers',
      'Improper tribunal composition',
      'Non-arbitrable subject matter',
      'Public policy',
    ],
    notes: 'Arbitration and Conciliation Act 1988 (revised 2004). New Arbitration Act 2023 recently enacted. Lagos is a key seat.',
    institutions: ['LCIA Nigeria', 'ICAMA', 'Lagos Court of Arbitration'],
  },
  {
    country: 'South Africa',
    region: 'Africa',
    nyConvention: true,
    year: 1976,
    court: 'High Court',
    timeLimit: '3 years from award date',
    requirements: [
      'Certified copy of the award',
      'Certified copy of the arbitration agreement',
      'Application to make the award an order of court',
    ],
    grounds: [
      'Misconduct of arbitrator',
      'Irregularity in proceedings',
      'Arbitrator exceeded powers',
      'Award improperly obtained',
      'NY Convention grounds for foreign awards',
    ],
    notes: 'International Arbitration Act 2017 implements the UNCITRAL Model Law. AFSA is the primary institution.',
    institutions: ['AFSA', 'SAAET'],
  },
];

const regionColors = { Africa: 'success', Europe: 'primary', Americas: 'error', Asia: 'warning', 'Middle East': 'secondary' };

const complianceColor = { compliant: 'success', partial: 'warning', 'non-compliant': 'error' };
const statusIcon = {
  met: <TaskAltIcon fontSize="small" color="success" />,
  partial: <PartialIcon fontSize="small" color="warning" />,
  missing: <ErrorIcon fontSize="small" color="error" />,
};
const riskColor = { low: 'success', medium: 'warning', high: 'error' };

// ─── AI Compliance Checker panel ─────────────────────────────────────────────
function ComplianceChecker({ t }) {
  const { user } = useAuth();
  const canCheck = ['admin', 'secretariat', 'arbitrator', 'counsel'].includes(user?.role);

  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const fileRef = useRef(null);

  const jurisdiction = JURISDICTIONS.find(j => j.country === selectedJurisdiction);

  const TEXT_EXTS = ['txt', 'text', 'md', 'csv', 'rtf'];
  const BINARY_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

  const MAX_SIZE = 3.5 * 1024 * 1024;

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setExtractError(t(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 3.5 MB.`));
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    setDocumentText('');
    setExtractError(null);
    setReport(null);
    const ext = file.name.split('.').pop().toLowerCase();

    if (TEXT_EXTS.includes(ext)) {
      // Read directly as text
      const reader = new FileReader();
      reader.onload = (ev) => setDocumentText(ev.target.result);
      reader.readAsText(file);
    } else if (BINARY_EXTS.includes(ext)) {
      // Send to backend for extraction
      setExtracting(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target.result.split(',')[1];
          const res = await apiService.extractText(base64, file.name);
          setDocumentText(res.data.text);
        } catch (err) {
          setExtractError(t('Could not extract text from this file. Please paste the text manually.'));
        } finally {
          setExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setExtractError(t('Unsupported file type. Please upload PDF, Word, Excel, or text files.'));
    }
  };

  const handleCheck = async () => {
    if (!jurisdiction || !documentText.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await apiService.checkCourtFilingCompliance(jurisdiction, documentText.trim());
      setReport(res.data.report);
    } catch (err) {
      setError(getApiErrorMessage(err, t('Compliance check failed. Please try again.')));
    } finally {
      setLoading(false);
    }
  };

  if (!canCheck) {
    return (
      <Alert severity="info">
        {t('Document compliance checking is available to arbitrators, counsel, secretariat, and administrators.')}
      </Alert>
    );
  }

  return (
    <Box>
      <Alert severity="info" icon={<AIIcon />} sx={{ mb: 3 }}>
        {t('Upload your award document and select a jurisdiction. The AI will review the document against that jurisdiction\'s specific enforcement requirements and flag any compliance issues.')}
      </Alert>

      <Grid container spacing={3}>
        {/* Left: inputs */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('1. Select Jurisdiction')}</Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('Enforcement Jurisdiction')}</InputLabel>
              <Select
                value={selectedJurisdiction}
                label={t('Enforcement Jurisdiction')}
                onChange={e => { setSelectedJurisdiction(e.target.value); setReport(null); }}
              >
                {JURISDICTIONS.map(j => (
                  <MenuItem key={j.country} value={j.country}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GavelIcon fontSize="small" color="action" />
                      {j.country}
                      <Chip label={j.region} size="small" color={regionColors[j.region] || 'default'} variant="outlined" sx={{ ml: 'auto' }} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {jurisdiction && (
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5, mb: 3 }}>
                <Typography variant="caption" color="text.secondary">{jurisdiction.court}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('Time limit')}: {jurisdiction.timeLimit}
                </Typography>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('2. Provide Document')}</Typography>

            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf" style={{ display: 'none' }} onChange={handleFile} />
            <Button
              variant="outlined"
              startIcon={extracting ? <CircularProgress size={16} /> : <UploadIcon />}
              onClick={() => { setExtractError(null); fileRef.current?.click(); }}
              fullWidth
              sx={{ mb: 0.5 }}
              disabled={extracting}
            >
              {extracting ? t('Extracting text…') : (fileName || t('Upload document'))}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              PDF · Word (.docx) · Excel (.xlsx) · Text — max 3.5 MB
            </Typography>
            {extractError && <Alert severity="warning" sx={{ mb: 1.5 }}>{extractError}</Alert>}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {t('Or paste document text below:')}
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={10}
              value={documentText}
              onChange={e => setDocumentText(e.target.value)}
              placeholder={t('Paste award text, petition, or filing document here…')}
              sx={{ fontFamily: 'monospace' }}
              inputProps={{ style: { fontSize: '0.8rem', fontFamily: 'monospace' } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {documentText.length > 0 ? `${documentText.length.toLocaleString()} ${t('characters')}` : ''}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AIIcon />}
                onClick={handleCheck}
                disabled={loading || !jurisdiction || !documentText.trim()}
              >
                {loading ? t('Analysing…') : t('Check Compliance')}
              </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Paper>
        </Grid>

        {/* Right: results */}
        <Grid item xs={12} md={7}>
          {loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {t('AI is reviewing your document against')} {selectedJurisdiction} {t('requirements…')}
              </Typography>
              <LinearProgress sx={{ mt: 3 }} />
            </Paper>
          )}

          {!loading && !report && (
            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <AIIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="body2">
                {t('Select a jurisdiction and provide your document to receive an AI compliance assessment.')}
              </Typography>
            </Paper>
          )}

          {report && (
            <Paper sx={{ p: 3 }}>
              {/* Overall */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{t('Compliance Assessment')} — {report.jurisdiction}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('Checked at')}: {report.checkedAt ? new Date(report.checkedAt).toLocaleString() : ''}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color={`${complianceColor[report.overallCompliance] || 'primary'}.main`}>
                    {report.score}%
                  </Typography>
                  <Chip
                    label={report.overallCompliance?.replace('-', ' ').toUpperCase()}
                    color={complianceColor[report.overallCompliance] || 'default'}
                    size="small"
                  />
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={report.score || 0}
                color={complianceColor[report.overallCompliance] || 'primary'}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />

              <Alert severity={complianceColor[report.overallCompliance] === 'success' ? 'success' : complianceColor[report.overallCompliance] === 'warning' ? 'warning' : 'error'} sx={{ mb: 3 }}>
                {report.summary}
              </Alert>

              {/* Requirements checks */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Filing Requirements')}</Typography>
              {(report.checks || []).map((check, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Box sx={{ mt: 0.25 }}>{statusIcon[check.status] || statusIcon.partial}</Box>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{check.requirement}</Typography>
                    <Typography variant="caption" color="text.secondary">{check.finding}</Typography>
                  </Box>
                  <Chip label={check.status} size="small" color={check.status === 'met' ? 'success' : check.status === 'partial' ? 'warning' : 'error'} sx={{ ml: 'auto', flexShrink: 0 }} />
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Risk grounds */}
              {(report.potentialGrounds || []).length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Enforcement Risk — Grounds to Refuse')}</Typography>
                  {report.potentialGrounds.map((g, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <WarnIcon fontSize="small" color={riskColor[g.risk] || 'warning'} sx={{ mt: 0.25 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={500}>{g.ground}</Typography>
                        <Typography variant="caption" color="text.secondary">{g.finding}</Typography>
                      </Box>
                      <Chip label={g.risk?.toUpperCase()} size="small" color={riskColor[g.risk] || 'default'} sx={{ flexShrink: 0 }} />
                    </Box>
                  ))}
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Recommendations */}
              {(report.recommendations || []).length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Recommendations')}</Typography>
                  <List dense disablePadding>
                    {report.recommendations.map((rec, i) => (
                      <ListItem key={i} sx={{ pl: 0, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><CheckIcon fontSize="small" color="primary" /></ListItemIcon>
                        <ListItemText primary={<Typography variant="body2">{rec}</Typography>} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('This AI assessment is for guidance only. Always engage qualified local counsel before filing enforcement proceedings.')}
              </Alert>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const CourtFiling = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = JURISDICTIONS.filter(j =>
    j.country.toLowerCase().includes(search.toLowerCase()) ||
    j.region.toLowerCase().includes(search.toLowerCase()) ||
    j.institutions.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">{t('Court Filing & Enforcement')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('AI-powered compliance checker and jurisdiction-specific enforcement guides.')}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab
            label={t('AI Compliance Checker')}
            icon={<AIIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab label={t('Jurisdiction Guides')} icon={<GlobeIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB 0: AI Compliance Checker */}
      {tab === 0 && <ComplianceChecker t={t} />}

      {/* TAB 1: Jurisdiction Guides */}
      {tab === 1 && (
        <>
          <Alert severity="info" sx={{ mb: 3 }} icon={<GlobeIcon />}>
            {t('These guides provide general information only. Always consult qualified local counsel before filing enforcement proceedings.')}
          </Alert>

          <TextField
            fullWidth
            label={t('Search by country, region, or institution')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {filtered.length} {t('jurisdictions')} · {JURISDICTIONS.filter(j => j.nyConvention).length} {t('NY Convention signatories')}
            </Typography>
          </Box>

          {filtered.map((j) => (
            <Accordion key={j.country} expanded={expanded === j.country} onChange={(_, open) => setExpanded(open ? j.country : null)} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                  <GavelIcon color="action" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{j.country}</Typography>
                    <Typography variant="caption" color="text.secondary">{j.court}</Typography>
                  </Box>
                  <Chip label={j.region} size="small" color={regionColors[j.region] || 'default'} variant="outlined" />
                  {j.nyConvention
                    ? <Chip label={`NY Convention ${j.year}`} size="small" color="success" icon={<CheckIcon />} />
                    : <Chip label="Non-signatory" size="small" color="error" icon={<NoIcon />} />
                  }
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('Filing Requirements')}</Typography>
                    <List dense disablePadding>
                      {j.requirements.map((req, i) => (
                        <ListItem key={i} sx={{ pl: 0, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><CheckIcon fontSize="small" color="primary" /></ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">{req}</Typography>} />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2"><strong>{t('Time Limit')}:</strong> {j.timeLimit}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <strong>{t('Institutions')}:</strong> {j.institutions.join(', ')}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AIIcon />}
                      color="secondary"
                      sx={{ mt: 2 }}
                      onClick={() => setTab(0)}
                    >
                      {t('Check document for this jurisdiction')}
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('Grounds to Refuse Enforcement')}</Typography>
                    <List dense disablePadding>
                      {j.grounds.map((g, i) => (
                        <ListItem key={i} sx={{ pl: 0, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><WarnIcon fontSize="small" color="warning" /></ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">{g}</Typography>} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 1 }}>{j.notes}</Alert>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}
    </Container>
  );
};

export default CourtFiling;
