// src/pages/Login.js
import React, { useState } from 'react';
import {
  Container, Paper, Typography, TextField,
  Button, Box, Alert, CircularProgress, Checkbox, FormControlLabel,
  Grid, Link, InputAdornment, IconButton, Stack, Divider
} from '@mui/material';

import {
  LockOutlined as LockIcon,
  Balance as BalanceIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#f4f7fb',
        py: { xs: 4, md: 7 },
      }}
    >
      <Container maxWidth="lg">
        <Paper sx={{ overflow: 'hidden', borderRadius: 3, boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)' }}>
          <Grid container>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                p: { xs: 3, md: 5 },
                color: 'white',
                minHeight: { md: 620 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  'linear-gradient(135deg, rgba(13,71,161,0.98), rgba(21,101,192,0.92)), repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 16px)',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 5 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center' }}>
                    <BalanceIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={850}>{t('Arbitration Platform')}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.84 }}>{t('Secure dispute resolution workspace')}</Typography>
                  </Box>
                </Stack>
                <Box
                  component="img"
                  src="/login-justice.jpg"
                  alt={t('Lady Justice statue')}
                  sx={{
                    width: '100%',
                    height: { xs: 260, md: 360 },
                    objectFit: 'cover',
                    objectPosition: 'center',
                    borderRadius: 3,
                    boxShadow: '0 24px 48px rgba(0,0,0,0.24)',
                    border: '1px solid rgba(255,255,255,0.24)',
                  }}
                />
              </Box>
              <Stack spacing={1.5} sx={{ mt: 5 }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <ShieldIcon fontSize="small" />
                  <Typography variant="body2">{t('Secure login protected by encrypted transport')}</Typography>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.78 }}>
                  {t('For sensitive legal data, sign out when using a shared device.')}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 3, sm: 5 }, maxWidth: 440, mx: 'auto' }}>
                <Box sx={{ mb: 3 }}>
                  <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight={850}>{t('Arbitration Platform - Sign In')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {t('Your role is detected automatically from your credentials.')}
                  </Typography>
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
            inputProps={{ 'aria-label': t('Email address') }}
          />
          <TextField
            label={t('Password')}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 1 }}
            autoComplete="current-password"
            inputProps={{ 'aria-label': t('Password') }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? t('Hide password') : t('Show password')}
                    onClick={() => setShowPassword(v => !v)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
              label={<Typography variant="body2">{t('Remember me')}</Typography>}
            />
            <Link component="button" type="button" variant="body2" underline="hover" onClick={() => setError(t('Password reset is handled by the platform administrator. Contact support to reset access.'))}>
              {t('Forgot password?')}
            </Link>
          </Stack>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ minHeight: 48, fontWeight: 800 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('Sign In')}
          </Button>
        </form>

                <Divider sx={{ my: 3 }} />
                <Stack spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    {t('This platform facilitates arbitration proceedings only. It has no arbitral authority and does not make awards or legal determinations.')}
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" useFlexGap>
                    <Link href="/charter" variant="caption" underline="hover">{t('Platform Charter')}</Link>
                    <Link href="/training" variant="caption" underline="hover">{t('Help / Support')}</Link>
                    <Link href="/settings" variant="caption" underline="hover">{t('Privacy')}</Link>
                    <Link href="/settings" variant="caption" underline="hover">{t('Terms')}</Link>
                    <Link href="mailto:support@arbplat.com" variant="caption" underline="hover">{t('Contact Support')}</Link>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
