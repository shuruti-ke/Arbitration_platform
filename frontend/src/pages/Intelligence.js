import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  AutoAwesome as IntelligenceIcon,
  Bolt as BoltIcon,
  Business as AdminIcon,
  CheckCircle as CheckIcon,
  Insights as InsightsIcon,
  Psychology as PsychologyIcon,
  Report as ReportIcon,
  Search as SearchIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AIReviewGate from '../components/AIReviewGate';

const MetricCard = ({ label, value, icon, color = 'primary.main' }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ color }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const asCount = (rows = [], key = 'status', value = '') => {
  const needle = String(value || '').toLowerCase();
  const match = rows.find((row) => String(row[key] || row[key.toUpperCase()] || row[0] || '').toLowerCase() === needle);
  if (!match) return 0;
  return parseInt(match.count || match.COUNT || match[1] || 0, 10) || 0;
};

const totalFromRows = (rows = []) =>
  rows.reduce((sum, row) => sum + (parseInt(row.count || row.COUNT || row[1] || 0, 10) || 0), 0);

const Intelligence = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isAdmin = (user?.role || user?.ROLE || '').toLowerCase() === 'admin';

  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [question, setQuestion] = useState('');
  const [companionResult, setCompanionResult] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('30');
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompanion, setLoadingCompanion] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);
  const [companionAcknowledged, setCompanionAcknowledged] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [apiService.getCases()];
        if (isAdmin) {
          requests.push(apiService.getIntelligenceSummary(30));
          requests.push(apiService.getIntelligenceHistory({ limit: 10 }));
        }

        const responses = await Promise.all(requests);
        const casesResponse = responses[0];
        const caseRows = (casesResponse.data.cases || []).map((row) => ({
          id: row.ID || row.id,
          caseId: row.CASE_ID || row.caseId || '',
          title: row.TITLE || row.title || '',
          status: row.STATUS || row.status || ''
        }));

        setCases(caseRows);
        setSelectedCaseId((current) => current || (caseRows[0]?.caseId || ''));

        if (isAdmin) {
          setSummary(responses[1].data);
          setHistory(responses[2].data.reports || []);
        }

        setError(null);
      } catch (err) {
        setError(t('Could not load intelligence data. Check server connection.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, t]);

  const handleGenerateCompanion = async () => {
    if (!selectedCaseId) {
      setError(t('Please select a case first.'));
      return;
    }
    if (!question.trim()) {
      setError(t('Please enter a question for the companion.'));
      return;
    }

    setLoadingCompanion(true);
    setCompanionAcknowledged(false);
    setError(null);
    try {
      const response = await apiService.generateCompanionAnalysis({
        caseId: selectedCaseId,
        question,
        language
      });
      setCompanionResult(response.data.analysis);
    } catch (err) {
      setError(t('Companion analysis failed.'));
    } finally {
      setLoadingCompanion(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setError(null);
    try {
      const response = await apiService.generateAdminReport({
        periodDays: parseInt(reportPeriod, 10) || 30,
        language,
        scope: 'platform'
      });
      setReportResult(response.data.report);
      if (isAdmin) {
        const historyResponse = await apiService.getIntelligenceHistory({ limit: 10 });
        setHistory(historyResponse.data.reports || []);
      }
    } catch (err) {
      setError(t('Admin report generation failed.'));
    } finally {
      setLoadingReport(false);
    }
  };

  const selectedCase = cases.find((entry) => entry.caseId === selectedCaseId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('AI Intelligence')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Augmented companion support for arbitrators, plus admin-only intelligence reports and analytics.')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <PsychologyIcon color="primary" />
              <Typography variant="h6">{t('AI Companion')}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('The companion learns from case files, documents, hearings, and audit history.')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth>
                  <InputLabel>{t('Select a case')}</InputLabel>
                  <Select
                    value={selectedCaseId}
                    label={t('Select a case')}
                    onChange={(event) => setSelectedCaseId(event.target.value)}
                  >
                    {cases.map((entry) => (
                      <MenuItem key={entry.caseId} value={entry.caseId}>
                        {entry.title || entry.caseId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  label={t('Question')}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={t('Ask about the selected case, evidence gaps, deadlines, risks, or procedure.')}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={loadingCompanion ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                  onClick={handleGenerateCompanion}
                  disabled={loadingCompanion}
                >
                  {loadingCompanion ? t('Generating...') : t('Generate Analysis')}
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {companionResult ? (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<CheckIcon />} label={t('Analysis ready')} color="success" />
                  <Chip icon={<SecurityIcon />} label={`${t('Confidence')}: ${String(companionResult.confidence || 'medium')}`} />
                  <Chip label={selectedCase?.title || selectedCaseId} />
                </Box>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {t('Summary')}
                  </Typography>
                  <Typography variant="body2">
                    {companionResult.executiveSummary || companionResult.rawText}
                  </Typography>
                </Paper>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {t('Key Findings')}
                      </Typography>
                      <List dense disablePadding>
                        {toList(companionResult.keyFindings).map((item, index) => (
                          <ListItem key={`${item}-${index}`} disableGutters sx={{ py: 0.25 }}>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {t('Risks')}
                      </Typography>
                      <List dense disablePadding>
                        {toList(companionResult.risks).map((item, index) => (
                          <ListItem key={`${item}-${index}`} disableGutters sx={{ py: 0.25 }}>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {t('Recommendations')}
                  </Typography>
                  <List dense disablePadding>
                    {toList(companionResult.recommendations).map((item, index) => (
                      <ListItem key={`${item}-${index}`} disableGutters sx={{ py: 0.25 }}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <MetricCard label={t('Parties')} value={companionResult.dataSnapshot?.parties ?? 0} icon={<SecurityIcon />} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard label={t('Counsel')} value={companionResult.dataSnapshot?.counsel ?? 0} icon={<ReportIcon />} color="secondary.main" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard label={t('Documents')} value={companionResult.dataSnapshot?.documents ?? 0} icon={<InsightsIcon />} color="success.main" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard label={t('Hearings')} value={companionResult.dataSnapshot?.hearings ?? 0} icon={<BoltIcon />} color="warning.main" />
                  </Grid>
                </Grid>

                {toList(companionResult.followUpQuestions).length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      {t('Follow-up Questions')}
                    </Typography>
                    <List dense disablePadding>
                      {toList(companionResult.followUpQuestions).map((item, index) => (
                        <ListItem key={`${item}-${index}`} disableGutters sx={{ py: 0.25 }}>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <AIReviewGate
                    context="companion analysis"
                    acknowledged={companionAcknowledged}
                    onAcknowledged={() => setCompanionAcknowledged(true)}
                  />
                </Paper>
              </Stack>
            ) : (
              <Alert severity="info">{t('Generate a case analysis to populate the companion view.')}</Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          {isAdmin ? (
            <Stack spacing={3}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <AdminIcon color="secondary" />
                  <Typography variant="h6">{t('Admin Reports')}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('Private to administrators. Use this to create saleable reports, premium analytics packs, and export-ready briefings.')}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('Coverage')}</InputLabel>
                      <Select
                        value={reportPeriod}
                        label={t('Coverage')}
                        onChange={(event) => setReportPeriod(event.target.value)}
                      >
                        <MenuItem value="30">{t('Last 30 days')}</MenuItem>
                        <MenuItem value="90">{t('Last 90 days')}</MenuItem>
                        <MenuItem value="365">{t('All time')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={loadingReport ? <CircularProgress size={18} color="inherit" /> : <ReportIcon />}
                      onClick={handleGenerateReport}
                      disabled={loadingReport}
                      sx={{ height: '56px' }}
                    >
                      {loadingReport ? t('Generating...') : t('Generate Report')}
                    </Button>
                  </Grid>
                </Grid>

                {summary && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <MetricCard label={t('Active')} value={asCount(summary.caseStatus, 'status', 'active')} icon={<SecurityIcon />} />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard label={t('Pending')} value={asCount(summary.caseStatus, 'status', 'pending')} icon={<ReportIcon />} color="warning.main" />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard label={t('Completed')} value={asCount(summary.caseStatus, 'status', 'completed')} icon={<CheckIcon />} color="success.main" />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard label={t('Overdue')} value={summary.overdueMilestones || 0} icon={<BoltIcon />} color="error.main" />
                    </Grid>
                  </Grid>
                )}
              </Paper>

              {summary && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    {t('Intelligence Snapshot')}
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disableGutters>
                      <ListItemText primary={t('Case stages tracked')} secondary={totalFromRows(summary.caseStage || [])} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText primary={t('Document library items')} secondary={totalFromRows(summary.documentAccess || [])} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText primary={t('Registered roles')} secondary={totalFromRows(summary.roles || [])} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText primary={t('System health')} secondary={summary.health?.status || t('Unknown')} />
                    </ListItem>
                  </List>
                </Paper>
              )}

              {reportResult && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {reportResult.title || t('Admin Report')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {reportResult.executiveSummary || reportResult.rawText}
                  </Typography>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    {t('Commercial Highlights')}
                  </Typography>
                  <List dense disablePadding>
                    {toList(reportResult.commercialHighlights).map((item, index) => (
                      <ListItem key={`${item}-${index}`} disableGutters sx={{ py: 0.25 }}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  {t('Recent Intelligence Runs')}
                </Typography>
                {history.length > 0 ? (
                  <List dense disablePadding>
                    {history.map((entry) => (
                      <ListItem key={entry.reportId} disableGutters sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={entry.title || t('Untitled report')}
                          secondary={`${entry.reportType || ''} · ${entry.summary || ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">{t('No intelligence runs yet.')}</Alert>
                )}
              </Paper>
            </Stack>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AdminIcon color="disabled" />
                <Typography variant="h6">{t('Admin Reports')}</Typography>
              </Box>
              <Alert severity="info">{t('This section is reserved for system administrators and premium report generation.')}</Alert>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [String(value)];
};

export default Intelligence;
