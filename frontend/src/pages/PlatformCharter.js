// frontend/src/pages/PlatformCharter.js
import React from 'react';
import {
  Container, Typography, Box, Paper, Alert, Grid, Card,
  CardContent, Chip, Divider
} from '@mui/material';
import {
  FolderOpen, Description, VideoCall, AutoAwesome, School, BarChart,
  Block, Gavel, Warning, Info, CheckCircle, Security
} from '@mui/icons-material';

const featureCards = [
  {
    icon: <FolderOpen sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Case Management',
    description:
      'Structured digital workflows for case registration, milestone tracking, timeline management, and procedural scheduling. Case management tools assist parties and the tribunal in organising proceedings.',
  },
  {
    icon: <Description sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Document Repository',
    description:
      'Secure, role-based document storage, upload, retrieval, and versioning. All documents are stored with access controls ensuring only authorised participants can view case materials.',
  },
  {
    icon: <VideoCall sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Virtual Hearings',
    description:
      'Technology infrastructure supporting remote hearings via video conference, including scheduling, participant management, and session recording where authorised by the tribunal.',
  },
  {
    icon: <AutoAwesome sx={{ fontSize: 40, color: 'warning.main' }} />,
    title: 'AI-Assisted Research',
    description:
      'Artificial intelligence tools that assist with document analysis, compliance checking, and legal research. All AI outputs are advisory only and must be verified by a qualified legal professional.',
    chip: 'Advisory Only',
    chipColor: 'warning',
  },
  {
    icon: <School sx={{ fontSize: 40, color: 'success.main' }} />,
    title: 'Training & Certification',
    description:
      'Educational modules, courses, and certification tracking for arbitration practitioners. Training content is for educational purposes and supports ongoing professional development.',
  },
  {
    icon: <BarChart sx={{ fontSize: 40, color: 'secondary.main' }} />,
    title: 'Analytics & Reporting',
    description:
      'Data visualisation and reporting tools that help administrators, arbitrators, and institutions understand case progress, timelines, and platform usage metrics.',
  },
];

const doesNotItems = [
  'Conduct or administer arbitration proceedings as an arbitral institution',
  'Make, issue, enforce, or recommend arbitral awards',
  'Appoint arbitrators with binding institutional authority',
  'Provide legal advice to any party or participant',
  'Determine the law applicable to any dispute',
  'Rule on jurisdiction, arbitrability, or the merits of any dispute',
  'Act as a party to any arbitration agreement',
  'Guarantee the enforceability of any award',
];

