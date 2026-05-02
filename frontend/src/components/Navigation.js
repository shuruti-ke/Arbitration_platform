// src/components/Navigation.js
import React, { cloneElement } from 'react';
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
  AdminPanelSettings as OperatorIcon,
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
    <IconButton
      component={Link}
      to={to}
      size="small"
      sx={{
        color: 'text.secondary',
        borderRadius: 1.5,
        p: 0.875,
        transition: 'all 140ms ease',
        '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
        '&.active': { color: 'primary.main', bgcolor: '#e8f0fe' },
      }}
    >
      {cloneElement(icon, { sx: { fontSize: 20 } })}
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
  { to: '/operator',      icon: <OperatorIcon />,    labelKey: 'Operator',         roles: ['admin'] },
];

const Navigation = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = (user?.role || '').toLowerCase();

  return (
    <AppBar position="sticky" sx={{ top: 0, zIndex: 1100 }}>
      <Toolbar variant="dense" sx={{ gap: 0.5, minHeight: 52, px: { xs: 1.5, md: 2.5 } }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, flexShrink: 0 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: 1,
            background: 'linear-gradient(135deg,#1565c0,#1976d2)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <DashboardIcon sx={{ fontSize: 16, color: '#fff' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight={800} sx={{ whiteSpace: 'nowrap', color: 'text.primary', letterSpacing: '-0.01em' }}>
            Rafiki Arbitration
          </Typography>
        </Box>

        {/* Nav icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {NAV_ITEMS.filter(item => item.roles.includes(role)).map(item => (
            <NavIcon key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} />
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* User info */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="caption" fontWeight={700} color="text.primary" display="block" sx={{ lineHeight: 1.2 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                {roleLabelKey(user.role)}
              </Typography>
            </Box>
            <Chip
              label={t(roleLabelKey(user.role))}
              size="small"
              color={roleColors[user.role] || 'default'}
              sx={{ fontWeight: 700, display: { xs: 'flex', sm: 'none' } }}
            />
            <Tooltip title={t('Logout')} arrow>
              <IconButton onClick={logout} size="small"
                sx={{ color: 'text.secondary', borderRadius: 1.5, '&:hover': { color: 'error.main', bgcolor: '#fef2f2' } }}>
                <LogoutIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
