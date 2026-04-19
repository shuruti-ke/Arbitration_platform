// src/pages/Analytics.js
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Grid, Box, CircularProgress, Alert,
  Card, CardContent
} from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CHART_COLORS = [
  'rgba(25, 118, 210, 0.7)',
  'rgba(56, 142, 60, 0.7)',
  'rgba(211, 47, 47, 0.7)',
  'rgba(245, 124, 0, 0.7)',
  'rgba(123, 31, 162, 0.7)',
  'rgba(0, 151, 167, 0.7)',
];

const StatCard = ({ label, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ textAlign: 'center' }}>
      <Typography variant="h3" sx={{ color, fontWeight: 700 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{label}</Typography>
    </CardContent>
  </Card>
);

const Analytics = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.getAnalytics()
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const monthlyLabels = (data.monthlyCases || []).map(r => r.MON || r.mon);
  const monthlyCounts = (data.monthlyCases || []).map(r => parseInt(r.CNT || r.cnt || 0));

  const barData = {
    labels: monthlyLabels.length ? monthlyLabels : ['No data'],
    datasets: [{
      label: t('Cases Filed'),
      data: monthlyCounts.length ? monthlyCounts : [0],
      backgroundColor: 'rgba(25, 118, 210, 0.6)',
      borderColor: 'rgba(25, 118, 210, 1)',
      borderWidth: 1,
    }]
  };

  const typeLabels = (data.casesByType || []).map(r => r.CASE_TYPE || r.case_type);
  const typeCounts = (data.casesByType || []).map(r => parseInt(r.CNT || r.cnt || 0));

  const pieData = {
    labels: typeLabels.length ? typeLabels : ['No data'],
    datasets: [{
      data: typeCounts.length ? typeCounts : [1],
      backgroundColor: CHART_COLORS.slice(0, typeLabels.length || 1),
    }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>{t('Analytics Dashboard')}</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label={t('Total Cases')} value={data.totalCases} color="#1976d2" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label={t('Documents')} value={data.totalDocuments} color="#388e3c" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label={t('Hearings')} value={data.totalHearings} color="#f57c00" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label={t('Active Users')} value={data.totalUsers} color="#7b1fa2" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{t('Cases Filed (Last 6 Months)')}</Typography>
            <Box sx={{ height: 280 }}>
              <Bar data={barData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{t('Case Types')}</Typography>
            <Box sx={{ height: 280 }}>
              <Pie data={pieData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{t('Cases by Status')}</Typography>
            {(data.casesByStatus || []).length === 0
              ? <Typography color="text.secondary">No cases yet</Typography>
              : (data.casesByStatus || []).map((r, i) => {
                  const status = r.STATUS || r.status || '—';
                  const count = parseInt(r.CNT || r.cnt || 0);
                  return (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{status}</Typography>
                      <Typography variant="body2" fontWeight={600}>{count}</Typography>
                    </Box>
                  );
                })}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{t('Hearings by Status')}</Typography>
            {(data.hearingsByStatus || []).length === 0
              ? <Typography color="text.secondary">No hearings yet</Typography>
              : (data.hearingsByStatus || []).map((r, i) => {
                  const status = r.STATUS || r.status || '—';
                  const count = parseInt(r.CNT || r.cnt || 0);
                  return (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{status}</Typography>
                      <Typography variant="body2" fontWeight={600}>{count}</Typography>
                    </Box>
                  );
                })}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
