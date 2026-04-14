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
  Box
} from '@mui/material';
import {
  Gavel as CasesIcon,
  Description as DocumentsIcon,
  BarChart as AnalyticsIcon,
  Warning as AlertsIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    pendingDisclosures: 0
  });

  useEffect(() => {
    // In a real app, this would fetch from the API
    setDashboardData({
      totalCases: 24,
      activeCases: 8,
      completedCases: 16,
      pendingDisclosures: 3
    });
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Arbitration Platform Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cases
              </Typography>
              <Typography variant="h4">
                {dashboardData.totalCases}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component="a" href="/cases">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Cases
              </Typography>
              <Typography variant="h4">
                {dashboardData.activeCases}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component="a" href="/cases">
                View Active
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Cases
              </Typography>
              <Typography variant="h4">
                {dashboardData.completedCases}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component="a" href="/cases">
                View Completed
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Disclosures
              </Typography>
              <Typography variant="h4">
                {dashboardData.pendingDisclosures}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component="a" href="/cases">
                View Pending
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ minHeight: 200 }}>
              <Typography color="textSecondary">
                Recent case activities will appear here...
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<CasesIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                New Case
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DocumentsIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                Upload Document
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<AnalyticsIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                View Analytics
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<AlertsIcon />}
                fullWidth
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