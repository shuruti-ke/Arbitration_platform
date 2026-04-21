// src/pages/Training.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, Chip, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Divider, TextField, CircularProgress,
  Paper, IconButton, Tooltip, List, ListItem, ListItemIcon,
  ListItemText, RadioGroup, FormControlLabel, Radio, Collapse,
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  PlayArrow as StartIcon,
  EmojiEvents as CertIcon,
  AutoAwesome as AIIcon,
  TrendingUp as TrendingIcon,
  Quiz as QuizIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Replay as RetakeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiService from '../services/api';

// ─── Static base modules ──────────────────────────────────────────────────────
const BASE_MODULES = [
  {
    id: 'intro', title: 'Introduction to Arbitration', level: 'Beginner', duration: '20 min',
    description: 'Core concepts: what arbitration is, how it differs from litigation, and when to use it.',
    topics: ['What is arbitration?', 'Arbitration vs. litigation vs. mediation', 'Types of disputes suitable for arbitration', 'Key principles: confidentiality, finality, neutrality', 'When to choose arbitration'],
    content: `Arbitration is a private, binding dispute resolution process in which parties agree to submit their dispute to one or more neutral decision-makers (arbitrators) rather than litigating before national courts.

Key characteristics that distinguish arbitration from litigation include: party autonomy in selecting arbitrators, procedural flexibility, confidentiality, finality of the award (limited grounds for appeal), and international enforceability under the 1958 New York Convention.

Unlike mediation—where a neutral facilitator helps parties reach a negotiated settlement—arbitration produces a binding decision. Parties often choose arbitration for commercial disputes, investor-state claims, construction, maritime, and IP matters where they value neutrality and confidentiality.

Core principles:
• Confidentiality: proceedings and awards are not public record
• Party autonomy: parties choose seat, rules, language, and arbitrators
• Finality: awards are final and binding, with narrow grounds to challenge
• Neutrality: disputes heard by agreed neutral arbitrators rather than home courts
• Enforceability: over 170 countries enforce foreign arbitral awards under the New York Convention`,
  },
  {
    id: 'rules', title: 'Arbitration Rules & Procedures', level: 'Intermediate', duration: '35 min',
    description: 'Overview of major institutional rules: ICC, LCIA, UNCITRAL, NCIA, SIAC.',
    topics: ['ICC Rules overview', 'LCIA Rules overview', 'UNCITRAL Arbitration Rules', 'NCIA Rules (Kenya)', 'SIAC Rules overview', 'Choosing the right rules for your dispute'],
    content: `Institutional arbitration rules set out the procedural framework governing the arbitration. Choosing the right rules depends on the nature of the dispute, the parties' locations, and the desired level of institutional support.

ICC Rules (International Chamber of Commerce): Known for the scrutiny of awards by the ICC Court before publication, Terms of Reference, and rigorous case management. Popular for high-value international commercial disputes.

LCIA Rules (London Court of International Arbitration): Favoured for speed and flexibility. LCIA appoints arbitrators directly and is known for efficient handling. Widely used in European and English law-governed contracts.

UNCITRAL Arbitration Rules: Designed for ad hoc arbitration without an administering institution, though UNCITRAL rules can be used with an appointing authority. Basis for many investment treaty arbitrations.

NCIA Rules (Nairobi Centre for International Arbitration): Kenya's primary institution, aligned with UNCITRAL Model Law. Growing preference for East African disputes and investment arbitration on the continent.

SIAC Rules (Singapore International Arbitration Centre): Leading institution in Asia. Known for emergency arbitrator provisions, expedited procedure for lower-value claims, and a cost-efficient approach.

Selection factors: value of dispute, legal system familiarity, cost of administration, preferred seat, time constraints, and whether investment treaty or commercial context.`,
  },
  {
    id: 'evidence', title: 'Evidence & Document Management', level: 'Intermediate', duration: '30 min',
    description: 'Best practices for organizing evidence, submissions, and case documents.',
    topics: ['Types of evidence in arbitration', 'Document exchange protocols', 'Witness statements and expert reports', 'Document confidentiality obligations', 'Using AI for document analysis'],
    content: `Evidence in arbitration is handled more flexibly than in national courts. Arbitrators have broad discretion over admissibility, weight, and document production.

Types of evidence: contemporaneous documents (contracts, correspondence, meeting minutes), witness of fact statements, expert witness reports, and electronic evidence.

Document exchange protocols: arbitral tribunals routinely adopt the IBA Rules on the Taking of Evidence in International Arbitration as a soft-law guide. Redfern Schedules are commonly used for document production requests, allowing each party to request specific categories, state reasons, and allow the other side to object.

Witness statements: submitted in writing in advance of the hearing; witnesses are available for cross-examination. Expert reports must comply with the tribunal's directions on scope and timing, and joint expert meetings are often ordered to narrow issues.

Confidentiality: parties and their counsel owe confidentiality obligations over documents produced in the proceeding. Specific rules vary by institution and seat law.

AI-assisted document review: machine learning tools accelerate privilege review, categorisation, and identification of key documents, particularly in large commercial disputes with voluminous discovery.`,
  },
  {
    id: 'awards', title: 'Drafting & Enforcing Awards', level: 'Advanced', duration: '40 min',
    description: 'How arbitral awards are structured, drafted, and enforced globally.',
    topics: ['Elements of a valid arbitral award', 'Award drafting best practices', 'The New York Convention (1958)', 'Cross-border enforcement procedures', 'Grounds for challenging an award'],
    content: `A valid arbitral award must be in writing, signed by the arbitrator(s), state the date and juridical seat, give reasons (unless waived), and be delivered to each party.

Drafting best practices: the award should be self-contained, logically structured (procedural history → issues → applicable law → analysis → dispositif), free from arithmetic errors, and use precise language in the operative part (dispositif).

The 1958 New York Convention (Convention on the Recognition and Enforcement of Foreign Arbitral Awards): ratified by over 170 states. Requires contracting states to recognise and enforce foreign arbitral awards subject to narrow grounds for refusal (Article V), including: incapacity of parties, invalid agreement, improper notice, award outside submission, irregular tribunal composition, non-binding award, non-arbitrable subject matter, and public policy.

Enforcement procedure: the winning party applies to the competent court of the jurisdiction where the losing party has assets. Requirements vary by jurisdiction—typically a certified copy of the award, the arbitration agreement, and translations.

Grounds to challenge: at the seat, parties may seek to set aside the award under the UNCITRAL Model Law (Article 34) or applicable national law—grounds mirror Article V of the New York Convention. Courts rarely set aside awards and will not re-examine the merits.`,
  },
  {
    id: 'platform', title: 'Using the Platform', level: 'Beginner', duration: '25 min',
    description: 'Step-by-step guide to managing cases, hearings, documents, and parties.',
    topics: ['Opening a case and the payment workflow', 'Adding parties and counsel', 'Scheduling and joining virtual hearings', 'Uploading and managing documents', 'Tracking case status and milestones'],
    content: `This platform provides an end-to-end digital environment for managing international arbitration proceedings.

Opening a case: navigate to Cases → New Case. Complete the intake form including parties' details, dispute type, applicable rules, and juridical seat. The payment workflow triggers automatically—filing fees must be settled before the case is formally registered.

Adding parties and counsel: from the case detail page, use the Parties and Counsel tabs to add respondents, claimants, and their legal representatives. Each contact receives automated email notifications for key case events.

Scheduling hearings: go to Hearings → Schedule Hearing. Select virtual, in-person, or hybrid format. Virtual hearings generate a Jitsi meeting room. Live transcription is available through the browser microphone for virtual sessions.

Document management: upload submissions, evidence, and correspondence through the Documents tab within each case. Files are categorised automatically and retained in the case record. AI analysis is available for uploaded documents.

Case status and milestones: the Timeline tab in each case tracks key procedural steps from filing through to the award. Status updates trigger notifications to all parties. The dashboard provides an at-a-glance overview of active matters.`,
  },
  {
    id: 'ai', title: 'AI in Arbitration', level: 'Intermediate', duration: '20 min',
    description: 'How AI tools on this platform support analysis, scheduling, and decision support.',
    topics: ['AI document analysis and evidence review', 'Predictive analytics and case timelines', 'AI conflict of interest detection', 'Ethical considerations for AI in dispute resolution', 'Limitations of AI in arbitration'],
    content: `AI is increasingly deployed across the arbitration lifecycle—from case intake and document review to conflict-of-interest screening and predictive analytics.

Document analysis: large language models can summarise voluminous submissions, identify key issues, flag inconsistencies between witness statements and contemporaneous documents, and assist with privilege review.

Predictive analytics: AI models trained on historical arbitration data can provide indicative case timelines, estimate award ranges by dispute type and quantum, and predict procedural delays.

Conflict of interest detection: the platform's AI cross-references arbitrator profiles against party lists, counsel, and disclosed relationships to surface potential conflicts early, supporting IBA Guidelines compliance.

Ethical considerations: AI must be a tool to assist human decision-makers, not replace them. Tribunals must be transparent about any AI use in drafting or analysis. Parties have a right to know if AI has contributed to procedural decisions. The principle of due process requires that AI tools do not introduce bias.

Limitations: AI cannot replace legal judgement, understand cultural nuance in oral hearings, or bear professional responsibility. Outputs must be verified by qualified counsel. AI hallucination remains a risk in legal contexts—always cite primary sources.`,
  },
];

