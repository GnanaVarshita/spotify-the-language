import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import SparklesIcon from '@mui/icons-material/AutoAwesome';

export const HeroCard: React.FC = () => {
  return (
    <Paper 
      className="hero-gradient-card"
      sx={{ 
        p: { xs: 4, md: 6 }, 
        borderRadius: 4, 
        mb: 6,
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
        <SparklesIcon sx={{ color: '#38bdf8' }} />
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: '#38bdf8', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em' 
          }}
        >
          Interactive Language Learning
        </Typography>
      </Stack>
      <Typography 
        variant="h3" 
        sx={{ 
          fontWeight: 800, 
          fontFamily: 'Outfit', 
          mb: 2,
          letterSpacing: '-0.03em',
          fontSize: { xs: '2rem', md: '3rem' }
        }}
      >
        Learn Languages easily by Songs
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.secondary', 
          maxWidth: 600,
          lineHeight: 1.6,
          fontSize: '1.1rem'
        }}
      >
        Search for your favorite music videos or pick a curated song below. View synchronized lyrics and translations side-by-side. Turn on <strong>Lyrics Mode</strong> to blur the video and fully immerse yourself in vocabulary!
      </Typography>
    </Paper>
  );
};
