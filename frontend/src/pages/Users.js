// src/pages/Users.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Alert, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Tabs, Tab,
  IconButton, Tooltip, InputAdornment
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Unarchive as RestoreIcon,
  Refresh as RefreshIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { getApiErrorMessage } from '../services/apiErrors';
import { useLanguage } from '../context/LanguageContext';

const ROLES = ['admin', 'secretariat', 'arbitrator', 'counsel', 'party'];

const ROLE_LABELS = {
  admin: 'Administrator',
  secretariat: 'Secretariat',
  arbitrator: 'Arbitrator',
  counsel: 'Legal Counsel',
  party: 'Party (Claimant / Respondent)'
};

const ROLE_COLORS = {
  admin: 'error',
  secretariat: 'primary',
  arbitrator: 'warning',
  counsel: 'info',
  party: 'success'
};

const roleLabelKey = (role) => {
  switch ((role || '').toLowerCase()) {
    case 'admin': return 'Administrator';
    case 'secretariat': return 'Secretariat';
    case 'arbitrator': return 'Arbitrator';
    case 'counsel': return 'Legal Counsel';
    case 'party': return 'Party (Claimant / Respondent)';
    default: return role || '';
  }
};

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', password: '', role: 'party'
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '!@#$';
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  pwd += Math.floor(Math.random() * 9) + 1;
  return pwd;
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'secretariat';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleTab, setRoleTab] = useState('all');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editUserId, setEditUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiService.getUsers();
      const rows = (res.data.users || []).map((u, i) => ({
        id: u.USER_ID || u.userId || u.user_id || i,
        userId: u.USER_ID || u.userId || u.user_id,
        firstName: u.FIRST_NAME || u.firstName || '',
        lastName: u.LAST_NAME || u.lastName || '',
        email: u.EMAIL || u.email || '',
        role: (u.ROLE || u.role || '').toLowerCase(),
        isActive: (u.IS_ACTIVE ?? u.isActive) !== 0,
        createdAt: u.CREATED_AT ? new Date(u.CREATED_AT).toLocaleDateString() : ''
      }));
      setUsers(rows);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('Could not load users.')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!createForm.firstName || !createForm.email || !createForm.password || !createForm.role) {
      setCreateError(t('First name, email, password and role are required.'));
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await apiService.registerUser(createForm);
      setCreatedUser({ ...createForm, ...res.data.user });
      setCreateForm(EMPTY_FORM);
      await fetchUsers();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, t('Failed to create user.')));
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    setEditError(null);
    try {
      await apiService.updateUser(editUserId, editForm);
      setEditOpen(false);
      await fetchUsers();
    } catch (err) {
      setEditError(getApiErrorMessage(err, t('Failed to update user.')));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (userId, name) => {
    if (!window.confirm(t('Archive user {{name}}? They will no longer be able to log in.', { name }))) return;
    try {
      await apiService.archiveUser(userId);
      await fetchUsers();
    } catch (err) {
      alert(getApiErrorMessage(err, t('Failed to archive user.')));
    }
  };

  const handleRestore = async (userId, name) => {
    if (!window.confirm(t('Restore user {{name}}? They will regain access to the platform.', { name }))) return;
    try {
      await apiService.restoreUser(userId);
      await fetchUsers();
    } catch (err) {
      alert(getApiErrorMessage(err, t('Failed to restore user.')));
    }
  };

  const openEdit = (row) => {
    setEditUserId(row.userId);
    setEditForm({ firstName: row.firstName, lastName: row.lastName, role: row.role });
    setEditError(null);
    setEditOpen(true);
  };

  const roleTabs = ['all', ...ROLES];
  const displayUsers = users.filter(u =>
    roleTab === 'all' ? true : u.role === roleTab
  );

  const columns = [
    {
      field: 'name', headerName: t('Name'), width: 180,
      valueGetter: (params) => `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() || '—'
    },
    { field: 'email', headerName: t('Email'), width: 240 },
    {
      field: 'role', headerName: t('Role'), width: 180,
      renderCell: (params) => (
        <Chip
          label={t(roleLabelKey(params.value))}
          size="small"
          color={ROLE_COLORS[params.value] || 'default'}
        />
      )
    },
    {
      field: 'isActive', headerName: t('Status'), width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? t('Active') : t('Archived')}
          size="small"
          color={params.value ? 'success' : 'default'}
          variant="outlined"
        />
      )
    },
    { field: 'createdAt', headerName: t('Created'), width: 110 },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={t('Edit user')}>
            <span>
              <IconButton size="small" onClick={() => openEdit(params.row)}
                disabled={!canManage}>
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {isAdmin && params.row.userId !== (currentUser?.userId || currentUser?.USER_ID) && (
            params.row.isActive ? (
              <Tooltip title={t('Archive user')}>
                <IconButton size="small" color="warning"
                  onClick={() => handleArchive(params.row.userId, params.row.firstName || params.row.email)}>
                  <ArchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={t('Restore user')}>
                <IconButton size="small" color="success"
                  onClick={() => handleRestore(params.row.userId, params.row.firstName || params.row.email)}>
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          )}
        </Box>
      )
    }
  ];

  if (!canManage) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{t('Access denied. Only administrators and secretariat can manage users.')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{t('User Management')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Create and manage platform users — arbitrators, counsel, parties, and secretariat staff')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('Refresh')}>
            <IconButton onClick={fetchUsers}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => { setCreatedUser(null); setCreateForm(EMPTY_FORM); setCreateError(null); setCreateOpen(true); }}>
            {t('Create User')}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Role summary chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r && u.isActive).length;
          return (
            <Chip key={r}
              label={`${t(roleLabelKey(r))}: ${count}`}
              color={ROLE_COLORS[r]}
              variant="outlined"
              size="small"
              onClick={() => setRoleTab(r === roleTab ? 'all' : r)}
              sx={{ cursor: 'pointer', fontWeight: roleTab === r ? 'bold' : 'normal' }}
            />
          );
        })}
        <Chip label={`Total: ${users.filter(u => u.isActive).length}`} size="small" />
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={roleTabs.indexOf(roleTab)} onChange={(_, v) => setRoleTab(roleTabs[v])}
          variant="scrollable" scrollButtons="auto">
          <Tab label={`${t('All')} (${users.length})`} />
          {ROLES.map(r => (
            <Tab key={r} label={`${t(roleLabelKey(r))} (${users.filter(u => u.role === r).length})`} />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ height: 480 }}>
        {loading
          ? <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
          : <DataGrid
              rows={displayUsers}
              columns={columns}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 25]}
            />
        }
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => { if (!creating) setCreateOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Create New User')}</DialogTitle>
        <DialogContent>
          {createdUser ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              <strong>{t('User created successfully!')}</strong><br />
              Send these credentials to <strong>{createdUser.email}</strong>:<br />
              Email: <strong>{createdUser.email}</strong><br />
              Password: <strong>{createdUser.password}</strong><br />
              {t('Role')}: <strong>{t(roleLabelKey(createdUser.role))}</strong><br /><br />
              <em>{t('Ask the user to change their password after first login.')}</em>
            </Alert>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {createError && <Grid item xs={12}><Alert severity="error">{createError}</Alert></Grid>}
              <Grid item xs={6}>
              <TextField label={t('First Name *')} fullWidth value={createForm.firstName}
                  onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label={t('Last Name')} fullWidth value={createForm.lastName}
                  onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t('Email Address *')} fullWidth type="email" value={createForm.email}
                  autoComplete="off"
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('Password *')} fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  autoComplete="new-password"
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t('Show/hide')}>
                          <IconButton size="small" onClick={() => setShowPassword(s => !s)}>
                            {showPassword ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Generate password')}>
                          <IconButton size="small" onClick={() => {
                            const pwd = generatePassword();
                            setCreateForm(f => ({ ...f, password: pwd }));
                            setShowPassword(true);
                          }}>
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Copy password')}>
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(createForm.password)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                  helperText={t('Min 8 characters. Use the refresh icon to auto-generate.')}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('Role *')}</InputLabel>
                  <Select value={createForm.role} label={t('Role *')}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                    {ROLES.filter(r => isAdmin ? true : r !== 'admin').map(r => (
                      <MenuItem key={r} value={r}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={t(roleLabelKey(r))} size="small" color={ROLE_COLORS[r]} />
                          <Typography variant="body2">{t(roleLabelKey(r))}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 0 }}>
                  {createForm.role === 'admin' && t('Full platform access — all cases, users, documents, and settings.')}
                  {createForm.role === 'secretariat' && t('Can create and manage cases, documents, and hearings. Cannot manage users.')}
                  {createForm.role === 'arbitrator' && t('Can view assigned cases, access documents, conduct hearings, and issue awards.')}
                  {createForm.role === 'counsel' && t('Can view their client\'s cases, upload submissions, and attend hearings.')}
                  {createForm.role === 'party' && t('Can view their case(s), upload supporting documents, and attend hearings.')}
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{createdUser ? t('Close') : t('Cancel')}</Button>
          {!createdUser && (
            <Button variant="contained" onClick={handleCreate} disabled={creating}>
              {creating ? t('Creating...') : t('Create User')}
            </Button>
          )}
          {createdUser && (
            <Button variant="outlined" onClick={() => { setCreatedUser(null); setCreateForm(EMPTY_FORM); }}>
              {t('Create Another')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Edit User')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {editError && <Grid item xs={12}><Alert severity="error">{editError}</Alert></Grid>}
            <Grid item xs={6}>
              <TextField label={t('First Name')} fullWidth value={editForm.firstName || ''}
                onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label={t('Last Name')} fullWidth value={editForm.lastName || ''}
                onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
            </Grid>
            {isAdmin && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('Role')}</InputLabel>
                  <Select value={editForm.role || 'party'} label={t('Role')}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                    {ROLES.map(r => (
                      <MenuItem key={r} value={r}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={r} size="small" color={ROLE_COLORS[r]} />
                          <Typography variant="body2">{ROLE_LABELS[r]}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? t('Saving...') : t('Save Changes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
