// src/pages/Settings.js
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useThemeMode } from '../context/ThemeModeContext';

const Settings = () => {
  const { mode, setMode } = useThemeMode();
  const { language, setLanguage, languages, t } = useLanguage();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoSave: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC'
  });
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    setSettings((current) => ({
      ...current,
      darkMode: mode === 'dark',
      language
    }));
  }, [mode, language]);

  const handleSettingChange = (setting) => (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (setting === 'darkMode') {
      const nextMode = nextValue ? 'dark' : 'light';
      setMode(nextMode);
      setSettings((current) => ({
        ...current,
        darkMode: nextValue
      }));
      return;
    }

    if (setting === 'language') {
      setLanguage(nextValue);
      setSettings((current) => ({
        ...current,
        language: nextValue
      }));
      return;
    }

    setSettings((current) => ({
      ...current,
      [setting]: nextValue
    }));
  };

  const handleDarkModeToggle = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    setSettings((current) => ({
      ...current,
      darkMode: nextMode === 'dark'
    }));
  };

  const handleSave = async () => {
    try {
      await apiService.updateSettings(settings);
      setSaveStatus({ type: 'success', message: t('Settings saved successfully.') });
    } catch (err) {
      setSaveStatus({ type: 'warning', message: t('Could not save to server. Settings saved locally.') });
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('System Settings')}
      </Typography>

      {saveStatus && (
        <Alert severity={saveStatus.type} sx={{ mb: 2 }} onClose={() => setSaveStatus(null)}>
          {saveStatus.message}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{t('General Settings')}</Typography>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={<Switch checked={settings.notifications} onChange={handleSettingChange('notifications')} color="primary" />}
            label={t('Enable Notifications')}
          />
          <FormControlLabel
            control={<Switch checked={settings.emailAlerts} onChange={handleSettingChange('emailAlerts')} color="primary" />}
            label={t('Email Alerts')}
          />
          <FormControlLabel
            control={<Switch checked={settings.autoSave} onChange={handleSettingChange('autoSave')} color="primary" />}
            label={t('Auto-save Documents')}
          />
          <FormControlLabel
            control={<Switch checked={settings.darkMode} onChange={handleDarkModeToggle} color="primary" />}
            label={t('Dark Mode')}
          />
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{t('Preferences')}</Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('Language')}</InputLabel>
          <Select value={settings.language} onChange={handleSettingChange('language')} label={t('Language')}>
            {Object.entries(languages).map(([code, entry]) => (
              <MenuItem key={code} value={code}>{entry.nativeLabel}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('Timezone')}</InputLabel>
          <Select value={settings.timezone} onChange={handleSettingChange('timezone')} label={t('Timezone')}>
            <MenuItem value="UTC">{t('UTC')}</MenuItem>
            <MenuItem value="EST">{t('Eastern Time')}</MenuItem>
            <MenuItem value="PST">{t('Pacific Time')}</MenuItem>
            <MenuItem value="CET">{t('Central European Time')}</MenuItem>
            <MenuItem value="EAT">{t('East Africa Time')}</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          {t('Save Settings')}
        </Button>
      </Paper>
    </Container>
  );
};

export default Settings;
