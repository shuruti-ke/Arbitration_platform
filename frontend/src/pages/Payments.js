// src/pages/Payments.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Grid, Chip, Stack,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, LinearProgress, Accordion, AccordionSummary,
  AccordionDetails, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
  CheckCircle as ApproveIcon,
  ExpandMore as ExpandMoreIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  PhoneAndroid as MpesaIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const STATUS_COLOR = {
  pending_invoice: 'warning',
  invoiced: 'info',
  proof_uploaded: 'secondary',
  paid: 'success',
  pending_payment: 'warning',
};

const STATUS_LABEL = {
  pending_invoice: 'Awaiting Invoice',
  invoiced: 'Invoice Issued',
  proof_uploaded: 'Proof Uploaded',
  paid: 'Paid',
  pending_payment: 'Pending Payment',
};

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: <BankIcon fontSize="small" /> },
  { value: 'bank_deposit', label: 'Bank Deposit', icon: <BankIcon fontSize="small" /> },
  { value: 'mpesa', label: 'M-Pesa', icon: <MpesaIcon fontSize="small" /> },
  { value: 'card', label: 'Card', icon: <CardIcon fontSize="small" /> },
];

const Payments = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invoice dialog (admin)
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceCase, setInvoiceCase] = useState(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState('KES');
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Proof upload dialog (arbitrator)
  const [proofDialog, setProofDialog] = useState(false);
  const [proofPayment, setProofPayment] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofMethod, setProofMethod] = useState('mpesa');
  const [proofLoading, setProofLoading] = useState(false);

  // Approve dialog (admin)
  const [approveDialog, setApproveDialog] = useState(false);
  const [approvePayment, setApprovePayment] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.request('GET', '/api/payments');
      setPayments(res.data?.payments || []);
      setPendingCases(res.data?.pendingCases || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load payment records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleIssueInvoice = async () => {
    if (!invoiceAmount || !invoiceCase) return;
    setInvoiceLoading(true);
    try {
      await apiService.request('POST', '/api/payments/invoice', {
        caseId: invoiceCase.CASE_ID || invoiceCase.case_id,
        amount: parseFloat(invoiceAmount),
        currency: invoiceCurrency,
      });
      setInvoiceDialog(false);
      setSuccessMsg('Invoice issued successfully. The arbitrator has been notified.');
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
        const paymentId = proofPayment.PAYMENT_ID || proofPayment.payment_id;
        await apiService.request('POST', `/api/payments/${paymentId}/proof`, {
          proofDocument: base64,
          fileName: proofFile.name,
          paymentMethod: proofMethod,
        });
        setProofDialog(false);
        setSuccessMsg('Proof of payment uploaded. The admin will review and activate your case.');
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
      const paymentId = approvePayment.PAYMENT_ID || approvePayment.payment_id;
      await apiService.request('POST', `/api/payments/${paymentId}/approve`, { notes: approveNotes });
      setApproveDialog(false);
      setSuccessMsg('Payment approved. Case is now active. Receipt issued to arbitrator.');
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not approve payment.');
    } finally {
      setApproveLoading(false);
    }
  };

  const fmtCurrency = (amount, currency) =>
    amount ? `${currency || 'KES'} ${parseFloat(amount).toLocaleString()}` : '—';

  const fmtDate = (val) => val ? new Date(val).toLocaleDateString() : '—';

  if (loading) return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <LinearProgress />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading payment records...</Typography>
    </Container>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, color: '#fff',
        background: 'linear-gradient(135deg, #1a237e 0%, #1976d2 60%, #0288d1 100%)',
        boxShadow: '0 8px 32px rgba(25,118,210,0.3)',
      }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <PaymentIcon sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              {isAdmin ? 'Payment Management' : 'My Payments'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.88, mt: 0.5 }}>
              {isAdmin
                ? 'Issue invoices, review proof of payment, issue receipts, and activate cases.'
                : 'View your invoices, upload proof of payment, and track case activation.'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          {[
            { label: 'Pending Invoice', value: isAdmin ? pendingCases.length : pendingCases.filter(c => (c.PAYMENT_STATUS || c.payment_status) === 'pending_invoice').length, color: '#FFF176' },
            { label: 'Invoiced', value: payments.filter(p => (p.STATUS || p.status) === 'invoiced').length, color: '#80DEEA' },
            { label: 'Proof Uploaded', value: payments.filter(p => (p.STATUS || p.status) === 'proof_uploaded').length, color: '#CE93D8' },
            { label: 'Paid & Active', value: payments.filter(p => (p.STATUS || p.status) === 'paid').length, color: '#A5D6A7' },
          ].map(stat => (
            <Paper key={stat.label} sx={{ px: 2.5, py: 1.5, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', color: '#fff', minWidth: 100, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption">{stat.label}</Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        {isAdmin && <Tab label={`Pending Invoice (${pendingCases.length})`} />}
        <Tab label={`Payment Records (${payments.length})`} />
        {!isAdmin && <Tab label="Payment Methods" />}
      </Tabs>

      {/* Admin: Pending Invoice Tab */}
      {isAdmin && tab === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">Cases Awaiting Invoice</Typography>
            <Typography variant="body2" color="text.secondary">
              These cases have been submitted by arbitrators and are awaiting your invoice.
            </Typography>
          </Box>
          {pendingCases.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No cases pending invoice.</Typography>
            </Box>
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
                    const caseId = c.CASE_ID || c.case_id;
                    const title = c.TITLE || c.title || caseId;
                    const ps = c.PAYMENT_STATUS || c.payment_status;
                    return (
                      <TableRow key={i}>
                        <TableCell><Typography fontWeight={600}>{title}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{caseId}</Typography></TableCell>
                        <TableCell><Chip size="small" label={STATUS_LABEL[ps] || ps} color={STATUS_COLOR[ps] || 'default'} /></TableCell>
                        <TableCell>{fmtDate(c.CREATED_AT || c.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ReceiptIcon />}
                            onClick={() => { setInvoiceCase(c); setInvoiceDialog(true); }}
                          >
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
      )}

      {/* Payment Records Tab */}
      {tab === (isAdmin ? 1 : 0) && (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">Payment Records</Typography>
          </Box>
          {payments.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {isAdmin ? 'No payment records yet.' : 'No payment records. Submit a case to receive an invoice.'}
              </Typography>
            </Box>
          ) : (
            <Box>
              {payments.map((pay, i) => {
                const status = pay.STATUS || pay.status;
                const paymentId = pay.PAYMENT_ID || pay.payment_id;
                const invoiceNo = pay.INVOICE_NUMBER || pay.invoice_number;
                const receiptNo = pay.RECEIPT_NUMBER || pay.receipt_number;
                const caseTitle = pay.CASE_TITLE || pay.case_title || pay.CASE_ID || pay.case_id;
                return (
                  <Accordion key={i} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                        <Chip size="small" label={STATUS_LABEL[status] || status} color={STATUS_COLOR[status] || 'default'} />
                        <Typography fontWeight={600} sx={{ flex: 1 }}>{caseTitle}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fmtCurrency(pay.PLATFORM_FEE || pay.platform_fee, pay.CURRENCY || pay.currency)}
                        </Typography>
                        {invoiceNo && <Typography variant="caption" color="text.secondary">{invoiceNo}</Typography>}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Invoice Details</Typography>
                          <Typography variant="body2">Number: {invoiceNo || '—'}</Typography>
                          <Typography variant="body2">Issued: {fmtDate(pay.INVOICE_ISSUED_AT || pay.invoice_issued_at)}</Typography>
                          <Typography variant="body2">Amount: {fmtCurrency(pay.PLATFORM_FEE || pay.platform_fee, pay.CURRENCY || pay.currency)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Receipt Details</Typography>
                          <Typography variant="body2">Number: {receiptNo || '—'}</Typography>
                          <Typography variant="body2">Issued: {fmtDate(pay.RECEIPT_ISSUED_AT || pay.receipt_issued_at)}</Typography>
                          <Typography variant="body2">Method: {pay.PAYMENT_METHOD || pay.payment_method || '—'}</Typography>
                        </Grid>
                        {(pay.PROOF_FILE_NAME || pay.proof_file_name) && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Proof uploaded: {pay.PROOF_FILE_NAME || pay.proof_file_name}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={1}>
                        {!isAdmin && status === 'invoiced' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<UploadIcon />}
                            onClick={() => { setProofPayment(pay); setProofDialog(true); }}
                          >
                            Upload Proof of Payment
                          </Button>
                        )}
                        {isAdmin && status === 'proof_uploaded' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => { setApprovePayment(pay); setApproveDialog(true); }}
                          >
                            Approve & Activate Case
                          </Button>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Paper>
      )}

      {/* Arbitrator: Payment Methods Info Tab */}
      {!isAdmin && tab === 1 && (
        <Grid container spacing={3}>
          {[
            {
              icon: <BankIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
              title: 'Bank Transfer',
              description: 'Transfer the invoice amount directly to the platform bank account.',
              details: ['Account Name: Arbitration Platform Ltd', 'Bank: Equity Bank Kenya', 'Account No: 0123456789', 'Branch: Nairobi Main', 'Reference: Your Invoice Number'],
            },
            {
              icon: <BankIcon sx={{ fontSize: 40, color: '#0288d1' }} />,
              title: 'Bank Deposit',
              description: 'Deposit cash or cheque at any branch of our bank.',
              details: ['Account Name: Arbitration Platform Ltd', 'Bank: Equity Bank Kenya', 'Account No: 0123456789', 'Deposit Reference: Your Invoice Number'],
            },
            {
              icon: <MpesaIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
              title: 'M-Pesa',
              description: 'Pay via M-Pesa Paybill or Till Number.',
              details: ['Paybill Number: 400200', 'Account Number: Your Invoice Number', 'Amount: As per invoice', 'Save your M-Pesa confirmation message'],
            },
            {
              icon: <CardIcon sx={{ fontSize: 40, color: '#9c27b0' }} />,
              title: 'Card Payment',
              description: 'Pay by debit or credit card through the platform.',
              details: ['Contact the secretariat for a card payment link', 'Visa, Mastercard, and AMEX accepted', 'Secure 3D payment gateway'],
            },
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
                  <Typography key={j} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace', color: 'text.primary' }}>
                    {d}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Alert severity="info">
              After payment, return to the <strong>Payment Records</strong> tab, open your invoice, and click <strong>Upload Proof of Payment</strong>. Once verified, your case will be activated within 24 hours.
            </Alert>
          </Grid>
        </Grid>
      )}

      {/* Issue Invoice Dialog (Admin) */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Case: <strong>{invoiceCase?.TITLE || invoiceCase?.title || invoiceCase?.CASE_ID || invoiceCase?.case_id}</strong>
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Platform Fee Amount"
              type="number"
              fullWidth
              value={invoiceAmount}
              onChange={e => setInvoiceAmount(e.target.value)}
              helperText="Enter the fee amount for this case"
            />
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select value={invoiceCurrency} label="Currency" onChange={e => setInvoiceCurrency(e.target.value)}>
                <MenuItem value="KES">KES — Kenyan Shilling</MenuItem>
                <MenuItem value="USD">USD — US Dollar</MenuItem>
                <MenuItem value="EUR">EUR — Euro</MenuItem>
                <MenuItem value="GBP">GBP — British Pound</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleIssueInvoice}
            disabled={invoiceLoading || !invoiceAmount}
            startIcon={invoiceLoading ? <CircularProgress size={16} /> : <ReceiptIcon />}
          >
            {invoiceLoading ? 'Issuing...' : 'Issue Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Proof Dialog (Arbitrator) */}
      <Dialog open={proofDialog} onClose={() => setProofDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Proof of Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invoice: <strong>{proofPayment?.INVOICE_NUMBER || proofPayment?.invoice_number}</strong> —
            Amount: <strong>{fmtCurrency(proofPayment?.PLATFORM_FEE || proofPayment?.platform_fee, proofPayment?.CURRENCY || proofPayment?.currency)}</strong>
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Payment Method Used</InputLabel>
              <Select value={proofMethod} label="Payment Method Used" onChange={e => setProofMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => (
                  <MenuItem key={m.value} value={m.value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {m.icon}<span>{m.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
              {proofFile ? proofFile.name : 'Choose Proof File (screenshot, receipt, etc.)'}
              <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={e => setProofFile(e.target.files?.[0] || null)} />
            </Button>
            {proofFile && (
              <Alert severity="info">File selected: {proofFile.name}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProofDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadProof}
            disabled={proofLoading || !proofFile}
            startIcon={proofLoading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {proofLoading ? 'Uploading...' : 'Submit Proof'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog (Admin) */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payment & Activate Case</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            After approval, a receipt will be issued to the arbitrator and the case will be set to <strong>Active</strong>.
          </Alert>
          <TextField
            label="Notes (optional)"
            fullWidth
            multiline
            rows={2}
            value={approveNotes}
            onChange={e => setApproveNotes(e.target.value)}
            placeholder="e.g. Payment confirmed via M-Pesa"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={approveLoading}
            startIcon={approveLoading ? <CircularProgress size={16} /> : <ApproveIcon />}
          >
            {approveLoading ? 'Approving...' : 'Approve & Issue Receipt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payments;
