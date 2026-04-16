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

const roleColors = {
  admin: 'error',
  arbitrator: 'warning',
  secretariat: 'info',
  counsel: 'secondary',
  party: 'default'
};

const Navigation = () => {
  const { user, logout } = useAuth();
  const canManageUsers = user && (user.role === 'admin' || user.role === 'secretariat');

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          Arbitration Platform
        </Typography>
        <Button color="inherit" component={Link} to="/" startIcon={<DashboardIcon />}>
          Dashboard
        </Button>
        <Button color="inherit" component={Link} to="/cases" startIcon={<CasesIcon />}>
          Cases
        </Button>
        <Button color="inherit" component={Link} to="/hearings" startIcon={<HearingsIcon />}>
          Hearings
        </Button>
        <Button color="inherit" component={Link} to="/documents" startIcon={<DocumentsIcon />}>
          Document Library
        </Button>
        <Button color="inherit" component={Link} to="/analytics" startIcon={<AnalyticsIcon />}>
          Analytics
        </Button>
        {canManageUsers && (
          <Button color="inherit" component={Link} to="/users" startIcon={<UsersIcon />}>
            Users
          </Button>
        )}
        <Button color="inherit" component={Link} to="/settings" startIcon={<SettingsIcon />}>
          Settings
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={roleColors[user.role] || 'default'}
              sx={{ color: 'white', fontWeight: 'bold' }}
            />
            <IconButton color="inherit" onClick={logout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
