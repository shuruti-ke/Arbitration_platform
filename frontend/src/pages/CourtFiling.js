// src/pages/CourtFiling.js
import React, { useState } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Chip, TextField, InputAdornment, Accordion, AccordionSummary,
  AccordionDetails, Alert, Button, Divider, List, ListItem,
  ListItemText, ListItemIcon
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckIcon,
  Warning as WarnIcon,
  Cancel as NoIcon,
  Download as DownloadIcon,
  Public as GlobeIcon,
} from '@mui/icons-material';
import { useLanguage } from '../context/LanguageContext';

const JURISDICTIONS = [
  {
    country: 'Kenya',
    region: 'Africa',
    nyConvention: true,
    year: 1989,
    court: 'High Court of Kenya (Commercial Division)',
    timeLimit: '3 years from award date',
    requirements: [
      'Original or certified copy of the arbitration agreement',
      'Original or certified copy of the award',
      'Certified translation if award is not in English',
      'Petition to enforce filed in the Commercial Division',
    ],
    grounds: [
      'Incapacity of a party',
      'Invalid arbitration agreement',
      'Lack of proper notice',
      'Award outside scope of submission',
      'Irregular tribunal composition',
      'Award not yet binding or set aside',
      'Non-arbitrable subject matter',
      'Public policy violation',
    ],
    notes: 'Kenya enacted the Arbitration Act (Cap. 49) in 1995, amended 2010. NCIA is the primary institution.',
    institutions: ['NCIA', 'Nairobi Centre for International Arbitration'],
  },
  {
    country: 'United Kingdom',
    region: 'Europe',
    nyConvention: true,
    year: 1975,
    court: 'High Court (Commercial Court, Queen\'s Bench Division)',
    timeLimit: '6 years from award date',
    requirements: [
      'Certified copy of the award',
      'Original arbitration agreement or certified copy',
      'Evidence that award is binding',
      'Application for permission to enforce (CPR Part 62)',
    ],
    grounds: [
      'Serious irregularity affecting the tribunal, proceedings, or award',
      'Jurisdictional challenge',
      'Substantive appeal (if agreed or with court permission)',
      'Public policy grounds',
    ],
    notes: 'UK Arbitration Act 1996 governs. London is a leading arbitration seat — LCIA, ICC London, CIArb.',
    institutions: ['LCIA', 'ICC', 'CIArb', 'ICSID'],
  },
  {
    country: 'United States',
    region: 'Americas',
    nyConvention: true,
    year: 1970,
    court: 'Federal District Court or State Court',
    timeLimit: '3 years (federal), varies by state',
    requirements: [
      'Duly authenticated original award or certified copy',
      'Original arbitration agreement or certified copy',
      'Certified translation if not in English',
      'Petition to confirm filed in federal or state court',
    ],
    grounds: [
      'Award procured by corruption, fraud, or undue means',
      'Evident partiality or corruption of arbitrators',
      'Misconduct of arbitrators prejudicing party rights',
      'Arbitrators exceeded their powers',
      'NY Convention grounds (for foreign awards)',
    ],
    notes: 'Federal Arbitration Act (FAA) governs. Chapter 2 implements the New York Convention. Major seats: NY, DC, Miami.',
    institutions: ['AAA/ICDR', 'JAMS', 'ICC', 'ICSID'],
  },
  {
    country: 'Singapore',
    region: 'Asia',
    nyConvention: true,
    year: 1986,
    court: 'Singapore High Court',
    timeLimit: '6 years from award date',
    requirements: [
      'Originating summons to enforce the award',
      'Affidavit exhibiting the award and arbitration agreement',
      'Certified translation if not in English',
    ],
    grounds: [
      'Party under incapacity',
      'Invalid arbitration agreement',
      'Lack of proper notice or unable to present case',
      'Award outside scope of submission',
      'Irregular tribunal composition',
      'Award set aside or suspended',
      'Non-arbitrable subject matter',
      'Public policy violation',
    ],
    notes: 'International Arbitration Act (IAA) and Arbitration Act govern. SIAC is the premier institution. Singapore is a top-tier seat.',
    institutions: ['SIAC', 'ICC', 'ICSID'],
  },
  {
    country: 'France',
    region: 'Europe',
    nyConvention: true,
    year: 1959,
    court: 'Paris Court of Appeal (Cour d\'appel de Paris)',
    timeLimit: '1 month from exequatur (recognition order)',
    requirements: [
      'Original award or certified copy',
      'Original arbitration agreement or certified copy',
      'Certified French translation',
      'Application for exequatur (recognition)',
    ],
    grounds: [
      'Non-arbitrable subject matter',
      'Violation of international public policy (ordre public)',
      'Invalid arbitration agreement',
      'Irregular constitution of tribunal',
    ],
    notes: 'French Code of Civil Procedure (Articles 1504-1527) governs international arbitration. ICC headquartered in Paris.',
    institutions: ['ICC', 'CMAP'],
  },
  {
    country: 'UAE / DIFC',
    region: 'Middle East',
    nyConvention: true,
    year: 2006,
    court: 'DIFC Courts or onshore UAE Courts',
    timeLimit: '15 years (DIFC), varies onshore',
    requirements: [
      'Certified copy of award',
      'Certified copy of arbitration agreement',
      'Arabic translation for onshore UAE courts',
      'Application to ratify (onshore) or enforce (DIFC)',
    ],
    grounds: [
      'Federal Arbitration Law No. 6 of 2018 grounds (onshore)',
      'DIFC Arbitration Law grounds (offshore)',
      'NY Convention grounds',
      'Public policy',
    ],
    notes: 'UAE Federal Arbitration Law 2018 modernized the framework. DIFC-LCIA and DIAC are primary institutions.',
    institutions: ['DIAC', 'DIFC-LCIA', 'ICC'],
  },
  {
    country: 'Nigeria',
    region: 'Africa',
    nyConvention: true,
    year: 1970,
    court: 'Federal High Court or State High Court',
    timeLimit: '6 years from award date',
    requirements: [
      'Authenticated original award or certified copy',
      'Original arbitration agreement or certified copy',
      'Application for leave to enforce (originating motion)',
    ],
    grounds: [
      'Incapacity of a party',
      'Invalid agreement',
      'Lack of notice',
      'Excess of powers',
      'Improper tribunal composition',
      'Non-arbitrable subject matter',
      'Public policy',
    ],
    notes: 'Arbitration and Conciliation Act 1988 (revised 2004). New Arbitration Act 2023 recently enacted. Lagos is a key seat.',
    institutions: ['LCIA Nigeria', 'ICAMA', 'Lagos Court of Arbitration'],
  },
  {
    country: 'South Africa',
    region: 'Africa',
    nyConvention: true,
    year: 1976,
    court: 'High Court',
    timeLimit: '3 years from award date',
    requirements: [
      'Certified copy of the award',
      'Certified copy of the arbitration agreement',
      'Application to make the award an order of court',
    ],
    grounds: [
      'Misconduct of arbitrator',
      'Irregularity in proceedings',
      'Arbitrator exceeded powers',
      'Award improperly obtained',
      'NY Convention grounds for foreign awards',
    ],
    notes: 'International Arbitration Act 2017 implements the UNCITRAL Model Law. AFSA is the primary institution.',
    institutions: ['AFSA', 'SAAET'],
  },
];

