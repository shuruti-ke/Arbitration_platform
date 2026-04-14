// src/pages/Documents.js
import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Article as TextIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon
} from '@mui/icons-material';

const Documents = () => {
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Contract_Agreement.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploaded: '2026-04-10',
      status: 'signed'
    },
    {
      id: 2,
      name: 'Evidence_Photos.zip',
      type: 'zip',
      size: '15.7 MB',
      uploaded: '2026-04-09',
      status: 'processed'
    },
    {
      id: 3,
      name: 'Witness_Statements.docx',
      type: 'docx',
      size: '1.2 MB',
      uploaded: '2026-04-08',
      status: 'certified'
    }
  ]);

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <PdfIcon />;
      case 'zip':
        return <DocumentIcon />;
      case 'docx':
        return <TextIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Document Management
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          sx={{ mr: 2 }}
        >
          Upload Document
        </Button>
        <Button
          variant="outlined"
        >
          New Document Package
        </Button>
      </Box>

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
                  <Typography variant="body2" color="textSecondary">
                    Type: {doc.type}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Size: {doc.size}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Uploaded: {doc.uploaded}
                  </Typography>
                  <Chip 
                    label={doc.status} 
                    color={doc.status === 'signed' ? 'success' : 'primary'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small">View</Button>
                <Button size="small">Download</Button>
                <Button size="small" color="secondary">Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Documents;