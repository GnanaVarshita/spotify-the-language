import React, { useState } from 'react';
import { Paper, Stack, Typography, Slider, Tooltip, IconButton, Menu, MenuItem, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import SpeedIcon from '@mui/icons-material/Speed';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import BlurOffIcon from '@mui/icons-material/BlurOff';

interface PlayerControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  speed: number;
  isBlurred: boolean;
  onSeekChange: (event: any, newValue: number | number[]) => void;
  onPlayPause: () => void;
  onVolumeChange: (event: any, newValue: number | number[]) => void;
  onMuteToggle: () => void;
  onSpeedChange: (rate: number) => void;
  onBlurToggle: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTime,
  duration,
  isPlaying,
  volume,
  isMuted,
  speed,
  isBlurred,
  onSeekChange,
  onPlayPause,
  onVolumeChange,
  onMuteToggle,
  onSpeedChange,
  onBlurToggle
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSpeedMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSpeedMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSpeedSelect = (rate: number) => {
    onSpeedChange(rate);
    handleSpeedMenuClose();
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs) || timeInSecs < 0) return '00:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Paper 
      className="glass-panel" 
      sx={{ 
        p: 2, 
        borderRadius: 3, 
        backgroundColor: '#18181b', 
        border: '1px solid rgba(255,255,255,0.06)' 
      }}
    >
      {/* Playback Seek Slider */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 38 }}>
          {formatTime(currentTime)}
        </Typography>
        
        <Slider
          size="small"
          value={currentTime}
          max={duration || 100}
          onChange={onSeekChange}
          sx={{
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
              '&:before': {
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
              },
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0px 0px 0px 8px rgba(56, 189, 248, 0.16)`,
              },
              '&.Mui-active': {
                width: 16,
                height: 16,
              },
            },
          }}
        />

        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 38 }}>
          {formatTime(duration)}
        </Typography>
      </Stack>

      {/* Dashboard Control Buttons */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {/* Play / Pause */}
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <IconButton 
              onClick={onPlayPause}
              sx={{ 
                backgroundColor: isPlaying ? 'rgba(255, 255, 255, 0.05)' : '#0284c7',
                color: isPlaying ? '#38bdf8' : '#ffffff',
                width: 44,
                height: 44,
                '&:hover': {
                  backgroundColor: isPlaying ? 'rgba(255, 255, 255, 0.1)' : '#0369a1',
                }
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>

          {/* Volume Control */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: 130 }}>
            <IconButton onClick={onMuteToggle} sx={{ color: 'text.secondary' }}>
              {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
            </IconButton>
            <Slider
              size="small"
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              aria-label="Volume"
              sx={{
                color: 'text.secondary',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                }
              }}
            />
          </Stack>
        </Stack>

        {/* Right Action buttons */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {/* Speed Control */}
          <Tooltip title="Playback Speed">
            <IconButton 
              onClick={handleSpeedMenuOpen}
              sx={{ 
                color: speed !== 1 ? '#38bdf8' : 'text.secondary',
                border: '1px solid',
                borderColor: speed !== 1 ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                backgroundColor: speed !== 1 ? 'rgba(56, 189, 248, 0.06)' : 'transparent'
              }}
            >
              <SpeedIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleSpeedMenuClose}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2
                }
              }
            }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <MenuItem 
                key={rate} 
                selected={speed === rate} 
                onClick={() => handleSpeedSelect(rate)}
                sx={{ fontWeight: 600 }}
              >
                {rate === 1 ? 'Normal' : `${rate}x`}
              </MenuItem>
            ))}
          </Menu>

          {/* Blur/Focus Mode Toggle */}
          <Button
            variant={isBlurred ? "contained" : "outlined"}
            color="primary"
            onClick={onBlurToggle}
            startIcon={isBlurred ? <BlurOffIcon /> : <BlurOnIcon />}
            sx={{ 
              fontWeight: 600,
              borderColor: isBlurred ? 'transparent' : 'rgba(56, 189, 248, 0.4)',
              backgroundColor: isBlurred ? '#0284c7' : 'transparent',
              color: isBlurred ? '#ffffff' : '#38bdf8',
              '&:hover': {
                backgroundColor: isBlurred ? '#0369a1' : 'rgba(56, 189, 248, 0.06)',
              }
            }}
          >
            {isBlurred ? "Unblur Video" : "Lyrics Mode"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
