import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, Button, TextField, FormControlLabel, Checkbox } from '@mui/material';
import { parseLRC, distributePlainTextLyrics } from '../../utils/vttParser';
import type { LyricsLine } from '../LyricsPanel';

interface CustomLyricsEditorProps {
  initialOrigInput: string;
  initialTransInput: string;
  videoDuration: number;
  isBlurred: boolean;
  mobileFullscreen?: boolean;
  onApply: (aligned: LyricsLine[]) => void;
  onCancel: () => void;
}

export const CustomLyricsEditor: React.FC<CustomLyricsEditorProps> = ({
  initialOrigInput,
  initialTransInput,
  videoDuration,
  isBlurred,
  mobileFullscreen = false,
  onApply,
  onCancel,
}) => {
  const [origInput, setOrigInput] = useState(initialOrigInput);
  const [transInput, setTransInput] = useState(initialTransInput);
  const [isLrcFormat, setIsLrcFormat] = useState(false);

  const handleApplyCustomLyrics = () => {
    if (!origInput.trim()) return;

    let originalCues = [];
    let translationCues = [];

    if (isLrcFormat) {
      originalCues = parseLRC(origInput);
      translationCues = parseLRC(transInput);
    } else {
      const duration = videoDuration || 180; // default to 3 minutes if duration is not loaded yet
      originalCues = distributePlainTextLyrics(origInput, duration);
      translationCues = distributePlainTextLyrics(transInput, duration);
    }

    const aligned = originalCues.map((orig, index) => {
      if (isLrcFormat) {
        // Match LRC cues by closest timestamp
        const match = translationCues.find(
          (trans) =>
            Math.min(orig.endTime, trans.endTime) - Math.max(orig.startTime, trans.startTime) > 0.1 ||
            Math.abs(orig.startTime - trans.startTime) < 1.0
        );
        return {
          startTime: orig.startTime,
          endTime: orig.endTime,
          text: orig.text,
          translation: match ? match.text : '',
        };
      } else {
        // Match plain text line-by-line
        return {
          startTime: orig.startTime,
          endTime: orig.endTime,
          text: orig.text,
          translation: translationCues[index] ? translationCues[index].text : '',
        };
      }
    });

    onApply(aligned);
  };

  const panelHeight = mobileFullscreen ? '100%' : (isBlurred ? '600px' : '520px');

  return (
    <Paper className="glass-panel" sx={{ p: 3, height: panelHeight, overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
        Import Custom Lyrics
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Copy lyrics from any source and paste them below. They will be synchronized line-by-line automatically.
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={isLrcFormat}
            onChange={(e) => setIsLrcFormat(e.target.checked)}
            color="primary"
          />
        }
        label="My lyrics contain LRC timestamps (e.g. [01:23.45] text)"
        sx={{ mb: 2, '& .MuiTypography-root': { fontWeight: 500, fontSize: '0.85rem' } }}
      />

      {/* Side-by-side editing textareas */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
            ORIGINAL SONG LYRICS
          </Typography>
          <TextField
            multiline
            rows={isBlurred ? 11 : 8}
            fullWidth
            variant="outlined"
            placeholder={`Paste lyrics line-by-line here...\n\nExample:\nLine one\nLine two\nLine three`}
            value={origInput}
            onChange={(e) => setOrigInput(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#09090b', fontSize: '0.85rem' } }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
            ENGLISH TRANSLATION
          </Typography>
          <TextField
            multiline
            rows={isBlurred ? 11 : 8}
            fullWidth
            variant="outlined"
            placeholder={`Paste English translation line-by-line here...\n\nExample:\nTranslation one\nTranslation two\nTranslation three`}
            value={transInput}
            onChange={(e) => setTransInput(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#09090b', fontSize: '0.85rem' } }}
          />
        </Box>
      </Box>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel} sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleApplyCustomLyrics} disabled={!origInput.trim()}>
          Apply Lyrics
        </Button>
      </Stack>
    </Paper>
  );
};
