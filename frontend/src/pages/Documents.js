// src/pages/Documents.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Paper, Box, Button, Grid, Card,
  CardContent, CardActions, Chip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Article as TextIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caseId, setCaseId] = useState('');
  const fileInputRef = useRef();

  const fetchDocuments = async () => {
    try {
      const response = await apiService.getDocuments();
      const docs = (response.data.documents || []).map((d) => ({
        id: d.ID || d.id,
        name: d.DOCUMENT_NAME || d.documentName || 'Untitled',
        caseId: d.CASE_ID || d.caseId || '',
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
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        await apiService.uploadDocument({
          documentName: selectedFile.name,
          caseId: caseId || null,
          content: base64
        });
        setDialogOpen(false);
        setSelectedFile(null);
        setCaseId('');
        await fetchDocuments();
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed.');
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Document Management</Typography>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setDialogOpen(true)}>
          Upload Document
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">No documents uploaded yet.</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>
            Upload First Document
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getFileIcon(doc.name)}
                    <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>{doc.name}</Typography>
                  </Box>
                  {doc.caseId && (
                    <Chip label={`Case: ${doc.caseId}`} size="small" variant="outlined" sx={{ mb: 1 }} />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Uploaded: {doc.createdAt}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="error" onClick={() => handleDelete(doc.id)}>Delete</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedFile(null); setUploadError(null); }}
        maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => fileInputRef.current.click()}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
              <UploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {selectedFile ? selectedFile.name : 'Click to select a file'}
              </Typography>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>

            <TextField
              label="Case ID (optional)"
              fullWidth
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="e.g. case-1776271919109"
            />

            {uploading && <LinearProgress />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setSelectedFile(null); setUploadError(null); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Documents;
