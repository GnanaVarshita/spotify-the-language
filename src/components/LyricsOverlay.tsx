'use client';

import { useEffect, useRef } from 'react';
import { X, Frown } from 'lucide-react';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

interface LyricsData {
  original: TranscriptItem[];
  english: TranscriptItem[];
}

interface LyricsOverlayProps {
  lyrics: LyricsData | null;
  currentTime: number;
  error: string | null;
  onClose: () => void;
}

export default function LyricsOverlay({ lyrics, currentTime, error, onClose }: LyricsOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]);

  const findActiveIndex = (items: TranscriptItem[]) => {
    if (!items) return -1;
    // The offset is in milliseconds or seconds? youtube-transcript returns milliseconds divided by 1000 usually.
    // Let's assume seconds based on player.getCurrentTime()
    return items.findIndex(
      (item, index) => {
        const nextItem = items[index + 1];
        const nextOffset = nextItem ? nextItem.offset / 1000 : Infinity;
        return (currentTime >= item.offset / 1000) && (currentTime < nextOffset);
      }
    );
  };

  const activeIndex = lyrics ? findActiveIndex(lyrics.original) : -1;

  if (error) {
    return (
      <div className="absolute inset-0 z-40 bg-spanish-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="text-center max-w-md">
          <Frown className="w-16 h-16 text-spanish-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Lo Siento...</h2>
          <p className="text-spanish-200 text-lg mb-8 leading-relaxed">
            Subtitles are not available for this video. We need them to provide translations and sync the lyrics.
          </p>
          <button
            onClick={onClose}
            className="bg-spanish-600 hover:bg-spanish-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg"
          >
            Close Overlay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-spanish-950/80 backdrop-blur-xl flex flex-col animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-20" ref={scrollRef}>
        <div className="max-w-6xl mx-auto">
          {lyrics?.original.map((line, index) => {
            const isActive = index === activeIndex;
            const englishLine = lyrics.english[index]?.text || '';
            
            return (
              <div
                key={index}
                ref={isActive ? activeLineRef : null}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-8 transition-all duration-500 border-b border-white/5 ${
                  isActive ? 'opacity-100 scale-105' : 'opacity-30 scale-100'
                }`}
              >
                {/* Original Lyrics */}
                <div className="flex flex-col justify-center">
                  <p 
                    className={`text-2xl md:text-3xl lg:text-4xl font-bold leading-tight ${
                      isActive ? 'text-spanish-300' : 'text-white'
                    }`}
                    dangerouslySetInnerHTML={{ __html: line.text }}
                  />
                </div>

                {/* English Translation */}
                <div className="flex flex-col justify-center md:border-l md:border-white/10 md:pl-16">
                  <p 
                    className={`text-xl md:text-2xl lg:text-3xl font-medium italic leading-relaxed ${
                      isActive ? 'text-white/90' : 'text-white/60'
                    }`}
                    dangerouslySetInnerHTML={{ __html: englishLine }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Bottom padding for UI elements */}
      <div className="h-20 w-full" />
    </div>
  );
}