const regionColors = {
  Africa: 'success',
  Europe: 'primary',
  Americas: 'error',
  Asia: 'warning',
  'Middle East': 'secondary',
};

const CourtFiling = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = JURISDICTIONS.filter(j =>
    j.country.toLowerCase().includes(search.toLowerCase()) ||
    j.region.toLowerCase().includes(search.toLowerCase()) ||
    j.institutions.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">{t('Court Filing & Enforcement Guides')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('Jurisdiction-specific guides for enforcing arbitral awards under the New York Convention (1958).')}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }} icon={<GlobeIcon />}>
        {t('These guides provide general information only. Always consult qualified local counsel before filing enforcement proceedings.')}
      </Alert>

      <TextField
        fullWidth
        label={t('Search by country, region, or institution')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        sx={{ mb: 3 }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {filtered.length} {t('jurisdictions')} · {JURISDICTIONS.filter(j => j.nyConvention).length} {t('NY Convention signatories shown')}
        </Typography>
      </Box>

      {filtered.map((j) => (
        <Accordion
          key={j.country}
          expanded={expanded === j.country}
          onChange={(_, open) => setExpanded(open ? j.country : null)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
              <GavelIcon color="action" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>{j.country}</Typography>
                <Typography variant="caption" color="text.secondary">{j.court}</Typography>
              </Box>
              <Chip label={j.region} size="small" color={regionColors[j.region] || 'default'} variant="outlined" />
              {j.nyConvention
                ? <Chip label={`NY Convention ${j.year}`} size="small" color="success" icon={<CheckIcon />} />
                : <Chip label="Non-signatory" size="small" color="error" icon={<NoIcon />} />
              }
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('Filing Requirements')}</Typography>
                <List dense disablePadding>
                  {j.requirements.map((req, i) => (
                    <ListItem key={i} sx={{ pl: 0, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><CheckIcon fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{req}</Typography>} />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2"><strong>{t('Time Limit')}:</strong> {j.timeLimit}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>{t('Institutions')}:</strong> {j.institutions.join(', ')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('Grounds to Refuse Enforcement')}</Typography>
                <List dense disablePadding>
                  {j.grounds.map((g, i) => (
                    <ListItem key={i} sx={{ pl: 0, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><WarnIcon fontSize="small" color="warning" /></ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{g}</Typography>} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>{j.notes}</Alert>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
};

export default CourtFiling;
