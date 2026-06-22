import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Chip, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { CuratedSong } from '../utils/curatedSongs';

interface SongSelectorProps {
  songs: CuratedSong[];
  onSelectSong: (song: CuratedSong) => void;
  activeSongId?: string;
}

export const SongSelector: React.FC<SongSelectorProps> = ({ songs, onSelectSong, activeSongId }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'primary';
      case 'Hard':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'es':
        return '🇪🇸';
      case 'fr':
        return '🇫🇷';
      case 'de':
        return '🇩🇪';
      default:
        return '🌐';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <Box sx={{ width: 4, height: 24, backgroundColor: '#38bdf8', borderRadius: 2 }} />
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            fontFamily: 'Outfit',
            color: 'text.primary',
            letterSpacing: '-0.02em'
          }}
        >
          Curated Song Library
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
          (Pre-synchronized bilingual lyrics)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {songs.map((song) => {
          const isActive = song.id === activeSongId;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={song.id}>
              <Card 
                onClick={() => onSelectSong(song)}
                sx={{ 
                  cursor: 'pointer',
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                  borderWidth: isActive ? 2 : 1,
                  boxShadow: isActive ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                  '&:hover .play-overlay': {
                    opacity: 1
                  }
                }}
              >
                {/* Thumbnail */}
                <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={song.thumbnailUrl}
                    alt={song.title}
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  
                  {/* Play Overlay on Hover */}
                  <Box 
                    className="play-overlay"
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(9, 9, 11, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.25s ease',
                      zIndex: 2
                    }}
                  >
                    <IconButton 
                      sx={{ 
                        backgroundColor: '#38bdf8', 
                        color: '#09090b',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          backgroundColor: '#7dd3fc',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                  </Box>

                  {/* Language Indicator on Thumbnail */}
                  <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
                    <Chip
                      label={`${getLanguageFlag(song.language)} ${song.languageName}`}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(9, 9, 11, 0.75)', 
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </Box>
                </Box>

                {/* Card Content */}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {song.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        fontWeight: 500,
                        mb: 2 
                      }}
                    >
                      {song.artist}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={song.difficulty} 
                      size="small" 
                      color={getDifficultyColor(song.difficulty)}
                      sx={{ fontWeight: 600, borderRadius: '4px' }}
                    />
                    
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {song.lyrics.filter(l => l.text !== '(Intro)' && l.text !== '(Instrumental Intro)').length} lines
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
