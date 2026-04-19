'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { ArrowLeft, Languages, Info } from 'lucide-react';
import LyricsOverlay from '@/components/LyricsOverlay';
import Link from 'next/link';

export default function PlayPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState<any>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLyrics() {
      try {
        const response = await fetch(`/api/lyrics?videoId=${id}`);
        if (!response.ok) {
          throw new Error('Lyrics not found');
        }
        const data = await response.json();
        setLyricsData(data);
      } catch (err) {
        setError('Subtitles are not available for this video. Please try another one.');
      } finally {
        setLoadingLyrics(false);
      }
    }

    if (id) fetchLyrics();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (player && !player.isMuted()) {
      interval = setInterval(() => {
        setCurrentTime(player.getCurrentTime());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [player]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <Link 
          href="/" 
          className="pointer-events-auto flex items-center gap-2 text-white hover:text-spanish-300 transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Search</span>
        </Link>
        
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            disabled={loadingLyrics || !!error}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
              showLyrics 
                ? 'bg-spanish-600 text-white' 
                : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Languages className="w-5 h-5" />
            {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className={`relative flex-1 transition-all duration-700 ${showLyrics ? 'scale-110' : 'scale-100'}`}>
        <YouTube
          videoId={id}
          opts={opts}
          onReady={onPlayerReady}
          className="w-full h-full"
        />
      </div>

      {/* Lyrics Overlay */}
      {showLyrics && (
        <LyricsOverlay 
          lyrics={lyricsData} 
          currentTime={currentTime} 
          error={error}
          onClose={() => setShowLyrics(false)}
        />
      )}

      {/* Info Message when loading or error */}
      {!showLyrics && (loadingLyrics || error) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/10">
          <Info className={`w-5 h-5 ${error ? 'text-red-400' : 'text-spanish-400 animate-pulse'}`} />
          <p className="text-sm font-medium">
            {loadingLyrics ? 'Analyzing video for subtitles...' : error}
          </p>
        </div>
      )}
    </div>
  );
}
