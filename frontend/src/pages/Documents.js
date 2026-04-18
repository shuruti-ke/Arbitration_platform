// src/pages/Documents.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Container, Typography, Paper, Box, Button, Grid, Card,
  CardContent, CardActions, Chip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Tabs, Tab, IconButton, Tooltip, Divider,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Article as TextIcon,
  InsertDriveFile as FileIcon,
  SmartToy as AIIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  LibraryBooks as LibraryIcon,
  Folder as CaseIcon,
  Lock as PrivateIcon,
  Public as GlobalIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  FolderOpen as FolderOpenIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import SearchableField from '../components/SearchableField';

const DOC_CATEGORIES = [
  'Constitution / Legislation',
  'Arbitration Rules',
  'Case Precedent / Award',
  'Legal Commentary',
  'Pleading',
  'Evidence / Exhibit',
  'Legal Brief',
  'Arbitration Agreement',
  'Award / Decision',
  'Procedural Order',
  'Correspondence',
  'Expert Report',
  'Contract / Agreement',
  'Proof of Service',
  'Certificate of Service',
  'Other',
];

const titleizeCode = (value) => String(value || '')
  .trim()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\b\w/g, (ch) => ch.toUpperCase());

const getFileIcon = (name) => {
  if (!name) return <FileIcon />;
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return <PdfIcon color="error" />;
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return <TextIcon color="primary" />;
  return <DocumentIcon color="action" />;
};

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [libraryDocs, setLibraryDocs] = useState([]);
  const [caseDocs, setCaseDocs] = useState([]);
  const [caseMeta, setCaseMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    caseId: '', category: 'Other', description: '', accessLevel: 'case'
  });
  const fileInputRef = useRef();

  // AI analysis state
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeDoc, setAnalyzeDoc] = useState(null);
  const [analyzePrompt, setAnalyzePrompt] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const mapDoc = (d) => ({
    id: d.ID || d.id,
    name: d.DOCUMENT_NAME || d.documentName || 'Untitled',
    caseId: d.CASE_ID || d.caseId || '',
    category: d.CATEGORY || d.category || 'Other',
    description: d.DESCRIPTION || d.description || '',
    accessLevel: d.ACCESS_LEVEL || d.accessLevel || 'case',
    createdAt: d.CREATED_AT ? new Date(d.CREATED_AT).toLocaleDateString() : '',
  });

  const displayDocCategory = (value) => t(value || titleizeCode(value));

  const fetchDocuments = async () => {
    try {
      const [libRes, caseRes, casesRes] = await Promise.all([
        apiService.getDocuments('global'),
        apiService.getDocuments('case'),
        apiService.getCases(),
      ]);
      setLibraryDocs((libRes.data.documents || []).map(mapDoc));
      const mappedCases = (casesRes.data.cases || []).reduce((acc, item) => {
        const caseId = item.CASE_ID || item.caseId || '';
        if (!caseId) return acc;
        acc[caseId] = {
          title: item.TITLE || item.title || caseId,
          status: item.STATUS || item.status || '',
        };
        return acc;
      }, {});
      setCaseMeta(mappedCases);
      setCaseDocs((caseRes.data.documents || []).map(mapDoc));
      setError(null);
    } catch (err) {
      setError(t('Could not load documents from server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { setUploadError(t('Please select a file.')); return; }
    if (uploadForm.accessLevel === 'case' && !uploadForm.caseId) {
      setUploadError(t('Case ID is required for case documents.'));
      return;
    }
    setUploading(true);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        await apiService.uploadDocument({
          documentName: selectedFile.name,
          caseId: uploadForm.caseId || null,
          category: uploadForm.category,
          description: uploadForm.description,
          accessLevel: uploadForm.accessLevel,
          content: base64,
          mimeType: selectedFile.type,
        });
        setUploadOpen(false);
        setSelectedFile(null);
        setUploadForm({ caseId: '', category: 'Other', description: '', accessLevel: 'case' });
        await fetchDocuments();
      } catch (err) {
        setUploadError(err.response?.data?.error || t('Upload failed.'));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = async (doc) => {
    const msg = doc.accessLevel === 'global'
      ? t('Delete "{{name}}" from the Platform Library?', { name: doc.name })
      : t('Delete "{{name}}"?', { name: doc.name });
    if (!window.confirm(msg)) return;
    try {
      await apiService.deleteDocument(doc.id);
      await fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error || t('Delete failed.'));
    }
  };

  const canDelete = (doc) => {
    if (!user) return false;
    const role = (user.role || user.ROLE || '').toLowerCase();
    if (doc.accessLevel === 'global') return role === 'admin';
    return ['admin', 'secretariat'].includes(role);
  };

  const openAnalyze = (doc) => {
    setAnalyzeDoc(doc);
    setAnalyzePrompt('');
    setAnalyzeResult('');
    setAnalyzeError(null);
    setAnalyzeOpen(true);
  };


  const handleAnalyze = async () => {
    if (!analyzePrompt.trim()) { setAnalyzeError(t('Enter a question or analysis request.')); return; }
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeResult('');
    try {
      const res = await apiService.analyzeDocument(analyzeDoc.id, analyzePrompt);
      setAnalyzeResult(res.data.analysis || t('No analysis returned.'));
    } catch (err) {
      setAnalyzeError(err.response?.data?.error || t('AI analysis failed.'));
    } finally {
      setAnalyzing(false);
    }
  };

  const filter = (docs) => {
    const q = searchQuery.toLowerCase();
    return docs.filter((d) =>
      !q || d.name.toLowerCase().includes(q) ||
      (d.caseId || '').toLowerCase().includes(q) ||
      (d.category || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  };

  const groupedCaseDocs = useMemo(() => {
    return filter(caseDocs).reduce((acc, doc) => {
      const key = doc.caseId || 'unassigned';
      if (!acc[key]) acc[key] = [];
      acc[key].push(doc);
      return acc;
    }, {});
  }, [caseDocs, searchQuery]);

  const caseFolders = useMemo(() => {
    return Object.entries(groupedCaseDocs)
      .map(([caseId, docs]) => ({
        caseId,
        title: caseMeta[caseId]?.title || caseId,
        status: caseMeta[caseId]?.status || '',
        docs,
      }))
      .sort((a, b) => (a.title || '').localeCompare(b.title || '') || a.caseId.localeCompare(b.caseId));
  }, [groupedCaseDocs, caseMeta]);

  const renderDocRow = (doc) => (
    <Paper
      key={doc.id}
      variant="outlined"
      sx={{ p: 1.5, mb: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        {getFileIcon(doc.name)}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
            {doc.name}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75, mb: 0.75 }}>
            <Chip label={displayDocCategory(doc.category)} size="small" color="primary" variant="outlined" />
            {doc.description && <Chip label={doc.description} size="small" variant="outlined" />}
            <Chip icon={<PrivateIcon />} label={`${t('Case')}: ${doc.caseId.slice(-8)}`} size="small" variant="outlined" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {doc.createdAt}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={t('Open case')}>
            <IconButton size="small" onClick={() => navigate(`/cases/${doc.caseId}`)}>
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Analyze with AI — uses this doc + Platform Library as context')}>
            <IconButton size="small" color="secondary" onClick={() => openAnalyze(doc)}>
              <AIIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canDelete(doc) && (
            <Tooltip title={t('Delete document')}>
              <IconButton size="small" color="error" onClick={() => handleDelete(doc)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );

  const DocGrid = ({ docs, emptyText }) => (
    docs.length === 0 ? (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <DocumentIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">{emptyText}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setUploadOpen(true)}>
          {t('Upload Document')}
        </Button>
      </Paper>
    ) : (
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {docs.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  {getFileIcon(doc.name)}
                  <Typography variant="subtitle2" sx={{ wordBreak: 'break-word', flex: 1 }}>
                    {doc.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  <Chip label={displayDocCategory(doc.category)} size="small" color="primary" variant="outlined" />
                  {doc.accessLevel === 'global'
                    ? <Chip icon={<GlobalIcon />} label={t('Platform Library')} size="small" color="success" variant="outlined" />
                    : doc.caseId && <Chip icon={<PrivateIcon />} label={`${t('Case')}: ${doc.caseId.slice(-8)}`} size="small" variant="outlined" />
                  }
                </Box>
                {doc.description && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {doc.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">{doc.createdAt}</Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Tooltip title={t('Analyze with AI — uses this doc + Platform Library as context')}>
                  <Button size="small" startIcon={<AIIcon />} onClick={() => openAnalyze(doc)} color="secondary">
                    {t('Analyze with AI')}
                  </Button>
                </Tooltip>
                {canDelete(doc) && (
                  <Tooltip title={t('Delete document')}>
                    <IconButton size="small" color="error" onClick={() => handleDelete(doc)} sx={{ ml: 'auto' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
        <Typography variant="h4">{t('Document Library')}</Typography>
        <Typography variant="body2" color="text.secondary">
            {t('Two levels:')} <strong>{t('Platform Library')}</strong> {t('(global AI knowledge)')} · <strong>{t('Case Documents')}</strong> {t('(case-specific folders for each arbitration matter)')}
        </Typography>
        </Box>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
          {t('Upload')}
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ px: 2, pt: 2 }}>
          <TextField
            size="small"
            placeholder={t('Search documents...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ mb: 1, width: 320 }}
          />
        </Box>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2 }}>
          <Tab icon={<LibraryIcon />} iconPosition="start"
            label={`${t('Platform Library')} (${libraryDocs.length})`}
            sx={{ textTransform: 'none' }} />
          <Tab icon={<CaseIcon />} iconPosition="start"
            label={`${t('Case Documents')} (${caseDocs.length})`}
            sx={{ textTransform: 'none' }} />
        </Tabs>
      </Paper>

      {/* Platform Library tab description */}
      {tabValue === 0 && (
        <Alert severity="info" icon={<GlobalIcon />} sx={{ mb: 2 }}>
          <strong>{t('Platform Library')}</strong> — {t('Upload laws, constitutions, arbitration acts, and institutional rules here.')}
          {t('The AI uses these documents as background knowledge when analyzing any case or document across the platform.')}
          {t('Only admin/secretariat can upload here.')}
        </Alert>
      )}

      {tabValue === 1 && (
        <Alert severity="info" icon={<PrivateIcon />} sx={{ mb: 2 }}>
          <strong>{t('Case Documents')}</strong> — {t('Case folders for each arbitration matter, containing pleadings, evidence, contracts, correspondence, service records, and other filings.')}
          {t('The AI uses these only when analyzing that specific case, combined with the Platform Library.')}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          {tabValue === 0 && (
            <DocGrid docs={filter(libraryDocs)} emptyText={t('No platform library documents yet. Upload laws, rules, and precedents here.')} />
          )}
          {tabValue === 1 && (
            caseFolders.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
                <FolderOpenIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  {t('No case folders yet. Upload documents to a case to create its folder.')}
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => setUploadOpen(true)}>
                  {t('Upload Document')}
                </Button>
              </Paper>
            ) : (
              <Box sx={{ mt: 1 }}>
                {caseFolders.map((folder) => (
                  <Accordion key={folder.caseId} defaultExpanded sx={{ mb: 1.5 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
                        <FolderOpenIcon color="primary" />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ wordBreak: 'break-word' }}>
                            {folder.title}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                            <Chip label={`${t('Case ID')}: ${folder.caseId}`} size="small" variant="outlined" />
                            {folder.status && <Chip label={t(folder.status)} size="small" color="primary" variant="outlined" />}
                            <Chip label={`${folder.docs.length} ${t('document(s)')}`} size="small" color="secondary" variant="outlined" />
                          </Box>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                        <Button size="small" variant="text" onClick={() => navigate(`/cases/${folder.caseId}`)} startIcon={<OpenIcon />}>
                          {t('Open case')}
                        </Button>
                      </Box>
                      {folder.docs.map((doc) => renderDocRow(doc))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => { setUploadOpen(false); setSelectedFile(null); setUploadError(null); }}
        maxWidth="sm" fullWidth>
        <DialogTitle>{t('Upload Document')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            {/* Access Level selector */}
            <FormControl fullWidth>
            <InputLabel>{t('Document Level')}</InputLabel>
            <Select value={uploadForm.accessLevel} label={t('Document Level')}
                onChange={(e) => setUploadForm({ ...uploadForm, accessLevel: e.target.value, caseId: '' })}>
              <MenuItem value="global">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GlobalIcon color="success" fontSize="small" />
                    <Box>
                      <Typography variant="body2">{t('Platform Library')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Global AI knowledge — laws, rules, precedents (admin only)')}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="case">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PrivateIcon color="warning" fontSize="small" />
                    <Box>
                      <Typography variant="body2">{t('Case Document')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('Linked to a specific case — AI uses for that case only')}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Box
              sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.rtf,.jpg,.jpeg,.png" />
              <UploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {selectedFile ? selectedFile.name : t('PDF, Word, Excel, CSV, TXT, Images')}
              </Typography>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>

            <SearchableField
              label={t('Category')}
              value={uploadForm.category}
              onChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              options={DOC_CATEGORIES}
            />

            {uploadForm.accessLevel === 'case' && (
              <TextField
                label={t('Case ID *')}
                fullWidth
                required
                value={uploadForm.caseId}
                onChange={(e) => setUploadForm({ ...uploadForm, caseId: e.target.value })}
                placeholder={t('e.g. case-1776271919109')}
                helperText={t('This document will only be used by the AI for this specific case')}
              />
            )}

            <TextField
              label={t('Description (optional)')}
              fullWidth
              multiline
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder={uploadForm.accessLevel === 'global'
                ? t('e.g. Constitution of Kenya 2010 — full text')
                : t('e.g. Claimant statement of claim filed 15 April 2026')}
            />

            {uploading && <LinearProgress />}
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => { setUploadOpen(false); setSelectedFile(null); setUploadError(null); }}>
            {t('Cancel')}
          </Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? t('Uploading...') : t('Upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={analyzeOpen} onClose={() => setAnalyzeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="secondary" />
            {t('AI Document Analysis')}
            {analyzeDoc?.accessLevel === 'global'
              ? <Chip label={t('Uses Platform Library')} size="small" color="success" sx={{ ml: 1 }} />
              : <Chip label={t('Uses Platform Library + Case Docs')} size="small" color="info" sx={{ ml: 1 }} />
            }
            <IconButton sx={{ ml: 'auto' }} onClick={() => setAnalyzeOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {analyzeDoc && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getFileIcon(analyzeDoc.name)}
                  <Box>
                  <Typography variant="body2" fontWeight="medium">{analyzeDoc.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{displayDocCategory(analyzeDoc.category)}
                      {analyzeDoc.accessLevel === 'global' ? ` · ${t('Platform Library')}` : ` · ${t('Case')}: ${analyzeDoc.caseId}`}
                  </Typography>
                  </Box>
                </Box>
              </Paper>

              <TextField
                label={t('What would you like to know about this document?')}
                multiline
                rows={3}
                fullWidth
                value={analyzePrompt}
                onChange={(e) => setAnalyzePrompt(e.target.value)}
                placeholder={t('e.g. Summarize the key arbitration provisions, What are the applicable laws, Identify the parties and their positions, Compare with the Arbitration Act')}
              />

              {analyzeError && <Alert severity="error">{analyzeError}</Alert>}

              {analyzing && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('Analyzing with AI — cross-referencing Platform Library...')}
                  </Typography>
                </Box>
              )}

              {analyzeResult && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <AIIcon fontSize="small" color="secondary" />
                    <Typography variant="caption" color="text.secondary" fontWeight="medium">
                      {t('AI Analysis')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analyzeResult}</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyzeOpen(false)}>{t('Close')}</Button>
              <Button variant="contained" onClick={handleAnalyze} disabled={analyzing || !analyzePrompt.trim()}
            startIcon={<AIIcon />}>
            {analyzing ? t('Analyzing...') : t('Analyze')}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default Documents;
