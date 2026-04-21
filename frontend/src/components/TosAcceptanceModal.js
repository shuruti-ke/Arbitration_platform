// frontend/src/components/TosAcceptanceModal.js
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, FormControlLabel, Checkbox, Divider
} from '@mui/material';

const TosAcceptanceModal = ({ open, onAccept }) => {
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    localStorage.setItem(
      'arb_tos_accepted_v1',
      JSON.stringify({ accepted: true, date: new Date().toISOString() })
    );
    onAccept();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {/* intentionally prevent close on backdrop click */}}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Platform Terms & Conditions</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Before accessing the platform, please read and accept the following:
        </Typography>

        <Box
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'grey.300',
            p: 2,
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            1. Facilitation Platform Only
          </Typography>
          <Typography variant="body2" paragraph>
            This platform is a technology facilitation tool. It has no arbitral authority. It does
            not conduct arbitration, make awards, or provide legal advice. All arbitral decisions are
            made solely by the appointed arbitrator(s).
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            2. AI Advisory Tools
          </Typography>
          <Typography variant="body2" paragraph>
            This platform uses artificial intelligence to assist with document analysis, compliance
            checking, and training content. All AI outputs are advisory only and must be reviewed
            and verified by qualified legal professionals before use in any proceedings.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            3. Confidentiality
          </Typography>
          <Typography variant="body2" paragraph>
            All case materials, documents, and communications shared on this platform are
            confidential. You must not disclose case materials to any person not party to the
            proceedings.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            4. Data Protection
          </Typography>
          <Typography variant="body2" paragraph>
            Your personal data is processed in accordance with the Kenya Data Protection Act 2019
            (Act No. 24 of 2019). You have the right to access, correct, and request deletion of
            your personal data.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            5. Governing Law
          </Typography>
          <Typography variant="body2">
            These terms are governed by the laws of the Republic of Kenya.
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              color="primary"
            />
          }
          label="I have read and agree to the Terms of Service, Privacy Policy, and AI Use Policy"
        />

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Last updated: April 2026
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={!checked}
        >
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TosAcceptanceModal;
