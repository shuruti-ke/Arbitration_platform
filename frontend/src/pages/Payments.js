// src/pages/Payments.js  — Account Management
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Grid, Chip, Stack,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, LinearProgress, Select, MenuItem,
  FormControl, InputLabel, Card, CardContent, Tooltip, IconButton,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
  CheckCircle as ApproveIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  PhoneAndroid as MpesaIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
  Sync as ReconcileIcon,
  Description as StatementIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircleOutline as MatchedIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const STATUS_COLOR = {
  pending_invoice: 'warning',
  invoiced:        'info',
  proof_uploaded:  'secondary',
  paid:            'success',
  pending_payment: 'warning',
};
const STATUS_LABEL = {
  pending_invoice: 'Awaiting Invoice',
  invoiced:        'Invoice Issued',
  proof_uploaded:  'Proof Uploaded',
  paid:            'Paid',
  pending_payment: 'Pending Payment',
};
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: <BankIcon  fontSize="small" /> },
  { value: 'bank_deposit',  label: 'Bank Deposit',   icon: <BankIcon  fontSize="small" /> },
  { value: 'mpesa',         label: 'M-Pesa',         icon: <MpesaIcon fontSize="small" /> },
  { value: 'card',          label: 'Card',           icon: <CardIcon  fontSize="small" /> },
];

