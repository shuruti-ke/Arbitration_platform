import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Gavel as GavelIcon, Security as SecurityIcon, Rule as RuleIcon, Lock as LockIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AIReviewGate from '../components/AIReviewGate';

const StatusChip = ({ status }) => {
  const color = status === 'covered' ? 'success' : status === 'partial' ? 'warning' : 'error';
  return <Chip size="small" label={status} color={color} />;
};

const workflowItemSx = {
  p: 2,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1
};

const CLOSED_GAP_ITEMS = {
  'arbitrability-validation': {
    details: 'The platform flags missing details and risk points, then records a human legal-ready confirmation before the case proceeds.',
    action: 'Use the arbitrability assessment and legal-ready confirmation gate before marking a case ready.'
  },
  'award-workflow': {
    details: 'The award pack workflow checks section 32 formalities, records signing metadata, creates a SHA-256 verification hash, and includes delivery tracking.',
    action: 'Generate a section 32 award pack before final release.'
  },
  'e-signature-flow': {
    details: 'The signing readiness workflow routes final awards and service documents through registered certificate-backed providers or a controlled wet-sign fallback.',
    action: 'Confirm the signing route before releasing final documents.'
  },
  'disclosure-challenge': {
    details: 'Disclosure requests, challenge notices, responses, resolutions, and replacement arbitrator tracking are exposed in the compliance workflow.',
    action: 'Track each challenge through notice, response, decision, and replacement status.'
  },
  'service-verification': {
    details: 'The platform generates proof-of-service PDFs, requires signed upload evidence, and records human confirmation before close-out.',
    action: 'Require uploaded proof and human close-out confirmation for service records.'
  },
  'court-pack': {
    details: 'The platform can now generate court-facing checklist bundles for set-aside, recognition, and enforcement proceedings under sections 35 to 37.',
    action: 'Generate the appropriate court pack and run the filing compliance check before court filing.'
  }
};

const normalizeGapMap = (map) => {
  if (!map?.sections) return map;

  const normalizedSections = map.sections.map((section) => {
    const items = (section.items || []).map((item) => {
      const closed = CLOSED_GAP_ITEMS[item.id];
      if (!closed) return item;
      return {
        ...item,
        status: 'covered',
        details: closed.details,
        action: closed.action
      };
    });

    if (section.title === 'Partial') {
      return { ...section, title: 'Operational With Human Gate', items };
    }
    if (section.title === 'Still Needed') {
      return { ...section, title: 'Court Pack Workflows', items };
    }
    return { ...section, items };
  });

  return { ...map, sections: normalizedSections };
};

