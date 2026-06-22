import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Container, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, Tooltip, Stack } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TranslateIcon from '@mui/icons-material/Translate';
import SettingsIcon from '@mui/icons-material/Settings';

interface HeaderProps {
  onBackToLibrary?: () => void;
  youtubeApiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onBackToLibrary, youtubeApiKey, onApiKeyChange }) => {
  const [openSettings, setOpenSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(youtubeApiKey);

  const handleOpen = () => {
    setKeyInput(youtubeApiKey);
    setOpenSettings(true);
  };

  const handleClose = () => {
    setOpenSettings(false);
  };

  const handleSave = () => {
    onApiKeyChange(keyInput.trim());
    handleClose();
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: 'none' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo & Title */}
          <Box 
            onClick={onBackToLibrary}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: onBackToLibrary ? 'pointer' : 'default',
              userSelect: 'none',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: onBackToLibrary ? 0.85 : 1
              }
            }}
          >
            <Box 
              sx={{ 
                mr: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
              }}
            >
              <MusicNoteIcon sx={{ color: '#09090b', fontSize: 22 }} />
            </Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 800, 
                background: 'linear-gradient(90deg, #f4f4f5 30%, #38bdf8 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.03em',
                fontFamily: 'Outfit'
              }}
            >
             Spotify the Language
            </Typography>
          </Box>

          {/* Right Header Navigation */}
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TranslateIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.85rem'
                }}
              >
                Learn Languages with Songs
              </Typography>
            </Box>

            {/* Settings button */}
            <Tooltip title="Configure API Key">
              <IconButton 
                onClick={handleOpen} 
                sx={{ 
                  color: youtubeApiKey ? '#38bdf8' : 'text.secondary',
                  border: youtubeApiKey ? '1px solid rgba(56, 189, 248, 0.2)' : 'none',
                  backgroundColor: youtubeApiKey ? 'rgba(56, 189, 248, 0.05)' : 'transparent'
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </Container>

      {/* Settings Dialog */}
      <Dialog 
        open={openSettings} 
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#18181b',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              p: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
          Settings & Integrations
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 2 }}>
            Public YouTube search proxies can sometimes experience downtime or CORS blocking. To search reliably, you can enter your own free Google YouTube Data API v3 Key.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="YouTube Data API v3 Key"
            type="password"
            fullWidth
            variant="outlined"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Paste your AIzaSy... API key here"
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#09090b',
              }
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1.5 }}>
            🔒 Keys are stored only locally in your browser cache (localStorage).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save Key
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};
