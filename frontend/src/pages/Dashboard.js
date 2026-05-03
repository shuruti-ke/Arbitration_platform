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
  HelpOutline as HelpIcon,
  ChevronRight as ChevronRightIcon,
  Lightbulb as LightbulbIcon,
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

const AdminDashboard = ({ analytics, pendingCases, payments, t }) => {
  const navigate = useNavigate();
  const casesByStatus = analytics.casesByStatus || [];
  const usersByRole = analytics.usersByRole || [];
  const recentActivity = analytics.recentActivity || [];

  const getCount = (arr, key, val) => {
    const row = arr.find(r => (r[key.toUpperCase()] || r[key] || '').toLowerCase() === val.toLowerCase());
    return row ? parseInt(row.CNT || row.cnt || 0) : 0;
  };

  const activeCases = getCount(casesByStatus, 'status', 'active');
  const pendingPayment = getCount(casesByStatus, 'status', 'pending_payment');
  const completedCases = getCount(casesByStatus, 'status', 'completed') + getCount(casesByStatus, 'status', 'closed');
  const totalRevenue = analytics.totalRevenue || 0;

  const fmtCurrency = (v) => `KES ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const statusColors = { active: '#4CAF50', pending_payment: '#FF9800', completed: '#2196F3', closed: '#9E9E9E', pending: '#FF9800' };

  const invoiceQueue = (pendingCases || []).filter(c => (c.STATUS || c.status || '').toLowerCase() === 'pending_payment');
  const proofQueue = (payments || []).filter(p => (p.STATUS || p.status || '').toLowerCase() === 'proof_uploaded');

  const kpiCards = [
    { label: 'Active Cases',       value: activeCases,               color: '#1565c0', icon: <CasesIcon sx={{ fontSize: 28 }} /> },
    { label: 'Pending Payment',    value: pendingPayment,            color: '#e65100', icon: <PaymentIcon sx={{ fontSize: 28 }} /> },
    { label: 'Completed Cases',    value: completedCases,            color: '#2e7d32', icon: <DoneIcon sx={{ fontSize: 28 }} /> },
    { label: 'Total Revenue',      value: fmtCurrency(totalRevenue), color: '#6a1b9a', icon: <TrendingIcon sx={{ fontSize: 28 }} /> },
  ];

  return (
    <Box sx={{ bgcolor: '#f7f9fc', minHeight: '100vh', pb: 6 }}>

      {/* ── Compact header ──────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e8edf3', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 44, height: 44, borderRadius: 1.5,
                background: 'linear-gradient(135deg,#b71c1c,#c62828)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <AdminIcon sx={{ fontSize: 24, color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 1.5, fontSize: 10, lineHeight: 1 }}>
                  ADMIN PORTAL
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Admin Control Centre
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Financial & operational view — case contents are private
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} justifyContent={{ md: 'flex-end' }}>
              <Button variant="contained" size="medium" startIcon={<PaymentIcon />}
                onClick={() => navigate('/payments')}
                sx={{ fontWeight: 700, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
                Payments
              </Button>
              <Button variant="outlined" size="medium" startIcon={<UsersIcon />}
                onClick={() => navigate('/users')}>
                Users
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 3, position: 'relative', zIndex: 1 }}>

        {/* Privacy wall notice */}
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          <strong>Privacy Wall:</strong> As admin you can see case ID, title, payment status, and the arbitrator who submitted it. You cannot access case content, party details, documents, or hearing information — those are confidential to case participants.
        </Alert>

        {/* Action Required */}
        {(invoiceQueue.length > 0 || proofQueue.length > 0) && (
          <Paper elevation={0} sx={{ border: '1px solid #e8edf3', borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 3, py: 1.75, bgcolor: '#fff8e1', borderBottom: '1px solid #ffe082' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AlertIcon sx={{ color: '#e65100', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#e65100' }}>Action Required</Typography>
                <Chip label={invoiceQueue.length + proofQueue.length} size="small" color="warning" sx={{ ml: 1, fontWeight: 700 }} />
              </Stack>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>Cases Awaiting Invoice</Typography>
                  {invoiceQueue.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">None pending.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {invoiceQueue.map((c, i) => {
                        const caseId = c.CASE_ID || c.case_id || c.caseId || '—';
                        const title = c.TITLE || c.title || 'Untitled';
                        const createdBy = c.CREATED_BY || c.created_by || c.createdBy || '—';
                        const date = c.CREATED_AT || c.created_at ? new Date(c.CREATED_AT || c.created_at).toLocaleDateString() : '—';
                        return (
                          <Box key={caseId + i} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #ffe082', bgcolor: '#fffde7', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{title}</Typography>
                              <Typography variant="caption" color="text.secondary">{caseId} · Arbitrator: {createdBy} · {date}</Typography>
                            </Box>
                            <Button size="small" variant="contained" color="warning" disableElevation
                              onClick={() => navigate('/payments')}
                              sx={{ fontWeight: 700, fontSize: 11, py: 0.4, flexShrink: 0 }}>
                              Issue Invoice
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>Payment Proofs to Review</Typography>
                  {proofQueue.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">None pending.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {proofQueue.map((p, i) => {
                        const caseId = p.CASE_ID || p.case_id || p.caseId || '—';
                        const amount = p.AMOUNT || p.amount ? fmtCurrency(p.AMOUNT || p.amount) : null;
                        const date = p.UPDATED_AT || p.updated_at || p.CREATED_AT || p.created_at
                          ? new Date(p.UPDATED_AT || p.updated_at || p.CREATED_AT || p.created_at).toLocaleDateString() : '—';
                        return (
                          <Box key={caseId + i} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #ce93d8', bgcolor: '#f3e5f5', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>Case {caseId}</Typography>
                              <Typography variant="caption" color="text.secondary">{amount ? `${amount} · ` : ''}Uploaded: {date}</Typography>
                            </Box>
                            <Button size="small" variant="contained" disableElevation
                              onClick={() => navigate('/payments')}
                              sx={{ fontWeight: 700, fontSize: 11, py: 0.4, flexShrink: 0, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}>
                              Review & Approve
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )}

        {(invoiceQueue.length === 0 && proofQueue.length === 0) && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>All caught up! No invoices to issue and no payment proofs awaiting review.</Alert>
        )}

        {/* KPI Row */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {kpiCards.map((card) => (
            <Grid item xs={6} md={3} key={card.label}>
              <Paper elevation={0} sx={{
                p: 2, borderRadius: 2, border: '1px solid #e8edf3', bgcolor: '#fff',
                borderTop: `3px solid ${card.color}`,
              }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{card.label}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Case Status Breakdown */}
          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff', height: '100%' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AnalyticsIcon sx={{ fontSize: 18, color: '#1565c0' }} />
                  <Typography variant="subtitle2" fontWeight={700}>Case Status Breakdown</Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 2.5 }}>
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
                            variant="determinate" value={pct}
                            sx={{ height: 8, borderRadius: 4, bgcolor: `${color}22`, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
                <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
                  Aggregate counts only — no case content
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Platform Users */}
          <Grid item xs={12} lg={3}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff', height: '100%' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <UsersIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle2" fontWeight={700}>Platform Users</Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 2.5 }}>
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
                <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate('/users')} startIcon={<UsersIcon />}>
                  Manage Users
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions + Recent Activity */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                  <Typography variant="subtitle2" fontWeight={700}>Quick Actions</Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Button fullWidth variant="contained" startIcon={<PaymentIcon />} onClick={() => navigate('/payments')} disableElevation>
                      Payments & Invoices
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<UsersIcon />} onClick={() => navigate('/users')}>
                      Manage Users
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<AnalyticsIcon />} onClick={() => navigate('/analytics')}>
                      View Analytics
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<LibraryIcon />} onClick={() => navigate('/documents')}>
                      Document Library
                    </Button>
                  </Stack>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TimelineIcon sx={{ fontSize: 18, color: 'action.active' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Recent Activity</Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 2 }}>
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
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
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

const ArbitratorDashboard = ({ cases, hearings, payments, stats, t, firstName, navigate, openArchive }) => {
  const [caseSearch, setCaseSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [moreCase, setMoreCase] = useState(null);
  const [helpOpen, setHelpOpen] = useState(true);

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
  const openMore = (event, c) => { setMoreAnchor(event.currentTarget); setMoreCase(c); };
  const closeMore = () => { setMoreAnchor(null); setMoreCase(null); };
  const goMore = (tab, action = '') => { if (moreCase) goCase(moreCase.caseId, tab, action); closeMore(); };

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
    { label: 'My Cases', value: normalisedCases.length, icon: <CasesIcon />, color: '#ef6c00', gradient: 'linear-gradient(135deg,#e65100,#ef6c00)', onClick: () => setStageFilter('all'), sub: `${activeCases.length} active` },
    { label: 'Active Proceedings', value: activeCases.length, icon: <ActiveIcon />, color: '#1565c0', gradient: 'linear-gradient(135deg,#0d47a1,#1976d2)', onClick: () => setStageFilter('all'), sub: `${stageSummary.length} stage(s)` },
    { label: 'Upcoming Hearings', value: upcomingHearings.length, icon: <HearingIcon />, color: '#00695c', gradient: 'linear-gradient(135deg,#004d40,#00796b)', onClick: () => setStageFilter('hearing'), sub: nextHearing ? 'Next hearing scheduled' : 'None due' },
    { label: 'Awards Completed', value: closedCases.length || stats.completed, icon: <DoneIcon />, color: '#2e7d32', gradient: 'linear-gradient(135deg,#1b5e20,#388e3c)', onClick: () => closedCases[0] ? openArchive(closedCases[0]) : setStageFilter('all'), sub: 'Closed cases' },
  ];

  const quickNavItems = [
    { label: 'Open New Case', icon: <SendIcon />, to: '/cases/agreement', color: '#1565c0', desc: 'Start a new arbitration proceeding' },
    { label: 'Hearing Calendar', icon: <HearingIcon />, to: '/hearings', color: '#0277bd', desc: 'Schedule & join hearing rooms' },
    { label: 'Document Library', icon: <LibraryIcon />, to: '/documents', color: '#2e7d32', desc: 'Upload and manage case files' },
    { label: 'Fees & Account', icon: <PaymentIcon />, to: '/payments', color: '#e65100', desc: 'Invoices, payment proofs & receipts' },
    { label: 'Analytics', icon: <AnalyticsIcon />, to: '/analytics', color: '#6a1b9a', desc: 'Platform statistics & trends' },
    { label: 'Compliance Tools', icon: <VerifiedIcon />, to: '/compliance', color: '#00695c', desc: 'Legal compliance and gap analysis' },
  ];

  const workflowGuide = [
    { key: 'filing', label: 'Filing', desc: 'Claimant submits Request for Arbitration and supporting documents.' },
    { key: 'response', label: 'Response', desc: 'Respondent files their Response to the claim.' },
    { key: 'arbitrator_appointment', label: 'Appointment', desc: 'Arbitrator is formally appointed and parties are notified.' },
    { key: 'terms_of_reference', label: 'Terms of Reference', desc: 'Tribunal sets procedural timetable and scope of issues.' },
    { key: 'hearing', label: 'Hearing', desc: 'Virtual or in-person hearings are conducted by the Tribunal.' },
    { key: 'deliberation', label: 'Deliberation', desc: 'Tribunal deliberates; AI draft award tool available here.' },
    { key: 'award', label: 'Award', desc: 'Final arbitral award is issued and award pack is prepared.' },
    { key: 'closed', label: 'Closed', desc: 'Case is concluded. Party access expires; file is archived.' },
  ];

  const stageAccentColor = (stage) => {
    if (stage === 'deliberation' || stage === 'award') return '#2e7d32';
    if (stage === 'hearing') return '#0277bd';
    if (stage === 'terms_of_reference') return '#6a1b9a';
    return '#1565c0';
  };

  const hasAlerts = draftFilings > 0 || nextHearing || deliberationCases > 0;

  return (
    <Box sx={{ bgcolor: '#f7f9fc', minHeight: '100vh', pb: 6 }}>

      {/* ── Compact header ──────────────────────────────────────────────── */}
      <Box sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #e8edf3',
        px: { xs: 2, sm: 3, md: 4 },
        py: 2,
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 44, height: 44, borderRadius: 1.5,
                background: 'linear-gradient(135deg,#1565c0,#1976d2)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <BalanceIcon sx={{ fontSize: 24, color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 1.5, fontSize: 10, lineHeight: 1 }}>
                  ARBITRATOR PORTAL
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Welcome back, {firstName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activeCases.length} active {activeCases.length === 1 ? 'proceeding' : 'proceedings'}
                  {upcomingHearings.length > 0 && ` · ${upcomingHearings.length} upcoming ${upcomingHearings.length === 1 ? 'hearing' : 'hearings'}`}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} justifyContent={{ md: 'flex-end' }}>
              <Button variant="contained" size="medium" startIcon={<CasesIcon />}
                onClick={() => navigate('/cases/agreement')}
                sx={{ fontWeight: 700, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
                Open New Case
              </Button>
              <Button variant="outlined" size="medium" startIcon={<LibraryIcon />}
                onClick={() => navigate('/documents')}>
                Documents
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ mt: 3, position: 'relative', zIndex: 1 }}>

        {/* KPI cards */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {workspaceStats.map((item) => (
            <Grid item xs={6} md={3} key={item.label}>
              <Paper
                onClick={item.onClick}
                role="button"
                tabIndex={0}
                elevation={0}
                sx={{
                  p: 2, borderRadius: 2, border: '1px solid #e8edf3', bgcolor: '#fff',
                  cursor: 'pointer', transition: 'all 150ms ease',
                  borderTop: `3px solid ${item.color}`,
                  '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.09)', transform: 'translateY(-2px)' },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ color: item.color, '& svg': { fontSize: 28 } }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>{item.value}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{item.label}</Typography>
                    <Typography variant="caption" color="text.disabled">{item.sub}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Alert strip */}
        {hasAlerts && (
          <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2.5, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={0} divider={<Divider orientation="vertical" flexItem />}>
              {draftFilings > 0 && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, px: 2, py: 1, cursor: 'pointer', borderRadius: 1.5, '&:hover': { bgcolor: '#fff8e1' } }}
                  onClick={() => setStageFilter('filing')}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: '#fff3cd', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <PendingActIcon sx={{ color: '#e65100', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Filings to Complete</Typography>
                    <Typography variant="caption" color="text.secondary">{draftFilings} draft filing(s) need submission</Typography>
                  </Box>
                  <Chip label={draftFilings} size="small" color="warning" sx={{ fontWeight: 700 }} />
                </Stack>
              )}
              {nextHearing && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, px: 2, py: 1, cursor: 'pointer', borderRadius: 1.5, '&:hover': { bgcolor: '#e3f2fd' } }}
                  onClick={() => goCase(nextHearing.CASE_ID || nextHearing.caseId, 'hearings')}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: '#dbeafe', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <HearingIcon sx={{ color: '#0277bd', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Next Hearing</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {nextHearing.TITLE || nextHearing.title || 'Hearing'} · {nextHearing.START_TIME || nextHearing.startTime || '—'}
                    </Typography>
                  </Box>
                  <ChevronRightIcon sx={{ color: 'text.disabled' }} />
                </Stack>
              )}
              {deliberationCases > 0 && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, px: 2, py: 1, cursor: 'pointer', borderRadius: 1.5, '&:hover': { bgcolor: '#e8f5e9' } }}
                  onClick={() => setStageFilter('deliberation')}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: '#dcfce7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <AutoAwesomeIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Awards in Progress</Typography>
                    <Typography variant="caption" color="text.secondary">{deliberationCases} case(s) ready for award work</Typography>
                  </Box>
                  <Chip label={deliberationCases} size="small" color="success" sx={{ fontWeight: 700 }} />
                </Stack>
              )}
            </Stack>
          </Paper>
        )}

        <Grid container spacing={3}>

          {/* ── Left: Case Management ──────────────────────────────────── */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
              {/* Card header */}
              <Box sx={{ px: 3, py: 1.75, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <AssignmentIcon color="primary" sx={{ fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={800}>My Cases</Typography>
                    <Typography variant="caption" color="text.secondary">Search, filter, and take the next procedural step</Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => navigate('/cases')}>View All</Button>
                </Stack>
              </Box>

              <Box sx={{ px: 3, py: 2.5 }}>
                {/* Search + stage filter */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                  <TextField
                    size="small" fullWidth value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    placeholder="Search by case name, ID or stage…"
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                  <TextField
                    size="small" select label="Stage" value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    sx={{ minWidth: { xs: '100%', md: 200 }, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  >
                    <MenuItem value="all">All Stages</MenuItem>
                    {workflowSteps.map(step => (
                      <MenuItem key={step.key} value={step.key}>{t(step.label)}</MenuItem>
                    ))}
                  </TextField>
                </Stack>

                {/* Stage chips */}
                {stageSummary.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {stageSummary.map(item => (
                      <Chip
                        key={item.key} size="small"
                        label={`${t(item.label)} (${item.count})`}
                        variant={stageFilter === item.key ? 'filled' : 'outlined'}
                        color={stageFilter === item.key ? 'primary' : 'default'}
                        onClick={() => setStageFilter(item.key)}
                      />
                    ))}
                  </Stack>
                )}

                {/* Case list */}
                {activeCases.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <GavelIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>No active cases yet</Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Open a new arbitration to begin a proceeding.</Typography>
                    <Button variant="contained" startIcon={<SendIcon />} onClick={() => navigate('/cases/agreement')}>Open New Case</Button>
                  </Box>
                ) : filteredActiveCases.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 1.5 }}>No cases match the current search or filter.</Alert>
                ) : (
                  <Stack spacing={2}>
                    {filteredActiveCases.map((c) => {
                      const next = nextAction(c);
                      const progress = Math.round(((stageIndex(c.caseStage) + 1) / workflowSteps.length) * 100);
                      const accent = stageAccentColor(c.caseStage);
                      return (
                        <Box
                          key={c.caseId}
                          sx={{
                            p: 2.5, borderRadius: 2,
                            border: '1px solid', borderColor: 'divider',
                            borderLeft: `4px solid ${accent}`,
                            bgcolor: '#fff',
                            transition: 'box-shadow 160ms ease, transform 160ms ease',
                            '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.10)', transform: 'translateY(-1px)' },
                          }}
                        >
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }} sx={{ mb: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.5 }}>{c.title}</Typography>
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                <Chip label={t(c.status)} size="small" color={c.status === 'active' ? 'primary' : 'warning'} />
                                <Chip
                                  label={`Stage ${stageIndex(c.caseStage) + 1}/${workflowSteps.length}: ${t(c.caseStage.replace(/_/g, ' '))}`}
                                  size="small" variant="outlined"
                                  sx={{ borderColor: accent, color: accent }}
                                />
                              </Stack>
                            </Box>
                          </Stack>

                          {/* Progress bar */}
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">Case Progress</Typography>
                              <Typography variant="caption" fontWeight={700} sx={{ color: accent }}>{progress}%</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate" value={progress}
                              sx={{
                                height: 7, borderRadius: 2, bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: accent },
                              }}
                            />
                          </Box>

                          {/* Actions */}
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button size="small" variant="contained" startIcon={<ActiveIcon />}
                              onClick={() => goCase(c.caseId, next.tab)}
                              sx={{ fontWeight: 700, bgcolor: accent, '&:hover': { bgcolor: accent, filter: 'brightness(0.88)' } }}>
                              {t(next.label)}
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<DocumentsIcon />}
                              onClick={() => goCase(c.caseId, 'documents', 'upload')}>Evidence</Button>
                            <Button size="small" variant="outlined" startIcon={<HearingIcon />}
                              onClick={() => goCase(c.caseId, 'hearings')}>Hearings</Button>
                            <Button size="small" variant="text" endIcon={<MoreVertIcon />}
                              onClick={(e) => openMore(e, c)}>More</Button>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Paper>

            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={closeMore}>
              <MenuItem onClick={() => goMore('overview', 'edit')}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit case</MenuItem>
              <MenuItem onClick={() => goMore('parties')}><GroupsIcon fontSize="small" sx={{ mr: 1 }} />Parties</MenuItem>
              <MenuItem onClick={() => goMore('ai-draft')}><AutoAwesomeIcon fontSize="small" sx={{ mr: 1 }} />AI Draft Award</MenuItem>
              <MenuItem onClick={() => goMore('award-pack')}><GavelIcon fontSize="small" sx={{ mr: 1 }} />Award Pack</MenuItem>
            </Menu>
          </Grid>

          {/* ── Right sidebar ──────────────────────────────────────────── */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2.5}>

              {/* Upcoming Hearings */}
              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <HearingIcon sx={{ fontSize: 18, color: '#0277bd' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Upcoming Hearings</Typography>
                    <Chip label={upcomingHearings.length} size="small" sx={{ ml: 'auto', fontWeight: 700 }} />
                  </Stack>
                </Box>
                <Box sx={{ p: 2 }}>
                  {upcomingHearings.length === 0 ? (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <HearingIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">No upcoming hearings.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.25}>
                      {upcomingHearings.map((h) => {
                        const hCaseId = h.CASE_ID || h.caseId;
                        return (
                          <Box key={h.HEARING_ID || h.hearingId}
                            onClick={() => goCase(hCaseId, 'hearings')}
                            sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', cursor: 'pointer', transition: 'all 140ms', '&:hover': { bgcolor: '#f0f7ff', borderColor: '#0277bd' } }}>
                            <Typography variant="body2" fontWeight={700}>{h.TITLE || h.title || 'Hearing'}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">{h.START_TIME || h.startTime || '—'}</Typography>
                            <Button size="small" variant="contained" sx={{ mt: 1, fontSize: 11, py: 0.4 }}
                              onClick={(e) => { e.stopPropagation(); goCase(hCaseId, 'hearings'); }}>
                              Join Room
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                  <Button fullWidth variant="outlined" size="small" sx={{ mt: 2, borderRadius: 1.5 }}
                    startIcon={<HearingIcon />} onClick={() => navigate('/hearings')}>
                    Manage All Hearings
                  </Button>
                </Box>
              </Paper>

              {/* Billing & Payments */}
              {(() => {
                const BILLING_STAGES = [
                  { key: 'pending_payment', label: 'Awaiting Invoice', desc: 'Case submitted — waiting for admin to issue invoice', color: '#e65100', action: null },
                  { key: 'invoiced',        label: 'Invoice Received', desc: 'Invoice issued — upload your proof of payment',     color: '#0277bd', action: { label: 'Pay Now', to: '/payments' } },
                  { key: 'proof_uploaded',  label: 'Proof Submitted',  desc: 'Payment proof uploaded — awaiting receipt',         color: '#6a1b9a', action: null },
                  { key: 'paid',            label: 'Receipt Issued',   desc: 'Case activated — you may proceed',                  color: '#2e7d32', action: null },
                ];
                const myPayments = payments || [];
                const stageCounts = BILLING_STAGES.map(stage => ({
                  ...stage,
                  count: myPayments.filter(p => (p.STATUS || p.status || '').toLowerCase() === stage.key).length,
                }));
                const invoicedCount = stageCounts.find(s => s.key === 'invoiced')?.count || 0;
                return (
                  <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PaymentIcon sx={{ fontSize: 18, color: '#e65100' }} />
                        <Typography variant="subtitle2" fontWeight={700}>Billing & Payments</Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      {invoicedCount > 0 && (
                        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1.5 }}
                          action={<Button size="small" color="warning" variant="outlined" onClick={() => navigate('/payments')}>Upload Proof</Button>}>
                          {invoicedCount} invoice{invoicedCount > 1 ? 's' : ''} awaiting your payment proof.
                        </Alert>
                      )}
                      <Stack spacing={1}>
                        {stageCounts.map(stage => (
                          <Box key={stage.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                            <Chip
                              label={stage.count}
                              size="small"
                              sx={{ fontWeight: 700, minWidth: 32, bgcolor: stage.count > 0 ? stage.color + '20' : 'action.hover', color: stage.count > 0 ? stage.color : 'text.disabled', border: `1px solid ${stage.count > 0 ? stage.color + '40' : 'transparent'}` }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: stage.count > 0 ? stage.color : 'text.disabled' }}>{stage.label}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>{stage.desc}</Typography>
                            </Box>
                            {stage.action && stage.count > 0 && (
                              <Button size="small" variant="outlined" sx={{ fontSize: 11, py: 0.3, borderRadius: 1, borderColor: stage.color, color: stage.color, '&:hover': { borderColor: stage.color, bgcolor: stage.color + '10' } }}
                                onClick={() => navigate(stage.action.to)}>
                                {stage.action.label}
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Stack>
                      <Button fullWidth variant="outlined" size="small" sx={{ mt: 1.5, borderRadius: 1.5 }}
                        startIcon={<PaymentIcon />} onClick={() => navigate('/payments')}>
                        View Full Account
                      </Button>
                    </Box>
                  </Paper>
                );
              })()}

              {/* Quick Navigation */}
              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <OpenIcon sx={{ fontSize: 18, color: '#6a1b9a' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Quick Navigation</Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Stack spacing={0.5}>
                    {quickNavItems.map((item) => (
                      <Box key={item.label} onClick={() => navigate(item.to)}
                        sx={{
                          px: 1.5, py: 1.25, borderRadius: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                          transition: 'all 140ms ease',
                          '&:hover': { bgcolor: item.color + '12', transform: 'translateX(4px)' },
                        }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: 1.25, bgcolor: item.color + '15', display: 'grid', placeItems: 'center', flexShrink: 0, color: item.color }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{item.desc}</Typography>
                        </Box>
                        <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Paper>

              {/* Help & Navigation Guide */}
              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                <Box
                  onClick={() => setHelpOpen(!helpOpen)}
                  sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3', cursor: 'pointer', userSelect: 'none' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <HelpIcon sx={{ fontSize: 18, color: '#c8a84b' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Help & Guide</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', fontWeight: 600 }}>
                      {helpOpen ? '▲' : '▼'}
                    </Typography>
                  </Stack>
                </Box>
                {helpOpen && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.25 }}>
                      Arbitration Workflow
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {workflowGuide.map((step, i) => (
                        <Stack key={step.key} direction="row" spacing={1.25} alignItems="flex-start">
                          <Box sx={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg,#0d2444,#1a3a6b)',
                            color: '#fff', display: 'grid', placeItems: 'center',
                            fontSize: 10, fontWeight: 800, mt: 0.15,
                          }}>{i + 1}</Box>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{step.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{step.desc}</Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <LightbulbIcon sx={{ fontSize: 16, color: '#c8a84b' }} />
                      <Typography variant="caption" fontWeight={700} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Quick Tips</Typography>
                    </Stack>
                    <Stack spacing={0.75}>
                      {[
                        'Click any case card to open full details.',
                        'Use "Open New Case" to start a new arbitration.',
                        'Upload evidence via the Documents tab in each case.',
                        'Join hearings directly from the Hearings tab.',
                        'AI Draft Award is available during deliberation stage.',
                        'Use Compliance Tools for legal gap analysis.',
                      ].map((tip, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                          <Typography sx={{ color: '#c8a84b', fontWeight: 900, lineHeight: 1.6, flexShrink: 0 }}>›</Typography>
                          <Typography variant="caption" color="text.secondary">{tip}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>

              {/* Closed Files */}
              {closedCases.length > 0 && (
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e8edf3', bgcolor: '#fff' }}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e8edf3' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ArchiveIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="subtitle1" fontWeight={700}>Closed Files</Typography>
                      <Chip label={closedCases.length} size="small" sx={{ ml: 'auto' }} />
                    </Stack>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Stack spacing={0.5}>
                      {closedCases.slice(0, 4).map(c => (
                        <Box key={c.caseId} sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{c.title}</Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Button size="small" variant="outlined" sx={{ fontSize: 11, py: 0.3, borderRadius: 1 }}
                              onClick={() => openArchive(c)}>Browse File</Button>
                            <Button size="small" variant="text" sx={{ fontSize: 11, py: 0.3 }}
                              onClick={() => goCase(c.caseId, 'overview')}>Open</Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Paper>
              )}

            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
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
  const [payments, setPayments] = useState([]);
  const [pendingCasesForAdmin, setPendingCasesForAdmin] = useState([]);
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

        if (isAdmin) {
          const [casesRes, paymentsRes] = await Promise.all([
            apiService.getCases().catch(() => ({ data: { cases: [] } })),
            apiService.request('GET', '/payments').catch(() => ({ data: { payments: [] } })),
          ]);
          setPendingCasesForAdmin(casesRes.data?.cases || []);
          setPayments(paymentsRes.data?.payments || paymentsRes.data || []);
        }

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
            const paymentsRes = await apiService.request('GET', '/payments').catch(() => ({ data: { payments: [] } }));
            setPayments(paymentsRes.data?.payments || paymentsRes.data || []);
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
        <AdminDashboard analytics={analytics} pendingCases={pendingCasesForAdmin} payments={payments} t={t} />
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
          payments={payments}
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
