// src/pages/IPArbitration.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Paper, Card, CardContent,
  Chip, Alert, Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Divider, CircularProgress, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem,
  ListItemIcon, ListItemText, Tab, Tabs, LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarnIcon,
  Error as ErrorIcon,
  Lightbulb as TipIcon,
  Gavel as GavelIcon,
  Shield as ShieldIcon,
  Science as ScienceIcon,
  BrandingWatermark as TrademarkIcon,
  Copyright as CopyrightIcon,
  Lock as TradeSecretIcon,
  Search as SearchIcon,
  Calculate as CalcIcon,
  LibraryBooks as LibraryIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const IP_SUBTYPES = [
  { value: 'patent', label: 'Patent', icon: <ScienceIcon />, color: '#1976d2', description: 'Inventions, processes, products and compositions of matter.' },
  { value: 'trademark', label: 'Trademark', icon: <TrademarkIcon />, color: '#388e3c', description: 'Brand names, logos, trade dress and service marks.' },
  { value: 'copyright', label: 'Copyright', icon: <CopyrightIcon />, color: '#7b1fa2', description: 'Literary, artistic, musical and software works.' },
  { value: 'trade_secret', label: 'Trade Secret', icon: <TradeSecretIcon />, color: '#d32f2f', description: 'Confidential business information, formulae and know-how.' },
  { value: 'software', label: 'Software / IT', icon: <ScienceIcon />, color: '#0097a7', description: 'Software licensing, development agreements and tech IP.' },
  { value: 'design', label: 'Industrial Design', icon: <TrademarkIcon />, color: '#f57c00', description: 'Product appearance, shape and aesthetic features.' },
];

const WIPO_GUIDE = [
  { step: 1, title: 'Verify Arbitrability', detail: 'Confirm the IP dispute is arbitrable in the relevant jurisdiction. Patent validity and trademark cancellation may require court or registry involvement in some countries.' },
  { step: 2, title: 'Check Arbitration Agreement', detail: 'Ensure a valid arbitration clause exists in the underlying contract (license, R&D, co-existence) or that the parties can agree to arbitrate the dispute now.' },
  { step: 3, title: 'Select Appropriate Rules', detail: 'WIPO Rules are purpose-built for IP. ICC, SIAC, and LCIA also have experience with IP. WIPO provides specialist arbitrator rosters with IP expertise.' },
  { step: 4, title: 'Choose Seat & Language', detail: 'Geneva is the default seat for WIPO. Singapore and London are popular alternatives for cross-border IP. Language choice should align with evidence and witnesses.' },
  { step: 5, title: 'Constitute the Tribunal', detail: 'For complex IP disputes (patents, technical trade secrets) consider 3 arbitrators including at least one with technical expertise in the relevant field.' },
  { step: 6, title: 'Agree Protective Order', detail: 'File a draft protective order early to safeguard trade secrets, source code, clinical data, or other confidential technical information produced in discovery.' },
  { step: 7, title: 'Expert Evidence', detail: 'Appoint technical experts (patent claim construction, scientific analysis, market valuation) early. Agree expert methodology and deadlines at the first procedural order.' },
  { step: 8, title: 'Damages & Remedies', detail: 'IP damages may include reasonable royalty, lost profits, unjust enrichment, and statutory damages. Injunctions and declaratory relief may also be available in the award.' },
];

