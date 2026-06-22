/**
 * Normalizes and cleans YouTube title and channel/artist name to extract a clean Artist and Song Title.
 */
export function cleanSongInfo(title: string, artist: string): { artist: string; title: string } {
  let cleanArtist = artist.trim();
  let cleanTitle = title.trim();

  // If the channel name looks like a generic YouTube channel, ignore it
  const genericChannels = ['vevo', 'lyrics', 'official', 'music', 'videos', 'records', 'tv', 'topic'];
  const artistLower = cleanArtist.toLowerCase();
  const isGenericChannel = genericChannels.some(gc => artistLower.includes(gc)) || cleanArtist.length > 25;

  // Check if title has a separator like "Artist - Title"
  const separators = [' - ', ' – ', ' — ', ' | ', ' : '];
  let foundSeparator = false;
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      cleanArtist = parts[0].trim();
      cleanTitle = parts[1].trim();
      foundSeparator = true;
      break;
    }
  }

  // If no separator and the channel name is generic, we try parsing by splitting on common patterns
  if (!foundSeparator && isGenericChannel) {
    const byMatch = title.match(/(.*?)\s+by\s+(.*)/i);
    if (byMatch) {
      cleanArtist = byMatch[2].trim();
      cleanTitle = byMatch[1].trim();
    }
  }

  // Clean brackets and parentheses: (Official Video), [Lyrics], etc.
  const cleanRegex = /\s*([[(])(official|music|video|audio|lyrics|lyric|hd|hq|original|remix|cover|with lyrics|karaoke|live|studio|subtitulado|subtitles|traduction|version|feat\.|ft\.).*?([\])])/gi;
  cleanTitle = cleanTitle.replace(cleanRegex, '').trim();
  cleanArtist = cleanArtist.replace(cleanRegex, '').trim();

  // Strip "feat." or "ft." or "featuring" and everything after it (even if not in brackets)
  const featRegex = /\s+(feat\.|ft\.|featuring)\s+.*/i;
  cleanTitle = cleanTitle.replace(featRegex, '').trim();
  cleanArtist = cleanArtist.replace(featRegex, '').trim();

  if (!foundSeparator) {
    // Strip trailing generic words
    cleanTitle = cleanTitle.replace(/\s+(Lyrics|Lyric Video|Official Video|Official Audio)$/i, '').trim();
  }

  // If there are multiple artists separated by comma, "and", "&", "x", take the first one
  const artistSeparators = [',', ' and ', ' & ', ' x '];
  for (const sep of artistSeparators) {
    if (cleanArtist.includes(sep)) {
      cleanArtist = cleanArtist.split(sep)[0].trim();
      break;
    }
  }

  return { artist: cleanArtist, title: cleanTitle };
}
