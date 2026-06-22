import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Box, Button, Alert } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { PlayerControls } from './player/PlayerControls';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface VideoPlayerProps {
  videoId: string;
  isBlurred: boolean;
  onBlurToggle: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlaybackStateChange: (isPlaying: boolean) => void;
  onPlayerError?: (errorCode: number) => void;
  onVideoIdResolved?: (videoId: string, title: string, artist: string) => void;
}

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  setSpeed: (rate: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  videoId,
  isBlurred,
  onBlurToggle,
  onTimeUpdate,
  onDurationChange,
  onPlaybackStateChange,
  onPlayerError,
  onVideoIdResolved
}, ref) => {
  const playerRef = useRef<any>(null);
  const containerId = `yt-player-${videoId}`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
        onTimeUpdate(seconds);
      }
    },
    setSpeed: (rate: number) => {
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(rate);
        setSpeed(rate);
      }
    }
  }));

  // Load YouTube API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize player when videoId or window.YT is ready
  useEffect(() => {
    let checkInterval: any;
    setInternalError(null); // Clear errors on video change

    const initPlayer = () => {
      // If player already exists, destroy it first
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error(e);
        }
        playerRef.current = null;
      }

      const isSearchQuery = videoId.startsWith('search:');
      const playerConfig: any = {
        playerVars: {
          autoplay: 1,
          controls: 0, // Hide native controls for clean blurred theme integration
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            const duration = event.target.getDuration();
            setDuration(duration);
            onDurationChange(duration);
            event.target.playVideo();
            
            // Set initial parameters
            event.target.setVolume(volume);
            event.target.setPlaybackRate(speed);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            const state = event.data;
            const playing = state === 1;
            setIsPlaying(playing);
            onPlaybackStateChange(playing);
            
            if (state === 0) {
              setCurrentTime(0);
            }

            // Resolve playing video details on play
            if (playing && onVideoIdResolved) {
              try {
                const player = event.target;
                let resolvedId = '';
                let resolvedTitle = '';
                let resolvedAuthor = '';
                
                if (player.getVideoData && player.getVideoData()) {
                  const data = player.getVideoData();
                  resolvedId = data.video_id;
                  resolvedTitle = data.title;
                  resolvedAuthor = data.author;
                }
                
                if (!resolvedId && player.getVideoUrl && player.getVideoUrl()) {
                  const url = player.getVideoUrl();
                  const match = url.match(/[?&]v=([^&#]*)/);
                  if (match) resolvedId = match[1];
                }
                
                if (resolvedId && !resolvedId.startsWith('search:')) {
                  onVideoIdResolved(resolvedId, resolvedTitle || 'Loaded Video', resolvedAuthor || 'YouTube Uploader');
                }
              } catch (e) {
                console.error('Error resolving playing video ID:', e);
              }
            }
          },
          onError: (event: any) => {
            const errCode = event.data;
            console.error('YouTube player error:', errCode);
            
            let message = 'An error occurred loading the YouTube video.';
            if (errCode === 101 || errCode === 150) {
              message = 'This video has embedding disabled by its owner (playback blocked on external sites).';
            } else if (errCode === 2) {
              message = 'The video ID is invalid.';
            } else if (errCode === 100) {
              message = 'The video requested was not found or has been removed.';
            }
            
            setInternalError(message);
            if (onPlayerError) {
              onPlayerError(errCode);
            }
          }
        }
      };

      if (isSearchQuery) {
        playerConfig.playerVars.listType = 'search';
        playerConfig.playerVars.list = videoId.substring(7);
      } else {
        playerConfig.videoId = videoId;
      }

      playerRef.current = new window.YT.Player(containerId, playerConfig);
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Fallback polling until YT script loads
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer();
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore destroy errors
        }
      }
    };
  }, [videoId]);

  // Playback timer update loop
  useEffect(() => {
    let intervalId: any;
    if (isPlaying && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      intervalId = setInterval(() => {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate(time);
      }, 150);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, onTimeUpdate]);

  // Controls Handlers
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const val = newValue as number;
    setVolume(val);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(val);
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
      if (playerRef.current && typeof playerRef.current.unMute === 'function') {
        playerRef.current.unMute();
      }
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(newSpeed);
      setSpeed(newSpeed);
    }
  };

  const handleSeekChange = (_event: any, newValue: number | number[]) => {
    const time = newValue as number;
    setCurrentTime(time);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(time, true);
    }
    onTimeUpdate(time);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Playback Error Warning Banner */}
      {internalError && (
        <Alert 
          severity="warning" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              href={`https://www.youtube.com/watch?v=${videoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            >
              Watch on YT
            </Button>
          }
          sx={{ mb: 2, backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}
        >
          {internalError}
        </Alert>
      )}

      {/* Video Frame */}
      <Box className={`video-wrapper ${isBlurred ? 'blurred' : ''}`} sx={{ mb: 2 }}>
        <div 
          id={containerId} 
          style={{ width: '100%', height: '100%', pointerEvents: isBlurred ? 'none' : 'auto' }} 
        />
      </Box>

      {/* Control Dashboard Panel */}
      <PlayerControls
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        speed={speed}
        isBlurred={isBlurred}
        onSeekChange={handleSeekChange}
        onPlayPause={handlePlayPause}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onSpeedChange={handleSpeedChange}
        onBlurToggle={onBlurToggle}
      />
    </Box>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
