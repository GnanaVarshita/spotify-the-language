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
import { fetchSubtitleTracks, fetchSubtitleContent, cleanSongInfo, fetchLyricsFromOvh, fetchLyricsFromLrclib } from './utils/pipedApi';
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
  };

  const handleSelectSearchVideo = (video: PipedVideoResult) => {
    if (activeSong) {
      // Swapping the video source for the currently playing curated song (keeps high-fidelity lyrics!)
      setAlternativeVideoId(video.videoId);
      setHasPlayerError(false);
      setShowAltSearch(false);
    } else {
      // Standard search: play search video
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
    }
  };

  const handleVideoIdResolved = (videoId: string, title: string, artist: string) => {
    if (videoId && videoId !== alternativeVideoId && videoId !== activeVideo?.videoId) {
      if (activeSong) {
        setAlternativeVideoId(videoId);
      } else {
        setAlternativeVideoId(null);
        setActiveVideo({
          videoId,
          title: activeVideo?.title && !activeVideo.videoId.startsWith('search:') ? activeVideo.title : title,
          artist: activeVideo?.artist && !activeVideo.videoId.startsWith('search:') ? activeVideo.artist : artist,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: 0
        });
      }
      setHasPlayerError(false);
    }
  };

  const handleBackToLibrary = () => {
    setActiveSong(null);
    setActiveVideo(null);
    setAlternativeVideoId(null);
    setHasPlayerError(false);
    setShowAltSearch(false);
    setIsBlurred(false);
    setLyrics([]);
    setRawLyricsText(null);
    setVideoDuration(0);
  };


  // Load subtitles from Piped API when a searched YouTube video is selected
  useEffect(() => {
    if (!activeVideo) return;

    const loadBackupLyrics = async (): Promise<boolean> => {
      try {
        const cleaned = cleanSongInfo(activeVideo.title, activeVideo.artist);
        
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
          setRawLyricsText(null); // Synced lyrics already have timestamps, no need to redistribute
        } else {
          setRawLyricsText(plainLyrics);
          const dur = videoDuration || activeVideo.duration || 180;
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
        const tracks = await fetchSubtitleTracks(activeVideo.videoId);
        
        if (tracks.length === 0) {
          const lyricsFound = await loadBackupLyrics();
          if (!lyricsFound) {
            setLyrics([]);
          }
          setLyricsLoading(false);
          return;
        }

        // Find primary non-English track (target language to learn)
        // If not found, fall back to first track
        let originalTrack = tracks.find(t => t.code !== 'en' && !t.code.startsWith('en'));
        if (!originalTrack) {
          originalTrack = tracks[0];
        }

        setTargetLanguageName(originalTrack.name || 'Original Language');

        // Look for English translation track
        const englishTrack = tracks.find(t => t.code === 'en' || t.code.startsWith('en'));

        // Fetch original subtitles
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

        // If English track is available, align them
        if (englishTrack && englishTrack.url !== originalTrack.url) {
          const englishVttText = await fetchSubtitleContent(englishTrack.url);
          const englishCues = parseSubtitles(englishVttText);

          // Align English captions with original captions by overlapping timestamps
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

          // Check if we need to translate missing lines
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
          // No English track: Translate the original cues line-by-line using MyMemory API
          // Translate in batches of 5 to avoid heavy rate limits
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
              await new Promise(r => setTimeout(r, 200)); // 200ms delay between batches
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
  }, [activeVideo]);

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
  const currentTitle = activeSong?.title || activeVideo?.title || '';
  const currentArtist = activeSong?.artist || activeVideo?.artist || '';

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
