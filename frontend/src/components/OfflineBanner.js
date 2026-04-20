// src/components/OfflineBanner.js
import React, { useState, useEffect } from 'react';
import { Alert, Collapse, Box, LinearProgress } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';

const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };
    const handleOffline = () => {
      setOffline(true);
      setJustReconnected(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <Collapse in={offline}>
        <Alert severity="warning" icon={<WifiOffIcon />} sx={{ borderRadius: 0, py: 0.5 }}>
          You are offline. Case data and documents may be unavailable until connection is restored.
        </Alert>
      </Collapse>
      <Collapse in={justReconnected}>
        <Box>
          <Alert severity="success" icon={<WifiIcon />} sx={{ borderRadius: 0, py: 0.5 }}>
            Connection restored. Syncing data...
          </Alert>
          <LinearProgress color="success" sx={{ height: 2 }} />
        </Box>
      </Collapse>
    </>
  );
};

export default OfflineBanner;
