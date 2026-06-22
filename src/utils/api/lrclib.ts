/**
 * Fetches lyrics from LRCLIB API.
 * Returns an object with syncedLyrics and/or plainLyrics if found, or null otherwise.
 */
export async function fetchLyricsFromLrclib(artist: string, title: string): Promise<{ syncedLyrics?: string; plainLyrics?: string } | null> {
  if (!artist || !title) return null;
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`lrclib.net returned status ${response.status}`);
    }
    const data = await response.json();
    return {
      syncedLyrics: data.syncedLyrics || undefined,
      plainLyrics: data.plainLyrics || undefined
    };
  } catch (err) {
    console.warn(`Failed to fetch lyrics from lrclib.net for artist: "${artist}", title: "${title}":`, err);
    return null;
  }
}
