// frontend/src/components/AIDisclosureBanner.js
import React from 'react';
import { Alert } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

const AIDisclosureBanner = ({
  message = 'AI-assisted content. All outputs are advisory only and must be verified by a qualified legal professional before use in proceedings.',
  sx,
  ...rest
}) => {
  return (
    <Alert
      severity="info"
      icon={<AutoAwesome fontSize="inherit" />}
      sx={{ ...sx }}
      {...rest}
    >
      {message}
    </Alert>
  );
};

export default AIDisclosureBanner;
