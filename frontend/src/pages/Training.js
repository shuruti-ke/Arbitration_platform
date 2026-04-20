// src/pages/Training.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  CardActions, Button, Chip, LinearProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  PlayArrow as StartIcon,
  EmojiEvents as CertIcon,
  MenuBook as ModuleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MODULES = [
  {
    id: 'intro',
    title: 'Introduction to Arbitration',
    description: 'Core concepts: what arbitration is, how it differs from litigation, and when to use it.',
    duration: '20 min',
    level: 'Beginner',
    topics: [
      'What is arbitration?',
      'Arbitration vs. litigation vs. mediation',
      'Types of disputes suitable for arbitration',
      'Key principles: confidentiality, finality, neutrality',
      'When to choose arbitration',
    ],
  },
  {
    id: 'rules',
    title: 'Arbitration Rules & Procedures',
    description: 'Overview of major institutional rules: ICC, LCIA, UNCITRAL, NCIA, SIAC.',
    duration: '35 min',
    level: 'Intermediate',
    topics: [
      'ICC Rules overview',
      'LCIA Rules overview',
      'UNCITRAL Arbitration Rules',
      'NCIA Rules (Kenya)',
      'SIAC Rules overview',
      'Choosing the right rules for your dispute',
    ],
  },
  {
    id: 'platform',
    title: 'Using the Platform',
    description: 'Step-by-step guide to managing cases, hearings, documents, and parties.',
    duration: '25 min',
    level: 'Beginner',
    topics: [
      'Opening a case and the payment workflow',
      'Adding parties and counsel',
      'Scheduling and joining virtual hearings',
      'Uploading and managing documents',
      'Tracking case status and milestones',
    ],
  },
  {
    id: 'evidence',
    title: 'Evidence & Document Management',
    description: 'Best practices for organizing evidence, submissions, and case documents.',
    duration: '30 min',
    level: 'Intermediate',
    topics: [
      'Types of evidence in arbitration',
      'Document exchange protocols',
      'Witness statements and expert reports',
      'Document confidentiality obligations',
      'Using AI for document analysis',
    ],
  },
  {
    id: 'awards',
    title: 'Drafting & Enforcing Awards',
    description: 'How arbitral awards are structured, drafted, and enforced globally.',
    duration: '40 min',
    level: 'Advanced',
    topics: [
      'Elements of a valid arbitral award',
      'Award drafting best practices',
      'The New York Convention (1958)',
      'Cross-border enforcement procedures',
      'Grounds for challenging an award',
    ],
  },
  {
    id: 'ai',
    title: 'AI in Arbitration',
    description: 'How AI tools on this platform support analysis, scheduling, and decision support.',
    duration: '20 min',
    level: 'Intermediate',
    topics: [
      'AI document analysis and evidence review',
      'Predictive analytics and case timelines',
      'AI conflict of interest detection',
      'Ethical considerations for AI in dispute resolution',
      'Limitations of AI in arbitration',
    ],
  },
];

const STORAGE_KEY = 'arb_training_progress';
const levelColor = { Beginner: 'success', Intermediate: 'warning', Advanced: 'error' };

const Training = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [activeModule, setActiveModule] = useState(null);
  const [certOpen, setCertOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }, [completed]);

  const markComplete = (moduleId) => {
    if (!completed.includes(moduleId)) setCompleted(prev => [...prev, moduleId]);
    setActiveModule(null);
  };

  const progress = Math.round((completed.length / MODULES.length) * 100);
  const allDone = completed.length === MODULES.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4">{t('Training & Certification')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('Complete all modules to earn your certificate of completion.')}
          </Typography>
        </Box>
        {allDone && (
          <Button variant="contained" color="success" startIcon={<CertIcon />} onClick={() => setCertOpen(true)}>
            {t('View Certificate')}
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{t('Progress')}</Typography>
          <Typography variant="body2" fontWeight={600}>
            {completed.length} / {MODULES.length} {t('modules completed')}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
          color={allDone ? 'success' : 'primary'}
        />
      </Box>

      {allDone && (
        <Alert severity="success" icon={<CertIcon />} sx={{ mb: 3 }}>
          {t('All modules complete! Your certificate of completion is ready.')}
        </Alert>
      )}

      <Grid container spacing={3}>
        {MODULES.map((mod) => {
          const done = completed.includes(mod.id);
          return (
            <Grid item xs={12} md={6} key={mod.id}>
              <Card
                variant={done ? 'outlined' : 'elevation'}
                sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  borderColor: done ? 'success.main' : undefined,
                  opacity: done ? 0.85 : 1,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, pr: 1 }}>{t(mod.title)}</Typography>
                    {done
                      ? <CheckIcon color="success" />
                      : <Chip label={mod.level} size="small" color={levelColor[mod.level]} variant="outlined" />
                    }
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t(mod.description)}
                  </Typography>
                  <Chip label={mod.duration} size="small" variant="outlined" icon={<SchoolIcon />} />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant={done ? 'text' : 'contained'}
                    color={done ? 'success' : 'primary'}
                    startIcon={done ? <CheckIcon /> : <StartIcon />}
                    onClick={() => setActiveModule(mod)}
                  >
                    {done ? t('Review') : t('Start Module')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Module Dialog */}
      {activeModule && (
        <Dialog open={!!activeModule} onClose={() => setActiveModule(null)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ModuleIcon color="primary" />
                {t(activeModule.title)}
              </Box>
              <Chip label={activeModule.level} size="small" color={levelColor[activeModule.level]} />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(activeModule.description)}
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Topics covered:')}</Typography>
            {activeModule.topics.map((topic, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <CheckIcon fontSize="small" color="primary" />
                <Typography variant="body2">{t(topic)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" sx={{ mt: 1 }}>
              {t('Review all topics above, then mark this module complete to track your progress toward certification.')}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActiveModule(null)}>{t('Close')}</Button>
            {!completed.includes(activeModule.id) && (
              <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => markComplete(activeModule.id)}>
                {t('Mark Complete')}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Certificate Dialog */}
      <Dialog open={certOpen} onClose={() => setCertOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('Certificate of Completion')}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              textAlign: 'center', py: 5, px: 4,
              border: '3px double', borderColor: 'primary.main', borderRadius: 2,
            }}
            className="printable-certificate"
          >
            <CertIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {t('Certificate of Completion')}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>{t('This certifies that')}</Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('has successfully completed all')} {MODULES.length} {t('training modules of the')}
            </Typography>
            <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5, mb: 2 }}>
              Arbitration Platform Training Programme
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {t('Date of completion')}: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              {MODULES.map(m => m.title).join(' · ')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertOpen(false)}>{t('Close')}</Button>
          <Button variant="contained" startIcon={<CertIcon />} onClick={() => window.print()}>
            {t('Print / Save as PDF')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Training;
