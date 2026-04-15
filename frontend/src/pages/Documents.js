// src/pages/Documents.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Article as TextIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await apiService.getDocuments();
        setDocuments(response.data || []);
      } catch (err) {
        setError('Could not load documents from server. Showing sample data.');
        setDocuments([
          { id: 1, name: 'Contract_Agreement.pdf', type: 'pdf', size: '2.4 MB', uploaded: '2026-04-10', status: 'signed' },
          { id: 2, name: 'Evidence_Photos.zip', type: 'zip', size: '15.7 MB', uploaded: '2026-04-09', status: 'processed' },
          { id: 3, name: 'Witness_Statements.docx', type: 'docx', size: '1.2 MB', uploaded: '2026-04-08', status: 'certified' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return <PdfIcon />;
      case 'docx': return <TextIcon />;
      default: return <DocumentIcon />;
    }
  };

  const handleView = (doc) => {
    alert(`Viewing: ${doc.name}`);
  };

  const handleDownload = (doc) => {
    alert(`Downloading: ${doc.name}`);
  };

  const handleDelete = (docId) => {
    if (window.confirm('Delete this document?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  const handleUpload = () => {
    alert('Upload functionality coming soon');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Document Management
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" startIcon={<UploadIcon />} sx={{ mr: 2 }} onClick={handleUpload}>
          Upload Document
        </Button>
        <Button variant="outlined" onClick={handleUpload}>
          New Document Package
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton color="primary">
                      {getFileIcon(doc.type)}
                    </IconButton>
                    <Typography variant="h6" component="h3">
                      {doc.name}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2" color="textSecondary">Type: {doc.type}</Typography>
                    <Typography variant="body2" color="textSecondary">Size: {doc.size}</Typography>
                    <Typography variant="body2" color="textSecondary">Uploaded: {doc.uploaded}</Typography>
                    <Chip
                      label={doc.status}
                      color={doc.status === 'signed' ? 'success' : 'primary'}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleView(doc)}>View</Button>
                  <Button size="small" onClick={() => handleDownload(doc)}>Download</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(doc.id)}>Delete</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Documents;
