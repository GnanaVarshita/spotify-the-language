import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Stack, Button } from '@mui/material';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import TranslateIcon from '@mui/icons-material/Translate';
import EditIcon from '@mui/icons-material/Edit';
import { CustomLyricsEditor } from './lyrics/CustomLyricsEditor';

export interface LyricsLine {
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
}

interface LyricsPanelProps {
  lyrics: LyricsLine[];
  currentTime: number;
  isBlurred: boolean;
  loading: boolean;
  mobileFullscreen?: boolean;
  onLineClick: (time: number) => void;
  targetLanguageName?: string;
  onCustomLyricsLoad: (cues: LyricsLine[]) => void;
  videoDuration: number;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  lyrics,
  currentTime,
  isBlurred,
  loading,
  mobileFullscreen = false,
  onLineClick,
  targetLanguageName = 'Target Language',
  onCustomLyricsLoad,
  videoDuration
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Find the currently active lyric line index based on playback time
  const activeIndex = lyrics.findIndex(
    (line) => currentTime >= line.startTime && currentTime <= line.endTime
  );

  // Auto-scroll to center the active lyric line when activeIndex changes (if enabled)
  useEffect(() => {
    if (autoScroll && activeIndex !== -1 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, autoScroll]);


  // Height helpers — fullscreen on mobile fills the flex overlay container
  const panelH = mobileFullscreen ? '100%' : (isBlurred ? '600px' : '520px');
  const scrollerH = mobileFullscreen ? undefined : (isBlurred ? '580px' : '520px');

  if (loading) {
    return (
      <Paper 
        className="glass-panel" 
        sx={{ 
          height: panelH, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 2,
          p: 4
        }}
      >
        <CircularProgress size={48} sx={{ color: '#38bdf8' }} />
        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Fetching & aligning lyrics and translations...
        </Typography>
      </Paper>
    );
  }

  // Render Custom Lyrics Editor
  if (isEditing) {
    return (
      <CustomLyricsEditor
        initialOrigInput={lyrics.map(l => l.text).join('\n')}
        initialTransInput={lyrics.map(l => l.translation).join('\n')}
        videoDuration={videoDuration}
        isBlurred={isBlurred}
        mobileFullscreen={mobileFullscreen}
        onApply={(aligned) => {
          onCustomLyricsLoad(aligned);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // Render empty state
  if (lyrics.length === 0) {
    return (
      <Paper 
        className="glass-panel" 
        sx={{ 
          height: panelH, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 2.5,
          p: 4,
          textAlign: 'center'
        }}
      >
        <SubtitlesIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Box>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, mb: 1 }}>
            No Captions Loaded
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, mx: 'auto', mb: 2 }}>
            We couldn't automatically load subtitle tracks from YouTube servers for this video. You can easily import your own lyrics!
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => {
            setIsEditing(true);
          }}
          sx={{ fontWeight: 600 }}
        >
          Paste Custom Lyrics
        </Button>
      </Paper>
    );
  }

  return (
    <Box className={mobileFullscreen ? 'lyrics-panel-fullscreen' : ''} sx={{ width: '100%' }}>
      {/* Panel Headers */}
      <Stack 
        direction="row" 
        sx={{ 
          justifyContent: 'space-between',
          mb: 1.5, 
          px: 2
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SubtitlesIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Original lyrics ({targetLanguageName})
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => setAutoScroll(!autoScroll)}
            sx={{ 
              color: autoScroll ? '#38bdf8' : 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              padding: '2px 8px',
              border: '1px solid',
              borderColor: autoScroll ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              borderRadius: '4px',
              '&:hover': {
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                borderColor: 'rgba(56, 189, 248, 0.35)'
              }
            }}
          >
            {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
          </Button>

          <Button 
            size="small" 
            variant="text" 
            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
            onClick={() => {
              setIsEditing(true);
            }}
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              padding: '2px 8px',
              '&:hover': {
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.05)'
              }
            }}
          >
            Edit/Paste Lyrics
          </Button>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mr: 4, display: isBlurred ? 'flex' : 'none' }}>
            <TranslateIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              English Translation
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* Lyrics Scroller */}
      <div 
        ref={containerRef} 
        className={`lyrics-container ${!isBlurred ? 'stacked-lyrics' : ''}`}
        style={{ 
          height: scrollerH,
          padding: mobileFullscreen ? '16px 12px' : (isBlurred ? '32px' : '20px'),
          transition: 'all 0.4s ease'
        }}
      >
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          
          return (
            <div
              key={index}
              ref={(el) => { lineRefs.current[index] = el; }}
              className={`lyrics-line ${isActive ? 'active' : ''}`}
              onClick={() => onLineClick(line.startTime)}
              style={{
                padding: isBlurred ? '20px 24px' : '12px 16px',
              }}
            >
              {/* Original Language Column */}
              <div 
                className="lyrics-column original-text"
                style={{ 
                  fontSize: isBlurred ? '1.35rem' : '1.05rem',
                  lineHeight: 1.5 
                }}
              >
                {line.text}
              </div>

              {/* Translation Column — always visible */}
              <div 
                className="lyrics-column translation-text"
                style={{ 
                  fontSize: isBlurred ? '1.25rem' : '0.95rem',
                  lineHeight: 1.5,
                }}
              >
                {line.translation}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Click instructions */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block', 
          color: 'text.disabled', 
          mt: 1.5, 
          textAlign: 'center', 
          fontWeight: 500 
        }}
      >
        💡 Click on any lyric line to jump the video to that segment.
      </Typography>
    </Box>
  );
};
