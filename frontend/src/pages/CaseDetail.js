// src/pages/CaseDetail.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Tabs, Tab, Chip, Grid,
  CircularProgress, Alert, Button, Divider, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow, Stepper,
  Step, StepLabel, StepContent, IconButton, Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Description as DocIcon,
  VideoCall as HearingIcon,
  Timeline as TimelineIcon,
  History as AuditIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const Field = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Box>
);

const STAGE_ORDER = ['filing', 'response', 'arbitrator_appointment', 'terms_of_reference', 'hearing', 'deliberation', 'award', 'closed'];

const CaseDetail = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getCase(caseId);
        setData(res.data);
      } catch (err) {
        setError('Failed to load case details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [caseId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const c = data.case;
  const parties = data.parties || [];
  const counsel = data.counsel || [];
  const milestones = data.milestones || [];
  const documents = data.documents || [];
  const hearings = data.hearings || [];
  const auditLog = data.auditLog || [];

  const claimants = parties.filter(p => (p.PARTY_TYPE || p.partyType) === 'claimant');
  const respondents = parties.filter(p => (p.PARTY_TYPE || p.partyType) === 'respondent');

  const statusColor = (s) => s === 'active' ? 'primary' : s === 'completed' ? 'success' : 'warning';

  const currentStage = c.CASE_STAGE || c.caseStage || 'filing';
  const stageIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={() => navigate('/cases')}><BackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">{c.TITLE || c.title}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip label={c.CASE_ID || c.caseId} size="small" variant="outlined" />
            <Chip label={c.STATUS || c.status} size="small" color={statusColor(c.STATUS || c.status)} />
            <Chip label={`Stage: ${currentStage}`} size="small" variant="outlined" color="info" />
            {(c.CASE_TYPE || c.caseType) && <Chip label={c.CASE_TYPE || c.caseType} size="small" />}
            {(c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel) &&
              <Chip label={c.CONFIDENTIALITY_LEVEL || c.confidentialityLevel} size="small" color="warning" />}
          </Box>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Parties (${parties.length})`} />
          <Tab label={`Counsel (${counsel.length})`} />
          <Tab label={`Documents (${documents.length})`} />
          <Tab label={`Hearings (${hearings.length})`} />
          <Tab label="Timeline" />
          <Tab label="Audit Log" />
        </Tabs>
      </Paper>

      {/* OVERVIEW */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Case Details</Typography>
              <Field label="Case ID" value={c.CASE_ID || c.caseId} />
              <Field label="Title" value={c.TITLE || c.title} />
              <Field label="Case Type" value={c.CASE_TYPE || c.caseType} />
              <Field label="Sector / Industry" value={c.SECTOR || c.sector} />
              <Field label="Dispute Category" value={c.DISPUTE_CATEGORY || c.disputeCategory} />
              <Field label="Status" value={c.STATUS || c.status} />
              <Field label="Current Stage" value={c.CASE_STAGE || c.caseStage} />
              <Field label="Description" value={c.DESCRIPTION || c.description} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Financial</Typography>
              <Field label="Dispute Amount"
                value={(c.DISPUTE_AMOUNT || c.disputeAmount)
                  ? `${c.CURRENCY || c.currency || 'USD'} ${Number(c.DISPUTE_AMOUNT || c.disputeAmount).toLocaleString()}`
                  : null} />
              <Field label="Currency" value={c.CURRENCY || c.currency} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Key Dates</Typography>
              <Field label="Filing Date" value={c.FILING_DATE ? new Date(c.FILING_DATE).toLocaleDateString() : null} />
              <Field label="Response Deadline" value={c.RESPONSE_DEADLINE ? new Date(c.RESPONSE_DEADLINE).toLocaleDateString() : null} />
              <Field label="Created At" value={c.CREATED_AT ? new Date(c.CREATED_AT).toLocaleDateString() : null} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Procedural</Typography>
              <Field label="Arbitration Rules" value={c.ARBITRATION_RULES || c.arbitrationRules} />
              <Field label="Seat of Arbitration" value={c.SEAT_OF_ARBITRATION || c.seatOfArbitration} />
              <Field label="Governing Law" value={c.GOVERNING_LAW || c.governingLaw} />
              <Field label="Language of Proceedings" value={c.LANGUAGE_OF_PROCEEDINGS || c.languageOfProceedings} />
              <Field label="Number of Arbitrators" value={c.NUM_ARBITRATORS || c.numArbitrators} />
              <Field label="Institution Reference" value={c.INSTITUTION_REF || c.institutionRef} />
              <Field label="Third Party Funding" value={(c.THIRD_PARTY_FUNDING || c.thirdPartyFunding) ? 'Yes' : 'No'} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Case Progression</Typography>
              <Stepper activeStep={stageIndex} orientation="vertical">
                {STAGE_ORDER.map((stage) => (
                  <Step key={stage} completed={STAGE_ORDER.indexOf(stage) < stageIndex}>
                    <StepLabel>{stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* PARTIES */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {parties.length === 0 && (
            <Grid item xs={12}><Alert severity="info">No parties added yet.</Alert></Grid>
          )}
          {claimants.map((p, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">Claimant</Typography>
                  <Chip label={p.ENTITY_TYPE || p.entityType || ''} size="small" />
                </Box>
                <Field label="Full Name" value={p.FULL_NAME || p.fullName} />
                <Field label="Organization" value={p.ORGANIZATION_NAME || p.organizationName} />
                <Field label="Nationality" value={p.NATIONALITY || p.nationality} />
                <Field label="Email" value={p.EMAIL || p.email} />
                <Field label="Phone" value={p.PHONE || p.phone} />
                <Field label="Address" value={p.ADDRESS || p.address} />
                <Field label="Tax / Business ID" value={p.TAX_ID || p.taxId} />
              </Paper>
            </Grid>
          ))}
          {respondents.map((p, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="error" />
                  <Typography variant="subtitle1" fontWeight="bold">Respondent</Typography>
                  <Chip label={p.ENTITY_TYPE || p.entityType || ''} size="small" />
                </Box>
                <Field label="Full Name" value={p.FULL_NAME || p.fullName} />
                <Field label="Organization" value={p.ORGANIZATION_NAME || p.organizationName} />
                <Field label="Nationality" value={p.NATIONALITY || p.nationality} />
                <Field label="Email" value={p.EMAIL || p.email} />
                <Field label="Phone" value={p.PHONE || p.phone} />
                <Field label="Address" value={p.ADDRESS || p.address} />
                <Field label="Tax / Business ID" value={p.TAX_ID || p.taxId} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* COUNSEL */}
      {tab === 2 && (
        <Paper>
          {counsel.length === 0
            ? <Box sx={{ p: 3 }}><Alert severity="info">No counsel added yet.</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Law Firm</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Bar No.</TableCell>
                    <TableCell>Languages</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {counsel.map((co, i) => (
                    <TableRow key={i}>
                      <TableCell>{co.FULL_NAME || co.fullName}</TableCell>
                      <TableCell>{co.LAW_FIRM || co.lawFirm}</TableCell>
                      <TableCell><Chip label={co.ROLE || co.role || 'counsel'} size="small" /></TableCell>
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
            ? <Box sx={{ p: 3 }}><Alert severity="info">No documents uploaded yet.</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document Name</TableCell>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Uploaded</TableCell>
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
            ? <Box sx={{ p: 3 }}><Alert severity="info">No hearings scheduled yet.</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hearing ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hearings.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>{h.HEARING_ID || h.hearingId}</TableCell>
                      <TableCell>{h.TITLE || h.title}</TableCell>
                      <TableCell>{h.TYPE || h.type}</TableCell>
                      <TableCell>{h.START_TIME || h.startTime}</TableCell>
                      <TableCell>{h.END_TIME || h.endTime}</TableCell>
                      <TableCell><Chip label={h.STATUS || h.status} size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </Paper>
      )}

      {/* TIMELINE */}
      {tab === 5 && (
        <Paper sx={{ p: 3 }}>
          {milestones.length === 0
            ? <Alert severity="info">No milestones found.</Alert>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Milestone</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {milestones.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{m.TITLE || m.title}</TableCell>
                      <TableCell>{(m.MILESTONE_TYPE || m.milestoneType || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{m.DUE_DATE ? new Date(m.DUE_DATE).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{m.COMPLETED_DATE ? new Date(m.COMPLETED_DATE).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Chip label={m.STATUS || m.status}
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
            ? <Box sx={{ p: 3 }}><Alert severity="info">No audit log entries.</Alert></Box>
            : <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Date</TableCell>
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
    </Container>
  );
};

export default CaseDetail;
