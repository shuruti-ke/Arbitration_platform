import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Gavel as GavelIcon, Security as SecurityIcon, Rule as RuleIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const StatusChip = ({ status }) => {
  const color = status === 'covered' ? 'success' : status === 'partial' ? 'warning' : 'error';
  return <Chip size="small" label={status} color={color} />;
};

const Compliance = () => {
  const { t } = useLanguage();
  const [gapMap, setGapMap] = useState(null);
  const [sources, setSources] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseDraft, setCaseDraft] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [gapRes, sourceRes, casesRes] = await Promise.all([
          apiService.getComplianceGapMap(),
          apiService.getLegalSources(),
          apiService.getCases()
        ]);

        setGapMap(gapRes.data);
        setSources(sourceRes.data.sources || []);
        const rows = (casesRes.data.cases || []).map((row) => ({
          caseId: row.CASE_ID || row.caseId || '',
          title: row.TITLE || row.title || '',
          status: row.STATUS || row.status || '',
          caseType: row.CASE_TYPE || row.caseType || '',
          governingLaw: row.GOVERNING_LAW || row.governingLaw || '',
          seatOfArbitration: row.SEAT_OF_ARBITRATION || row.seatOfArbitration || '',
          arbitrationRules: row.ARBITRATION_RULES || row.arbitrationRules || '',
          languageOfProceedings: row.LANGUAGE_OF_PROCEEDINGS || row.languageOfProceedings || '',
          claimantName: row.CLAIMANT_NAME || row.claimantName || '',
          respondentName: row.RESPONDENT_NAME || row.respondentName || '',
          reliefSought: row.RELIEF_SOUGHT || row.reliefSought || '',
          arbitratorNominee: row.ARBITRATOR_NOMINEE || row.arbitratorNominee || ''
        }));
        setCases(rows);
        setSelectedCaseId(rows[0]?.caseId || '');
        setError(null);
      } catch (err) {
        setError(t('Could not load compliance data. Check server connection.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [t]);

  const selectedCase = useMemo(
    () => cases.find((entry) => entry.caseId === selectedCaseId) || null,
    [cases, selectedCaseId]
  );

  useEffect(() => {
    setCaseDraft(selectedCase || {});
  }, [selectedCase]);

  const handleAssess = async () => {
    if (!selectedCase) {
      setError(t('Please select a case first.'));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await apiService.assessArbitrability(caseDraft);
      setAssessment(response.data);
    } catch (err) {
      setError(t('Arbitrability assessment failed.'));
    } finally {
      setBusy(false);
    }
  };

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
          {t('Compliance')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('The platform is designed to manage arbitration workflows in line with the Kenya Arbitration Act, Cap. 49.')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <RuleIcon color="primary" />
              <Typography variant="h6">{t('Gap Map')}</Typography>
            </Box>

            <Stack spacing={2}>
              {(gapMap?.sections || []).map((section) => (
                <Paper key={section.title} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {section.title}
                  </Typography>
                  <Stack spacing={1.5}>
                    {(section.items || []).map((item) => (
                      <Card key={item.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {item.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {item.details}
                              </Typography>
                            </Box>
                            <StatusChip status={item.status} />
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>{t('Action')}:</strong> {item.action}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <GavelIcon color="primary" />
                <Typography variant="h6">{t('Legal Sources')}</Typography>
              </Box>
              <Stack spacing={1.5}>
                {sources.map((source) => (
                  <Paper key={source.key} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {source.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {source.jurisdiction} | {source.consolidatedVersion}
                        </Typography>
                      </Box>
                      <Chip size="small" icon={<SecurityIcon />} label={source.type} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {source.notes?.join(' ')}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('Arbitrability Check')}
              </Typography>
              <Select
                fullWidth
                value={selectedCaseId}
                onChange={(event) => setSelectedCaseId(event.target.value)}
                sx={{ mb: 2 }}
              >
                {cases.map((entry) => (
                  <MenuItem key={entry.caseId} value={entry.caseId}>
                    {entry.title || entry.caseId}
                  </MenuItem>
                ))}
              </Select>

              <Stack spacing={2}>
                <TextField label={t('Case Title')} value={caseDraft.title || ''} onChange={(e) => setCaseDraft((current) => ({ ...current, title: e.target.value }))} fullWidth />
                <TextField label={t('Description')} value={caseDraft.description || ''} onChange={(e) => setCaseDraft((current) => ({ ...current, description: e.target.value }))} multiline minRows={3} fullWidth />
                <TextField label={t('Governing Law')} value={caseDraft.governingLaw || ''} onChange={(e) => setCaseDraft((current) => ({ ...current, governingLaw: e.target.value }))} fullWidth />
                <TextField label={t('Seat of Arbitration')} value={caseDraft.seatOfArbitration || ''} onChange={(e) => setCaseDraft((current) => ({ ...current, seatOfArbitration: e.target.value }))} fullWidth />
                <TextField label={t('Arbitration Rules')} value={caseDraft.arbitrationRules || ''} onChange={(e) => setCaseDraft((current) => ({ ...current, arbitrationRules: e.target.value }))} fullWidth />
                <Button variant="contained" onClick={handleAssess} disabled={busy}>
                  {busy ? t('Assessing...') : t('Assess Arbitrability')}
                </Button>
              </Stack>

              {assessment && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t('Assessment')}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {assessment.assessment}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {assessment.legalCaution}
                  </Typography>
                  {assessment.missingFields?.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>{t('Missing')}:</strong> {assessment.missingFields.join(', ')}
                    </Typography>
                  )}
                  {assessment.redFlags?.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>{t('Red flags')}:</strong> {assessment.redFlags.join(' ')}
                    </Typography>
                  )}
                </Paper>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Compliance;
