// src/pages/Cases.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { apiService } from '../services/api';

const Cases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await apiService.getCases();
        setCases(response.data || []);
      } catch (err) {
        setError('Could not load cases from server. Showing sample data.');
        setCases([
          { id: 1, caseId: 'CASE-2026-001', title: 'Commercial Dispute ABC Corp', status: 'active', parties: 2, createdAt: '2026-04-01', updatedAt: '2026-04-10' },
          { id: 2, caseId: 'CASE-2026-002', title: 'Contract Dispute XYZ Ltd', status: 'completed', parties: 3, createdAt: '2026-03-15', updatedAt: '2026-04-05' },
          { id: 3, caseId: 'CASE-2026-003', title: 'IP Dispute Tech Innovations', status: 'pending', parties: 2, createdAt: '2026-04-08', updatedAt: '2026-04-12' },
          { id: 4, caseId: 'CASE-2026-004', title: 'Employment Dispute Global Corp', status: 'active', parties: 2, createdAt: '2026-04-02', updatedAt: '2026-04-11' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { field: 'caseId', headerName: 'Case ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 300 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'active' ? 'primary' :
            params.value === 'completed' ? 'success' : 'warning'
          }
          size="small"
          variant="outlined"
        />
      )
    },
    { field: 'parties', headerName: 'Parties', width: 100 },
    { field: 'createdAt', headerName: 'Created', width: 120 },
    { field: 'updatedAt', headerName: 'Updated', width: 120 }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Case Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => alert('New case form coming soon')}
        >
          New Case
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search Cases"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={filterStatus}
              label="Status Filter"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterStatus('all')}
          >
            Reset Filter
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 400, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredCases}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } }
            }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        )}
      </Paper>
    </Container>
  );
};

export default Cases;
