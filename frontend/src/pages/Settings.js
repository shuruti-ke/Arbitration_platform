// src/pages/Settings.js
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoSave: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC'
  });

  const handleSettingChange = (setting) => (event) => {
    setSettings({
      ...settings,
      [setting]: event.target.value || event.target.checked
    });
  };

  const handleSave = () => {
    // Save settings to backend
    console.log('Settings saved:', settings);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            General Settings
          </Typography>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications}
                onChange={handleSettingChange('notifications')}
                color="primary"
              />
            }
            label="Enable Notifications"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.emailAlerts}
                onChange={handleSettingChange('emailAlerts')}
                color="primary"
              />
            }
            label="Email Alerts"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSave}
                onChange={handleSettingChange('autoSave')}
                color="primary"
              />
            }
            label="Auto-save Documents"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.darkMode}
                onChange={handleSettingChange('darkMode')}
                color="primary"
              />
            }
            label="Dark Mode"
          />
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Preferences
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={settings.language}
            onChange={handleSettingChange('language')}
            label="Language"
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="sw">Swahili</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Timezone</InputLabel>
          <Select
            value={settings.timezone}
            onChange={handleSettingChange('timezone')}
            label="Timezone"
          >
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="EST">Eastern Time</MenuItem>
            <MenuItem value="PST">Pacific Time</MenuItem>
            <MenuItem value="CET">Central European Time</MenuItem>
            <MenuItem value="EAT">East Africa Time</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Save Settings
        </Button>
      </Paper>
    </Container>
  );
};

export default Settings;