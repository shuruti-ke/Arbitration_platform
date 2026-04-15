// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Card, CardContent,
  CardActions, Button, Box, Alert, CircularProgress, Chip, Divider
} from '@mui/material';
import {
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  BarChart as AnalyticsIcon,
  FolderOpen as RepoIcon,
  Schedule as PendingIcon,
  CheckCircle as DoneIcon,
  PlayArrow as ActiveIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

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

const Dashboard = () => {
  const navigate = useNavigate();
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

        // Aggregate case stats from analytics
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

        // Recent 5 cases
        const cases = (casesRes.data.cases || []).slice(0, 5);
        setRecentCases(cases);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Arbitration Platform Dashboard
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Cases"
            value={stats.total}
            icon={<CasesIcon fontSize="large" />}
            color="text.secondary"
            linkTo="/cases"
            linkLabel="View All"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Cases"
            value={stats.active}
            icon={<ActiveIcon fontSize="large" />}
            color="primary.main"
            linkTo="/cases"
            linkLabel="View Active"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Cases"
            value={stats.completed}
            icon={<DoneIcon fontSize="large" />}
            color="success.main"
            linkTo="/cases"
            linkLabel="View Completed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Documents"
            value={stats.documents}
            icon={<DocumentsIcon fontSize="large" />}
            color="info.main"
            linkTo="/documents"
            linkLabel="Document Library"
          />
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

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" startIcon={<CasesIcon />} fullWidth component={Link} to="/cases">
                New Case
              </Button>
              <Button variant="outlined" startIcon={<DocumentsIcon />} fullWidth component={Link} to="/documents">
                Document Library
              </Button>
              <Button variant="outlined" startIcon={<AnalyticsIcon />} fullWidth component={Link} to="/analytics">
                View Analytics
              </Button>
              <Button variant="outlined" startIcon={<RepoIcon />} fullWidth component={Link} to="/cases">
                Case Repository
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
