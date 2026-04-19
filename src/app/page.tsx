'use client';

import { useState } from 'react';
import { Search, Music, Globe } from 'lucide-react';
import { searchVideos, YouTubeVideo } from '@/lib/youtube';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setSearched(true);
    const results = await searchVideos(query, language);
    setVideos(results);
    setLoading(false);
  };

  const languages = [
    { label: 'Any Language', value: '' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'French', value: 'French' },
    { label: 'German', value: 'German' },
    { label: 'Italian', value: 'Italian' },
    { label: 'Portuguese', value: 'Portuguese' },
    { label: 'Japanese', value: 'Japanese' },
    { label: 'Korean', value: 'Korean' },
  ];

  return (
    <main className="min-h-screen bg-spanish-50 dark:bg-spanish-950 flex flex-col items-center p-6 md:p-12">
      <div className="w-full max-w-4xl text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Music className="w-10 h-10 text-spanish-600" />
          <h1 className="text-4xl font-bold text-spanish-900 dark:text-spanish-100">Let&apos;s Spotify</h1>
        </div>
        <p className="text-lg text-spanish-700 dark:text-spanish-300">
          Learn a new language through the power of music.
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-2xl flex flex-col md:flex-row gap-3 mb-12">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-spanish-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a song or artist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-spanish-200 focus:border-spanish-500 outline-none bg-white dark:bg-spanish-900 transition-all text-spanish-900 dark:text-spanish-100"
          />
        </div>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-spanish-400 w-5 h-5" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="pl-10 pr-8 py-3 rounded-xl border-2 border-spanish-200 focus:border-spanish-500 outline-none bg-white dark:bg-spanish-900 transition-all appearance-none text-spanish-900 dark:text-spanish-100 cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-spanish-600 hover:bg-spanish-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-spanish-200"
        >
          Search
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spanish-600"></div>
        </div>
      )}

      {!loading && searched && videos.length === 0 && (
        <div className="text-center py-20 text-spanish-600">
          <p className="text-xl">No songs found. Try a different search term.</p>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {videos.map((video) => (
            <Link
              href={`/play/${video.id}`}
              key={video.id}
              className="group bg-white dark:bg-spanish-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-spanish-100 dark:border-spanish-800"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-all duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-spanish-900/0 group-hover:bg-spanish-900/20 transition-all flex items-center justify-center">
                  <div className="w-12 h-12 bg-spanish-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                    <Music className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-spanish-900 dark:text-spanish-100 line-clamp-2 leading-tight mb-1 group-hover:text-spanish-600 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-spanish-500 dark:text-spanish-400">
                  {video.channelTitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !searched && (
        <div className="mt-12 text-center text-spanish-400 max-w-lg">
          <p>
            Start by searching for your favorite artist or a song in the language you&apos;re learning.
            We&apos;ll handle the subtitles and translations for you.
          </p>
        </div>
      )}
    </main>
  );
}