const ARBITRABILITY_MATRIX = [
  { subtype: 'Patent Infringement', arbitrable: true, notes: 'Fully arbitrable in most jurisdictions. Binding as between parties only.' },
  { subtype: 'Patent Validity (inter partes)', arbitrable: 'partial', notes: 'Arbitrable between the parties; does not bind third parties or the patent office.' },
  { subtype: 'Trademark Infringement', arbitrable: true, notes: 'Generally arbitrable. Award binds the parties.' },
  { subtype: 'Trademark Validity / Cancellation', arbitrable: 'partial', notes: 'Varies by jurisdiction — some require registry proceedings. Verify locally.' },
  { subtype: 'Copyright Infringement', arbitrable: true, notes: 'Fully arbitrable in virtually all jurisdictions.' },
  { subtype: 'Copyright Moral Rights', arbitrable: false, notes: 'Non-waivable moral rights are generally not arbitrable in civil law countries.' },
  { subtype: 'Trade Secret Misappropriation', arbitrable: true, notes: 'Fully arbitrable. Enhanced confidentiality orders strongly recommended.' },
  { subtype: 'License Agreement Disputes', arbitrable: true, notes: 'Core use case for IP arbitration — royalties, scope, sublicensing, termination.' },
  { subtype: 'Domain Name Disputes', arbitrable: true, notes: 'UDRP (WIPO) provides a specialist domain dispute procedure.' },
  { subtype: 'Employee IP Ownership', arbitrable: 'partial', notes: 'Arbitrable where employment agreement includes clause. Statutory rights may override.' },
];

const ROYALTY_FACTORS = [
  'Date of hypothetical negotiation',
  'Remaining patent term',
  'Established royalty rates in the industry',
  'Nature and scope of the license (exclusive/non-exclusive)',
  'Licensor\'s established policy and marketing program',
  'Commercial relationship between licensor and licensee',
  'Effect of the patented product on promoting other licensor sales',
  'Duration of the patent and license term',
  'Profitability of the product made under the patent',
  'Utility and advantages of the patented property over alternatives',
  'Nature of the patented invention and its commercial embodiment',
  'Extent of use and evidence of value',
  'Opinion testimony of qualified experts',
  'Amount that licensor and licensee would have agreed upon (Georgia-Pacific factors)',
];

