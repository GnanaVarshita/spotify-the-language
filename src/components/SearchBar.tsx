import React, { useState } from 'react';
import { Box, TextField, InputAdornment, Button, CircularProgress, Alert, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { searchVideos } from '../utils/pipedApi';
import type { PipedVideoResult } from '../utils/pipedApi';
import { SearchResultGrid } from './search/SearchResultGrid';

interface SearchBarProps {
  onSelectVideo: (video: PipedVideoResult) => void;
  youtubeApiKey: string;
  persistedQuery?: string;
  onQueryChange?: (q: string) => void;
  persistedResults?: PipedVideoResult[];
  onResultsChange?: (res: PipedVideoResult[]) => void;
  persistedSearched?: boolean;
  onSearchedChange?: (s: boolean) => void;
  persistedErrorMsg?: string | null;
  onErrorMsgChange?: (err: string | null) => void;
}

// Utility to extract Video ID from YouTube links
export function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSelectVideo, 
  youtubeApiKey,
  persistedQuery,
  onQueryChange,
  persistedResults,
  onResultsChange,
  persistedSearched,
  onSearchedChange,
  persistedErrorMsg,
  onErrorMsgChange
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const [localResults, setLocalResults] = useState<PipedVideoResult[]>([]);
  const [localSearched, setLocalSearched] = useState(false);
  const [localErrorMsg, setLocalErrorMsg] = useState<string | null>(null);

  const query = persistedQuery !== undefined ? persistedQuery : localQuery;
  const setQuery = onQueryChange !== undefined ? onQueryChange : setLocalQuery;

  const results = persistedResults !== undefined ? persistedResults : localResults;
  const setResults = onResultsChange !== undefined ? onResultsChange : setLocalResults;

  const searched = persistedSearched !== undefined ? persistedSearched : localSearched;
  const setSearched = onSearchedChange !== undefined ? onSearchedChange : setLocalSearched;

  const errorMsg = persistedErrorMsg !== undefined ? persistedErrorMsg : localErrorMsg;
  const setErrorMsg = onErrorMsgChange !== undefined ? onErrorMsgChange : setLocalErrorMsg;

  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setErrorMsg(null);
    
    // Check if user pasted a direct YouTube Video Link or Video ID
    const extractedId = extractVideoId(trimmedQuery) || (trimmedQuery.length === 11 && !trimmedQuery.includes(' ') ? trimmedQuery : null);
    if (extractedId) {
      onSelectVideo({
        videoId: extractedId,
        title: 'Custom YouTube Video',
        artist: 'Pasted Link',
        thumbnailUrl: `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
        duration: 0
      });
      setQuery('');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      if (youtubeApiKey) {
        // Query via YouTube Data API (fetching both videos and playlists)
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(trimmedQuery)}&type=video,playlist&maxResults=12&key=${youtubeApiKey}`
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData?.error?.message || `YouTube API returned status ${response.status}`);
        }
        const data = await response.json();
        const items = data.items || [];
        const mappedResults = items.map((item: any) => {
          if (item.id.kind === 'youtube#playlist') {
            return {
              videoId: `playlist:${item.id.playlistId}`,
              title: item.snippet.title,
              artist: item.snippet.channelTitle || 'YouTube Playlist',
              thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
              duration: 0,
              isPlaylist: true,
              videoCount: 0
            };
          } else {
            return {
              videoId: item.id.videoId,
              title: item.snippet.title,
              artist: item.snippet.channelTitle,
              thumbnailUrl: item.snippet.thumbnails?.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
              duration: 0
            };
          }
        });
        setResults(mappedResults);
      } else {
        // Query via Invidious API
        const videoResults = await searchVideos(trimmedQuery);
        if (videoResults.length === 0) {
          setErrorMsg('All public search proxies are currently rate-limited. Click "Instant Play" below to play the song immediately!');
        }
        setResults(videoResults);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Search proxy failed. Click "Instant Play" below to search and load the video natively!');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantPlay = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    onSelectVideo({
      videoId: `search:${trimmedQuery}`,
      title: trimmedQuery,
      artist: 'Direct YouTube Playback',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
      duration: 0
    });
    setQuery('');
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Search Input Box */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a song title (e.g. 'Me gustas tu lyrics') or paste a YouTube link"
          variant="outlined"
          autoComplete="off"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#18181b',
            }
          }}
        />
        
        <Stack direction="row" spacing={2}>
          <Button 
            type="submit" 
            variant="outlined" 
            color="primary"
            disabled={loading || !query.trim()}
            sx={{ 
              flex: 1,
              height: '48px',
              fontSize: '0.95rem',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#38bdf8'
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#38bdf8' }} /> : 'Search Version Options'}
          </Button>

          <Button 
            variant="contained" 
            color="primary"
            onClick={handleInstantPlay}
            disabled={!query.trim()}
            startIcon={<FlashOnIcon />}
            sx={{ 
              flex: 1,
              height: '48px',
              fontSize: '0.95rem',
              boxShadow: 'none'
            }}
          >
            Instant Play (Always Works)
          </Button>
        </Stack>
      </Box>

      {/* Helpful Hint banner to bypass proxy CORS/rate issues */}
      <Alert 
        severity="info" 
        variant="outlined"
        sx={{ 
          mb: 3, 
          borderColor: 'rgba(56, 189, 248, 0.2)',
          color: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
          '& .MuiAlert-icon': {
            color: '#38bdf8'
          }
        }}
      >
        ⚡ <strong>Instant Play:</strong> Bypasses public search proxies entirely! YouTube's player will search and load the top matching video directly inside your browser.
      </Alert>

      {errorMsg && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            backgroundColor: 'rgba(239, 68, 68, 0.08)', 
            color: '#f87171', 
            border: '1px solid rgba(239, 68, 68, 0.2)' 
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleInstantPlay}
              sx={{ fontWeight: 700 }}
            >
              Play "{query}" Natively
            </Button>
          }
        >
          {errorMsg}
        </Alert>
      )}

      <SearchResultGrid
        loading={loading}
        searched={searched}
        results={results}
        errorMsg={errorMsg}
        onSelectVideo={onSelectVideo}
        youtubeApiKey={youtubeApiKey}
      />
    </Box>
  );
};
