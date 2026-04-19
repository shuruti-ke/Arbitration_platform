// src/components/SignaturePad.js
// Free canvas-based e-signature — no third-party service required
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Tabs, Tab, TextField, Typography, Alert
} from '@mui/material';
import { Edit as DrawIcon, TextFields as TypeIcon, Clear as ClearIcon } from '@mui/icons-material';

const CANVAS_W = 500;
const CANVAS_H = 180;

// Draw tab — mouse + touch signature pad
const DrawPad = ({ canvasRef }) => {
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const move = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stop = () => { drawing.current = false; };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, [canvasRef]);

  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: 1, display: 'inline-block', width: '100%', bgcolor: '#fff' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
    </Box>
  );
};

// Type tab — typed name rendered as cursive signature
const TypedSignature = ({ canvasRef, name, setName }) => {
  const renderTyped = useCallback((value) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (!value.trim()) return;
    ctx.font = `italic ${Math.min(60, Math.floor(CANVAS_W / (value.length * 0.6 + 1)))}px Georgia, serif`;
    ctx.fillStyle = '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, CANVAS_W / 2, CANVAS_H / 2);
    // Underline
    const metrics = ctx.measureText(value);
    const lineY = CANVAS_H / 2 + 28;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2 - metrics.width / 2, lineY);
    ctx.lineTo(CANVAS_W / 2 + metrics.width / 2, lineY);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [canvasRef]);

  useEffect(() => { renderTyped(name); }, [name, renderTyped]);

  return (
    <Box>
      <TextField
        label="Type your full name"
        fullWidth
        value={name}
        onChange={e => setName(e.target.value)}
        sx={{ mb: 2 }}
        placeholder="Your signature will appear below"
      />
      <Box sx={{ border: '1px solid #ccc', borderRadius: 1, bgcolor: '#fff' }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block', width: '100%' }} />
      </Box>
    </Box>
  );
};

// Main SignaturePad dialog
const SignaturePad = ({ open, onClose, onSign, signerName = '', signerRole = '' }) => {
  const [tab, setTab] = useState(0);
  const [typedName, setTypedName] = useState(signerName);
  const drawCanvasRef = useRef(null);
  const typeCanvasRef = useRef(null);

  const activeCanvas = tab === 0 ? drawCanvasRef : typeCanvasRef;

  const clear = () => {
    const canvas = activeCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (tab === 1) setTypedName('');
  };

  const isEmpty = () => {
    const canvas = activeCanvas.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
    }
    return true;
  };

  const handleSign = () => {
    if (isEmpty()) return;
    const canvas = activeCanvas.current;
    const base64 = canvas.toDataURL('image/png');
    onSign({
      signatureImage: base64,
      signedAt: new Date().toISOString(),
      signerName: tab === 1 ? typedName : signerName,
      signerRole,
      method: tab === 0 ? 'drawn' : 'typed',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Electronic Signature
        {signerRole && <Typography variant="caption" display="block" color="text.secondary">Signing as: {signerRole}</Typography>}
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          By clicking <strong>Sign Document</strong> you agree this electronic signature is legally binding and equivalent to your handwritten signature.
        </Alert>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab icon={<DrawIcon />} label="Draw Signature" iconPosition="start" />
          <Tab icon={<TypeIcon />} label="Type Signature" iconPosition="start" />
        </Tabs>
        {tab === 0 && <DrawPad canvasRef={drawCanvasRef} />}
        {tab === 1 && <TypedSignature canvasRef={typeCanvasRef} name={typedName} setName={setTypedName} />}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {tab === 0 ? 'Draw your signature using your mouse or finger.' : 'Type your name to generate a signature.'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={clear} startIcon={<ClearIcon />}>Clear</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSign} variant="contained" color="primary">Sign Document</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignaturePad;