const RoyaltyCalculator = () => {
  const [form, setForm] = useState({ revenue: '', rate: '', years: '', growth: '' });
  const [result, setResult] = useState(null);

  const calculate = () => {
    const rev = parseFloat(form.revenue) || 0;
    const rate = parseFloat(form.rate) / 100 || 0;
    const years = parseInt(form.years) || 1;
    const growth = parseFloat(form.growth) / 100 || 0;

    let total = 0;
    const yearly = [];
    let currentRev = rev;
    for (let y = 1; y <= years; y++) {
      const royalty = currentRev * rate;
      total += royalty;
      yearly.push({ year: y, revenue: currentRev.toFixed(0), royalty: royalty.toFixed(0) });
      currentRev *= (1 + growth);
    }
    setResult({ total: total.toFixed(0), yearly });
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Estimate reasonable royalty damages based on revenue base, rate, and duration. This is a starting point — final damages require expert analysis.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <TextField label="Annual Revenue ($)" fullWidth size="small" type="number"
            value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField label="Royalty Rate (%)" fullWidth size="small" type="number"
            value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })}
            placeholder="e.g. 5" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField label="Years" fullWidth size="small" type="number"
            value={form.years} onChange={e => setForm({ ...form, years: e.target.value })}
            placeholder="e.g. 3" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField label="Annual Revenue Growth (%)" fullWidth size="small" type="number"
            value={form.growth} onChange={e => setForm({ ...form, growth: e.target.value })}
            placeholder="e.g. 10" />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" startIcon={<CalcIcon />} onClick={calculate}>
            Calculate
          </Button>
        </Grid>
      </Grid>
      {result && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="h6" color="primary.main">
            Total Royalty Estimate: ${parseInt(result.total).toLocaleString()}
          </Typography>
          <Box sx={{ mt: 1 }}>
            {result.yearly.map(row => (
              <Typography key={row.year} variant="body2">
                Year {row.year}: Revenue ${parseInt(row.revenue).toLocaleString()} × Rate = <strong>${parseInt(row.royalty).toLocaleString()}</strong>
              </Typography>
            ))}
          </Box>
          <Alert severity="warning" sx={{ mt: 1 }} icon={<WarnIcon />}>
            This estimate is for indicative purposes only. Actual damages require expert economic analysis and consideration of Georgia-Pacific or comparable jurisdiction factors.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

const IPArbitration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [arbitrabilityForm, setArbitrabilityForm] = useState({ ipSubtype: '', crossBorder: false, hasLicenseAgreement: '' });
  const [arbitrabilityResult, setArbitrabilityResult] = useState(null);

  useEffect(() => {
    apiService.getCases()
      .then(res => {
        const ipCases = (res.data.cases || []).filter(c =>
          (c.CASE_TYPE || c.case_type || '').toLowerCase() === 'ip'
        );
        setCases(ipCases);
      })
      .catch(() => setCases([]))
      .finally(() => setLoadingCases(false));
  }, []);

  const runArbitrabilityCheck = () => {
    const { ipSubtype } = arbitrabilityForm;
    const match = ARBITRABILITY_MATRIX.find(r =>
      r.subtype.toLowerCase().includes((ipSubtype || '').replace('_', ' ').toLowerCase())
    );
    setArbitrabilityResult(match || {
      subtype: ipSubtype,
      arbitrable: 'partial',
      notes: 'No specific guidance found for this subtype. Recommend legal review in the relevant jurisdiction.'
    });
  };

  const ipStats = {
    total: cases.length,
    active: cases.filter(c => (c.STATUS || c.status) === 'active').length,
    subtypes: cases.reduce((acc, c) => {
      const t = c.IP_SUBTYPE || c.ip_subtype || 'unspecified';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>IP Arbitration Centre</Typography>
          <Typography variant="body2" color="text.secondary">
            Specialist tools, guidance, and case management for Intellectual Property disputes
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<GavelIcon />} onClick={() => navigate('/cases/agreement')}>
          New IP Case
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Arbitrability Checker" />
          <Tab label="WIPO Filing Guide" />
          <Tab label="Royalty Calculator" />
          <Tab label="Guidance Library" />
        </Tabs>
      </Box>

      {/* Tab 0: Overview */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h3" color="primary.main" fontWeight={700}>{loadingCases ? '—' : ipStats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total IP Cases</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h3" color="success.main" fontWeight={700}>{loadingCases ? '—' : ipStats.active}</Typography>
                <Typography variant="body2" color="text.secondary">Active Cases</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h3" color="info.main" fontWeight={700}>{Object.keys(ipStats.subtypes).length || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">IP Subtypes</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h3" color="warning.main" fontWeight={700}>WIPO</Typography>
                <Typography variant="body2" color="text.secondary">Preferred Rules</Typography>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>IP Dispute Types Supported</Typography>
                <Grid container spacing={1.5}>
                  {IP_SUBTYPES.map(st => (
                    <Grid item xs={12} sm={6} key={st.value}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ color: st.color, mt: 0.3 }}>{st.icon}</Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>{st.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{st.description}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Why Arbitrate IP Disputes?</Typography>
                {[
                  ['Confidentiality', 'Court proceedings are public — arbitration protects trade secrets and sensitive technical information.'],
                  ['Technical Expertise', 'Parties can select arbitrators with specialist IP and technical knowledge.'],
                  ['International Enforcement', 'Awards enforceable in 170+ countries under the New York Convention.'],
                  ['Speed & Finality', 'IP litigation can take years — arbitration offers faster, final resolution.'],
                  ['Party Autonomy', 'Parties control procedure, language, seat and evidence rules.'],
                  ['Cross-Border IP', 'Single forum for multi-jurisdictional IP disputes — avoids parallel litigation.'],
                ].map(([title, desc]) => (
                  <Box key={title} sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary">{desc}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 1: Arbitrability Checker */}
      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>IP Arbitrability Checker</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check whether your IP dispute is suitable for arbitration and identify jurisdiction-specific risks before filing.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>IP Dispute Type</InputLabel>
                <Select value={arbitrabilityForm.ipSubtype}
                  onChange={e => setArbitrabilityForm({ ...arbitrabilityForm, ipSubtype: e.target.value })}
                  label="IP Dispute Type">
                  {ARBITRABILITY_MATRIX.map(r => (
                    <MenuItem key={r.subtype} value={r.subtype}>{r.subtype}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="contained" startIcon={<SearchIcon />} onClick={runArbitrabilityCheck}
                disabled={!arbitrabilityForm.ipSubtype}>
                Check Arbitrability
              </Button>
            </Grid>
          </Grid>

          {arbitrabilityResult && (
            <Alert
              severity={arbitrabilityResult.arbitrable === true ? 'success' : arbitrabilityResult.arbitrable === false ? 'error' : 'warning'}
              icon={arbitrabilityResult.arbitrable === true ? <CheckIcon /> : arbitrabilityResult.arbitrable === false ? <ErrorIcon /> : <WarnIcon />}
              sx={{ mb: 2 }}>
              <strong>{arbitrabilityResult.subtype}</strong>
              <br />
              <strong>Arbitrable: </strong>
              {arbitrabilityResult.arbitrable === true ? 'Yes' : arbitrabilityResult.arbitrable === false ? 'No' : 'Partial / Jurisdiction-Dependent'}
              <br />
              {arbitrabilityResult.notes}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Full Arbitrability Matrix</Typography>
          {ARBITRABILITY_MATRIX.map(row => (
            <Box key={row.subtype} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1, borderBottom: '1px solid #f5f5f5' }}>
              <Box sx={{ mt: 0.3, flexShrink: 0 }}>
                {row.arbitrable === true ? <CheckIcon color="success" fontSize="small" /> :
                 row.arbitrable === false ? <ErrorIcon color="error" fontSize="small" /> :
                 <WarnIcon color="warning" fontSize="small" />}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>{row.subtype}</Typography>
                <Typography variant="caption" color="text.secondary">{row.notes}</Typography>
              </Box>
            </Box>
          ))}
          <Alert severity="info" sx={{ mt: 2 }}>
            This matrix provides general guidance only. Arbitrability is jurisdiction-specific and must be confirmed with qualified IP counsel.
          </Alert>
        </Paper>
      )}

      {/* Tab 2: WIPO Filing Guide */}
      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">WIPO Arbitration Filing Guide</Typography>
            <Chip label="WIPO Arbitration & Mediation Center" color="primary" size="small" />
          </Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            The WIPO Arbitration and Mediation Center (Geneva) is the leading institution for international IP dispute resolution. It administers arbitration, mediation, expedited arbitration, and expert determination proceedings.
          </Alert>
          {WIPO_GUIDE.map(step => (
            <Accordion key={step.step} defaultExpanded={step.step === 1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip label={`Step ${step.step}`} size="small" color="primary" />
                  <Typography fontWeight={600}>{step.title}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">{step.detail}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Recommended WIPO Seats for IP Arbitration</Typography>
            {[
              ['Geneva, Switzerland', 'WIPO headquarters — neutral, IP-specialist infrastructure'],
              ['Singapore', 'SIAC IP arbitration — strong in Asia-Pacific, tech disputes'],
              ['London, UK', 'LCIA — strong for commercial IP and licensing disputes'],
              ['Paris, France', 'ICC — International IP disputes with French/EU law elements'],
              ['Nairobi, Kenya', 'NCIA/KIAC — African IP disputes, East Africa focus'],
            ].map(([seat, note]) => (
              <Box key={seat} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 180 }}>{seat}</Typography>
                <Typography variant="body2" color="text.secondary">{note}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Tab 3: Royalty Calculator */}
      {tab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>IP Damages — Reasonable Royalty Estimator</Typography>
          <RoyaltyCalculator />
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Georgia-Pacific Factors (Patent Damages)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Courts and tribunals consider these 15 factors when determining a reasonable royalty for patent infringement damages:
          </Typography>
          <List dense>
            {ROYALTY_FACTORS.map((f, i) => (
              <ListItem key={i} sx={{ py: 0.3 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Typography variant="body2" color="primary.main" fontWeight={700}>{i + 1}.</Typography>
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2">{f}</Typography>} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Tab 4: Guidance Library */}
      {tab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>IP Arbitration Guidance Library</Typography>
          <Grid container spacing={2}>
            {[
              {
                title: 'Patent Arbitration Checklist',
                items: [
                  'Confirm patent is valid and in force in relevant jurisdictions',
                  'Identify claim(s) alleged to be infringed',
                  'Gather claim charts mapping accused products to claim elements',
                  'Collect prior art relevant to validity challenges',
                  'Obtain expert with technical expertise in the patent\'s field',
                  'Quantify damages: lost profits or reasonable royalty',
                  'Consider whether validity counterclaim is in scope',
                  'Draft protective order for technical disclosures',
                ]
              },
              {
                title: 'Trademark Arbitration Checklist',
                items: [
                  'Produce trademark registration certificates',
                  'Conduct trademark search reports for priority evidence',
                  'Gather consumer survey evidence on likelihood of confusion',
                  'Document actual confusion instances if available',
                  'Collect evidence of trademark use and reputation',
                  'Assess whether cancellation/invalidity is in scope',
                  'Quantify damages: lost sales, dilution, unjust enrichment',
                  'Consider co-existence agreement as settlement option',
                ]
              },
              {
                title: 'Trade Secret Checklist',
                items: [
                  'Define and document the trade secret with specificity',
                  'Evidence reasonable measures to maintain secrecy',
                  'Establish that the secret was not publicly available',
                  'Prove acquisition by improper means or breach of duty',
                  'Draft comprehensive protective order immediately',
                  'Quantify damages: reasonable royalty, unjust enrichment, or actual loss',
                  'Consider injunctive relief to prevent continued use',
                  'Review employment agreements and NDAs',
                ]
              },
              {
                title: 'Copyright Arbitration Checklist',
                items: [
                  'Produce copyright registration certificate or evidence of creation',
                  'Establish chain of title and ownership',
                  'Identify infringing works and access evidence',
                  'Prove substantial similarity between works',
                  'Consider fair use / fair dealing defense',
                  'Calculate damages: actual or statutory where available',
                  'Identify all infringing copies and seek destruction order',
                  'Check for moral rights issues (waivable in some jurisdictions)',
                ]
              },
            ].map(section => (
              <Grid item xs={12} md={6} key={section.title}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom color="primary.main">
                    {section.title}
                  </Typography>
                  {section.items.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                      <CheckIcon color="success" fontSize="small" sx={{ mt: 0.2, flexShrink: 0 }} />
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Key IP Arbitration Institutions</Typography>
            <Grid container spacing={1.5}>
              {[
                ['WIPO AMC', 'wipo.int/amc', 'Geneva — global IP specialist'],
                ['SIAC', 'siac.org.sg', 'Singapore — Asia-Pacific leader'],
                ['ICC', 'iccwbo.org', 'Paris — international commercial & IP'],
                ['LCIA', 'lcia.org', 'London — commercial IP & licensing'],
                ['AAA-ICDR', 'icdr.org', 'New York — technology & IP (US)'],
                ['NCIA', 'nairobi-arbitration.com', 'Nairobi — East Africa IP disputes'],
              ].map(([name, url, desc]) => (
                <Grid item xs={12} sm={6} md={4} key={name}>
                  <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{name}</Typography>
                      <Typography variant="caption" color="text.secondary">{desc}</Typography>
                    </Box>
                    <Chip label={url} size="small" variant="outlined" />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default IPArbitration;