const fmtCurrency = (amount, currency = 'KES') =>
  amount ? `${currency} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (val) => val ? new Date(val).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const v = (row, ...keys) => { for (const k of keys) { const u = k.toUpperCase(), l = k.toLowerCase(); if (row[u] !== undefined) return row[u]; if (row[l] !== undefined) return row[l]; } return undefined; };

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#1976d2', icon }) => (
  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
    <CardContent sx={{ pb: '12px !important' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Stack>
      <Typography variant="h5" fontWeight={700} sx={{ color }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
);

// ─── Statement Print View ─────────────────────────────────────────────────────
const StatementPrint = React.forwardRef(({ payments, pendingCases, period }, ref) => {
  const totalInvoiced = payments.reduce((s, p) => s + parseFloat(v(p, 'platform_fee') || 0), 0);
  const totalPaid     = payments.filter(p => v(p, 'status') === 'paid').reduce((s, p) => s + parseFloat(v(p, 'platform_fee') || 0), 0);
  const outstanding   = totalInvoiced - totalPaid;
  const currency      = payments[0] ? v(payments[0], 'currency') || 'KES' : 'KES';

  return (
    <Box ref={ref} sx={{ p: 4, fontFamily: 'serif', '@media print': { fontSize: '11px' } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>NCIA Arbitration Platform</Typography>
          <Typography variant="body2">Nairobi Centre for International Arbitration</Typography>
          <Typography variant="body2">Upper Hill, Nairobi, Kenya</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight={700}>ACCOUNT STATEMENT</Typography>
          <Typography variant="body2">Period: {period}</Typography>
          <Typography variant="body2">Generated: {new Date().toLocaleDateString('en-KE')}</Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: '#f5f5f5' }}>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell><strong>Case</strong></TableCell>
              <TableCell><strong>Invoice Date</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Receipt #</strong></TableCell>
              <TableCell><strong>Paid Date</strong></TableCell>
              <TableCell><strong>Method</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p, i) => (
              <TableRow key={i}>
                <TableCell>{v(p, 'invoice_number') || '—'}</TableCell>
                <TableCell>{v(p, 'case_title') || v(p, 'case_id') || '—'}</TableCell>
                <TableCell>{fmtDate(v(p, 'invoice_issued_at'))}</TableCell>
                <TableCell>{fmtCurrency(v(p, 'platform_fee'), v(p, 'currency'))}</TableCell>
                <TableCell>{v(p, 'receipt_number') || '—'}</TableCell>
                <TableCell>{fmtDate(v(p, 'receipt_issued_at'))}</TableCell>
                <TableCell>{v(p, 'payment_method') || '—'}</TableCell>
                <TableCell>{STATUS_LABEL[v(p, 'status')] || v(p, 'status')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={6} justifyContent="flex-end">
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2">Total Invoiced: <strong>{fmtCurrency(totalInvoiced, currency)}</strong></Typography>
          <Typography variant="body2">Total Received: <strong>{fmtCurrency(totalPaid, currency)}</strong></Typography>
          <Typography variant="body2" color={outstanding > 0 ? 'error' : 'success.main'}>
            Outstanding: <strong>{fmtCurrency(outstanding, currency)}</strong>
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Payments = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Invoice dialog
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceCase, setInvoiceCase] = useState(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDesc, setInvoiceDesc] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState('KES');
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Proof upload dialog
  const [proofDialog, setProofDialog] = useState(false);
  const [proofPayment, setProofPayment] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofMethod, setProofMethod] = useState('mpesa');
  const [proofRef, setProofRef] = useState('');
  const [proofLoading, setProofLoading] = useState(false);

  // Approve dialog
  const [approveDialog, setApproveDialog] = useState(false);
  const [approvePayment, setApprovePayment] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  // Statement dialog
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState('All time');
  const printRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.request('GET', '/payments');
      setPayments(res.data?.payments || []);
      setPendingCases(res.data?.pendingCases || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load account records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ──────────────────────────────────────────────────────
  const currency = payments[0] ? v(payments[0], 'currency') || 'KES' : 'KES';
  const totalInvoiced  = payments.reduce((s, p) => s + parseFloat(v(p, 'platform_fee') || 0), 0);
  const totalPaid      = payments.filter(p => v(p, 'status') === 'paid').reduce((s, p) => s + parseFloat(v(p, 'platform_fee') || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const proofPending   = payments.filter(p => v(p, 'status') === 'proof_uploaded').length;
  const reconcileRate  = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // ── Reconciliation: pair each payment record with its state ──────────────
  const reconciliation = payments.map(p => {
    const status = v(p, 'status');
    const amount = parseFloat(v(p, 'platform_fee') || 0);
    const matched = status === 'paid';
    const pending = status === 'proof_uploaded';
    return { ...p, _matched: matched, _pending: pending, _amount: amount };
  });
  const unmatched = reconciliation.filter(r => !r._matched);
  const matched   = reconciliation.filter(r => r._matched);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleIssueInvoice = async () => {
    if (!invoiceAmount || !invoiceCase) return;
    setInvoiceLoading(true);
    try {
      await apiService.request('POST', '/payments/invoice', {
        caseId: v(invoiceCase, 'case_id'),
        amount: parseFloat(invoiceAmount),
        currency: invoiceCurrency,
        description: invoiceDesc,
      });
      setInvoiceDialog(false);
      setInvoiceAmount(''); setInvoiceDesc('');
      setSuccessMsg('Invoice issued. The arbitrator has been notified.');
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not issue invoice.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !proofPayment) return;
    setProofLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const paymentId = v(proofPayment, 'payment_id');
        await apiService.request('POST', `/payments/${paymentId}/proof`, {
          proofDocument: base64,
          fileName: proofFile.name,
          paymentMethod: proofMethod,
          referenceNumber: proofRef,
        });
        setProofDialog(false);
        setSuccessMsg('Proof submitted. Admin will verify and activate your case within 24 hours.');
        load();
      };
      reader.readAsDataURL(proofFile);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not upload proof.');
    } finally {
      setProofLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvePayment) return;
    setApproveLoading(true);
    try {
      const paymentId = v(approvePayment, 'payment_id');
      await apiService.request('POST', `/payments/${paymentId}/approve`, { notes: approveNotes });
      setApproveDialog(false);
      setSuccessMsg('Payment approved. Case activated and receipt issued.');
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not approve payment.');
    } finally {
      setApproveLoading(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Account Statement</title>
      <style>body{font-family:serif;padding:32px}table{width:100%;border-collapse:collapse}
      td,th{border:1px solid #ddd;padding:6px 8px;font-size:11px}th{background:#f5f5f5}</style>
      </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  if (loading) return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <LinearProgress />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading account records…</Typography>
    </Container>
  );

  // ── Admin tab indices: 0=Overview 1=Invoices 2=Reconciliation 3=Statements
  // ── Arbitrator tab indices: 0=My Invoices 1=Payment Methods

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>

      {/* ── Header ── */}
      <Paper sx={{
        p: 3, mb: 3, color: '#fff',
        background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 60%, #0277bd 100%)',
        boxShadow: '0 8px 32px rgba(25,118,210,0.3)',
      }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <WalletIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              {isAdmin ? 'Account Management' : 'My Account'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.88, mt: 0.5 }}>
              {isAdmin
                ? 'Invoicing, receipts, reconciliation, and financial statements for all arbitration cases.'
                : 'View your invoices, upload proof of payment, and track case activation.'}
            </Typography>
          </Box>
        </Stack>

        {/* Summary stat pills */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {isAdmin ? [
            { label: 'Awaiting Invoice', value: pendingCases.length,                                color: '#FFF176' },
            { label: 'Invoiced',         value: payments.filter(p => v(p,'status')==='invoiced').length, color: '#80DEEA' },
            { label: 'Proof Pending',    value: proofPending,                                      color: '#CE93D8' },
            { label: 'Paid & Active',    value: matched.length,                                    color: '#A5D6A7' },
            { label: 'Reconciled',       value: `${reconcileRate}%`,                              color: '#FFCC80' },
          ] : [
            { label: 'Invoices',         value: payments.length,                                   color: '#80DEEA' },
            { label: 'Awaiting Payment', value: payments.filter(p=>v(p,'status')==='invoiced').length, color: '#FFF176' },
            { label: 'Paid',             value: matched.length,                                    color: '#A5D6A7' },
          ].map(stat => (
            <Paper key={stat.label} sx={{ px: 2.5, py: 1.5, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', color: '#fff', textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption">{stat.label}</Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {error      && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Tabs ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {isAdmin ? [
          <Tab key="ov"  label="Overview" />,
          <Tab key="inv" label={`Invoices (${pendingCases.length + payments.length})`} />,
          <Tab key="rec" label={`Reconciliation`} />,
          <Tab key="st"  label="Statements" />,
        ] : [
          <Tab key="mi"  label={`My Invoices (${payments.length})`} />,
          <Tab key="pm"  label="Payment Methods" />,
        ]}
      </Tabs>

      {/* ════════════════════ ADMIN: OVERVIEW ════════════════════ */}
      {isAdmin && tab === 0 && (
        <Stack spacing={3}>
          {/* KPI cards */}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatCard label="Total Invoiced"   value={fmtCurrency(totalInvoiced, currency)}   icon={<ReceiptIcon />}     color="#1565c0" />
            <StatCard label="Total Collected"  value={fmtCurrency(totalPaid, currency)}        icon={<ApproveIcon />}     color="#2e7d32" />
            <StatCard label="Outstanding"      value={fmtCurrency(totalOutstanding, currency)} icon={<WarningIcon />}     color={totalOutstanding > 0 ? '#c62828' : '#2e7d32'} />
            <StatCard label="Reconciliation Rate" value={`${reconcileRate}%`}                  icon={<ReconcileIcon />}   color="#e65100"
              sub={`${matched.length} of ${payments.length} invoices matched`} />
            <StatCard label="Proof Awaiting Review" value={proofPending}                       icon={<TrendingUpIcon />}  color="#6a1b9a" />
          </Stack>

          {/* Proof-pending — needs immediate action */}
          {proofPending > 0 && (
            <Paper variant="outlined" sx={{ borderColor: 'warning.main', borderRadius: 2 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', background: 'warning.50' }}>
                <Typography variant="subtitle1" fontWeight={700} color="warning.dark">
                  {proofPending} payment{proofPending > 1 ? 's' : ''} awaiting approval
                </Typography>
                <Typography variant="body2" color="text.secondary">Review uploaded proof and activate these cases.</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Case</TableCell>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Proof File</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.filter(p => v(p,'status') === 'proof_uploaded').map((p, i) => (
                      <TableRow key={i} sx={{ background: '#fff8e1' }}>
                        <TableCell><Typography fontWeight={600}>{v(p,'case_title') || v(p,'case_id')}</Typography></TableCell>
                        <TableCell>{v(p,'invoice_number') || '—'}</TableCell>
                        <TableCell>{fmtCurrency(v(p,'platform_fee'), v(p,'currency'))}</TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{v(p,'proof_file_name') || '—'}</Typography></TableCell>
                        <TableCell>{v(p,'payment_method') || '—'}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />}
                            onClick={() => { setApprovePayment(p); setApproveDialog(true); }}>
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Cases awaiting invoice */}
          {pendingCases.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>{pendingCases.length} case{pendingCases.length > 1 ? 's' : ''} awaiting invoice</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Case Title</TableCell>
                      <TableCell>Case ID</TableCell>
                      <TableCell>Filed</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingCases.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell><Typography fontWeight={600}>{v(c,'title') || v(c,'case_id')}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{v(c,'case_id')}</Typography></TableCell>
                        <TableCell>{fmtDate(v(c,'created_at'))}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" startIcon={<ReceiptIcon />}
                            onClick={() => { setInvoiceCase(c); setInvoiceDialog(true); }}>
                            Create Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>
      )}

      {/* ════════════════════ ADMIN: INVOICES ════════════════════ */}
      {isAdmin && tab === 1 && (
        <Stack spacing={3}>
          {/* Awaiting invoice */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">Create Invoice</Typography>
                <Typography variant="body2" color="text.secondary">Cases submitted and waiting for an invoice to be issued.</Typography>
              </Box>
            </Box>
            {pendingCases.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">All cases have been invoiced.</Typography></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Case</TableCell>
                      <TableCell>Case ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Filed</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingCases.map((c, i) => {
                      const ps = v(c,'payment_status');
                      return (
                        <TableRow key={i}>
                          <TableCell><Typography fontWeight={600}>{v(c,'title') || v(c,'case_id')}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{v(c,'case_id')}</Typography></TableCell>
                          <TableCell><Chip size="small" label={STATUS_LABEL[ps] || ps} color={STATUS_COLOR[ps] || 'default'} /></TableCell>
                          <TableCell>{fmtDate(v(c,'created_at'))}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="contained" startIcon={<ReceiptIcon />}
                              onClick={() => { setInvoiceCase(c); setInvoiceDialog(true); }}>
                              Issue Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* All issued invoices */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">All Invoices</Typography>
            </Box>
            {payments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No invoices issued yet.</Typography></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Case</TableCell>
                      <TableCell>Issued</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Paid Date</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p, i) => {
                      const status = v(p,'status');
                      return (
                        <TableRow key={i}>
                          <TableCell><Typography variant="body2" fontWeight={600}>{v(p,'invoice_number') || '—'}</Typography></TableCell>
                          <TableCell>{v(p,'case_title') || v(p,'case_id')}</TableCell>
                          <TableCell>{fmtDate(v(p,'invoice_issued_at'))}</TableCell>
                          <TableCell>{fmtCurrency(v(p,'platform_fee'), v(p,'currency'))}</TableCell>
                          <TableCell><Chip size="small" label={STATUS_LABEL[status] || status} color={STATUS_COLOR[status] || 'default'} /></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{v(p,'receipt_number') || '—'}</Typography></TableCell>
                          <TableCell>{fmtDate(v(p,'receipt_issued_at'))}</TableCell>
                          <TableCell align="right">
                            {status === 'proof_uploaded' && (
                              <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />}
                                onClick={() => { setApprovePayment(p); setApproveDialog(true); }}>
                                Approve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      )}

      {/* ════════════════════ ADMIN: RECONCILIATION ════════════════════ */}
      {isAdmin && tab === 2 && (
        <Stack spacing={3}>
          {/* Summary */}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatCard label="Total Invoiced"    value={payments.length}   icon={<ReceiptIcon />}  color="#1565c0" sub={fmtCurrency(totalInvoiced, currency)} />
            <StatCard label="Matched / Paid"    value={matched.length}    icon={<MatchedIcon />}  color="#2e7d32" sub={fmtCurrency(totalPaid, currency)} />
            <StatCard label="Unmatched"         value={unmatched.length}  icon={<WarningIcon />}  color="#c62828" sub={fmtCurrency(totalOutstanding, currency)} />
            <StatCard label="Reconciled"        value={`${reconcileRate}%`} icon={<ReconcileIcon />} color="#e65100" />
          </Stack>

          {/* Unmatched invoices */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" color={unmatched.length > 0 ? 'error' : 'success.main'}>
                {unmatched.length > 0 ? `${unmatched.length} Unreconciled Invoice${unmatched.length > 1 ? 's' : ''}` : 'All invoices reconciled'}
              </Typography>
              <Typography variant="body2" color="text.secondary">Invoices without a matching approved payment.</Typography>
            </Box>
            {unmatched.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <MatchedIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography color="success.main" fontWeight={600}>All invoices have been reconciled.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Case</TableCell>
                      <TableCell>Invoiced</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Current Status</TableCell>
                      <TableCell>Proof File</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unmatched.map((p, i) => {
                      const status = v(p,'status');
                      return (
                        <TableRow key={i} sx={{ background: p._pending ? '#fff8e1' : undefined }}>
                          <TableCell>{v(p,'invoice_number') || '—'}</TableCell>
                          <TableCell><Typography fontWeight={600}>{v(p,'case_title') || v(p,'case_id')}</Typography></TableCell>
                          <TableCell>{fmtDate(v(p,'invoice_issued_at'))}</TableCell>
                          <TableCell><strong>{fmtCurrency(v(p,'platform_fee'), v(p,'currency'))}</strong></TableCell>
                          <TableCell><Chip size="small" label={STATUS_LABEL[status] || status} color={STATUS_COLOR[status] || 'default'} /></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{v(p,'proof_file_name') || 'No proof yet'}</Typography></TableCell>
                          <TableCell align="right">
                            {p._pending && (
                              <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />}
                                onClick={() => { setApprovePayment(p); setApproveDialog(true); }}>
                                Reconcile & Approve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Matched invoices */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" color="success.main">{matched.length} Reconciled Payments</Typography>
            </Box>
            {matched.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No reconciled payments yet.</Typography></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Case</TableCell>
                      <TableCell>Invoice Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Paid Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Variance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matched.map((p, i) => (
                      <TableRow key={i} sx={{ background: '#f1f8e9' }}>
                        <TableCell>{v(p,'invoice_number') || '—'}</TableCell>
                        <TableCell>{v(p,'case_title') || v(p,'case_id')}</TableCell>
                        <TableCell>{fmtDate(v(p,'invoice_issued_at'))}</TableCell>
                        <TableCell>{fmtCurrency(v(p,'platform_fee'), v(p,'currency'))}</TableCell>
                        <TableCell>{v(p,'receipt_number') || '—'}</TableCell>
                        <TableCell>{fmtDate(v(p,'receipt_issued_at'))}</TableCell>
                        <TableCell>{v(p,'payment_method') || '—'}</TableCell>
                        <TableCell><Chip size="small" label="Matched" color="success" icon={<MatchedIcon />} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      )}

      {/* ════════════════════ ADMIN: STATEMENTS ════════════════════ */}
      {isAdmin && tab === 3 && (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Generate Account Statement</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generate a printable statement of all invoices and payments for any period.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Period</InputLabel>
                <Select value={statementPeriod} label="Period" onChange={e => setStatementPeriod(e.target.value)}>
                  <MenuItem value="All time">All time</MenuItem>
                  <MenuItem value="This month">This month</MenuItem>
                  <MenuItem value="Last 3 months">Last 3 months</MenuItem>
                  <MenuItem value="This financial year">This financial year</MenuItem>
                  <MenuItem value="Last financial year">Last financial year</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => setStatementOpen(true)}>
                Preview & Print
              </Button>
            </Stack>
          </Paper>

          {/* Financial summary table */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Financial Summary</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Amount ({currency})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { label: 'Total invoiced',          count: payments.length,              amount: totalInvoiced },
                    { label: 'Paid & reconciled',        count: matched.length,               amount: totalPaid },
                    { label: 'Awaiting payment',         count: payments.filter(p=>v(p,'status')==='invoiced').length, amount: payments.filter(p=>v(p,'status')==='invoiced').reduce((s,p)=>s+parseFloat(v(p,'platform_fee')||0),0) },
                    { label: 'Proof uploaded (pending)', count: proofPending,                 amount: payments.filter(p=>v(p,'status')==='proof_uploaded').reduce((s,p)=>s+parseFloat(v(p,'platform_fee')||0),0) },
                    { label: 'Outstanding',              count: unmatched.length,             amount: totalOutstanding },
                  ].map((row, i) => (
                    <TableRow key={i} sx={i === 4 ? { background: totalOutstanding > 0 ? '#fff3e0' : '#f1f8e9', fontWeight: 700 } : {}}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right"><strong>{fmtCurrency(row.amount, currency)}</strong></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}

      {/* ════════════════════ ARBITRATOR: MY INVOICES ════════════════════ */}
      {!isAdmin && tab === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">My Invoices</Typography>
          </Box>
          {payments.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No invoices yet. Submit a case to receive your first invoice.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Case</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Receipt #</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p, i) => {
                    const status = v(p,'status');
                    return (
                      <TableRow key={i}>
                        <TableCell><Typography fontWeight={600}>{v(p,'invoice_number') || '—'}</Typography></TableCell>
                        <TableCell>{v(p,'case_title') || v(p,'case_id')}</TableCell>
                        <TableCell>{fmtDate(v(p,'invoice_issued_at'))}</TableCell>
                        <TableCell><strong>{fmtCurrency(v(p,'platform_fee'), v(p,'currency'))}</strong></TableCell>
                        <TableCell><Chip size="small" label={STATUS_LABEL[status] || status} color={STATUS_COLOR[status] || 'default'} /></TableCell>
                        <TableCell>{v(p,'receipt_number') || '—'}</TableCell>
                        <TableCell align="right">
                          {status === 'invoiced' && (
                            <Button size="small" variant="contained" startIcon={<UploadIcon />}
                              onClick={() => { setProofPayment(p); setProofDialog(true); }}>
                              Upload Proof
                            </Button>
                          )}
                          {status === 'paid' && (
                            <Chip size="small" icon={<MatchedIcon />} label="Paid" color="success" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ════════════════════ ARBITRATOR: PAYMENT METHODS ════════════════════ */}
      {!isAdmin && tab === 1 && (
        <Grid container spacing={3}>
          {[
            { icon: <BankIcon sx={{ fontSize: 40, color: '#1976d2' }} />, title: 'Bank Transfer', description: 'Transfer directly to the platform bank account.', details: ['Account Name: NCIA Arbitration Platform', 'Bank: Equity Bank Kenya', 'Account No: 0123456789', 'Branch: Nairobi Upper Hill', 'Reference: Your Invoice Number'] },
            { icon: <BankIcon sx={{ fontSize: 40, color: '#0288d1' }} />, title: 'Bank Deposit',  description: 'Deposit cash or cheque at any Equity branch.',     details: ['Account Name: NCIA Arbitration Platform', 'Bank: Equity Bank Kenya', 'Account No: 0123456789', 'Reference: Your Invoice Number'] },
            { icon: <MpesaIcon sx={{ fontSize: 40, color: '#4caf50' }} />, title: 'M-Pesa',       description: 'Pay via M-Pesa Paybill.',                          details: ['Paybill Number: 400200', 'Account Number: Your Invoice Number', 'Amount: As per invoice', 'Save your M-Pesa confirmation SMS'] },
            { icon: <CardIcon sx={{ fontSize: 40, color: '#9c27b0' }} />, title: 'Card Payment',  description: 'Visa, Mastercard, or AMEX via secure gateway.',    details: ['Contact the secretariat for a card payment link', 'Visa, Mastercard, and AMEX accepted', 'Secure 3D payment gateway'] },
          ].map((method, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  {method.icon}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{method.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{method.description}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                {method.details.map((d, j) => (
                  <Typography key={j} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>{d}</Typography>
                ))}
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Alert severity="info">
              After payment, go to <strong>My Invoices</strong>, find your invoice, and click <strong>Upload Proof</strong>. Once verified your case activates within 24 hours.
            </Alert>
          </Grid>
        </Grid>
      )}

      {/* ════════════════════ DIALOGS ════════════════════ */}

      {/* Issue Invoice */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Case: <strong>{v(invoiceCase,'title') || v(invoiceCase,'case_id')}</strong>
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Platform Fee Amount" type="number" fullWidth value={invoiceAmount}
                onChange={e => setInvoiceAmount(e.target.value)} helperText="Arbitration platform fee" />
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Currency</InputLabel>
                <Select value={invoiceCurrency} label="Currency" onChange={e => setInvoiceCurrency(e.target.value)}>
                  <MenuItem value="KES">KES</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Invoice Description (optional)" fullWidth value={invoiceDesc}
              onChange={e => setInvoiceDesc(e.target.value)}
              placeholder="e.g. Arbitration filing fee — Case No. 2026/001" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleIssueInvoice}
            disabled={invoiceLoading || !invoiceAmount}
            startIcon={invoiceLoading ? <CircularProgress size={16} /> : <ReceiptIcon />}>
            {invoiceLoading ? 'Issuing…' : 'Issue Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Proof */}
      <Dialog open={proofDialog} onClose={() => setProofDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Proof of Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invoice <strong>{v(proofPayment,'invoice_number')}</strong> — Amount: <strong>{fmtCurrency(v(proofPayment,'platform_fee'), v(proofPayment,'currency'))}</strong>
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Payment Method Used</InputLabel>
              <Select value={proofMethod} label="Payment Method Used" onChange={e => setProofMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => (
                  <MenuItem key={m.value} value={m.value}>
                    <Stack direction="row" spacing={1} alignItems="center">{m.icon}<span>{m.label}</span></Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Transaction / Reference Number" fullWidth value={proofRef}
              onChange={e => setProofRef(e.target.value)} placeholder="e.g. M-Pesa code or bank ref" />
            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
              {proofFile ? proofFile.name : 'Attach proof (screenshot, receipt, PDF)'}
              <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setProofFile(e.target.files?.[0] || null)} />
            </Button>
            {proofFile && <Alert severity="info">File: {proofFile.name}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProofDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadProof}
            disabled={proofLoading || !proofFile}
            startIcon={proofLoading ? <CircularProgress size={16} /> : <UploadIcon />}>
            {proofLoading ? 'Uploading…' : 'Submit Proof'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Payment */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payment & Reconcile</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Invoice <strong>{v(approvePayment,'invoice_number')}</strong> — <strong>{fmtCurrency(v(approvePayment,'platform_fee'), v(approvePayment,'currency'))}</strong><br />
            Approving will issue a receipt, activate the case, and mark this invoice as reconciled.
          </Alert>
          <TextField label="Notes (optional)" fullWidth multiline rows={2} value={approveNotes}
            onChange={e => setApproveNotes(e.target.value)}
            placeholder="e.g. Confirmed via M-Pesa code MXX123" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove}
            disabled={approveLoading}
            startIcon={approveLoading ? <CircularProgress size={16} /> : <ApproveIcon />}>
            {approveLoading ? 'Approving…' : 'Approve & Reconcile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statement Preview */}
      <Dialog open={statementOpen} onClose={() => setStatementOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Account Statement — {statementPeriod}</span>
            <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="outlined">Print / Save PDF</Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <StatementPrint ref={printRef} payments={payments} pendingCases={pendingCases} period={statementPeriod} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatementOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default Payments;
