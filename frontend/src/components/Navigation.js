// src/components/Navigation.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Arbitration Platform
        </Typography>
        <Button 
          color="inherit" 
          component={Link} 
          to="/"
          startIcon={<DashboardIcon />}
        >
          Dashboard
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/cases"
          startIcon={<CasesIcon />}
        >
          Cases
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/documents"
          startIcon={<DocumentsIcon />}
        >
          Documents
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/analytics"
          startIcon={<AnalyticsIcon />}
        >
          Analytics
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/settings"
          startIcon={<SettingsIcon />}
        >
          Settings
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;