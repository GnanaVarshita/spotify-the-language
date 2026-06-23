import { useState, useRef, useEffect } from 'react';
import { Container, Grid, Box, Typography, Button, Paper, Breadcrumbs, Link, Alert, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import SearchIcon from '@mui/icons-material/Search';
import BlurOffIcon from '@mui/icons-material/BlurOff';

import { Header } from './components/Header';
import { SongSelector } from './components/SongSelector';
import { SearchBar } from './components/SearchBar';
import { VideoPlayer } from './components/VideoPlayer';
import type { VideoPlayerRef } from './components/VideoPlayer';
import { LyricsPanel } from './components/LyricsPanel';
import type { LyricsLine } from './components/LyricsPanel';
import { HeroCard } from './components/app/HeroCard';

import { curatedSongs } from './utils/curatedSongs';
import type { CuratedSong } from './utils/curatedSongs';
import { fetchSubtitleTracks, fetchSubtitleContent, cleanSongInfo, fetchLyricsFromOvh, fetchLyricsFromLrclib, getRecommendations, getYoutubeRecommendations } from './utils/pipedApi';
import type { PipedVideoResult } from './utils/pipedApi';
import { parseSubtitles, distributePlainTextLyrics, parseLRC } from './utils/vttParser';
import type { SubtitleCue } from './utils/vttParser';
import { translateText } from './utils/translator';

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSong, setActiveSong] = useState<CuratedSong | null>(null);
  const [activeVideo, setActiveVideo] = useState<PipedVideoResult | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [targetLanguageName, setTargetLanguageName] = useState('Target Language');
  
  // Tracks plain-text lyrics from lyrics.ovh to allow duration scaling
  const [rawLyricsText, setRawLyricsText] = useState<string | null>(null);

  // API fallbacks and self-healing video states
  const [alternativeVideoId, setAlternativeVideoId] = useState<string | null>(null);
  const [hasPlayerError, setHasPlayerError] = useState(false);
  const [showAltSearch, setShowAltSearch] = useState(false);

  // Persistent search states to remember state on Back to Library
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PipedVideoResult[]>([]);
  const [searchSearched, setSearchSearched] = useState(false);
  const [searchErrorMsg, setSearchErrorMsg] = useState<string | null>(null);

  // Load YouTube Data API Key from LocalStorage
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>(
    () => localStorage.getItem('yt_api_key') || ''
  );

  // Active playing track details resolved from YT player (for subtitle and recommendations lookup)
  const [resolvedVideoTrack, setResolvedVideoTrack] = useState<{ videoId: string; title: string; artist: string; duration?: number } | null>(null);
  
  // Recommendations and Autoplay Queue
  const [recommendations, setRecommendations] = useState<PipedVideoResult[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [playbackQueue, setPlaybackQueue] = useState<PipedVideoResult[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);

  // Recently Played History
  const [recentlyPlayed, setRecentlyPlayed] = useState<PipedVideoResult[]>(() => {
    try {
      const saved = localStorage.getItem('recently_played');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load recently played history:', e);
      return [];
    }
  });

  const playerRef = useRef<VideoPlayerRef>(null);

  const handleApiKeyChange = (key: string) => {
    setYoutubeApiKey(key);
    if (key) {
      localStorage.setItem('yt_api_key', key);
    } else {
      localStorage.removeItem('yt_api_key');
    }
  };

  // Synchronize playback seek with clicking a lyrics line
  const handleLineClick = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  const handleSelectCuratedSong = (song: CuratedSong) => {
    setActiveVideo(null);
    setActiveSong(song);
    setAlternativeVideoId(null);
    setHasPlayerError(false);
    setShowAltSearch(false);
    setIsBlurred(false);
    setCurrentTime(0);
    setVideoDuration(0);
    setLyrics(song.lyrics);
    setRawLyricsText(null); // Curated songs are pre-synchronized
    setTargetLanguageName(song.languageName);

    // Mapped curated songs list for autoplay queue
    const mapped = curatedSongs.map(s => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnailUrl: `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`,
      duration: 0
    }));
    setPlaybackQueue(mapped);
    const idx = mapped.findIndex(item => item.videoId === song.videoId);
    setCurrentQueueIndex(idx);
    
    setResolvedVideoTrack({ videoId: song.videoId, title: song.title, artist: song.artist });
    setRecommendations([]);
  };

  const handleSelectSearchVideo = (video: PipedVideoResult) => {
    if (activeSong) {
      // Swapping the video source for the currently playing curated song (keeps high-fidelity lyrics!)
      setAlternativeVideoId(video.videoId);
      setHasPlayerError(false);
      setShowAltSearch(false);
      setResolvedVideoTrack({ videoId: video.videoId, title: activeSong.title, artist: activeSong.artist });
    } else {
      // Standard search: play search video or playlist
      setActiveSong(null);
      setActiveVideo(video);
      setAlternativeVideoId(null);
      setHasPlayerError(false);
      setShowAltSearch(false);
      setIsBlurred(false);
      setCurrentTime(0);
      setVideoDuration(0);
      setLyrics([]);
      setRawLyricsText(null); // Reset for new video load
      setTargetLanguageName('Original Language');

      if (video.isPlaylist) {
        setPlaybackQueue([]);
        setCurrentQueueIndex(-1);
        setResolvedVideoTrack(null); // Resolves dynamically when player starts playing
      } else {
        setPlaybackQueue(searchResults);
        const idx = searchResults.findIndex(item => item.videoId === video.videoId);
        setCurrentQueueIndex(idx !== -1 ? idx : 0);
        setResolvedVideoTrack({ videoId: video.videoId, title: video.title, artist: video.artist, duration: video.duration });
      }
      setRecommendations([]);
    }
  };

  const handleVideoIdResolved = (videoId: string, title: string, artist: string) => {
    const isCurated = !!activeSong;
    if (videoId && videoId !== resolvedVideoTrack?.videoId) {
      setResolvedVideoTrack({
        videoId,
        title: isCurated ? (activeSong?.title || title) : title,
        artist: isCurated ? (activeSong?.artist || artist) : artist
      });
      setHasPlayerError(false);
    }
  };

  const handleBackToLibrary = () => {
    setActiveSong(null);
    setActiveVideo(null);
    setResolvedVideoTrack(null);
    setRecommendations([]);
    setPlaybackQueue([]);
    setCurrentQueueIndex(-1);
    setAlternativeVideoId(null);
    setHasPlayerError(false);
    setShowAltSearch(false);
    setIsBlurred(false);
    setLyrics([]);
    setRawLyricsText(null);
    setVideoDuration(0);
  };

  const handleVideoEnded = () => {
    if (!autoplayEnabled) return;
    
    // YouTube player advances playlists automatically, so we don't interfere
    if (activeVideo?.isPlaylist) {
      console.log('Playlist track ended. YouTube player auto-advances.');
      return;
    }
    
    if (playbackQueue.length > 0 && currentQueueIndex < playbackQueue.length - 1) {
      const nextIndex = currentQueueIndex + 1;
      const nextVideo = playbackQueue[nextIndex];
      setCurrentQueueIndex(nextIndex);
      
      if (activeSong) {
        const matchingCurated = curatedSongs.find(s => s.videoId === nextVideo.videoId);
        if (matchingCurated) {
          handleSelectCuratedSong(matchingCurated);
        }
      } else {
        handleSelectSearchVideo(nextVideo);
      }
    } else if (recommendations.length > 0) {
      const topRec = recommendations[0];
      handleSelectSearchVideo(topRec);
    }
  };

  // Load subtitles from API when a resolved video track changes (skipping curated songs)
  useEffect(() => {
    if (!resolvedVideoTrack || activeSong) return;

    const loadBackupLyrics = async (): Promise<boolean> => {
      try {
        const cleaned = cleanSongInfo(resolvedVideoTrack.title, resolvedVideoTrack.artist);
        
        let lyricsSource = '';
        let plainLyrics = '';
        let plainCues: SubtitleCue[] = [];
        let isSynced = false;

        // 1. Try LRCLIB first
        console.log(`Fallback: Querying LRCLIB for artist: "${cleaned.artist}", title: "${cleaned.title}"`);
        const lrclibData = await fetchLyricsFromLrclib(cleaned.artist, cleaned.title);
        if (lrclibData) {
          if (lrclibData.syncedLyrics) {
            plainCues = parseLRC(lrclibData.syncedLyrics);
            if (plainCues.length > 0) {
              isSynced = true;
              lyricsSource = 'LRCLIB (Synced)';
              console.log('Fallback: Found pre-synchronized lyrics on LRCLIB!');
            }
          }
          if (!isSynced && lrclibData.plainLyrics) {
            plainLyrics = lrclibData.plainLyrics;
            lyricsSource = 'LRCLIB (Plain)';
            console.log('Fallback: Found plain lyrics on LRCLIB!');
          }
        }

        // 2. Try lyrics.ovh as a secondary fallback
        if (!isSynced && !plainLyrics) {
          console.log(`Fallback: Querying lyrics.ovh for artist: "${cleaned.artist}", title: "${cleaned.title}"`);
          const ovhLyrics = await fetchLyricsFromOvh(cleaned.artist, cleaned.title);
          if (ovhLyrics) {
            plainLyrics = ovhLyrics;
            lyricsSource = 'lyrics.ovh';
            console.log('Fallback: Found plain lyrics on lyrics.ovh!');
          }
        }

        if (!isSynced && !plainLyrics) {
          console.warn('Fallback: No lyrics returned from either LRCLIB or lyrics.ovh.');
          return false;
        }

        setTargetLanguageName(`Original (${lyricsSource})`);

        if (isSynced) {
          setRawLyricsText(null);
        } else {
          setRawLyricsText(plainLyrics);
          const dur = videoDuration || resolvedVideoTrack.duration || 180;
          plainCues = distributePlainTextLyrics(plainLyrics, dur);
        }

        if (plainCues.length === 0) {
          return false;
        }

        // Translate line-by-line in chunks of 5 using MyMemory API with auto-detect
        const translatedLines: LyricsLine[] = [];
        const chunkSize = 5;

        for (let i = 0; i < plainCues.length; i += chunkSize) {
          const chunk = plainCues.slice(i, i + chunkSize);
          const chunkPromises = chunk.map(async cue => {
            try {
              const trans = await translateText(cue.text, 'Autodetect', 'en');
              return {
                startTime: cue.startTime,
                endTime: cue.endTime,
                text: cue.text,
                translation: trans
              };
            } catch (e) {
              return {
                startTime: cue.startTime,
                endTime: cue.endTime,
                text: cue.text,
                translation: ''
              };
            }
          });

          const resolved = await Promise.all(chunkPromises);
          translatedLines.push(...resolved);

          if (i + chunkSize < plainCues.length) {
            await new Promise(r => setTimeout(r, 100)); // 100ms delay between batches
          }
        }

        setLyrics(translatedLines);
        return true;
      } catch (e) {
        console.error('Failed fetching backup lyrics:', e);
        return false;
      }
    };

    const loadSubtitles = async () => {
      setLyricsLoading(true);
      try {
        const tracks = await fetchSubtitleTracks(resolvedVideoTrack.videoId);
        
        if (tracks.length === 0) {
          const lyricsFound = await loadBackupLyrics();
          if (!lyricsFound) {
            setLyrics([]);
          }
          setLyricsLoading(false);
          return;
        }

        // Find primary non-English track
        let originalTrack = tracks.find(t => t.code !== 'en' && !t.code.startsWith('en'));
        if (!originalTrack) {
          originalTrack = tracks[0];
        }

        setTargetLanguageName(originalTrack.name || 'Original Language');

        const englishTrack = tracks.find(t => t.code === 'en' || t.code.startsWith('en'));

        const originalVttText = await fetchSubtitleContent(originalTrack.url);
        const originalCues = parseSubtitles(originalVttText);

        if (originalCues.length === 0) {
          const lyricsFound = await loadBackupLyrics();
          if (!lyricsFound) {
            setLyrics([]);
          }
          setLyricsLoading(false);
          return;
        }

        if (englishTrack && englishTrack.url !== originalTrack.url) {
          const englishVttText = await fetchSubtitleContent(englishTrack.url);
          const englishCues = parseSubtitles(englishVttText);

          const aligned = originalCues.map(orig => {
            const match = englishCues.find(eng => {
              const overlap = Math.min(orig.endTime, eng.endTime) - Math.max(orig.startTime, eng.startTime);
              return overlap > 0.1 || Math.abs(orig.startTime - eng.startTime) < 1.0;
            });
            return {
              startTime: orig.startTime,
              endTime: orig.endTime,
              text: orig.text,
              translation: match ? match.text : ''
            };
          });

          const filled = await Promise.all(
            aligned.map(async line => {
              if (!line.translation) {
                const trans = await translateText(line.text, originalTrack!.code, 'en');
                return { ...line, translation: trans };
              }
              return line;
            })
          );

          setLyrics(filled);
        } else {
          const translatedLines: LyricsLine[] = [];
          const chunkSize = 5;
          const fromCode = originalTrack.code;

          for (let i = 0; i < originalCues.length; i += chunkSize) {
            const chunk = originalCues.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async cue => {
              try {
                const trans = await translateText(cue.text, fromCode, 'en');
                return {
                  startTime: cue.startTime,
                  endTime: cue.endTime,
                  text: cue.text,
                  translation: trans
                };
              } catch (e) {
                return {
                  startTime: cue.startTime,
                  endTime: cue.endTime,
                  text: cue.text,
                  translation: ''
                };
              }
            });

            const resolved = await Promise.all(chunkPromises);
            translatedLines.push(...resolved);

            if (i + chunkSize < originalCues.length) {
              await new Promise(r => setTimeout(r, 200));
            }
          }

          setLyrics(translatedLines);
        }
      } catch (err) {
        console.error('Failed loading captions, trying backup:', err);
        const lyricsFound = await loadBackupLyrics();
        if (!lyricsFound) {
          setLyrics([]);
        }
      } finally {
        setLyricsLoading(false);
      }
    };

    loadSubtitles();
  }, [resolvedVideoTrack]);

  // Load recommendations when active song/video changes
  useEffect(() => {
    const track = activeSong || resolvedVideoTrack;
    if (!track) {
      setRecommendations([]);
      return;
    }
    
    const fetchRecs = async () => {
      setRecommendationsLoading(true);
      try {
        let recs: PipedVideoResult[] = [];
        if (youtubeApiKey) {
          recs = await getYoutubeRecommendations(track.artist, track.videoId, youtubeApiKey);
        } else {
          recs = await getRecommendations(track.artist, track.videoId);
        }
        setRecommendations(recs);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };
    
    fetchRecs();
  }, [activeSong, resolvedVideoTrack, youtubeApiKey]);

  // Save playing tracks to Recently Played history
  useEffect(() => {
    if (!resolvedVideoTrack) return;
    
    const { videoId, title, artist } = resolvedVideoTrack;
    if (!videoId || !title || title === 'Custom YouTube Video' || title === 'Loaded Video') return;
    
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((item) => item.videoId !== videoId);
      
      const newTrack: PipedVideoResult = {
        videoId,
        title,
        artist: artist || 'Unknown Artist',
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: resolvedVideoTrack.duration || 0
      };
      
      const updated = [newTrack, ...filtered].slice(0, 8); // Keep last 8 played items
      
      try {
        localStorage.setItem('recently_played', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recently played history:', e);
      }
      
      return updated;
    });
  }, [resolvedVideoTrack]);

  // Redistribute plain-text backup lyrics if the actual video duration becomes available
  useEffect(() => {
    if (videoDuration > 0 && lyrics.length > 0 && rawLyricsText) {
      const lineDuration = videoDuration / lyrics.length;
      const updated = lyrics.map((line, index) => ({
        ...line,
        startTime: index * lineDuration,
        endTime: (index + 1) * lineDuration
      }));
      setLyrics(updated);
    }
  }, [videoDuration]);

  const currentVideoId = alternativeVideoId || activeSong?.videoId || activeVideo?.videoId || '';
  const currentTitle = activeSong?.title || resolvedVideoTrack?.title || activeVideo?.title || '';
  const currentArtist = activeSong?.artist || resolvedVideoTrack?.artist || activeVideo?.artist || '';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#09090b', pb: { xs: 4, md: 8 } }}>
      <Header 
        onBackToLibrary={handleBackToLibrary} 
        youtubeApiKey={youtubeApiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {/* Navigation Breadcrumbs / Back button */}
        {(activeSong || activeVideo) && (
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ color: 'text.secondary', mb: 1.5, '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}>
              <Link
                underline="hover"
                color="inherit"
                onClick={handleBackToLibrary}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}
              >
                <LibraryMusicIcon sx={{ fontSize: 16 }} />
                Library
              </Link>
              <Typography color="text.primary" sx={{ fontWeight: 600, maxWidth: { xs: '160px', md: 'none' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTitle}
              </Typography>
            </Breadcrumbs>

            <Button 
              variant="outlined" 
              onClick={handleBackToLibrary}
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              Back to Library
            </Button>
          </Box>
        )}

        {/* Dashboard: Curated Songs + Search */}
        {!activeSong && !activeVideo && (
          <Box>
            <HeroCard />

            {/* Song Library Selector */}
            <SongSelector 
              songs={curatedSongs} 
              onSelectSong={handleSelectCuratedSong} 
            />

            {/* Recently Played History Shelf */}
            {recentlyPlayed.length > 0 && (
              <Box sx={{ mt: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                  <Box sx={{ width: 4, height: 24, backgroundColor: '#38bdf8', borderRadius: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Recently Played
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {recentlyPlayed.map((video) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={video.videoId}>
                      <Paper
                        onClick={() => handleSelectSearchVideo(video)}
                        className="glass-panel"
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            borderColor: 'rgba(56, 189, 248, 0.35)',
                            backgroundColor: 'rgba(56, 189, 248, 0.03)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box
                          component="img"
                          src={video.thumbnailUrl}
                          alt={video.title}
                          sx={{
                            width: 64,
                            height: 48,
                            objectFit: 'cover',
                            borderRadius: 1,
                            flexShrink: 0
                          }}
                        />
                        <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              lineHeight: 1.25,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              mb: 0.25
                            }}
                          >
                            {video.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {video.artist}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Box sx={{ my: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} />

            {/* YouTube Video Search */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <Box sx={{ width: 4, height: 24, backgroundColor: '#38bdf8', borderRadius: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                  Search and Learn Any Video
                </Typography>
              </Box>
              <SearchBar 
                onSelectVideo={handleSelectSearchVideo} 
                youtubeApiKey={youtubeApiKey} 
                persistedQuery={searchQuery}
                onQueryChange={setSearchQuery}
                persistedResults={searchResults}
                onResultsChange={setSearchResults}
                persistedSearched={searchSearched}
                onSearchedChange={setSearchSearched}
                persistedErrorMsg={searchErrorMsg}
                onErrorMsgChange={setSearchErrorMsg}
              />
            </Box>
          </Box>
        )}

        {/* Video Player + Lyrics Interface */}
        {(activeSong || activeVideo) && (
          <Grid container spacing={{ xs: 2, md: 4 }} sx={{ alignItems: 'flex-start' }}>
            {/* Left side: Video details & Player */}
            <Grid size={{ xs: 12, md: isBlurred ? 4 : 7 }} sx={{ transition: 'all 0.4s ease' }}>
              <VideoPlayer
                ref={playerRef}
                videoId={currentVideoId}
                isBlurred={isBlurred}
                onBlurToggle={() => setIsBlurred(!isBlurred)}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setVideoDuration}
                onPlaybackStateChange={() => {}}
                onPlayerError={() => setHasPlayerError(true)}
                onVideoIdResolved={handleVideoIdResolved}
                onVideoEnded={handleVideoEnded}
              />
              
              <Box sx={{ mt: 2, px: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 750, fontFamily: 'Outfit', letterSpacing: '-0.01em', mb: 0.5, fontSize: { xs: '1.15rem', md: '1.5rem' } }}>
                  {currentTitle}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500, mb: 2, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                  {currentArtist} {alternativeVideoId && '(Alternative Upload playing)'}
                </Typography>

                {/* Self-healing warning if embedding is blocked */}
                {hasPlayerError && (
                  <Alert 
                    severity="warning" 
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => setShowAltSearch(!showAltSearch)}
                        sx={{ fontWeight: 600 }}
                      >
                        {showAltSearch ? "Hide Search" : "Find Alternative"}
                      </Button>
                    }
                    sx={{ mb: 2, border: '1px solid rgba(245, 158, 11, 0.2)', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}
                  >
                    ⚠️ <strong>Playback Blocked by YouTube:</strong> Music label copyright restrictions have disabled embedding for this specific video upload.
                  </Alert>
                )}

                {/* Voluntary swap version button */}
                {activeSong && !hasPlayerError && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<SearchIcon />}
                    onClick={() => setShowAltSearch(!showAltSearch)}
                    sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, mt: -1 }}
                  >
                    {showAltSearch ? "Hide search options" : "Video blocked/lagging? Find another version"}
                  </Button>
                )}

                {/* Inline Search Bar for Swapping Video Source while keeping Curated Lyrics */}
                {showAltSearch && (
                  <Paper 
                    className="glass-panel" 
                    sx={{ p: 2.5, mt: 2, border: '1px solid rgba(56, 189, 248, 0.2)', backgroundColor: 'rgba(56, 189, 248, 0.02)' }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#38bdf8' }}>
                      🔍 Search for another upload of "{currentTitle}"
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                      Search for a fan upload or lyric version (which typically allows embedding). The curated translation scroller will remain synced!
                    </Typography>
                    <SearchBar 
                      onSelectVideo={handleSelectSearchVideo} 
                      youtubeApiKey={youtubeApiKey} 
                    />
                  </Paper>
                )}

                {/* Playlist Queue / Recommendations Panel */}
                <Box sx={{ mt: 4, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', fontSize: '1.25rem', color: '#38bdf8' }}>
                      {activeVideo?.isPlaylist ? "Playlist Queue" : "Recommended Songs"}
                    </Typography>
                    
                    {!activeVideo?.isPlaylist && (
                      <Button
                        size="small"
                        onClick={() => setAutoplayEnabled(!autoplayEnabled)}
                        sx={{ 
                          textTransform: 'none', 
                          fontSize: '0.78rem', 
                          fontWeight: 600,
                          color: autoplayEnabled ? '#38bdf8' : 'text.secondary',
                          borderColor: autoplayEnabled ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.08)',
                          '&:hover': {
                            borderColor: '#38bdf8',
                            backgroundColor: 'rgba(56, 189, 248, 0.04)'
                          }
                        }}
                        variant="outlined"
                      >
                        {autoplayEnabled ? "Auto-play: ON" : "Auto-play: OFF"}
                      </Button>
                    )}
                  </Box>

                  {activeVideo?.isPlaylist ? (
                    <Paper className="glass-panel" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                      <Box sx={{ color: '#38bdf8', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>⚙️</Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                        Playing from Playlist. YouTube Player will automatically load and play the next song in the background. Bilingual lyrics scroller will update automatically.
                      </Typography>
                    </Paper>
                  ) : (
                    <Grid container spacing={2}>
                      {recommendationsLoading ? (
                        [1, 2, 3, 4].map((i) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={i}>
                            <Paper className="glass-panel" sx={{ p: 1.5, display: 'flex', gap: 1.5, height: 60, alignItems: 'center' }}>
                              <Box className="shimmer-loading" sx={{ width: 80, height: 45, borderRadius: 1 }} />
                              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box className="shimmer-loading" sx={{ height: 12, width: '80%', borderRadius: 1 }} />
                                <Box className="shimmer-loading" sx={{ height: 10, width: '40%', borderRadius: 1 }} />
                              </Box>
                            </Paper>
                          </Grid>
                        ))
                      ) : recommendations.length > 0 ? (
                        recommendations.map((rec) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={rec.videoId}>
                            <Paper 
                              className="glass-panel" 
                              onClick={() => handleSelectSearchVideo(rec)}
                              sx={{ 
                                p: 1.5, 
                                display: 'flex', 
                                gap: 1.5, 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                alignItems: 'center',
                                '&:hover': {
                                  borderColor: 'rgba(56, 189, 248, 0.3)',
                                  backgroundColor: 'rgba(56, 189, 248, 0.02)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <Box 
                                component="img" 
                                src={rec.thumbnailUrl} 
                                alt={rec.title}
                                sx={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 1 }}
                              />
                              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    fontWeight: 700, 
                                    fontSize: '0.82rem',
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    mb: 0.25
                                  }}
                                >
                                  {rec.title}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary', 
                                    display: 'block',
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis' 
                                  }}
                                >
                                  {rec.artist}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))
                      ) : (
                        <Grid size={12}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1, fontStyle: 'italic' }}>
                            No recommendations found for this artist.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Right side: Lyrics Highlight Scroller — hidden on mobile when fullscreen overlay is active */}
            {!(isMobile && isBlurred) && (
              <Grid size={{ xs: 12, md: isBlurred ? 8 : 5 }} sx={{ transition: 'all 0.4s ease' }}>
                <LyricsPanel
                  lyrics={lyrics}
                  currentTime={currentTime}
                  isBlurred={isBlurred}
                  loading={lyricsLoading}
                  onLineClick={handleLineClick}
                  targetLanguageName={targetLanguageName}
                  onCustomLyricsLoad={(newLyrics) => {
                    setRawLyricsText(null);
                    setLyrics(newLyrics);
                  }}
                  videoDuration={videoDuration}
                />
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {/* ─────────────────────────────────────────────────────
          Mobile Fullscreen Lyrics Overlay
          Activated when user taps "Lyrics" on a phone/tablet.
          The video keeps playing behind the overlay (audio on).
      ───────────────────────────────────────────────────── */}
      {isMobile && isBlurred && (activeSong || activeVideo) && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            backgroundColor: '#09090b',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mini header bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              backgroundColor: 'rgba(9, 9, 11, 0.97)',
              backdropFilter: 'blur(12px)',
              flexShrink: 0,
              gap: 1,
            }}
          >
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {currentTitle}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {currentArtist}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<BlurOffIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsBlurred(false)}
              sx={{
                borderColor: 'rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '0.75rem',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Exit Lyrics
            </Button>
          </Box>

          {/* Full-height lyrics panel */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LyricsPanel
              lyrics={lyrics}
              currentTime={currentTime}
              isBlurred={false}
              mobileFullscreen={true}
              loading={lyricsLoading}
              onLineClick={handleLineClick}
              targetLanguageName={targetLanguageName}
              onCustomLyricsLoad={(newLyrics) => {
                setRawLyricsText(null);
                setLyrics(newLyrics);
              }}
              videoDuration={videoDuration}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
