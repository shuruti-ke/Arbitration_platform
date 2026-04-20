// src/App.js
import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeModeProvider, useThemeMode } from './context/ThemeModeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import AgreementEditor from './pages/AgreementEditor';
import CaseDetail from './pages/CaseDetail';
import Documents from './pages/Documents';
import Analytics from './pages/Analytics';
import Intelligence from './pages/Intelligence';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import Hearings from './pages/Hearings';
import Users from './pages/Users';
import Login from './pages/Login';
import IPArbitration from './pages/IPArbitration';
import Payments from './pages/Payments';
import Training from './pages/Training';
import CourtFiling from './pages/CourtFiling';
import Navigation from './components/Navigation';
import OfflineBanner from './components/OfflineBanner';
import './styles/App.css';

const buildTheme = (mode, direction) =>
  createTheme({
    direction,
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f5f5f5',
        paper: mode === 'dark' ? '#111827' : '#ffffff'
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#0f172a' : '#f5f5f5',
            color: mode === 'dark' ? '#f8fafc' : '#111827',
            direction
          }
        }
      }
    }
  });

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      {user && <Navigation />}
      {user && <OfflineBanner />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
        <Route path="/cases/agreement" element={<ProtectedRoute><AgreementEditor /></ProtectedRoute>} />
        <Route path="/cases/:caseId" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/intelligence" element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/hearings" element={<ProtectedRoute><Hearings /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/ip-arbitration" element={<ProtectedRoute><IPArbitration /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
        <Route path="/court-filing" element={<ProtectedRoute><CourtFiling /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const AppShell = () => {
  const { mode } = useThemeMode();
  const { dir } = useLanguage();
  const theme = useMemo(() => buildTheme(mode, dir), [mode, dir]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App" dir={dir}>
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <LanguageProvider>
      <ThemeModeProvider>
        <AppShell />
      </ThemeModeProvider>
    </LanguageProvider>
  );
}

export default App;