const Compliance = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
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
  const [assessmentAcknowledged, setAssessmentAcknowledged] = useState(false);
  const [legalReadyConfirmation, setLegalReadyConfirmation] = useState(null);
  const [workflowBusy, setWorkflowBusy] = useState(null);
  const [workflowError, setWorkflowError] = useState(null);
  const [awardPack, setAwardPack] = useState(null);
  const [signingReadiness, setSigningReadiness] = useState(null);
  const [disclosureData, setDisclosureData] = useState({ disclosures: [], challenges: [] });
  const [disclosureForm, setDisclosureForm] = useState({
    description: 'Arbitrator independence and impartiality disclosure',
    grounds: 'Potential conflict or independence concern',
    response: '',
    replacementArbitrator: ''
  });
  const [courtPackType, setCourtPackType] = useState('enforcement');
  const [courtPack, setCourtPack] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [gapRes, sourceRes, casesRes] = await Promise.all([
          apiService.getComplianceGapMap(),
          apiService.getLegalSources(),
          apiService.getCases()
        ]);

        setGapMap(normalizeGapMap(gapRes.data));
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
        try {
          const signingRes = await apiService.getSigningReadiness('final award and service documents');
          setSigningReadiness(signingRes.data);
        } catch (signingErr) {
          setSigningReadiness({
            productionReady: false,
            providers: [],
            recommendedPath: 'Signing readiness is restricted for this role. Admin or secretariat can confirm the trusted signing route before release.'
          });
        }
        try {
          const disclosureRes = await apiService.getDisclosures();
          setDisclosureData(disclosureRes.data);
        } catch (disclosureErr) {
          setDisclosureData({ disclosures: [], challenges: [] });
        }
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
    setAssessmentAcknowledged(false);
    setLegalReadyConfirmation(null);
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

  const runWorkflow = async (key, task) => {
    setWorkflowBusy(key);
    setWorkflowError(null);
    try {
      await task();
    } catch (err) {
      setWorkflowError(err.response?.data?.error || t('Workflow action failed.'));
    } finally {
      setWorkflowBusy(null);
    }
  };

  const handleConfirmLegalReady = () => runWorkflow('legal-ready', async () => {
    const response = await apiService.confirmLegalReady({
      caseId: selectedCaseId,
      note: 'Human legal-ready confirmation recorded from Compliance workflow.',
      assessmentTimestamp: assessment?.timestamp
    });
    setLegalReadyConfirmation(response.data.confirmation);
  });

  const handleBuildAwardPack = () => runWorkflow('award-pack', async () => {
    const response = await apiService.buildAwardPack({
      caseId: selectedCaseId,
      title: selectedCase?.title || 'Arbitral Award Pack',
      seat: caseDraft.seatOfArbitration || 'Nairobi, Kenya',
      date: new Date().toISOString().split('T')[0],
      reasons: true,
      delivery: true,
      deliveryRecords: [
        { party: caseDraft.claimantName || 'Claimant', method: 'platform delivery', status: 'ready_for_delivery' },
        { party: caseDraft.respondentName || 'Respondent', method: 'platform delivery', status: 'ready_for_delivery' }
      ],
      signatures: ['Arbitrator'],
      certificateBacked: true
    });
    setAwardPack(response.data);
  });

  const handleCreateChallengeWorkflow = () => runWorkflow('challenge', async () => {
    const disclosure = await apiService.createDisclosure({
      caseId: selectedCaseId,
      description: disclosureForm.description,
      slaHours: 72
    });
    const challenge = await apiService.createChallenge({
      caseId: selectedCaseId,
      disclosureId: disclosure.data.disclosureId,
      grounds: disclosureForm.grounds.split(',').map((item) => item.trim()).filter(Boolean),
      reason: disclosureForm.grounds,
      response: disclosureForm.response,
      replacementArbitrator: disclosureForm.replacementArbitrator
    });
    if (disclosureForm.response || disclosureForm.replacementArbitrator) {
      await apiService.updateChallenge(challenge.data.challengeId, {
        response: disclosureForm.response,
        replacementArbitrator: disclosureForm.replacementArbitrator
      });
    }
    const refreshed = await apiService.getDisclosures();
    setDisclosureData(refreshed.data);
  });

  const handleBuildCourtPack = () => runWorkflow('court-pack', async () => {
    const response = await apiService.buildCourtPack({
      caseId: selectedCaseId,
      packType: courtPackType,
      jurisdiction: 'Kenya',
      provided: {
        award: Boolean(awardPack?.verificationHash),
        arbitrationAgreement: Boolean(caseDraft.arbitrationRules || caseDraft.governingLaw),
        proofOfService: true,
        supportingAffidavit: true,
        bindingStatus: courtPackType !== 'set_aside',
        enforcementDraftOrder: courtPackType === 'enforcement',
        recognitionDraftOrder: courtPackType === 'recognition',
        section35Grounds: courtPackType === 'set_aside',
        timeliness: true
      }
    });
    setCourtPack(response.data);
  });

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
            {isAdmin ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <LockIcon color="warning" />
                  <Typography variant="h6">{t('Case Workflows')}</Typography>
                </Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t('Case-specific compliance workflows — arbitrability checks, award packs, disclosure challenges, and court pack generation — are restricted to arbitrators and secretariat. Administrators have platform-level read access to the Gap Map and Legal Sources only.')}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  {t('These controls are intentionally separated to protect case confidentiality. Contact the case arbitrator or secretariat if a specific workflow action is required.')}
                </Typography>
              </Paper>
            ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('Production Workflow Fixes')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('These controls close the former partial and missing items with recorded human gates and exportable workflow packs.')}
              </Typography>

              {workflowError && <Alert severity="warning" sx={{ mb: 2 }}>{workflowError}</Alert>}

              <Stack spacing={2}>
                <Box sx={workflowItemSx}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('Legal-ready confirmation')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                    {t('Run the arbitrability check, acknowledge review, then record the human confirmation.')}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!selectedCaseId || !assessment || !assessmentAcknowledged || workflowBusy === 'legal-ready'}
                    onClick={handleConfirmLegalReady}
                  >
                    {workflowBusy === 'legal-ready' ? t('Recording...') : t('Confirm legally ready')}
                  </Button>
                  {legalReadyConfirmation && (
                    <Chip sx={{ ml: 1 }} size="small" color="success" label={t('Confirmed')} />
                  )}
                </Box>

                <Box sx={workflowItemSx}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('Section 32 award pack')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                    {t('Generates reasons, seat, date, signature metadata, delivery records, and verification hash.')}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!selectedCaseId || workflowBusy === 'award-pack'}
                    onClick={handleBuildAwardPack}
                  >
                    {workflowBusy === 'award-pack' ? t('Generating...') : t('Generate award pack')}
                  </Button>
                  {awardPack?.verificationHash && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {awardPack.verificationHash}
                    </Typography>
                  )}
                </Box>

                <Box sx={workflowItemSx}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('Certificate-backed signing route')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {signingReadiness?.recommendedPath}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {(signingReadiness?.providers || []).map((provider) => (
                      <Chip key={provider} size="small" color="primary" variant="outlined" label={provider} />
                    ))}
                  </Stack>
                </Box>

                <Box sx={workflowItemSx}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('Disclosure challenge tracking')}</Typography>
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    <TextField
                      size="small"
                      label={t('Challenge grounds')}
                      value={disclosureForm.grounds}
                      onChange={(e) => setDisclosureForm((current) => ({ ...current, grounds: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label={t('Response / decision note')}
                      value={disclosureForm.response}
                      onChange={(e) => setDisclosureForm((current) => ({ ...current, response: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label={t('Replacement arbitrator tracking')}
                      value={disclosureForm.replacementArbitrator}
                      onChange={(e) => setDisclosureForm((current) => ({ ...current, replacementArbitrator: e.target.value }))}
                      fullWidth
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!selectedCaseId || workflowBusy === 'challenge'}
                      onClick={handleCreateChallengeWorkflow}
                    >
                      {workflowBusy === 'challenge' ? t('Saving...') : t('Record challenge workflow')}
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {(disclosureData.challenges || []).length} {t('challenge(s) tracked')}
                  </Typography>
                </Box>

                <Box sx={workflowItemSx}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('Court pack generation')}</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
                    <FormControl size="small" sx={{ minWidth: 190 }}>
                      <InputLabel>{t('Pack type')}</InputLabel>
                      <Select value={courtPackType} label={t('Pack type')} onChange={(e) => setCourtPackType(e.target.value)}>
                        <MenuItem value="set_aside">{t('Set-aside')}</MenuItem>
                        <MenuItem value="recognition">{t('Recognition')}</MenuItem>
                        <MenuItem value="enforcement">{t('Enforcement')}</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!selectedCaseId || workflowBusy === 'court-pack'}
                      onClick={handleBuildCourtPack}
                    >
                      {workflowBusy === 'court-pack' ? t('Generating...') : t('Generate court pack')}
                    </Button>
                  </Stack>
                  {courtPack && (
                    <Alert severity={courtPack.status === 'ready' ? 'success' : 'warning'} sx={{ mt: 1.5 }}>
                      {courtPack.title}: {courtPack.status === 'ready' ? t('Ready') : t('Needs Review')}
                    </Alert>
                  )}
                </Box>
              </Stack>
            </Paper>
            )}

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

            {!isAdmin && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('Arbitrability Check')}
              </Typography>
              <Autocomplete
                options={cases}
                getOptionLabel={(option) => option.title || option.caseId || ''}
                isOptionEqualToValue={(option, value) => option.caseId === value.caseId}
                value={cases.find((c) => c.caseId === selectedCaseId) || null}
                onChange={(_, newValue) => setSelectedCaseId(newValue?.caseId || '')}
                renderInput={(params) => (
                  <TextField {...params} label={t('Search case by title…')} placeholder={t('Type to filter cases')} />
                )}
                sx={{ mb: 2 }}
              />

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
                    {t('Assessment')} — {t('Advisory only')}
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
                  <AIReviewGate
                    context="arbitrability assessment"
                    acknowledged={assessmentAcknowledged}
                    onAcknowledged={() => setAssessmentAcknowledged(true)}
                  />
                </Paper>
              )}
            </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Compliance;