const PlatformCharter = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          color: 'white',
          py: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Arbitration Facilitation Platform
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            A neutral technology platform assisting arbitration proceedings
          </Typography>
          <Chip
            label="Technology Facilitation Tool — Not an Arbitral Institution"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: '0.85rem', px: 1 }}
          />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Prominent Disclaimer Alert */}
        <Alert
          severity="info"
          icon={<Info />}
          sx={{
            mb: 4,
            borderLeft: '4px solid #1976d2',
            '& .MuiAlert-message': { fontSize: '1rem' },
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            This platform facilitates arbitration proceedings. It has no arbitral authority and does
            not make, enforce, or recommend awards. All decisions in any arbitration are made solely
            by the appointed arbitrator(s).
          </Typography>
        </Alert>

        {/* Section 1: What This Platform Does */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h5" fontWeight="bold">
              What This Platform Does
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The Platform provides the following technology facilitation services to support arbitration proceedings:
          </Typography>
          <Grid container spacing={3}>
            {featureCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.title}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 6 },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 1.5 }}>{card.icon}</Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {card.title}
                      </Typography>
                      {card.chip && (
                        <Chip
                          label={card.chip}
                          size="small"
                          color={card.chipColor || 'default'}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Section 2: What This Platform Does NOT Do */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Block color="error" />
            <Typography variant="h5" fontWeight="bold">
              What This Platform Does Not Do
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            To be clear about the Platform's role and limitations:
          </Typography>
          <Paper elevation={1} sx={{ p: 3, borderLeft: '4px solid #d32f2f' }}>
            {doesNotItems.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: idx < doesNotItems.length - 1 ? 2 : 0 }}>
                <Warning color="error" sx={{ mt: 0.25, flexShrink: 0 }} />
                <Typography variant="body1">{item}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Section 3: Legal Framework */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Gavel color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Legal Framework
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The Platform operates within the following legal and regulatory framework:
          </Typography>
          <Grid container spacing={2}>
            {[
              {
                title: 'Kenya Arbitration Act (Cap. 49)',
                body:
                  'The Platform is designed to support arbitration proceedings conducted under the Arbitration Act (Cap. 49, Laws of Kenya), as amended, which gives effect to the UNCITRAL Model Law on International Commercial Arbitration in Kenya.',
              },
              {
                title: 'UNCITRAL Model Law',
                body:
                  "The Platform's workflows and procedural features are informed by the UNCITRAL Model Law on International Commercial Arbitration (1985, as amended 2006) to facilitate internationally compatible proceedings.",
              },
              {
                title: 'Kenya Data Protection Act 2019',
                body:
                  'All personal data processed by the Platform is handled in accordance with the Data Protection Act 2019 (Act No. 24 of 2019, Laws of Kenya), administered by the Office of the Data Protection Commissioner (ODPC).',
              },
              {
                title: 'Kenya Information and Communications Act',
                body:
                  "The Platform's electronic communications, data storage, and digital services comply with the Kenya Information and Communications Act (Cap. 411A, Laws of Kenya) and subsidiary legislation thereunder.",
              },
            ].map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper elevation={1} sx={{ p: 2.5, height: '100%', bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.body}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Section 4: AI Transparency */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome color="warning" />
            <Typography variant="h5" fontWeight="bold">
              AI Transparency
            </Typography>
          </Box>
          <Alert severity="warning" icon={<AutoAwesome />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              AI-Assisted Features — Advisory Only
            </Typography>
            <Typography variant="body2">
              This platform uses artificial intelligence tools to assist with document analysis, legal
              research, compliance checking, and training content. All AI outputs are advisory only
              and must be reviewed and verified by a qualified legal professional before being used in
              any proceedings.
            </Typography>
          </Alert>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="body2" paragraph>
              <strong>AI Providers:</strong> The Platform uses OpenAI (GPT-4o-mini, primary), Qwen
              (secondary), and NVIDIA AI (tertiary) as language model providers for AI-assisted
              features.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>What AI is used for:</strong> Document analysis, arbitration agreement review,
              compliance checking, legal research assistance, and training content generation — all on
              an advisory basis only.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>What AI is NOT used for:</strong> AI is never used to make arbitral decisions,
              generate binding awards, provide legal advice, or substitute for the judgment of a
              qualified legal professional or appointed arbitrator.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Hallucination risk:</strong> AI language models can generate plausible-sounding
              but factually incorrect information, including fabricated legal citations and inaccurate
              statements of law. All AI outputs must be independently verified. The Platform
              implements guardrails to reduce — but not eliminate — this risk.
            </Typography>
            <Typography variant="body2">
              <strong>Opt-out:</strong> Parties may request that AI analysis not be applied to their
              case by contacting platform@arbitration.platform.
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Section 5: Contact & Legal Documents */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Security color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Contact & Legal Documents
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            For enquiries about the Platform and to access our legal documents:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Contact Us
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>General enquiries:</strong> platform@arbitration.platform
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Data protection:</strong> data@arbitration.platform
                </Typography>
                <Typography variant="body2">
                  <strong>Platform URL:</strong> https://arbitration-platform.vercel.app
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Legal Documents
                </Typography>
                {[
                  { label: 'Terms of Service', path: 'terms-of-service' },
                  { label: 'Privacy Policy', path: 'privacy-policy' },
                  { label: 'AI Use Policy', path: 'ai-use-policy' },
                  { label: 'Platform Charter', path: 'platform-charter' },
                  { label: 'Facilitation Agreement Template', path: 'facilitation-agreement-template' },
                ].map((doc) => (
                  <Typography key={doc.path} variant="body2" sx={{ mb: 0.5 }}>
                    <a
                      href={`/legal/${doc.path}.md`}
                      style={{ color: '#1976d2', textDecoration: 'none' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {doc.label}
                    </a>
                  </Typography>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Effective: April 2026 | Governing Law: Republic of Kenya | Arbitration Facilitation
            Platform
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PlatformCharter;
