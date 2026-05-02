import React from 'react';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import {
  Close as CloseIcon,
  OpenInFull as ExpandIcon,
  Remove as MinimizeIcon,
  Videocam as VideoIcon,
} from '@mui/icons-material';

const STORAGE_KEY = 'arb_active_hearing_room_v1';

export const openMeetingDock = ({ url, title }) => {
  if (!url) return;
  const payload = {
    url,
    title: title || 'Hearing room',
    openedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('arb:meeting-open', { detail: payload }));
};

const readStoredMeeting = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const MeetingDock = () => {
  const [meeting, setMeeting] = React.useState(() => readStoredMeeting());
  const [minimized, setMinimized] = React.useState(false);

  React.useEffect(() => {
    const handleOpen = (event) => {
      setMeeting(event.detail || readStoredMeeting());
      setMinimized(false);
    };
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) setMeeting(readStoredMeeting());
    };
    window.addEventListener('arb:meeting-open', handleOpen);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('arb:meeting-open', handleOpen);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const closeMeeting = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMeeting(null);
  };

  if (!meeting?.url) return null;

  if (minimized) {
    return (
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          py: 0.75,
          borderRadius: 1,
        }}
      >
        <VideoIcon color="primary" fontSize="small" />
        <Typography variant="body2" sx={{ maxWidth: 220 }} noWrap>{meeting.title}</Typography>
        <Tooltip title="Expand meeting">
          <IconButton size="small" onClick={() => setMinimized(false)}><ExpandIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Close meeting">
          <IconButton size="small" onClick={closeMeeting}><CloseIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={10}
      sx={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 1500,
        width: { xs: 'calc(100vw - 32px)', md: 520 },
        height: { xs: 420, md: 520 },
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <VideoIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>{meeting.title}</Typography>
        <Tooltip title="Minimize meeting">
          <IconButton size="small" onClick={() => setMinimized(true)}><MinimizeIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Close meeting">
          <IconButton size="small" onClick={closeMeeting}><CloseIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Box
        component="iframe"
        title={meeting.title}
        src={meeting.url}
        allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
        sx={{
          border: 0,
          width: '100%',
          flex: 1,
          bgcolor: 'black',
        }}
      />
    </Paper>
  );
};

export default MeetingDock;
