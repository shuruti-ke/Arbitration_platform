// src/pages/Analytics.js
import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
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
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const { t } = useLanguage();
  // Sample data for charts
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: t('Cases Created'),
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(25, 118, 210, 0.5)',
      },
      {
        label: t('Cases Completed'),
        data: [8, 15, 2, 3, 1, 2],
        backgroundColor: 'rgba(56, 210, 25, 0.5)',
      }
    ],
  };

  const pieData = {
    labels: [t('Commercial'), t('Employment'), t('IP'), t('Other')],
    datasets: [
      {
        data: [300, 150, 100, 50],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js',
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('Analytics Dashboard')}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('Cases Overview')}
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={barData} options={options} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('Case Types Distribution')}
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={pieData} options={options} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('Performance Metrics')}
            </Typography>
            <Box sx={{ minHeight: 200 }}>
              <Typography variant="body1">
                • {t('Average case resolution time: 45 days')}
              </Typography>
              <Typography variant="body1">
                • {t('Compliance rate: 98.5%')}
              </Typography>
              <Typography variant="body1">
                • {t('User satisfaction: 4.7/5.0')}
              </Typography>
              <Typography variant="body1">
                • {t('Active arbitrators: 24')}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('System Health')}
            </Typography>
            <Box sx={{ minHeight: 200 }}>
              <Typography variant="body1">
                • {t('API Response Time: 120ms')}
              </Typography>
              <Typography variant="body1">
                • {t('Uptime: 99.9%')}
              </Typography>
              <Typography variant="body1">
                • {t('Active Users: 42')}
              </Typography>
              <Typography variant="body1">
                • {t('Storage Used: 2.4 GB')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
