import React from 'react';
import { Box, Grid, Card, CardContent, CardMedia, Typography, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { PipedVideoResult } from '../../utils/pipedApi';

interface SearchResultGridProps {
  loading: boolean;
  searched: boolean;
  results: PipedVideoResult[];
  errorMsg: string | null;
  onSelectVideo: (video: PipedVideoResult) => void;
  youtubeApiKey: string;
}

export const SearchResultGrid: React.FC<SearchResultGridProps> = ({
  loading,
  searched,
  results,
  errorMsg,
  onSelectVideo,
  youtubeApiKey
}) => {
  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card sx={{ height: '100%' }}>
              <Box className="shimmer-loading" sx={{ pt: '56.25%' }} />
              <CardContent>
                <Box className="shimmer-loading" sx={{ height: 16, width: '80%', mb: 1, borderRadius: 1 }} />
                <Box className="shimmer-loading" sx={{ height: 12, width: '50%', borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (searched && results.length === 0 && !errorMsg) {
    return (
      <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', my: 4 }}>
        No videos found. Try a different query or click Instant Play!
      </Typography>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <MusicNoteIcon sx={{ color: '#38bdf8' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Outfit' }}>
          Search Results {youtubeApiKey && '(via Google API)'}
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {results.map((video) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={video.videoId}>
            <Card 
              onClick={() => onSelectVideo(video)}
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                '&:hover .play-overlay': {
                  opacity: 1
                }
              }}
            >
              <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  image={video.thumbnailUrl}
                  alt={video.title}
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Play Overlay */}
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
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <IconButton 
                    sx={{ 
                      backgroundColor: '#38bdf8', 
                      color: '#09090b',
                      '&:hover': {
                        backgroundColor: '#7dd3fc',
                      }
                    }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </Box>

                {/* Duration Label */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8, 
                    backgroundColor: 'rgba(9, 9, 11, 0.85)', 
                    color: '#f4f4f5', 
                    px: 1, 
                    py: 0.25, 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {formatDuration(video.duration)}
                </Box>
              </Box>

              <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 700, 
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 0.5
                    }}
                  >
                    {video.title}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {video.artist}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
