/**
 * Fetches lyrics from lyrics.ovh API.
 */
export async function fetchLyricsFromOvh(artist: string, title: string): Promise<string> {
  if (!artist || !title) return '';
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`lyrics.ovh returned status ${response.status}`);
    }
    const data = await response.json();
    return data.lyrics || '';
  } catch (err) {
    console.warn(`Failed to fetch lyrics from lyrics.ovh for artist: "${artist}", title: "${title}":`, err);
    return '';
  }
}