const STORAGE_KEYS = {
  certified: 'arb_training_certified_v2',  // { moduleId: { score, date } }
  aiModules: 'arb_ai_modules_v2',           // array of AI-generated modules
};

const levelColor  = { Beginner: 'success', Intermediate: 'warning', Advanced: 'error' };
const PASS_SCORE  = 70;   // percent to pass
const EXAM_LENGTH = 10;   // questions per exam

const diffLabel = (d) => ['', 'Basic', 'Foundational', 'Intermediate', 'Advanced', 'Expert'][d] || '';
const diffColor = (d) => ['', 'success', 'info', 'warning', 'error', 'error'][d] || 'default';

function DifficultyStars({ level }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
      {[1,2,3,4,5].map(i =>
        i <= level
          ? <StarIcon key={i} sx={{ fontSize: 14, color: 'warning.main' }} />
          : <StarBorderIcon key={i} sx={{ fontSize: 14, color: 'text.disabled' }} />
      )}
    </Box>
  );
}

// ─── Module content renderer (parses markdown-style headings, bullets, bold) ──
function renderInline(text) {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function ModuleContent({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let bulletBuffer = [];

  const flushBullets = (key) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <List key={`bullets-${key}`} dense disablePadding sx={{ mb: 1.5 }}>
        {bulletBuffer.map((b, i) => (
          <ListItem key={i} sx={{ pl: 0, py: 0.25, alignItems: 'flex-start' }}>
            <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }} />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body1" sx={{ lineHeight: 1.75 }}>{renderInline(b)}</Typography>} />
          </ListItem>
        ))}
      </List>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) { flushBullets(idx); return; }

    if (trimmed.startsWith('### ')) {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 0.75, color: 'primary.main' }}>
          {trimmed.slice(4)}
        </Typography>
      );
    } else if (trimmed.startsWith('## ')) {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="h6" fontWeight={700} sx={{ mt: 3.5, mb: 1, borderBottom: '2px solid', borderColor: 'primary.light', pb: 0.5 }}>
          {trimmed.slice(3)}
        </Typography>
      );
    } else if (trimmed.startsWith('# ')) {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="h5" fontWeight={800} sx={{ mt: 2, mb: 1.5 }}>
          {trimmed.slice(2)}
        </Typography>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      bulletBuffer.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      bulletBuffer.push(trimmed.replace(/^\d+\.\s/, ''));
    } else {
      flushBullets(idx);
      elements.push(
        <Typography key={idx} variant="body1" sx={{ mb: 1.5, lineHeight: 1.85 }}>
          {renderInline(trimmed)}
        </Typography>
      );
    }
  });
  flushBullets('end');

  return <Box>{elements}</Box>;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Training = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'admin';

  // Persisted state
  const [certified, setCertified] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.certified) || '{}'); } catch { return {}; }
  });
  const [aiModules, setAiModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.aiModules) || '[]'); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.certified, JSON.stringify(certified)); }, [certified]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.aiModules, JSON.stringify(aiModules)); }, [aiModules]);

  const allModules = [...BASE_MODULES, ...aiModules];

  // View state
  const [view, setView] = useState('list'); // 'list' | 'learn' | 'exam' | 'result'
  const [activeModule, setActiveModule] = useState(null);

  // Exam state
  const [examAnswers, setExamAnswers] = useState([]); // [{ questionId, correct, difficulty, topic }]
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState(3);

  // Admin - module generation
  const [genOpen, setGenOpen] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genLevel, setGenLevel] = useState('Beginner');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingSuggestions, setTrendingSuggestions] = useState([]);

  // Certificate dialog
  const [certModule, setCertModule] = useState(null);

  // ─── Computed ───────────────────────────────────────────────────────────────
  const certifiedIds = Object.keys(certified);
  const passedCount  = certifiedIds.filter(id => allModules.find(m => m.id === id)).length;
  const totalCount   = allModules.length;
  const overallPct   = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const allPassed    = passedCount === totalCount && totalCount > 0;

  // ─── Admin: Generate module ─────────────────────────────────────────────────
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');

  const handleGenerateModule = async (topic) => {
    setGenLoading(true);
    setGenError(null);
    setGenProgress(0);
    setGenStage('Submitting request…');
    try {
      const res = await apiService.generateTrainingModule(topic || genTopic, genLevel);
      const { jobId } = res.data;

      // Animated progress while polling
      const stages = [
        [10, 'Drafting introduction and legal framework…'],
        [25, 'Defining key concepts…'],
        [40, 'Writing core principles…'],
        [55, 'Building case studies…'],
        [68, 'Analysing challenges…'],
        [80, 'Compiling best practices…'],
        [90, 'Finalising and formatting…'],
      ];
      let stageIdx = 0;
      const progressTimer = setInterval(() => {
        if (stageIdx < stages.length) {
          setGenProgress(stages[stageIdx][0]);
          setGenStage(stages[stageIdx][1]);
          stageIdx++;
        }
      }, 6000);

      // Poll for result
      let mod = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await apiService.getModuleJobStatus(jobId);
        const job = statusRes.data;
        if (job.status === 'done') { mod = job.module; break; }
        if (job.status === 'error') throw new Error(job.error || 'Generation failed');
      }
      clearInterval(progressTimer);
      if (!mod) throw new Error('Generation timed out. Please try again.');

      setGenProgress(100);
      setGenStage('Module ready!');
      await new Promise(r => setTimeout(r, 600));

      setAiModules(prev => [mod, ...prev]);
      setGenOpen(false);
      setGenTopic('');
      setGenProgress(0);
      setGenStage('');
      setTrendingSuggestions([]);
    } catch (err) {
      setGenError(err.response?.data?.error || err.message || t('Failed to generate module. Try again.'));
      setGenProgress(0);
      setGenStage('');
    } finally {
      setGenLoading(false);
    }
  };

  const handleGetTrending = async () => {
    setTrendingLoading(true);
    setTrendingSuggestions([]);
    setGenError(null);
    try {
      const res = await apiService.getTrendingTopics();
      setTrendingSuggestions(res.data.topics || []);
    } catch {
      setGenError(t('Could not fetch trending topics.'));
    } finally {
      setTrendingLoading(false);
    }
  };

  const removeAiModule = (id) => {
    setAiModules(prev => prev.filter(m => m.id !== id));
  };

  // ─── Exam logic ─────────────────────────────────────────────────────────────
  const fetchNextQuestion = useCallback(async (mod, answers, difficulty) => {
    setQuestionLoading(true);
    setQuestionError(null);
    setSelectedAnswer(null);
    setAnswered(false);
    try {
      const coveredTopics = answers.map(a => a.topic).filter(Boolean);
      const res = await apiService.getExamQuestion({
        moduleTitle: mod.title,
        moduleTopics: mod.topics || [],
        difficulty,
        coveredTopics,
      });
      setCurrentQuestion(res.data.question);
    } catch (err) {
      setQuestionError(t('Failed to load question. Please try again.'));
    } finally {
      setQuestionLoading(false);
    }
  }, [t]);

  const startExam = (mod) => {
    setActiveModule(mod);
    setExamAnswers([]);
    setCurrentDifficulty(3);
    setCurrentQuestion(null);
    setExamResult(null);
    setView('exam');
    fetchNextQuestion(mod, [], 3);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;
    const correct = selectedAnswer === currentQuestion.correctIndex;
    setAnswered(true);
    const newAnswer = {
      questionId: currentQuestion.questionId,
      correct,
      difficulty: currentQuestion.difficulty,
      topic: currentQuestion.topic,
      questionText: currentQuestion.text,
      selectedIndex: selectedAnswer,
      correctIndex: currentQuestion.correctIndex,
      explanation: currentQuestion.explanation,
    };
    setExamAnswers(prev => [...prev, newAnswer]);

    // Adaptive: adjust difficulty
    const newDifficulty = correct
      ? Math.min(5, currentQuestion.difficulty + 1)
      : Math.max(1, currentQuestion.difficulty - 1);
    setCurrentDifficulty(newDifficulty);
  };

  const nextQuestion = () => {
    const newAnswers = [...examAnswers];
    // Already appended in submitAnswer; recalculate from state
    if (newAnswers.length >= EXAM_LENGTH) {
      finishExam(newAnswers);
    } else {
      fetchNextQuestion(activeModule, newAnswers, currentDifficulty);
    }
  };

  const finishExam = (answers) => {
    // Weighted score: correct at difficulty D earns D points; max = sum of all difficulties if all correct
    const earned = answers.reduce((sum, a) => sum + (a.correct ? a.difficulty : 0), 0);
    const maxPossible = answers.reduce((sum, a) => sum + a.difficulty, 0);
    const score = maxPossible > 0 ? Math.round((earned / maxPossible) * 100) : 0;
    const passed = score >= PASS_SCORE;
    const result = { score, passed, answers };
    setExamResult(result);

    if (passed) {
      setCertified(prev => ({
        ...prev,
        [activeModule.id]: { score, date: new Date().toISOString() },
      }));
    }
    setView('result');
  };

  // Check if submitAnswer has been called and exam is full
  useEffect(() => {
    if (answered && examAnswers.length === EXAM_LENGTH) {
      // slight delay to let user see the last answer feedback
      const timer = setTimeout(() => finishExam(examAnswers), 1500);
      return () => clearTimeout(timer);
    }
  }, [answered, examAnswers]); // eslint-disable-line

  // ─── Views ──────────────────────────────────────────────────────────────────

  // MODULE LIST
  if (view === 'list') return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">{t('Training & Certification')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('Study each module then pass the adaptive AI exam to earn your certificate.')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {allPassed && (
            <Button variant="contained" color="success" startIcon={<CertIcon />} onClick={() => setCertModule('all')}>
              {t('Full Certificate')}
            </Button>
          )}
          {isAdmin && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setGenOpen(true); setTrendingSuggestions([]); setGenError(null); }}>
              {t('New Module')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Overall progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{t('Overall Progress')}</Typography>
          <Typography variant="body2" fontWeight={600}>{passedCount} / {totalCount} {t('certified')}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={overallPct} sx={{ height: 8, borderRadius: 4 }} color={allPassed ? 'success' : 'primary'} />
      </Paper>

      {/* Module cards */}
      <Grid container spacing={3}>
        {allModules.map((mod) => {
          const cert = certified[mod.id];
          return (
            <Grid item xs={12} md={6} key={mod.id}>
              <Card variant={cert ? 'outlined' : 'elevation'} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: cert ? 'success.main' : undefined }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, pr: 1, fontSize: '1rem' }}>{mod.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                      {cert
                        ? <Chip label={`${cert.score}% ✓`} size="small" color="success" icon={<VerifiedIcon />} />
                        : <Chip label={mod.level} size="small" color={levelColor[mod.level]} variant="outlined" />
                      }
                      {mod.aiGenerated && <Chip label="AI" size="small" color="secondary" icon={<AIIcon />} variant="outlined" />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{mod.description}</Typography>
                  <Chip label={mod.duration} size="small" variant="outlined" icon={<SchoolIcon />} />
                </CardContent>
                <CardActions sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                  <Button size="small" startIcon={<StartIcon />} onClick={() => { setActiveModule(mod); setView('learn'); }}>
                    {cert ? t('Review') : t('Study')}
                  </Button>
                  <Button
                    size="small"
                    variant={cert ? 'outlined' : 'contained'}
                    color={cert ? 'success' : 'primary'}
                    startIcon={cert ? <RetakeIcon /> : <QuizIcon />}
                    onClick={() => startExam(mod)}
                  >
                    {cert ? t('Retake Exam') : t('Take Exam')}
                  </Button>
                  {cert && (
                    <Button size="small" startIcon={<CertIcon />} color="success" onClick={() => setCertModule(mod)}>
                      {t('Certificate')}
                    </Button>
                  )}
                  {isAdmin && mod.aiGenerated && (
                    <Tooltip title={t('Remove AI module')}>
                      <IconButton size="small" color="error" onClick={() => removeAiModule(mod.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Admin: Generate Module Dialog */}
      <Dialog open={genOpen} onClose={() => { setGenOpen(false); setTrendingSuggestions([]); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="secondary" />
            {t('Generate AI Training Module')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {genError && <Alert severity="error">{genError}</Alert>}
          {genLoading && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{genStage}</Typography>
                <Typography variant="caption" color="text.secondary">{genProgress}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={genProgress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}
          <TextField
            label={t('Module Topic')}
            value={genTopic}
            onChange={e => setGenTopic(e.target.value)}
            placeholder={t('e.g. Third-Party Funding in International Arbitration')}
            fullWidth
            onKeyDown={e => e.key === 'Enter' && !genLoading && genTopic.trim() && handleGenerateModule()}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{t('Difficulty Level')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                <Chip
                  key={lvl}
                  label={lvl}
                  clickable
                  onClick={() => setGenLevel(lvl)}
                  color={genLevel === lvl ? levelColor[lvl] : 'default'}
                  variant={genLevel === lvl ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={trendingLoading ? <CircularProgress size={16} /> : <TrendingIcon />}
            onClick={handleGetTrending}
            disabled={trendingLoading}
          >
            {t('Suggest Trending Topics')}
          </Button>
          {trendingSuggestions.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>{t('Click to select a topic:')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {trendingSuggestions.map((topic, i) => (
                  <Chip
                    key={i}
                    label={topic}
                    onClick={() => { setGenTopic(topic); setTrendingSuggestions([]); }}
                    variant="outlined"
                    color="secondary"
                    clickable
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenOpen(false)}>{t('Cancel')}</Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={genLoading ? <CircularProgress size={16} color="inherit" /> : <AIIcon />}
            onClick={() => handleGenerateModule()}
            disabled={genLoading || !genTopic.trim()}
          >
            {genLoading ? t('Generating…') : t('Generate Module')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Dialog */}
      <CertificateDialog
        open={!!certModule}
        onClose={() => setCertModule(null)}
        user={user}
        mod={certModule === 'all' ? null : certModule}
        allModules={allModules}
        certified={certified}
        t={t}
      />
    </Container>
  );

  // LEARN VIEW
  if (view === 'learn' && activeModule) return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<BackIcon />} onClick={() => setView('list')} sx={{ mb: 2 }}>{t('Back to Modules')}</Button>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{activeModule.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={activeModule.level} size="small" color={levelColor[activeModule.level]} />
              <Chip label={activeModule.duration} size="small" variant="outlined" icon={<SchoolIcon />} />
              {activeModule.aiGenerated && <Chip label="AI Generated" size="small" color="secondary" icon={<AIIcon />} />}
            </Box>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{activeModule.description}</Typography>

        <Divider sx={{ mb: 3 }} />

        {activeModule.content ? (
          <ModuleContent content={activeModule.content} />
        ) : (
          <>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Topics covered:')}</Typography>
            <List dense disablePadding>
              {activeModule.topics.map((topic, i) => (
                <ListItem key={i} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}><CheckIcon fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2">{topic}</Typography>} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<QuizIcon />} onClick={() => startExam(activeModule)}>
            {certified[activeModule.id] ? t('Retake Exam') : t('Take Exam')}
          </Button>
          <Button onClick={() => setView('list')}>{t('Back')}</Button>
        </Box>
      </Paper>
    </Container>
  );

  // EXAM VIEW
  if (view === 'exam' && activeModule) {
    const questionNumber = examAnswers.length + (answered ? 0 : 1);
    const examProgress = Math.round((examAnswers.length / EXAM_LENGTH) * 100);

    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => setView('list')} sx={{ mb: 2 }}>{t('Exit Exam')}</Button>

        <Paper sx={{ p: 4 }}>
          {/* Exam header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{activeModule.title} — {t('Adaptive Exam')}</Typography>
            <Chip label={`${examAnswers.length} / ${EXAM_LENGTH}`} size="small" variant="outlined" />
          </Box>
          <LinearProgress variant="determinate" value={examProgress} sx={{ height: 6, borderRadius: 3, mb: 3 }} />

          {questionLoading && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{t('Generating next question…')}</Typography>
            </Box>
          )}

          {questionError && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>{questionError}</Alert>
              <Button variant="contained" onClick={() => fetchNextQuestion(activeModule, examAnswers, currentDifficulty)}>
                {t('Retry')}
              </Button>
            </Box>
          )}

          {currentQuestion && !questionLoading && (
            <>
              {/* Difficulty indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DifficultyStars level={currentQuestion.difficulty} />
                <Chip label={diffLabel(currentQuestion.difficulty)} size="small" color={diffColor(currentQuestion.difficulty)} />
                <Typography variant="caption" color="text.secondary">— {t('Adaptive difficulty')}</Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 3, lineHeight: 1.5 }}>
                {currentQuestion.text}
              </Typography>

              <RadioGroup value={selectedAnswer !== null ? String(selectedAnswer) : ''} onChange={e => !answered && setSelectedAnswer(Number(e.target.value))}>
                {currentQuestion.options.map((opt, i) => {
                  let color = 'text.primary';
                  let bgcolor = 'transparent';
                  if (answered) {
                    if (i === currentQuestion.correctIndex) { color = 'success.main'; bgcolor = 'success.light'; }
                    else if (i === selectedAnswer) { color = 'error.main'; bgcolor = 'error.light'; }
                  }
                  return (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        mb: 1.5, p: 1.5, cursor: answered ? 'default' : 'pointer',
                        borderColor: answered && i === currentQuestion.correctIndex ? 'success.main'
                          : answered && i === selectedAnswer ? 'error.main' : 'divider',
                        bgcolor,
                        '&:hover': !answered ? { bgcolor: 'action.hover' } : {},
                        transition: 'all 0.2s',
                      }}
                      onClick={() => !answered && setSelectedAnswer(i)}
                    >
                      <FormControlLabel
                        value={String(i)}
                        control={<Radio size="small" />}
                        label={<Typography variant="body2" color={color}>{opt}</Typography>}
                        sx={{ m: 0, width: '100%', pointerEvents: 'none' }}
                      />
                    </Paper>
                  );
                })}
              </RadioGroup>

              {/* Answer feedback */}
              <Collapse in={answered}>
                <Alert
                  severity={selectedAnswer === currentQuestion.correctIndex ? 'success' : 'error'}
                  sx={{ mt: 2, mb: 1 }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {selectedAnswer === currentQuestion.correctIndex ? t('Correct!') : t('Incorrect')}
                  </Typography>
                  <Typography variant="body2">{currentQuestion.explanation}</Typography>
                </Alert>
                {examAnswers.length < EXAM_LENGTH && (
                  <Button variant="contained" endIcon={<NextIcon />} onClick={nextQuestion} sx={{ mt: 1 }}>
                    {examAnswers.length === EXAM_LENGTH - 1 ? t('Finish Exam') : t('Next Question')}
                  </Button>
                )}
              </Collapse>

              {!answered && (
                <Button
                  variant="contained"
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  sx={{ mt: 2 }}
                >
                  {t('Submit Answer')}
                </Button>
              )}
            </>
          )}
        </Paper>
      </Container>
    );
  }

  // RESULT VIEW
  if (view === 'result' && examResult) return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {examResult.passed
            ? <CertIcon sx={{ fontSize: 72, color: 'warning.main' }} />
            : <QuizIcon sx={{ fontSize: 72, color: 'text.secondary' }} />
          }
          <Typography variant="h4" fontWeight={700} color={examResult.passed ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
            {examResult.passed ? t('Passed!') : t('Not Passed')}
          </Typography>
          <Typography variant="h2" fontWeight={800} color={examResult.passed ? 'success.main' : 'error.main'}>
            {examResult.score}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Pass mark')}: {PASS_SCORE}% · {t('Exam')}: {activeModule?.title}
          </Typography>
        </Box>

        {examResult.passed && (
          <Alert severity="success" icon={<VerifiedIcon />} sx={{ mb: 3 }}>
            {t('Certificate earned for this module. You can view it from the module list.')}
          </Alert>
        )}
        {!examResult.passed && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t('Review the module content and retake the exam to earn your certificate.')}
          </Alert>
        )}

        {/* Answer review */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t('Question Review')}</Typography>
        {examResult.answers.map((a, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2, mb: 1, borderColor: a.correct ? 'success.light' : 'error.light' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ flexGrow: 1, pr: 2 }}>
                <strong>Q{i + 1}.</strong> {a.questionText}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                <Chip label={a.correct ? t('Correct') : t('Wrong')} size="small" color={a.correct ? 'success' : 'error'} />
                <DifficultyStars level={a.difficulty} />
              </Box>
            </Box>
            {!a.correct && a.explanation && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {a.explanation}
              </Typography>
            )}
          </Paper>
        ))}

        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<RetakeIcon />} onClick={() => startExam(activeModule)}>
            {t('Retake Exam')}
          </Button>
          <Button startIcon={<StartIcon />} onClick={() => { setActiveModule(activeModule); setView('learn'); }}>
            {t('Review Module')}
          </Button>
          <Button variant="contained" onClick={() => setView('list')}>
            {t('Back to Modules')}
          </Button>
          {examResult.passed && (
            <Button variant="contained" color="success" startIcon={<CertIcon />} onClick={() => setCertModule(activeModule)}>
              {t('View Certificate')}
            </Button>
          )}
        </Box>
      </Paper>

      <CertificateDialog
        open={!!certModule}
        onClose={() => setCertModule(null)}
        user={user}
        mod={certModule === 'all' ? null : certModule}
        allModules={allModules}
        certified={certified}
        t={t}
      />
    </Container>
  );

  return null;
};

// ─── Certificate Dialog ────────────────────────────────────────────────────────
function CertificateDialog({ open, onClose, user, mod, allModules, certified, t }) {
  const isAll = !mod;
  const certifiedModules = allModules.filter(m => certified[m.id]);
  const score = mod ? certified[mod.id]?.score : null;
  const date = mod
    ? (certified[mod.id]?.date ? new Date(certified[mod.id].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isAll ? t('Full Programme Certificate') : t('Module Certificate')}</DialogTitle>
      <DialogContent>
        <Box
          sx={{ textAlign: 'center', py: 5, px: 4, border: '3px double', borderColor: 'primary.main', borderRadius: 2 }}
          className="printable-certificate"
        >
          <CertIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {isAll ? t('Certificate of Completion') : t('Certificate of Achievement')}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>{t('This certifies that')}</Typography>
          <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
            {user?.firstName} {user?.lastName}
          </Typography>
          {isAll ? (
            <>
              <Typography variant="body1" color="text.secondary">
                {t('has successfully passed all')} {certifiedModules.length} {t('modules of the')}
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5, mb: 2 }}>
                Arbitration Platform Training Programme
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary">{t('has successfully passed the module')}</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mt: 0.5, mb: 1 }}>{mod?.title}</Typography>
              {score !== null && (
                <Chip label={`${score}% — ${t('Passed')}`} color="success" icon={<VerifiedIcon />} sx={{ mb: 2 }} />
              )}
            </>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">{t('Date of completion')}: {date}</Typography>
          {isAll && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              {certifiedModules.map(m => m.title).join(' · ')}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
        <Button variant="contained" startIcon={<CertIcon />} onClick={() => window.print()}>
          {t('Print / Save as PDF')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Training;
