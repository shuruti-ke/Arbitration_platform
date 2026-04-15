// src/pages/Documents.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Paper, Box, Button, Grid, Card,
  CardContent, CardActions, Chip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Tabs, Tab, IconButton, Tooltip, Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Article as TextIcon,
  InsertDriveFile as FileIcon,
  SmartToy as AIIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

const DOC_CATEGORIES = [
  'Pleading',
  'Evidence / Exhibit',
  'Legal Brief',
  'Arbitration Agreement',
  'Award / Decision',
  'Procedural Order',
  'Correspondence',
  'Expert Report',
  'Contract / Agreement',
  'Other',
];

const getFileIcon = (name) => {
  if (!name) return <FileIcon />;
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return <PdfIcon color="error" />;
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return <TextIcon color="primary" />;
  return <DocumentIcon color="action" />;
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ caseId: '', category: 'Other', description: '' });
  const fileInputRef = useRef();

  // AI analysis state
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeDoc, setAnalyzeDoc] = useState(null);
  const [analyzePrompt, setAnalyzePrompt] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const fetchDocuments = async () => {
    try {
      const response = await apiService.getDocuments();
      const docs = (response.data.documents || []).map((d) => ({
        id: d.ID || d.id,
        name: d.DOCUMENT_NAME || d.documentName || 'Untitled',
        caseId: d.CASE_ID || d.caseId || '',
        category: d.CATEGORY || d.category || 'Other',
        description: d.DESCRIPTION || d.description || '',
        createdAt: d.CREATED_AT ? new Date(d.CREATED_AT).toLocaleDateString() : '',
      }));
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError('Could not load documents from server.');
      setDocuments([]);
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
    if (!selectedFile) { setUploadError('Please select a file.'); return; }
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
          content: base64,
          mimeType: selectedFile.type,
        });
        setUploadOpen(false);
        setSelectedFile(null);
        setUploadForm({ caseId: '', category: 'Other', description: '' });
        await fetchDocuments();
      } catch (err) {
        setUploadError(err.response?.data?.error || 'Upload failed.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const openAnalyze = (doc) => {
    setAnalyzeDoc(doc);
    setAnalyzePrompt('');
    setAnalyzeResult('');
    setAnalyzeError(null);
    setAnalyzeOpen(true);
  };

  const handleAnalyze = async () => {
    if (!analyzePrompt.trim()) { setAnalyzeError('Enter a question or analysis request.'); return; }
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeResult('');
    try {
      const res = await apiService.analyzeDocument(analyzeDoc.id, analyzePrompt);
      setAnalyzeResult(res.data.analysis || 'No analysis returned.');
    } catch (err) {
      setAnalyzeError(err.response?.data?.error || 'AI analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || d.name.toLowerCase().includes(q) || (d.caseId || '').toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q);
    if (tabValue === 0) return matchesSearch;
    const cats = ['Pleading', 'Evidence / Exhibit', 'Legal Brief', 'Arbitration Agreement', 'Award / Decision', 'Procedural Order'];
    if (tabValue === 1) return matchesSearch && cats.includes(d.category);
    return matchesSearch && !cats.includes(d.category);
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Document Library</Typography>
          <Typography variant="body2" color="text.secondary">
            Central repository for all case documents · AI-powered analysis available
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
          Upload Document
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search + Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ px: 2, pt: 2 }}>
          <TextField
            size="small"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ mb: 1, width: 300 }}
          />
        </Box>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2 }}>
          <Tab label={`All (${documents.length})`} />
          <Tab label="Legal Documents" />
          <Tab label="Other" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : filteredDocs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            {searchQuery ? 'No documents match your search.' : 'No documents uploaded yet.'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => setUploadOpen(true)}>
              Upload First Document
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredDocs.map((doc) => (
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
                    <Chip label={doc.category} size="small" color="primary" variant="outlined" />
                    {doc.caseId && <Chip label={`Case: ${doc.caseId.slice(-8)}`} size="small" variant="outlined" />}
                  </Box>
                  {doc.description && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {doc.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Uploaded: {doc.createdAt}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Tooltip title="Analyze with AI">
                    <Button size="small" startIcon={<AIIcon />} onClick={() => openAnalyze(doc)} color="secondary">
                      AI Analyze
                    </Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => { setUploadOpen(false); setSelectedFile(null); setUploadError(null); }}
        maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document to Library</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            <Box
              sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png" />
              <UploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {selectedFile ? selectedFile.name : 'Click to select file (PDF, Word, TXT, Image)'}
              </Typography>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>

            <FormControl fullWidth>
              <InputLabel>Document Category</InputLabel>
              <Select value={uploadForm.category} label="Document Category"
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}>
                {DOC_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Case ID (optional)"
              fullWidth
              value={uploadForm.caseId}
              onChange={(e) => setUploadForm({ ...uploadForm, caseId: e.target.value })}
              placeholder="Link to a specific case"
            />

            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Brief description of this document"
            />

            {uploading && <LinearProgress />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadOpen(false); setSelectedFile(null); setUploadError(null); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={analyzeOpen} onClose={() => setAnalyzeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="secondary" />
            AI Document Analysis
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
                    <Typography variant="caption" color="text.secondary">{analyzeDoc.category}</Typography>
                  </Box>
                </Box>
              </Paper>

              <TextField
                label="What would you like to know about this document?"
                multiline
                rows={3}
                fullWidth
                value={analyzePrompt}
                onChange={(e) => setAnalyzePrompt(e.target.value)}
                placeholder="e.g. Summarize the key claims, Extract the arbitration clause, What are the applicable laws mentioned, Identify the parties and their positions"
              />

              {analyzeError && <Alert severity="error">{analyzeError}</Alert>}

              {analyzing && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    AI is analyzing the document...
                  </Typography>
                </Box>
              )}

              {analyzeResult && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <AIIcon fontSize="small" color="secondary" />
                    <Typography variant="caption" color="text.secondary" fontWeight="medium">
                      AI Analysis Result
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analyzeResult}</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyzeOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleAnalyze} disabled={analyzing || !analyzePrompt.trim()}
            startIcon={<AIIcon />}>
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Documents;
