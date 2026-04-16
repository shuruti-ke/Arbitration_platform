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

const statusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'primary';
    case 'in-progress': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const Hearings = () => {
  const { user, hasRole } = useAuth();
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

  const fetchHearings = async () => {
    try {
      const res = await apiService.getHearings();
      setHearings(res.data.hearings || []);
    } catch (err) {
      setError('Could not load hearings.');
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
      setError(err.response?.data?.error || 'Failed to schedule hearing.');
    }
  };

  const handleAssign = async () => {
    try {
      await apiService.assignArbitrator(newAssignment);
      setAssignOpen(false);
      setNewAssignment({ caseId: '', arbitratorId: '', role: 'sole' });
      setError(null);
      alert('Arbitrator assigned successfully. Awaiting acceptance.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign arbitrator.');
    }
  };

  const handleJoin = async (hearingId) => {
    try {
      const res = await apiService.joinHearing(hearingId);
      setJoinUrl(res.data.jitsiUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join hearing.');
    }
  };

  const handleDelete = async (hearingId, title) => {
    if (!window.confirm(`Delete hearing "${title}"? You can schedule it again afterward if needed.`)) return;
    try {
      await apiService.deleteHearing(hearingId);
      setHearings(prev => prev.filter(h => (h.HEARING_ID || h.hearingId) !== hearingId));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete hearing.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Hearings</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasRole('admin', 'secretariat', 'arbitrator') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setScheduleOpen(true)}>
              Schedule Hearing
            </Button>
          )}
          {hasRole('admin', 'secretariat') && (
            <Button variant="outlined" startIcon={<GavelIcon />} onClick={() => setAssignOpen(true)}>
              Assign Arbitrator
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {joinUrl && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setJoinUrl(null)}>
          Hearing room ready.{' '}
          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
            Click here to join
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
          <Typography variant="h6" color="textSecondary">No hearings scheduled yet.</Typography>
          {hasRole('admin', 'secretariat', 'arbitrator') && (
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => setScheduleOpen(true)}>
              Schedule First Hearing
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
                    <Chip label={status} color={statusColor(status)} size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">Case: {caseId}</Typography>
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
                      Delete
                    </Button>
                  )}
                  {type === 'virtual' && status !== 'cancelled' && (
                    <Button size="small" variant="contained" startIcon={<VideoIcon />}
                      onClick={() => handleJoin(hId)}>
                      Join
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
        <DialogTitle>Schedule Hearing</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Case ID" value={newHearing.caseId} onChange={e => setNewHearing({ ...newHearing, caseId: e.target.value })} fullWidth required />
          <TextField label="Title" value={newHearing.title} onChange={e => setNewHearing({ ...newHearing, title: e.target.value })} fullWidth />
          <TextField label="Start Time" type="datetime-local" value={newHearing.startTime} onChange={e => setNewHearing({ ...newHearing, startTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
          <TextField label="End Time" type="datetime-local" value={newHearing.endTime} onChange={e => setNewHearing({ ...newHearing, endTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={newHearing.type} label="Type" onChange={e => setNewHearing({ ...newHearing, type: e.target.value })}>
              <MenuItem value="virtual">Virtual</MenuItem>
              <MenuItem value="in-person">In-Person</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Agenda" value={newHearing.agenda} onChange={e => setNewHearing({ ...newHearing, agenda: e.target.value })} fullWidth multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSchedule}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Arbitrator Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Arbitrator</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Case ID" value={newAssignment.caseId} onChange={e => setNewAssignment({ ...newAssignment, caseId: e.target.value })} fullWidth required />
          <TextField label="Arbitrator User ID" value={newAssignment.arbitratorId} onChange={e => setNewAssignment({ ...newAssignment, arbitratorId: e.target.value })} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={newAssignment.role} label="Role" onChange={e => setNewAssignment({ ...newAssignment, role: e.target.value })}>
              <MenuItem value="sole">Sole Arbitrator</MenuItem>
              <MenuItem value="presiding">Presiding Arbitrator</MenuItem>
              <MenuItem value="co-arbitrator">Co-Arbitrator</MenuItem>
              <MenuItem value="emergency">Emergency Arbitrator</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Hearings;
