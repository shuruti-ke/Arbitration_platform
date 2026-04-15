// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Card, CardContent,
  CardActions, Button, Box, Alert, CircularProgress, Chip, Divider, List,
  ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  BarChart as AnalyticsIcon,
  FolderOpen as RepoIcon,
  Schedule as PendingIcon,
  CheckCircle as DoneIcon,
  PlayArrow as ActiveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LibraryBooks as LibraryIcon,
  VideoCall as HearingIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  AdminPanelSettings as AdminIcon,
  Balance as BalanceIcon,
  Groups as GroupsIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon, color, linkTo, linkLabel }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Box>
          <Typography color="text.secondary" variant="body2">{title}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
        </Box>
      </Box>
    </CardContent>
    {linkTo && (
      <CardActions>
        <Button size="small" component={Link} to={linkTo}>{linkLabel}</Button>
      </CardActions>
    )}
  </Card>
);

const ROLE_CONTENT = {
  admin: {
    icon: <AdminIcon sx={{ fontSize: 40 }} />,
    color: 'error.main',
    title: 'Platform Administrator',
    purpose: 'You operate and manage the arbitration platform on behalf of the law firm. You have full access to all cases, users, documents, and settings.',
    responsibilities: [
      'Register and manage users — claimants, respondents, arbitrators, and counsel',
      'Create, manage, and assign arbitration cases',
      'Upload and maintain the Platform Document Library (laws, rules, precedents for AI)',
      'Appoint arbitrators and manage the arbitral tribunal',
      'Schedule and oversee virtual hearings',
      'Monitor all case progress, milestones, and deadlines',
      'Generate analytics reports and audit trails',
    ],
    actions: [
      { label: 'Create New Case', to: '/cases', icon: <CasesIcon /> },
      { label: 'Document Library', to: '/documents', icon: <LibraryIcon /> },
      { label: 'Analytics', to: '/analytics', icon: <AnalyticsIcon /> },
    ]
  },
  secretariat: {
    icon: <BusinessIcon sx={{ fontSize: 40 }} />,
    color: 'primary.main',
    title: 'Secretariat',
    purpose: 'You manage day-to-day arbitration proceedings on behalf of the law firm — coordinating cases, parties, documents, and hearings.',
    responsibilities: [
      'Open and manage arbitration cases filed by claimants',
      'Coordinate between claimants, respondents, and arbitrators',
      'Upload case documents and maintain the document library',
      'Schedule hearings and send notifications to parties',
      'Track case stages and ensure deadlines are met',
      'Prepare case files for the arbitral tribunal',
      'Record and distribute orders, decisions, and awards',
    ],
    actions: [
      { label: 'Manage Cases', to: '/cases', icon: <CasesIcon /> },
      { label: 'Document Library', to: '/documents', icon: <LibraryIcon /> },
      { label: 'Hearings', to: '/hearings', icon: <HearingIcon /> },
    ]
  },
  arbitrator: {
    icon: <BalanceIcon sx={{ fontSize: 40 }} />,
    color: 'warning.main',
    title: 'Arbitrator',
    purpose: 'You are appointed as the neutral decision-maker in arbitration proceedings. Your role is to conduct fair hearings and issue a binding award.',
    responsibilities: [
      'Review the case file — Request for Arbitration, Response, and all supporting documents',
      'Conduct preliminary meetings to set the Terms of Reference',
      'Schedule and preside over hearings (virtual or in-person)',
      'Review all submissions from claimants and respondents',
      'Request clarification or additional documents as needed',
      'Deliberate and draft the final arbitral award',
      'Issue the award — which is binding and enforceable under the applicable arbitration rules',
    ],
    actions: [
      { label: 'My Assigned Cases', to: '/cases', icon: <AssignmentIcon /> },
      { label: 'Hearings', to: '/hearings', icon: <HearingIcon /> },
      { label: 'Document Library', to: '/documents', icon: <DocumentsIcon /> },
    ]
  },
  counsel: {
    icon: <PersonIcon sx={{ fontSize: 40 }} />,
    color: 'info.main',
    title: 'Legal Counsel',
    purpose: 'You represent a party (claimant or respondent) in arbitration proceedings. Your role is to advance your client\'s case before the Tribunal.',
    responsibilities: [
      'Review the case file and all documents filed by the opposing party',
      'Upload legal submissions — statements of claim, defence, reply, and rejoinder',
      'Upload supporting evidence — contracts, invoices, correspondence, expert reports',
      'Attend and participate in virtual hearings on behalf of your client',
      'Nominate and communicate arbitrator preferences to the Secretariat',
      'Track hearing schedules, submission deadlines, and case milestones',
      'Receive and review the final arbitral award',
    ],
    actions: [
      { label: 'My Cases', to: '/cases', icon: <CasesIcon /> },
      { label: 'Upload Documents', to: '/documents', icon: <UploadIcon /> },
      { label: 'Hearings', to: '/hearings', icon: <HearingIcon /> },
    ]
  },
  party: {
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    color: 'success.main',
    title: 'Party to Arbitration',
    purpose: 'You are a claimant or respondent in an arbitration proceeding. This platform allows you to track your case, upload documents, and participate in hearings.',
    responsibilities: [
      'View your case details, current stage, and upcoming deadlines',
      'Upload your contract, supporting documents, and evidence',
      'Track the progress of your case from filing through to award',
      'Participate in virtual hearings scheduled by the Tribunal',
      'Review submissions and documents filed by the opposing party',
      'Receive notifications when the Tribunal issues orders or decisions',
      'Access the final arbitral award once issued',
    ],
    actions: [
      { label: 'My Cases', to: '/cases', icon: <CasesIcon /> },
      { label: 'Upload Documents', to: '/documents', icon: <UploadIcon /> },
      { label: 'Hearings', to: '/hearings', icon: <HearingIcon /> },
    ]
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pending: 0, documents: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsRes, casesRes] = await Promise.all([
          apiService.getAnalytics(),
          apiService.getCases()
        ]);

        const caseRows = analyticsRes.data.cases || [];
        let active = 0, completed = 0, pending = 0;
        caseRows.forEach((row) => {
          const status = (row.STATUS || row.status || '').toLowerCase();
          const count = parseInt(row.COUNT || row.count || 0, 10);
          if (status === 'active') active = count;
          else if (status === 'completed') completed = count;
          else if (status === 'pending') pending = count;
        });

        const docRows = analyticsRes.data.documents || [];
        const docCount = parseInt((docRows[0] || {}).COUNT || (docRows[0] || {}).count || 0, 10);

        setStats({ total: active + completed + pending, active, completed, pending, documents: docCount });
        setRecentCases((casesRes.data.cases || []).slice(0, 5));
        setError(null);
      } catch (err) {
        setError('Could not load dashboard data. Check server connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const statusColor = (s) => {
    const st = (s || '').toLowerCase();
    if (st === 'active') return 'primary';
    if (st === 'completed') return 'success';
    return 'warning';
  };

  const role = (user?.role || user?.ROLE || 'party').toLowerCase();
  const roleContent = ROLE_CONTENT[role] || ROLE_CONTENT.party;
  const firstName = user?.firstName || user?.FIRST_NAME || user?.email?.split('@')[0] || 'User';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Role-Based Purpose Panel */}
      <Paper sx={{ p: 3, mb: 3, borderLeft: 4, borderColor: roleContent.color }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ color: roleContent.color, mt: 0.5 }}>{roleContent.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" fontWeight="bold">
                Welcome, {firstName}
              </Typography>
              <Chip label={roleContent.title} size="small" sx={{ bgcolor: roleContent.color, color: 'white' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {roleContent.purpose}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  Your responsibilities on this platform:
                </Typography>
                <List dense disablePadding>
                  {roleContent.responsibilities.map((r, i) => (
                    <ListItem key={i} disablePadding sx={{ py: 0.2 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <VerifiedIcon fontSize="small" sx={{ color: roleContent.color }} />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{r}</Typography>} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  Quick actions:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {roleContent.actions.map((a, i) => (
                    <Button key={i} variant={i === 0 ? 'contained' : 'outlined'}
                      startIcon={a.icon} fullWidth component={Link} to={a.to} size="small">
                      {a.label}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Cases" value={stats.total}
            icon={<CasesIcon fontSize="large" />} color="text.secondary"
            linkTo="/cases" linkLabel="View All" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Cases" value={stats.active}
            icon={<ActiveIcon fontSize="large" />} color="primary.main"
            linkTo="/cases" linkLabel="View Active" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed Cases" value={stats.completed}
            icon={<DoneIcon fontSize="large" />} color="success.main"
            linkTo="/cases" linkLabel="View Completed" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Documents" value={stats.documents}
            icon={<DocumentsIcon fontSize="large" />} color="info.main"
            linkTo="/documents" linkLabel="Document Library" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Cases */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Cases</Typography>
              <Button size="small" component={Link} to="/cases">View All</Button>
            </Box>
            {recentCases.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No cases yet. Create your first case.
              </Typography>
            ) : (
              recentCases.map((c, i) => {
                const id = c.CASE_ID || c.caseId;
                const title = c.TITLE || c.title || 'Untitled';
                const status = c.STATUS || c.status || 'pending';
                const type = c.CASE_TYPE || c.caseType || '';
                return (
                  <Box key={id || i}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, px: 1, borderRadius: 1 }}
                      onClick={() => navigate(`/cases/${id}`)}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">{title}</Typography>
                        <Typography variant="caption" color="text.secondary">{id} {type ? `· ${type}` : ''}</Typography>
                      </Box>
                      <Chip label={status} size="small" color={statusColor(status)} />
                    </Box>
                    {i < recentCases.length - 1 && <Divider />}
                  </Box>
                );
              })
            )}
          </Paper>
        </Grid>

        {/* Platform Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>About This Platform</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A secure, end-to-end digital arbitration management platform for conducting arbitration proceedings online — from initial filing through to final award.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Platform users:</Typography>
            {[
              { role: 'Administrator / Secretariat', desc: 'Operates the platform, manages cases and users', color: 'error' },
              { role: 'Arbitrator', desc: 'Reviews cases, conducts hearings, issues awards', color: 'warning' },
              { role: 'Legal Counsel', desc: 'Represents parties, files submissions and evidence', color: 'info' },
              { role: 'Party (Claimant / Respondent)', desc: 'Tracks case progress, uploads documents, attends hearings', color: 'success' },
            ].map((u, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={u.role} size="small" color={u.color} variant="outlined" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>{u.desc}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
