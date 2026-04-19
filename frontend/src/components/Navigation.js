// src/components/Navigation.js
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Chip, Box, Tooltip } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as IntelligenceIcon,
  Policy as ComplianceIcon,
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
    case 'party': return 'Party';
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

const NavIcon = ({ to, icon, label }) => (
  <Tooltip title={label} arrow>
    <IconButton color="inherit" component={Link} to={to} size="medium">
      {icon}
    </IconButton>
  </Tooltip>
);

const Navigation = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <AppBar position="static">
      <Toolbar variant="dense" sx={{ gap: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1, whiteSpace: 'nowrap' }}>
          {t('Arbitration Platform')}
        </Typography>

        <NavIcon to="/"            icon={<DashboardIcon />}    label={t('Dashboard')} />
        <NavIcon to="/cases"       icon={<CasesIcon />}        label={t('Cases')} />
        <NavIcon to="/hearings"    icon={<HearingsIcon />}     label={t('Hearings')} />
        <NavIcon to="/documents"   icon={<DocumentsIcon />}    label={t('Document Library')} />
        <NavIcon to="/analytics"   icon={<AnalyticsIcon />}    label={t('Analytics')} />
        <NavIcon to="/compliance"  icon={<ComplianceIcon />}   label={t('Compliance')} />
        <NavIcon to="/intelligence" icon={<IntelligenceIcon />} label={t('AI Intelligence')} />
        <NavIcon to="/users"       icon={<UsersIcon />}        label={t('Users')} />
        <NavIcon to="/settings"    icon={<SettingsIcon />}     label={t('Settings')} />

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, whiteSpace: 'nowrap' }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Chip
              label={t(roleLabelKey(user.role))}
              size="small"
              color={roleColors[user.role] || 'default'}
              sx={{ color: 'white', fontWeight: 'bold' }}
            />
            <Tooltip title={t('Logout')} arrow>
              <IconButton color="inherit" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
