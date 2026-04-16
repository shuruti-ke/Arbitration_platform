// src/components/Navigation.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Chip, Box } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  VideoCall as HearingsIcon,
  Logout as LogoutIcon,
  ManageAccounts as UsersIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const roleLabelKey = (role) => {
  switch ((role || '').toLowerCase()) {
    case 'admin': return 'Administrator';
    case 'secretariat': return 'Secretariat';
    case 'arbitrator': return 'Arbitrator';
    case 'counsel': return 'Legal Counsel';
    case 'party': return 'Party (Claimant / Respondent)';
    default: return role || '';
  }
};

const roleColors = {
  admin: 'error',
  arbitrator: 'warning',
  secretariat: 'info',
  counsel: 'secondary',
  party: 'default'
};

const Navigation = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const canManageUsers = user && (user.role === 'admin' || user.role === 'secretariat');

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          {t('Arbitration Platform')}
        </Typography>
        <Button color="inherit" component={Link} to="/" startIcon={<DashboardIcon />}>
          {t('Dashboard')}
        </Button>
        <Button color="inherit" component={Link} to="/cases" startIcon={<CasesIcon />}>
          {t('Cases')}
        </Button>
        <Button color="inherit" component={Link} to="/hearings" startIcon={<HearingsIcon />}>
          {t('Hearings')}
        </Button>
        <Button color="inherit" component={Link} to="/documents" startIcon={<DocumentsIcon />}>
          {t('Document Library')}
        </Button>
        <Button color="inherit" component={Link} to="/analytics" startIcon={<AnalyticsIcon />}>
          {t('Analytics')}
        </Button>
        <Button color="inherit" component={Link} to="/users" startIcon={<UsersIcon />}>
          {t('Users')}
        </Button>
        <Button color="inherit" component={Link} to="/settings" startIcon={<SettingsIcon />}>
          {t('Settings')}
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Chip
              label={t(roleLabelKey(user.role))}
              size="small"
              color={roleColors[user.role] || 'default'}
              sx={{ color: 'white', fontWeight: 'bold' }}
            />
            <IconButton color="inherit" onClick={logout} title={t('Logout')}>
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
