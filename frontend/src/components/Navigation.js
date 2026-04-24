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
  ManageAccounts as UsersIcon,
  VerifiedUser as IPIcon,
  Payment as PaymentIcon,
  School as TrainingIcon,
  AccountBalance as CourtFilingIcon,
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

// Nav items per role — lower roles see fewer items
const NAV_ITEMS = [
  { to: '/',              icon: <DashboardIcon />,   labelKey: 'Dashboard',        roles: ['admin', 'secretariat', 'arbitrator', 'counsel', 'party'] },
  { to: '/cases',         icon: <CasesIcon />,       labelKey: 'Cases',            roles: ['admin', 'secretariat', 'arbitrator', 'counsel', 'party'] },
  { to: '/hearings',      icon: <HearingsIcon />,    labelKey: 'Hearings',         roles: ['admin', 'secretariat', 'arbitrator', 'counsel', 'party'] },
  { to: '/documents',     icon: <DocumentsIcon />,   labelKey: 'Document Library', roles: ['admin', 'secretariat', 'arbitrator', 'counsel', 'party'] },
  { to: '/analytics',     icon: <AnalyticsIcon />,   labelKey: 'Analytics',        roles: ['admin', 'secretariat'] },
  { to: '/compliance',    icon: <ComplianceIcon />,  labelKey: 'Compliance',       roles: ['admin', 'secretariat', 'arbitrator'] },
  { to: '/intelligence',  icon: <IntelligenceIcon />,labelKey: 'AI Intelligence',  roles: ['admin', 'secretariat', 'arbitrator'] },
  { to: '/ip-arbitration',icon: <IPIcon />,          labelKey: 'IP Arbitration',   roles: ['admin', 'secretariat', 'arbitrator', 'counsel'] },
  { to: '/payments',      icon: <PaymentIcon />,     labelKey: 'Account Management', roles: ['admin', 'arbitrator'] },
  { to: '/users',         icon: <UsersIcon />,       labelKey: 'Users',            roles: ['admin'] },
  { to: '/court-filing',  icon: <CourtFilingIcon />, labelKey: 'Court Filing',     roles: ['admin', 'secretariat', 'arbitrator', 'counsel'] },
  { to: '/training',      icon: <TrainingIcon />,    labelKey: 'Training',         roles: ['admin', 'secretariat', 'arbitrator', 'counsel', 'party'] },
  { to: '/settings',      icon: <SettingsIcon />,    labelKey: 'Settings',         roles: ['admin', 'secretariat'] },
];

const Navigation = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = (user?.role || '').toLowerCase();

  return (
    <AppBar position="static">
      <Toolbar variant="dense" sx={{ gap: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1, whiteSpace: 'nowrap' }}>
          {t('Arbitration Platform')}
        </Typography>

        {NAV_ITEMS.filter(item => item.roles.includes(role)).map(item => (
          <NavIcon key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} />
        ))}

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
