export interface SubtitleCue {
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

interface RawCue {
  startTime: number;
  endTime: number;
  text: string[];
}

/**
 * Parses WebVTT or SRT subtitle strings into an array of SubtitleCue objects.
 * Handles different timestamp structures (with/without hours, dots vs commas)
 * and strips HTML/formatting tags.
 */
export function parseSubtitles(subText: string): SubtitleCue[] {
  if (!subText) return [];

  const lines = subText.split(/\r?\n/);
  const cues: RawCue[] = [];
  let currentCue: RawCue | null = null;

  // Regex to match timestamps like:
  // 00:01:20.123 --> 00:01:23.456
  // 01:20.123 --> 01:23.456
  // 00:01:20,123 --> 00:01:23,456
  const timestampRegex = /(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

  function timeToSeconds(
    hoursStr: string | undefined,
    minsStr: string,
    secsStr: string,
    msStr: string
  ): number {
    const hours = parseInt(hoursStr || '0', 10);
    const minutes = parseInt(minsStr, 10);
    const seconds = parseInt(secsStr, 10);
    const ms = parseInt(msStr, 10);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = timestampRegex.exec(line);
    if (match) {
      const startTime = timeToSeconds(match[1], match[2], match[3], match[4]);
      const endTime = timeToSeconds(match[5], match[6], match[7], match[8]);
      currentCue = { startTime, endTime, text: [] };
      cues.push(currentCue);
    } else if (currentCue) {
      // Ignore headers, metadata, or simple line index numbers (common in SRT)
      if (
        line === 'WEBVTT' ||
        line.startsWith('NOTE') ||
        line.startsWith('Kind:') ||
        line.startsWith('Language:') ||
        /^\d+$/.test(line)
      ) {
        continue;
      }
      currentCue.text.push(line);
    }
  }

  // Post-process to join multiline subtitles and strip formatting tags
  return cues
    .map(cue => {
      const joinedText = cue.text
        .join(' ')
        .replace(/<[^>]*>/g, '') // Remove HTML tags like <b>, <i>
        .replace(/\{[^}]*\}/g, '') // Remove ASS style brackets if any
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();

      return {
        startTime: cue.startTime,
        endTime: cue.endTime,
        text: joinedText,
      };
    })
    .filter(cue => cue.text.length > 0);
}

/**
 * Parses LRC (Lyrics with timestamps) formatted text.
 * Format example: [01:23.45]Line of lyrics
 */
export function parseLRC(lrcText: string): SubtitleCue[] {
  if (!lrcText) return [];
  const lines = lrcText.split(/\r?\n/);
  const cues: SubtitleCue[] = [];
  
  // Matches [mm:ss.xx] or [mm:ss:xx] or [mm:ss]
  const lrcRegex = /^\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\](.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = lrcRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
      }
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      
      cues.push({
        startTime: time,
        endTime: time + 4, // default duration, adjusted below
        text
      });
    }
  }

  // Sort cues by start time just in case they are out of order
  cues.sort((a, b) => a.startTime - b.startTime);

  // Set the end time of each cue to the start time of the next cue
  for (let i = 0; i < cues.length - 1; i++) {
    cues[i].endTime = cues[i + 1].startTime;
  }

  return cues;
}

/**
 * Distributes plain text lyrics evenly across a specified video duration.
 */
export function distributePlainTextLyrics(text: string, duration: number): SubtitleCue[] {
  if (!text || !duration) return [];
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  const lineDuration = duration / lines.length;
  return lines.map((line, index) => ({
    startTime: index * lineDuration,
    endTime: (index + 1) * lineDuration,
    text: line
  }));
}
