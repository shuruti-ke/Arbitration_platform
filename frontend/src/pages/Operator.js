import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SecurityIcon from '@mui/icons-material/Security';
import apiService from '../services/api';

const statusColor = (value) => {
  if (value === true || value === 'ready' || value === 'connected') return 'success';
  if (value === false || value === 'degraded' || value === 'disconnected') return 'error';
  return 'default';
};

const Field = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={600}>{value}</Typography>
  </Box>
);

const CheckChip = ({ label, value }) => (
  <Chip size="small" label={label} color={statusColor(value)} variant={value ? 'filled' : 'outlined'} />
);

const Operator = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getOpsStatus();
      setStatus(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to load operator status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Operator</Typography>
          <Typography variant="body2" color="text.secondary">Runtime, database, configuration, and queue health.</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} variant="contained" onClick={loadStatus} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {status && !loading && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6">Database</Typography>
              </Stack>
              <Stack spacing={1.5}>
                <Chip label={status.status} color={statusColor(status.status)} sx={{ alignSelf: 'flex-start' }} />
                <Field label="Provider" value={status.database?.provider || 'unknown'} />
                <Field label="Connected" value={status.database?.connected ? 'Yes' : 'No'} />
                <Field label="Last checked" value={status.timestamp} />
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <MemoryIcon color="primary" />
                <Typography variant="h6">Runtime</Typography>
              </Stack>
              <Stack spacing={1.5}>
                <Field label="Environment" value={status.environment} />
                <Field label="Node" value={status.runtime?.node} />
                <Field label="Uptime" value={`${status.uptimeSeconds}s`} />
                <Field label="PID" value={status.runtime?.pid} />
                <Divider />
                <Field label="RSS" value={`${status.runtime?.memoryMb?.rss || 0} MB`} />
                <Field label="Heap used" value={`${status.runtime?.memoryMb?.heapUsed || 0} MB`} />
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Checks</Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                <CheckChip label="JWT secret" value={status.checks?.jwtSecret} />
                <CheckChip label="CORS origin" value={status.checks?.corsOrigin} />
                <CheckChip label="AI provider" value={status.checks?.aiProviderConfigured} />
                <CheckChip label="Email" value={status.checks?.emailConfigured} />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Field label="Training jobs" value={status.queues?.trainingJobs ?? 0} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Operator;
