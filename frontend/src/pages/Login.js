// src/pages/Login.js
import React, { useState } from 'react';
import {
  Container, Paper, Typography, TextField,
  Button, Box, Alert, CircularProgress, Chip
} from '@mui/material';

import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/apiErrors';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err, t('Login failed. Please check your credentials.')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">{t('Arbitration Platform')}</Typography>
            <Typography variant="body2" color="textSecondary">{t('Sign in to your account')}</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
              {t('Arbitration Facilitation Platform — Case management and hearing support for arbitration proceedings')}
            </Typography>
            <Alert severity="info" variant="outlined" sx={{ mt: 1, mb: 0 }}>
              {t('This platform facilitates arbitration proceedings only. It has no arbitral authority and does not make awards or legal determinations.')}
            </Alert>
          </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label={t('Email')}
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            autoComplete="email"
          />
          <TextField
            label={t('Password')}
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('Sign In')}
          </Button>
        </form>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['admin', 'arbitrator', 'secretariat', 'counsel', 'party'].map(role => (
            <Chip key={role} label={t(role === 'counsel' ? 'Legal Counsel' : role === 'party' ? 'Party (Claimant / Respondent)' : role === 'admin' ? 'Administrator' : role === 'secretariat' ? 'Secretariat' : 'Arbitrator')} size="small" variant="outlined" />
          ))}
        </Box>

        <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          <a href="/charter" style={{ color: 'inherit' }}>Platform Charter & Legal Documents</a>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;
