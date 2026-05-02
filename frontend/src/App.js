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
import AwardVerification from './pages/AwardVerification';
import PlatformCharter from './pages/PlatformCharter';
import Operator from './pages/Operator';
import Navigation from './components/Navigation';
import OfflineBanner from './components/OfflineBanner';
import TosAcceptanceModal from './components/TosAcceptanceModal';
import MeetingDock from './components/MeetingDock';
import './styles/App.css';

const buildTheme = (mode, direction) =>
  createTheme({
    direction,
    palette: {
      mode,
      primary:   { main: '#1565c0', light: '#1976d2', dark: '#0d47a1', contrastText: '#fff' },
      secondary: { main: '#6a1b9a', contrastText: '#fff' },
      success:   { main: '#2e7d32', contrastText: '#fff' },
      warning:   { main: '#e65100', contrastText: '#fff' },
      error:     { main: '#c62828', contrastText: '#fff' },
      info:      { main: '#0277bd', contrastText: '#fff' },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f7f9fc',
        paper:   mode === 'dark' ? '#1e293b' : '#ffffff',
      },
      divider: mode === 'dark' ? '#334155' : '#e8edf3',
      text: {
        primary:   mode === 'dark' ? '#f1f5f9' : '#111827',
        secondary: mode === 'dark' ? '#94a3b8' : '#6b7280',
        disabled:  mode === 'dark' ? '#64748b' : '#9ca3af',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
      h3: { fontWeight: 800, letterSpacing: '-0.03em' },
      h4: { fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 700, fontSize: '0.8125rem' },
      body1: { fontSize: '0.9375rem' },
      body2: { fontSize: '0.875rem' },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      overline: { letterSpacing: '0.12em', fontSize: '0.7rem', fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#0f172a' : '#f7f9fc',
            color: mode === 'dark' ? '#f1f5f9' : '#111827',
            direction,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            color: mode === 'dark' ? '#f1f5f9' : '#111827',
            borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e8edf3'}`,
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ ownerState }) => ({
            ...(ownerState.elevation === 0 && {
              border: `1px solid ${mode === 'dark' ? '#334155' : '#e8edf3'}`,
            }),
            borderRadius: 8,
          }),
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${mode === 'dark' ? '#334155' : '#e8edf3'}`,
            borderRadius: 8,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: { root: { '&:last-child': { paddingBottom: 16 } } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 6, textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
          sizeSmall: { fontSize: '0.8rem', padding: '3px 10px' },
          sizeMedium: { padding: '6px 16px' },
          sizeLarge: { padding: '9px 22px' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 600, fontSize: '0.75rem' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: mode === 'dark' ? '#1e293b' : '#fff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? '#334155' : '#d1d9e6',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1565c0',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: '0.875rem' },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: mode === 'dark' ? '#0f172a' : '#fafbfd',
              color: mode === 'dark' ? '#94a3b8' : '#6b7280',
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: `2px solid ${mode === 'dark' ? '#334155' : '#e8edf3'}`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { border: 0 },
            '&:hover': { backgroundColor: mode === 'dark' ? '#1e293b' : '#f7f9fc' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? '#334155' : '#e8edf3',
            fontSize: '0.875rem',
            padding: '10px 16px',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 4, height: 6 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 8, fontSize: '0.875rem' } },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: mode === 'dark' ? '#334155' : '#e8edf3' } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 12, border: 'none' } },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            fontSize: '1rem',
            borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e8edf3'}`,
            paddingBottom: 12,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${mode === 'dark' ? '#334155' : '#e8edf3'}`,
            padding: '12px 16px',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: 44,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 3, borderRadius: '3px 3px 0 0' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            '&.Mui-selected': {
              backgroundColor: mode === 'dark' ? '#1e3a5f' : '#e8f0fe',
              color: '#1565c0',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.75rem',
            borderRadius: 6,
            backgroundColor: mode === 'dark' ? '#0f172a' : '#1e293b',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 6 },
        },
      },
    },
  });

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes((user.role || '').toLowerCase())) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const [showTos, setShowTos] = React.useState(false);

  React.useEffect(() => {
    if (user && localStorage.getItem('arb_tos_accepted_v1') === null) {
      setShowTos(true);
    }
  }, [user]);

  return (
    <>
      {user && <Navigation />}
      {user && <OfflineBanner />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/verify" element={<AwardVerification />} />
        <Route path="/charter" element={<PlatformCharter />} />
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
        <Route path="/operator" element={<ProtectedRoute roles={['admin']}><Operator /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <MeetingDock />}
      <TosAcceptanceModal open={showTos} onAccept={() => setShowTos(false)} />
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
