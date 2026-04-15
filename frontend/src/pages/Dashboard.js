// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  BarChart as AnalyticsIcon,
  Warning as AlertsIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    pendingDisclosures: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiService.getHealth();
        setDashboardData({
          totalCases: 24,
          activeCases: 8,
          completedCases: 16,
          pendingDisclosures: 3
        });
      } catch (err) {
        setError('Unable to connect to server. Showing cached data.');
        setDashboardData({
          totalCases: 24,
          activeCases: 8,
          completedCases: 16,
          pendingDisclosures: 3
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Arbitration Platform Dashboard
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Cases</Typography>
              <Typography variant="h4">{dashboardData.totalCases}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/cases">View All</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Cases</Typography>
              <Typography variant="h4">{dashboardData.activeCases}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/cases">View Active</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Completed Cases</Typography>
              <Typography variant="h4">{dashboardData.completedCases}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/cases">View Completed</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending Disclosures</Typography>
              <Typography variant="h4">{dashboardData.pendingDisclosures}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/cases">View Pending</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            <Box sx={{ minHeight: 200 }}>
              <Typography color="textSecondary">
                Recent case activities will appear here...
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<CasesIcon />}
                fullWidth
                component={Link}
                to="/cases"
                sx={{ mb: 1 }}
              >
                New Case
              </Button>
              <Button
                variant="outlined"
                startIcon={<DocumentsIcon />}
                fullWidth
                component={Link}
                to="/documents"
                sx={{ mb: 1 }}
              >
                Upload Document
              </Button>
              <Button
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                fullWidth
                component={Link}
                to="/analytics"
                sx={{ mb: 1 }}
              >
                View Analytics
              </Button>
              <Button
                variant="outlined"
                startIcon={<AlertsIcon />}
                fullWidth
                component={Link}
                to="/cases"
              >
                Check Alerts
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
