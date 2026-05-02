// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Card, CardContent,
  CardActions, Button, Box, Alert, CircularProgress, Chip, Divider, List,
  ListItem, ListItemIcon, ListItemText, LinearProgress, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Table,
  TableHead, TableBody, TableRow, TableCell, IconButton, Tooltip,
  TextField, Menu, MenuItem, InputAdornment,
} from '@mui/material';
import {
  Gavel as CasesIcon,
  Gavel as GavelIcon,
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
  Verified as VerifiedIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingIcon,
  PendingActions as PendingActIcon,
  ManageAccounts as UsersIcon,
  Timeline as TimelineIcon,
  Notifications as AlertIcon,
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  OpenInNew as OpenIcon,
  AutoAwesome as AutoAwesomeIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
    purpose: 'You manage the platform\'s operational and financial side. Case contents are confidential — only arbitrators and parties can access case details.',
    responsibilities: [
      'Register and manage arbitrator accounts',
      'Issue invoices when arbitrators submit new cases',
      'Review proof of payment and issue receipts',
      'Approve case activation after payment confirmation',
      'Monitor platform-level statistics and user activity',
      'Manage the document library (laws, rules, AI knowledge base)',
    ],
    actions: [
      { label: 'Account Management', to: '/payments', icon: <PaymentIcon /> },
      { label: 'Manage Users', to: '/users', icon: <UsersIcon /> },
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
    purpose: 'You are the neutral decision-maker. You open cases by paying the platform fee, then conduct proceedings and issue binding awards.',
    responsibilities: [
      'Open a new case and pay the platform fee after invoice is issued',
      'Add parties (claimant, respondent) and their counsel to the case',
      'Review the case file — Request for Arbitration, Response, and all documents',
      'Conduct preliminary meetings to set the Terms of Reference',
      'Schedule and preside over hearings (virtual or in-person)',
      'Issue the final arbitral award — binding and enforceable',
      'Email parties any case particulars after the case concludes',
    ],
    actions: [
      { label: 'My Cases', to: '/cases', icon: <AssignmentIcon /> },
      { label: 'My Account', to: '/payments', icon: <PaymentIcon /> },
      { label: 'Hearings', to: '/hearings', icon: <HearingIcon /> },
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

// ─── Admin-only Dashboard ────────────────────────────────────────────────────
const GradientStatCard = ({ title, value, subtitle, icon, gradient, accentColor }) => (
  <Paper sx={{
    p: 2.5, borderRadius: 3, color: '#fff', position: 'relative', overflow: 'hidden',
    background: gradient,
    boxShadow: `0 8px 24px ${accentColor}44`,
  }}>
    <Box sx={{ position: 'absolute', right: -12, top: -12, opacity: 0.15, fontSize: 80 }}>
      {icon}
    </Box>
    <Typography variant="caption" sx={{ opacity: 0.88, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11 }}>
      {title}
    </Typography>
    <Typography variant="h3" fontWeight={800} sx={{ my: 0.5, letterSpacing: '-0.04em' }}>
      {value}
    </Typography>
    {subtitle && <Typography variant="body2" sx={{ opacity: 0.85 }}>{subtitle}</Typography>}
  </Paper>
);

const AdminDashboard = ({ analytics, t }) => {
  const navigate = useNavigate();
  const casesByStatus = analytics.casesByStatus || [];
  const usersByRole = analytics.usersByRole || [];
  const recentActivity = analytics.recentActivity || [];
  const paymentStats = analytics.paymentStats || [];

  const getCount = (arr, key, val) => {
    const row = arr.find(r => (r[key.toUpperCase()] || r[key] || '').toLowerCase() === val.toLowerCase());
    return row ? parseInt(row.CNT || row.cnt || 0) : 0;
  };

  const activeCases = getCount(casesByStatus, 'status', 'active');
  const pendingPayment = getCount(casesByStatus, 'status', 'pending_payment');
  const completedCases = getCount(casesByStatus, 'status', 'completed') + getCount(casesByStatus, 'status', 'closed');
  const pendingInvoices = analytics.pendingInvoicesCount || 0;
  const totalRevenue = analytics.totalRevenue || 0;
  const proofPending = getCount(paymentStats, 'status', 'proof_uploaded');

  const totalArbitrators = getCount(usersByRole, 'role', 'arbitrator');
  const totalParties = getCount(usersByRole, 'role', 'party') + getCount(usersByRole, 'role', 'counsel');

  const fmtCurrency = (v) => `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const statusColors = { active: '#4CAF50', pending_payment: '#FF9800', completed: '#2196F3', closed: '#9E9E9E', pending: '#FF9800' };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, color: '#fff',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1a237e 45%, #283593 100%)',
        boxShadow: '0 12px 40px rgba(13,27,42,0.4)',
        borderRadius: 3,
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.06), transparent 50%)', pointerEvents: 'none' }} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <AdminIcon sx={{ fontSize: 44 }} />
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.03em' }}>
              Platform Overview
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>
              Aggregate operational view — case details are confidential and accessible only to participants.
            </Typography>
          </Box>
        </Stack>

        {/* Urgent Alerts */}
        {(pendingInvoices > 0 || proofPending > 0) && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {pendingInvoices > 0 && (
              <Chip
                icon={<AlertIcon />}
                label={`${pendingInvoices} case${pendingInvoices > 1 ? 's' : ''} awaiting invoice`}
                color="warning"
                sx={{ fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/payments')}
              />
            )}
            {proofPending > 0 && (
              <Chip
                icon={<PendingActIcon />}
                label={`${proofPending} payment proof${proofPending > 1 ? 's' : ''} pending review`}
                color="error"
                sx={{ fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/payments')}
              />
            )}
          </Stack>
        )}
      </Paper>

      {/* KPI Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <GradientStatCard
            title="Active Cases"
            value={activeCases}
            subtitle="Currently in proceedings"
            icon={<CasesIcon sx={{ fontSize: 80 }} />}
            gradient="linear-gradient(135deg, #1565C0 0%, #1976d2 100%)"
            accentColor="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GradientStatCard
            title="Pending Payment"
            value={pendingPayment}
            subtitle="Awaiting invoice or proof"
            icon={<PaymentIcon sx={{ fontSize: 80 }} />}
            gradient="linear-gradient(135deg, #E65100 0%, #F57C00 100%)"
            accentColor="#F57C00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GradientStatCard
            title="Completed Cases"
            value={completedCases}
            subtitle="Awards issued"
            icon={<DoneIcon sx={{ fontSize: 80 }} />}
            gradient="linear-gradient(135deg, #2E7D32 0%, #43A047 100%)"
            accentColor="#43A047"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GradientStatCard
            title="Total Revenue"
            value={fmtCurrency(totalRevenue)}
            subtitle="Platform fees collected"
            icon={<TrendingIcon sx={{ fontSize: 80 }} />}
            gradient="linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%)"
            accentColor="#7B1FA2"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Case Status Breakdown */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Case Status Breakdown</Typography>
            {casesByStatus.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No case data available.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {casesByStatus.map((row, i) => {
                  const status = row.STATUS || row.status || 'unknown';
                  const count = parseInt(row.CNT || row.cnt || 0);
                  const total = casesByStatus.reduce((s, r) => s + parseInt(r.CNT || r.cnt || 0), 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const color = statusColors[status.toLowerCase()] || '#9E9E9E';
                  return (
                    <Box key={i}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" textTransform="capitalize">{status.replace(/_/g, ' ')}</Typography>
                        <Typography variant="body2" fontWeight={700}>{count} ({pct}%)</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8, borderRadius: 4,
                          bgcolor: `${color}22`,
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Platform Users */}
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <UsersIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>Platform Users</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={800} color="primary.main">{analytics.totalUsers || 0}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Active accounts</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              {usersByRole.map((row, i) => {
                const r = row.ROLE || row.role || '';
                const cnt = parseInt(row.CNT || row.cnt || 0);
                const roleColor = { admin: 'error', arbitrator: 'warning', secretariat: 'info', counsel: 'secondary', party: 'default' };
                return (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                    <Chip size="small" label={r} color={roleColor[r] || 'default'} variant="outlined" />
                    <Typography variant="body2" fontWeight={700}>{cnt}</Typography>
                  </Stack>
                );
              })}
            </Stack>
            <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} component={Link} to="/users" startIcon={<UsersIcon />}>
              Manage Users
            </Button>
          </Paper>
        </Grid>

        {/* Quick Actions + Recent Activity */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
              <Stack spacing={1}>
                <Button fullWidth variant="contained" startIcon={<PaymentIcon />} component={Link} to="/payments" color="primary">
                  Account Management
                </Button>
                <Button fullWidth variant="outlined" startIcon={<UsersIcon />} component={Link} to="/users">
                  Register New Arbitrator
                </Button>
                <Button fullWidth variant="outlined" startIcon={<AnalyticsIcon />} component={Link} to="/analytics">
                  View Analytics
                </Button>
                <Button fullWidth variant="outlined" startIcon={<LibraryIcon />} component={Link} to="/documents">
                  Document Library
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <TimelineIcon color="action" />
                <Typography variant="h6" fontWeight={700}>Recent Activity</Typography>
              </Stack>
              {recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No recent activity.</Typography>
              ) : (
                <Stack spacing={1}>
                  {recentActivity.slice(0, 6).map((log, i) => {
                    const action = log.ACTION || log.action || '';
                    const type = log.EVENT_TYPE || log.event_type || '';
                    const date = log.CREATED_AT || log.created_at;
                    return (
                      <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" fontWeight={600} textTransform="capitalize">
                            {(type || action).replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {date ? new Date(date).toLocaleString() : ''}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <PaymentIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>Payment Summary</Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" component={Link} to="/payments">Full Payment Dashboard</Button>
            </Stack>
            <Grid container spacing={2}>
              {[
                { label: 'Pending Invoice', count: pendingInvoices, color: '#FF9800', desc: 'Cases awaiting invoice from you' },
                { label: 'Invoiced', count: getCount(paymentStats, 'status', 'invoiced'), color: '#2196F3', desc: 'Waiting for arbitrator payment' },
                { label: 'Proof Uploaded', count: proofPending, color: '#9C27B0', desc: 'Ready for your review & approval' },
                { label: 'Paid & Active', count: getCount(paymentStats, 'status', 'paid'), color: '#4CAF50', desc: 'Completed payments' },
              ].map((item, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: `${item.color}11`, borderRadius: 2, border: `1px solid ${item.color}33` }}>
                    <Typography variant="h3" fontWeight={800} sx={{ color: item.color }}>{item.count}</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

const normaliseCase = (c) => ({
  caseId: c.CASE_ID || c.case_id || c.caseId || '',
  title: c.TITLE || c.title || 'Untitled',
  status: c.STATUS || c.status || 'pending',
  caseStage: c.CASE_STAGE || c.caseStage || 'filing',
  submissionStatus: c.SUBMISSION_STATUS || c.submissionStatus || 'draft',
  caseType: c.CASE_TYPE || c.caseType || '',
  paymentStatus: c.PAYMENT_STATUS || c.payment_status || c.paymentStatus || '',
  createdAt: c.CREATED_AT || c.created_at || c.createdAt || '',
});

const workflowSteps = [
  { key: 'filing', label: 'Filing', tab: 'overview' },
  { key: 'response', label: 'Response', tab: 'documents' },
  { key: 'arbitrator_appointment', label: 'Appointment', tab: 'parties' },
  { key: 'terms_of_reference', label: 'Terms', tab: 'timeline' },
  { key: 'hearing', label: 'Hearing', tab: 'hearings' },
  { key: 'deliberation', label: 'Deliberation', tab: 'ai-draft' },
  { key: 'award', label: 'Award', tab: 'award-pack' },
  { key: 'closed', label: 'Closed', tab: 'overview' },
];

const ArbitratorDashboard = ({ cases, hearings, stats, t, firstName, navigate, openArchive }) => {
  const [caseSearch, setCaseSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [moreCase, setMoreCase] = useState(null);
  const normalisedCases = cases.map(normaliseCase);
  const activeCases = normalisedCases.filter(c => !['completed', 'closed', 'terminated'].includes((c.status || '').toLowerCase()));
  const closedCases = normalisedCases.filter(c => ['completed', 'closed', 'terminated'].includes((c.status || '').toLowerCase()));
  const caseIds = new Set(normalisedCases.map(c => c.caseId));
  const myHearings = (hearings || []).filter(h => caseIds.has(h.CASE_ID || h.caseId));
  const upcomingHearings = myHearings
    .filter(h => !['completed', 'cancelled'].includes(String(h.STATUS || h.status || '').toLowerCase()))
    .sort((a, b) => new Date(a.START_TIME || a.startTime || 0) - new Date(b.START_TIME || b.startTime || 0))
    .slice(0, 4);
  const nextHearing = upcomingHearings[0] || null;
  const draftFilings = activeCases.filter(c => (c.submissionStatus || '').toLowerCase() === 'draft').length;
  const deliberationCases = activeCases.filter(c => ['deliberation', 'award'].includes((c.caseStage || '').toLowerCase())).length;
  const stageSummary = workflowSteps.map(step => ({
    ...step,
    count: activeCases.filter(c => (c.caseStage || 'filing') === step.key).length
  })).filter(step => step.count > 0);
  const filteredActiveCases = activeCases.filter(c => {
    const haystack = `${c.title} ${c.caseId} ${c.caseType} ${c.caseStage}`.toLowerCase();
    const matchesSearch = !caseSearch.trim() || haystack.includes(caseSearch.trim().toLowerCase());
    const matchesStage = stageFilter === 'all' || c.caseStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const goCase = (caseId, tab = 'overview', action = '') => {
    const qs = new URLSearchParams();
    if (tab) qs.set('tab', tab);
    if (action) qs.set('action', action);
    navigate(`/cases/${caseId}?${qs.toString()}`);
  };
  const openMore = (event, c) => {
    setMoreAnchor(event.currentTarget);
    setMoreCase(c);
  };
  const closeMore = () => {
    setMoreAnchor(null);
    setMoreCase(null);
  };
  const goMore = (tab, action = '') => {
    if (moreCase) goCase(moreCase.caseId, tab, action);
    closeMore();
  };

  const stageIndex = (stage) => Math.max(0, workflowSteps.findIndex(s => s.key === stage));
  const nextAction = (c) => {
    if ((c.submissionStatus || '').toLowerCase() === 'draft') return { label: 'Submit Filing', tab: 'overview' };
    const stage = c.caseStage || 'filing';
    if (stage === 'filing' || stage === 'response') return { label: 'Review File', tab: 'documents' };
    if (stage === 'terms_of_reference') return { label: 'Set Terms', tab: 'timeline' };
    if (stage === 'hearing') return { label: 'Manage Hearing', tab: 'hearings' };
    if (stage === 'deliberation') return { label: 'Draft Award', tab: 'ai-draft' };
    if (stage === 'award') return { label: 'Issue Award Pack', tab: 'award-pack' };
    return { label: 'Open Case', tab: 'overview' };
  };

  const workspaceStats = [
    { label: 'My Cases', value: normalisedCases.length, icon: <CasesIcon />, color: '#ef6c00', onClick: () => setStageFilter('all'), trend: '+0 this week' },
    { label: 'Active Proceedings', value: activeCases.length, icon: <ActiveIcon />, color: '#1976d2', onClick: () => setStageFilter('all'), trend: `${stageSummary.length} active stage(s)` },
    { label: 'Hearings Ahead', value: upcomingHearings.length, icon: <HearingIcon />, color: '#00838f', onClick: () => setStageFilter('hearing'), trend: nextHearing ? 'Next hearing scheduled' : 'No hearings due' },
    { label: 'Awards Completed', value: closedCases.length || stats.completed, icon: <DoneIcon />, color: '#2e7d32', onClick: () => closedCases[0] ? openArchive(closedCases[0]) : setStageFilter('all'), trend: 'Closed record' },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'warning.light',
                  color: 'warning.dark',
                  flexShrink: 0,
                }}
              >
                <BalanceIcon sx={{ fontSize: 38 }} />
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
                  {t('Arbitrator Portal')}
                </Typography>
                <Typography variant="h4" fontWeight={850} sx={{ lineHeight: 1.1, letterSpacing: 0 }}>
                  {t('Arbitrator Workspace')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
                  {t('Welcome, {{name}}. Manage your active proceedings, hearings, documents, deliberation, and awards from one focused workspace.', { name: firstName })}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
              <Button variant="contained" size="large" startIcon={<CasesIcon />} onClick={() => navigate('/cases/agreement')}>
                {t('Open New Arbitration')}
              </Button>
              <Button variant="outlined" size="large" startIcon={<LibraryIcon />} onClick={() => navigate('/documents')}>
                {t('Documents')}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {workspaceStats.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Paper
              sx={{
                p: 2.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.10)' },
              }}
              onClick={item.onClick}
              role="button"
              tabIndex={0}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ color: item.color, display: 'flex', '& svg': { fontSize: 34 } }}>{item.icon}</Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{t(item.label)}</Typography>
                  <Typography variant="h4" fontWeight={850}>{item.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{t(item.trend)}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: draftFilings ? 'warning.light' : 'divider', cursor: draftFilings ? 'pointer' : 'default' }}
            onClick={() => draftFilings && setStageFilter('filing')}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PendingActIcon color={draftFilings ? 'warning' : 'disabled'} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{t('Filings to complete')}</Typography>
                <Typography variant="body2" color="text.secondary">{draftFilings ? t('{{count}} draft filing(s) need submission. Review today.', { count: draftFilings }) : t('No draft filings waiting.')}</Typography>
              </Box>
              <Chip label={draftFilings} color={draftFilings ? 'warning' : 'default'} />
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: nextHearing ? 'info.light' : 'divider', cursor: nextHearing ? 'pointer' : 'default' }}
            onClick={() => nextHearing && goCase(nextHearing.CASE_ID || nextHearing.caseId, 'hearings')}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <HearingIcon color={nextHearing ? 'info' : 'disabled'} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>{t('Next hearing')}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {nextHearing ? `${nextHearing.TITLE || nextHearing.title || t('Hearing')} · ${nextHearing.START_TIME || nextHearing.startTime || '—'}` : t('No hearing scheduled.')}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: deliberationCases ? 'success.light' : 'divider', cursor: deliberationCases ? 'pointer' : 'default' }}
            onClick={() => deliberationCases && setStageFilter('deliberation')}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AutoAwesomeIcon color={deliberationCases ? 'success' : 'disabled'} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{t('Awards in progress')}</Typography>
                <Typography variant="body2" color="text.secondary">{deliberationCases ? t('{{count}} case(s) are ready for award work.', { count: deliberationCases }) : t('No award drafting currently due.')}</Typography>
              </Box>
              <Chip label={deliberationCases} color={deliberationCases ? 'success' : 'default'} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
              <AssignmentIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={800}>{t('Case Management')}</Typography>
                <Typography variant="body2" color="text.secondary">{t('Search, filter, and open the next procedural action for each assigned case.')}</Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={() => navigate('/cases')}>{t('View All Cases')}</Button>
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                placeholder={t('Search cases, IDs, stages...')}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
              <TextField
                size="small"
                select
                label={t('Stage')}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 220 } }}
              >
                <MenuItem value="all">{t('All stages')}</MenuItem>
                {workflowSteps.map(step => (
                  <MenuItem key={step.key} value={step.key}>{t(step.label)}</MenuItem>
                ))}
              </TextField>
            </Stack>
            {stageSummary.length > 0 && (
              <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
                {stageSummary.map(item => (
                  <Chip
                    key={item.key}
                    size="small"
                    label={`${t(item.label)} ${item.count}`}
                    variant={stageFilter === item.key ? 'filled' : 'outlined'}
                    color={stageFilter === item.key ? 'primary' : 'default'}
                    onClick={() => setStageFilter(item.key)}
                  />
                ))}
              </Stack>
            )}

            {activeCases.length === 0 ? (
              <Alert severity="info">{t('No active arbitration cases are assigned to this arbitrator account yet.')}</Alert>
            ) : filteredActiveCases.length === 0 ? (
              <Alert severity="info">{t('No cases match the current search or filter.')}</Alert>
            ) : (
              <Stack spacing={2}>
                {filteredActiveCases.map((c) => {
                  const next = nextAction(c);
                  const progress = Math.round(((stageIndex(c.caseStage) + 1) / workflowSteps.length) * 100);
                  return (
                    <Paper
                      key={c.caseId}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: 4,
                        borderLeftColor: c.caseStage === 'deliberation' || c.caseStage === 'award' ? 'success.main' : c.caseStage === 'hearing' ? 'info.main' : 'primary.main',
                        transition: 'border-color 120ms ease, box-shadow 120ms ease',
                        '&:hover': { boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)' },
                      }}
                    >
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>{c.title}</Typography>
                            <Chip label={t(c.status)} size="small" color={c.status === 'active' ? 'primary' : 'warning'} />
                            <Chip label={`${t('Stage')} ${stageIndex(c.caseStage) + 1}/${workflowSteps.length}: ${t(c.caseStage.replace(/_/g, ' '))}`} size="small" color="info" variant="outlined" />
                          </Stack>
                          <Box sx={{ mt: 1.5, mb: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" color="text.secondary">
                                {t('Case progress')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {progress}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 8,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': { borderRadius: 1 },
                              }}
                            />
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button size="small" variant="contained" startIcon={<ActiveIcon />} onClick={() => goCase(c.caseId, next.tab)} sx={{ fontWeight: 700 }}>
                              {t(next.label)}
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<DocumentsIcon />} onClick={() => goCase(c.caseId, 'documents', 'upload')}>{t('Evidence')}</Button>
                            <Button size="small" variant="outlined" startIcon={<HearingIcon />} onClick={() => goCase(c.caseId, 'hearings')}>{t('Hearings')}</Button>
                            <Button
                              size="small"
                              variant="text"
                              endIcon={<MoreVertIcon />}
                              onClick={(event) => openMore(event, c)}
                              aria-label={t('More case actions')}
                            >
                              {t('More')}
                            </Button>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={closeMore}>
              <MenuItem onClick={() => goMore('overview', 'edit')}><EditIcon fontSize="small" sx={{ mr: 1 }} />{t('Edit case')}</MenuItem>
              <MenuItem onClick={() => goMore('parties')}><GroupsIcon fontSize="small" sx={{ mr: 1 }} />{t('Parties')}</MenuItem>
              <MenuItem onClick={() => goMore('ai-draft')}><AutoAwesomeIcon fontSize="small" sx={{ mr: 1 }} />{t('AI Draft Award')}</MenuItem>
              <MenuItem onClick={() => goMore('award-pack')}><GavelIcon fontSize="small" sx={{ mr: 1 }} />{t('Award Pack')}</MenuItem>
            </Menu>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <HearingIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>{t('Upcoming Hearings')}</Typography>
              </Stack>
              {upcomingHearings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('No upcoming hearings.')}</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {upcomingHearings.map((h) => {
                    const hCaseId = h.CASE_ID || h.caseId;
                    return (
                      <Paper key={h.HEARING_ID || h.hearingId} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={800}>{h.TITLE || h.title || t('Hearing')}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{hCaseId}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{h.START_TIME || h.startTime || '—'}</Typography>
                        <Button size="small" variant="contained" sx={{ mt: 1 }} onClick={() => goCase(hCaseId, 'hearings')}>{t('Open Hearing Room')}</Button>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
              <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/hearings')}>{t('Schedule / Manage Hearings')}</Button>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{t('Arbitration Tools')}</Typography>
              <Stack spacing={1}>
                <Button fullWidth variant="contained" startIcon={<SendIcon />} onClick={() => navigate('/cases/agreement')}>{t('Start New Case')}</Button>
                <Button fullWidth variant="outlined" startIcon={<HearingIcon />} onClick={() => navigate('/hearings')}>{t('Hearing Calendar')}</Button>
                <Button fullWidth variant="outlined" startIcon={<LibraryIcon />} onClick={() => navigate('/documents')}>{t('Document Library')}</Button>
                <Button fullWidth variant="outlined" startIcon={<PaymentIcon />} onClick={() => navigate('/payments')}>{t('Fees & Account')}</Button>
                <Button fullWidth variant="outlined" startIcon={<AnalyticsIcon />} onClick={() => navigate('/analytics')}>{t('Analytics')}</Button>
              </Stack>
            </Paper>

            {closedCases.length > 0 ? (
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <ArchiveIcon color="action" />
                  <Typography variant="h6" fontWeight={700}>{t('Closed Files')}</Typography>
                  <Chip label={closedCases.length} size="small" />
                </Stack>
                {closedCases.slice(0, 4).map(c => (
                  <Box key={c.caseId} sx={{ py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                    <Button size="small" onClick={() => openArchive(c)}>{t('Browse File')}</Button>
                    <Button size="small" onClick={() => goCase(c.caseId, 'overview')}>{t('Open')}</Button>
                  </Box>
                ))}
              </Paper>
            ) : (
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AlertIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>{t('Recent Activity')}</Typography>
                </Stack>
                <Stack spacing={1}>
                  {activeCases.slice(0, 3).map(c => (
                    <Box key={c.caseId} sx={{ py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{t('Currently at')} {t(c.caseStage.replace(/_/g, ' '))}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pending: 0, documents: 0 });
  const [analytics, setAnalytics] = useState({});
  const [recentCases, setRecentCases] = useState([]);
  const [closedCases, setClosedCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const isArbitrator = (user?.role || '').toLowerCase() === 'arbitrator';

  // File archive dialog state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveCase, setArchiveCase] = useState(null);
  const [archiveDocs, setArchiveDocs] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const openArchive = async (c) => {
    const caseId = c.CASE_ID || c.case_id || c.caseId;
    setArchiveCase(c);
    setArchiveOpen(true);
    setArchiveDocs([]);
    setArchiveLoading(true);
    try {
      const res = await apiService.getCaseDocuments(caseId);
      setArchiveDocs(res.data.documents || []);
    } catch (_) {}
    finally { setArchiveLoading(false); }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const analyticsRes = await apiService.getAnalytics();
        const analyticsData = analyticsRes.data || {};
        setAnalytics(analyticsData);

        const caseRows = analyticsData.casesByStatus || [];
        let active = 0, completed = 0, pending = 0;
        caseRows.forEach((row) => {
          const status = (row.STATUS || row.status || '').toLowerCase();
          const count = parseInt(row.CNT || row.cnt || 0);
          if (status === 'active') active = count;
          else if (['completed', 'closed'].includes(status)) completed += count;
          else pending += count;
        });

        setStats({ total: active + completed + pending, active, completed, pending, documents: analyticsData.totalDocuments || 0 });

        if (!isAdmin) {
          const casesRes = await apiService.getCases();
          const allCases = casesRes.data.cases || [];
          const CLOSED_STATUSES = ['completed', 'closed', 'terminated'];
          const activeRows = allCases.filter(c => !CLOSED_STATUSES.includes((c.STATUS || c.status || '').toLowerCase()));
          setRecentCases(isArbitrator ? activeRows : activeRows.slice(0, 5));
          if (isArbitrator) {
            setClosedCases(allCases.filter(c => CLOSED_STATUSES.includes((c.STATUS || c.status || '').toLowerCase())));
            const hearingsRes = await apiService.getHearings().catch(() => ({ data: { hearings: [] } }));
            setHearings(hearingsRes.data.hearings || []);
          }
        }
        setError(null);
      } catch (err) {
        setError(t('Could not load dashboard data. Check server connection.'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin, isArbitrator]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  if (isAdmin) {
    return (
      <>
        {error && <Alert severity="warning" sx={{ m: 2 }}>{error}</Alert>}
        <AdminDashboard analytics={analytics} t={t} />
      </>
    );
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

  if (isArbitrator) {
    return (
      <>
        {error && <Alert severity="warning" sx={{ m: 2 }}>{error}</Alert>}
        <ArbitratorDashboard
          cases={[...recentCases, ...closedCases]}
          hearings={hearings}
          stats={stats}
          t={t}
          firstName={firstName}
          navigate={navigate}
          openArchive={openArchive}
        />
      </>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('Dashboard')}
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Role-Based Purpose Panel */}
      <Paper sx={{ p: 3, mb: 3, borderLeft: 4, borderColor: roleContent.color }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ color: roleContent.color, mt: 0.5 }}>{roleContent.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" fontWeight="bold">
                {t('Welcome, {{name}}', { name: firstName })}
              </Typography>
              <Chip label={t(roleContent.title)} size="small" sx={{ bgcolor: roleContent.color, color: 'white' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(roleContent.purpose)}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  {t('Your responsibilities on this platform:')}
                </Typography>
                <List dense disablePadding>
                  {roleContent.responsibilities.map((r, i) => (
                    <ListItem key={i} disablePadding sx={{ py: 0.2 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <VerifiedIcon fontSize="small" sx={{ color: roleContent.color }} />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{t(r)}</Typography>} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  {t('Quick actions:')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {roleContent.actions.map((a, i) => (
                    <Button key={i} variant={i === 0 ? 'contained' : 'outlined'}
                      startIcon={a.icon} fullWidth component={Link} to={a.to} size="small">
                      {t(a.label)}
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
          <StatCard title={t('Total Cases')} value={stats.total}
            icon={<CasesIcon fontSize="large" />} color="text.secondary"
            linkTo="/cases" linkLabel={t('View All')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('Active Cases')} value={stats.active}
            icon={<ActiveIcon fontSize="large" />} color="primary.main"
            linkTo="/cases" linkLabel={t('View Active')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('Completed Cases')} value={stats.completed}
            icon={<DoneIcon fontSize="large" />} color="success.main"
            linkTo="/cases" linkLabel={t('View Completed')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('Document Library')} value={stats.documents}
            icon={<DocumentsIcon fontSize="large" />} color="info.main"
            linkTo="/documents" linkLabel={t('Document Library')} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Cases */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{t('Active Cases')}</Typography>
              <Button size="small" component={Link} to="/cases">{t('View All')}</Button>
            </Box>
            {recentCases.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                {t('No active cases.')}
              </Typography>
            ) : (
              recentCases.map((c, i) => {
                const id = c.CASE_ID || c.case_id || c.caseId;
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
                      <Chip label={t(status)} size="small" color={statusColor(status)} />
                    </Box>
                    {i < recentCases.length - 1 && <Divider />}
                  </Box>
                );
              })
            )}
          </Paper>

          {/* Closed Case File Archive — arbitrator only */}
          {isArbitrator && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ArchiveIcon color="action" />
                <Typography variant="h6">{t('Closed Case Files')}</Typography>
                <Chip label={closedCases.length} size="small" />
              </Box>
              {closedCases.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  {t('No closed cases yet.')}
                </Typography>
              ) : (
                closedCases.map((c, i) => {
                  const id = c.CASE_ID || c.case_id || c.caseId;
                  const title = c.TITLE || c.title || 'Untitled';
                  const status = c.STATUS || c.status || 'closed';
                  return (
                    <Box key={id || i}>
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 1, borderRadius: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium">{title}</Typography>
                          <Typography variant="caption" color="text.secondary">{id}</Typography>
                        </Box>
                        <Chip label={t(status)} size="small" variant="outlined" sx={{ mr: 1 }} />
                        <Tooltip title={t('Browse case files')}>
                          <IconButton size="small" onClick={() => openArchive(c)}>
                            <RepoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Open case')}>
                          <IconButton size="small" onClick={() => navigate(`/cases/${id}`)}>
                            <OpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {i < closedCases.length - 1 && <Divider />}
                    </Box>
                  );
                })
              )}
            </Paper>
          )}
        </Grid>

        {/* Platform Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{t('About This Platform')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('A secure, end-to-end digital arbitration management platform for conducting arbitration proceedings online — from initial filing through to final award.')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('Platform users:')}</Typography>
            {[
              { role: 'Administrator / Secretariat', desc: 'Operates the platform, manages cases and users', color: 'error' },
              { role: 'Arbitrator', desc: 'Reviews cases, conducts hearings, issues awards', color: 'warning' },
              { role: 'Legal Counsel', desc: 'Represents parties, files submissions and evidence', color: 'info' },
              { role: 'Party (Claimant / Respondent)', desc: 'Tracks case progress, uploads documents, attends hearings', color: 'success' },
            ].map((u, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={t(u.role)} size="small" color={u.color} variant="outlined" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>{t(u.desc)}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* File Archive Dialog */}
      <Dialog open={archiveOpen} onClose={() => setArchiveOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArchiveIcon />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {archiveCase ? (archiveCase.TITLE || archiveCase.title || 'Case Files') : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {archiveCase ? (archiveCase.CASE_ID || archiveCase.case_id || archiveCase.caseId) : ''}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {archiveLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : archiveDocs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No documents found for this case.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {archiveDocs.map((doc, i) => {
                  const name = doc.DOCUMENT_NAME || doc.document_name || doc.documentName || `Document ${i + 1}`;
                  const category = doc.CATEGORY || doc.category || '—';
                  const date = doc.CREATED_AT || doc.created_at ? new Date(doc.CREATED_AT || doc.created_at).toLocaleDateString() : '—';
                  const docId = doc.ID || doc.id;
                  return (
                    <TableRow key={docId || i} hover>
                      <TableCell>
                        <Typography variant="body2">{name}</Typography>
                        {doc.DESCRIPTION || doc.description ? (
                          <Typography variant="caption" color="text.secondary">{doc.DESCRIPTION || doc.description}</Typography>
                        ) : null}
                      </TableCell>
                      <TableCell><Chip label={category} size="small" variant="outlined" /></TableCell>
                      <TableCell><Typography variant="caption">{date}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="View document">
                          <IconButton size="small" onClick={() => navigate(`/documents`)}>
                            <OpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveOpen(false)}>Close</Button>
          <Button variant="outlined" onClick={() => { setArchiveOpen(false); navigate('/documents'); }}>
            Go to Document Library
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
