// src/pages/AwardVerification.js
import React, { useState } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper,
  Alert, CircularProgress, Divider, Chip, InputAdornment,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  GppBad as NotVerifiedIcon,
  Search as SearchIcon,
  Fingerprint as HashIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';
import apiService from '../services/api';
import { getApiErrorMessage } from '../services/apiErrors';
import { useLanguage } from '../context/LanguageContext';

const AwardVerification = () => {
  const { t } = useLanguage();
  const [hash, setHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiService.verifyAwardHash(hash.trim());
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ verified: false, message: t('Hash not found in registry') });
      } else {
        setError(getApiErrorMessage(err, t('Verification failed. Please try again.')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <GavelIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('Award Verification')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Verify the authenticity of an arbitral award pack by entering its SHA-256 verification hash.')}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {t('Enter Verification Hash')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            value={hash}
            onChange={e => setHash(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. a3f2b1c4d5e6..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HashIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
            }}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            onClick={handleVerify}
            disabled={loading || !hash.trim()}
            sx={{ minWidth: 130, height: 56 }}
          >
            {t('Verify')}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {result && (
        <Paper sx={{ p: 4 }}>
          {result.verified ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <VerifiedIcon sx={{ fontSize: 36, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" color="success.main" fontWeight={700}>
                    {t('Award Verified')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('This hash is registered in the platform award registry.')}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{t('Title')}:</Typography>
                  <Typography variant="body2" fontWeight={500}>{result.title}</Typography>
                </Box>
                {result.caseId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{t('Case ID')}:</Typography>
                    <Typography variant="body2" fontWeight={500}>{result.caseId}</Typography>
                  </Box>
                )}
                {result.seat && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{t('Seat')}:</Typography>
                    <Typography variant="body2" fontWeight={500}>{result.seat}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{t('Status')}:</Typography>
                  <Chip
                    label={result.status === 'ready' ? t('Ready') : t('Needs Review')}
                    color={result.status === 'ready' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{t('Generated At')}:</Typography>
                  <Typography variant="body2">{new Date(result.generatedAt).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{t('Hash')}:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all', color: 'text.secondary', mt: 0.25 }}>
                    {result.hash}
                  </Typography>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <NotVerifiedIcon sx={{ fontSize: 36, color: 'error.main' }} />
              <Box>
                <Typography variant="h6" color="error.main" fontWeight={700}>
                  {t('Not Verified')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.message || t('This hash is not registered in the platform award registry.')}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      <Box sx={{ mt: 4, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {t('Award verification hashes are generated using SHA-256 when an award pack is finalised on this platform. Each hash uniquely identifies the award pack at the time of generation. This does not constitute legal certification — always consult qualified legal counsel.')}
        </Typography>
      </Box>
    </Container>
  );
};

export default AwardVerification;
