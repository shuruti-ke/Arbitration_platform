// src/pages/Hearings.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Button, Grid, Card,
  CardContent, CardActions, Chip, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress
} from '@mui/material';
import {
  VideoCall as VideoIcon,
  Add as AddIcon,
  Gavel as GavelIcon,
  DeleteForever as DeleteIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { getApiErrorMessage } from '../services/apiErrors';
import { useLanguage } from '../context/LanguageContext';

const statusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'primary';
    case 'in-progress': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const titleizeCode = (value) => String(value || '')
  .trim()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\b\w/g, (ch) => ch.toUpperCase());

const codeKey = (value) => String(value || '').trim().toLowerCase();

const Hearings = () => {
  const { user, hasRole } = useAuth();
  const { t } = useLanguage();
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [joinUrl, setJoinUrl] = useState(null);

  const [newHearing, setNewHearing] = useState({
    caseId: '', title: '', startTime: '', endTime: '', type: 'virtual', agenda: ''
  });

  const [newAssignment, setNewAssignment] = useState({
    caseId: '', arbitratorId: '', role: 'sole'
  });

  useEffect(() => {
    fetchHearings();
  }, []);

  const displayEnum = (value, overrides = {}) => {
    const raw = codeKey(value);
    if (!raw) return '';
    return t(overrides[raw] || titleizeCode(value));
  };

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

  const displayAssignmentRole = (value) => displayEnum(value, {
    sole: 'Sole Arbitrator',
    presiding: 'Presiding Arbitrator',
    'co-arbitrator': 'Co-Arbitrator',
    emergency: 'Emergency Arbitrator'
  });

  const fetchHearings = async () => {
    try {
      const res = await apiService.getHearings();
      setHearings(res.data.hearings || []);
    } catch (err) {
      setError(getApiErrorMessage(err, t('Could not load hearings.')));
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    try {
      const res = await apiService.createHearing(newHearing);
      setHearings(prev => [res.data.hearing, ...prev]);
      setScheduleOpen(false);
      setNewHearing({ caseId: '', title: '', startTime: '', endTime: '', type: 'virtual', agenda: '' });
    } catch (err) {
      setError(getApiErrorMessage(err, t('Failed to schedule hearing.')));
    }
  };

  const handleAssign = async () => {
    try {
      await apiService.assignArbitrator(newAssignment);
      setAssignOpen(false);
      setNewAssignment({ caseId: '', arbitratorId: '', role: 'sole' });
      setError(null);
      alert(t('Arbitrator assigned successfully. Awaiting acceptance.'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('Failed to assign arbitrator.')));
    }
  };

  const handleJoin = async (hearingId) => {
    try {
      const res = await apiService.joinHearing(hearingId);
      setJoinUrl(res.data.jitsiUrl);
    } catch (err) {
      setError(getApiErrorMessage(err, t('Failed to join hearing.')));
    }
  };

  const handleDelete = async (hearingId, title) => {
    if (!window.confirm(t('Delete hearing "{{title}}"? You can schedule it again afterward if needed.', { title }))) return;
    try {
      await apiService.deleteHearing(hearingId);
      setHearings(prev => prev.filter(h => (h.HEARING_ID || h.hearingId) !== hearingId));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('Failed to delete hearing.')));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">{t('Hearings')}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasRole('admin', 'secretariat', 'arbitrator') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setScheduleOpen(true)}>
              {t('Schedule Hearing')}
            </Button>
          )}
          {hasRole('admin', 'secretariat') && (
            <Button variant="outlined" startIcon={<GavelIcon />} onClick={() => setAssignOpen(true)}>
              {t('Assign Arbitrator')}
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {joinUrl && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setJoinUrl(null)}>
          {t('Hearing room ready.')} {' '}
          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
            {t('Click here to join')}
          </a>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : hearings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <VideoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">{t('No hearings scheduled yet.')}</Typography>
          {hasRole('admin', 'secretariat', 'arbitrator') && (
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => setScheduleOpen(true)}>
              {t('Schedule First Hearing')}
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {hearings.map((h, i) => {
            const hId     = h.HEARING_ID  || h.hearingId;
            const title   = h.TITLE       || h.title;
            const status  = h.STATUS      || h.status;
            const caseId  = h.CASE_ID     || h.caseId;
            const start   = h.START_TIME  || h.startTime;
            const end     = h.END_TIME    || h.endTime;
            const agenda  = h.AGENDA      || h.agenda;
            const type    = h.TYPE        || h.type;
            return (
            <Grid item xs={12} md={6} key={hId || i}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{title}</Typography>
                    <Chip label={displayHearingStatus(status)} color={statusColor(status)} size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">{t('Case')}: {caseId}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">{start} — {end}</Typography>
                  </Box>
                  {agenda && (
                    <Typography variant="body2" sx={{ mt: 1 }} color="textSecondary">
                      {agenda}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  {hasRole('admin', 'secretariat') && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(hId, title)}
                    >
                      {t('Delete')}
                    </Button>
                  )}
                  {type === 'virtual' && status !== 'cancelled' && (
                    <Button size="small" variant="contained" startIcon={<VideoIcon />}
                      onClick={() => handleJoin(hId)}>
                      {t('Join')}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
            );
          })}
        </Grid>
      )}

      {/* Schedule Hearing Dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Schedule Hearing')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('Case ID')} value={newHearing.caseId} onChange={e => setNewHearing({ ...newHearing, caseId: e.target.value })} fullWidth required />
          <TextField label={t('Title')} value={newHearing.title} onChange={e => setNewHearing({ ...newHearing, title: e.target.value })} fullWidth />
          <TextField label={t('Start Time')} type="datetime-local" value={newHearing.startTime} onChange={e => setNewHearing({ ...newHearing, startTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
          <TextField label={t('End Time')} type="datetime-local" value={newHearing.endTime} onChange={e => setNewHearing({ ...newHearing, endTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
          <FormControl fullWidth>
            <InputLabel>{t('Type')}</InputLabel>
            <Select value={newHearing.type} label={t('Type')} onChange={e => setNewHearing({ ...newHearing, type: e.target.value })}>
              <MenuItem value="virtual">{t('Virtual')}</MenuItem>
              <MenuItem value="in-person">{t('In-Person')}</MenuItem>
              <MenuItem value="hybrid">{t('Hybrid')}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={t('Agenda')} value={newHearing.agenda} onChange={e => setNewHearing({ ...newHearing, agenda: e.target.value })} fullWidth multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleSchedule}>{t('Schedule')}</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Arbitrator Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Assign Arbitrator')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('Case ID')} value={newAssignment.caseId} onChange={e => setNewAssignment({ ...newAssignment, caseId: e.target.value })} fullWidth required />
          <TextField label={t('Arbitrator User ID')} value={newAssignment.arbitratorId} onChange={e => setNewAssignment({ ...newAssignment, arbitratorId: e.target.value })} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>{t('Role')}</InputLabel>
            <Select value={newAssignment.role} label={t('Role')} onChange={e => setNewAssignment({ ...newAssignment, role: e.target.value })}>
              <MenuItem value="sole">{t('Sole Arbitrator')}</MenuItem>
              <MenuItem value="presiding">{displayAssignmentRole('presiding')}</MenuItem>
              <MenuItem value="co-arbitrator">{displayAssignmentRole('co-arbitrator')}</MenuItem>
              <MenuItem value="emergency">{displayAssignmentRole('emergency')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleAssign}>{t('Assign')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Hearings;
