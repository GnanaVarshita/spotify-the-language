import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // 1. Fetch available transcript tracks first (to see what languages are available)
    // Note: The youtube-transcript library doesn't expose a 'list' method easily,
    // so we attempt to fetch the original and the auto-translated English one.
    
    // Attempt to fetch the primary/default transcript
    const originalTranscript = await YoutubeTranscript.fetchTranscript(videoId);

    // Attempt to fetch English translated transcript
    // The library doesn't directly support translation parameters in a documented way for all cases,
    // but it usually fetches the default. 
    // If the video isn't English, we want to try and get the English translation.
    
    // Workaround: We'll return the original transcript. 
    // For translation, since we want side-by-side, we ideally need the English version too.
    // If the library only gives us one, we might need to rely on the library's ability 
    // to specify language if supported, or a different scraper.
    
    // Let's try to fetch English specifically if possible.
    let englishTranscript = null;
    try {
      englishTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    } catch (e) {
      console.log('No English transcript found specifically, might be auto-generated or unavailable.');
    }

    return NextResponse.json({
      original: originalTranscript,
      english: englishTranscript || originalTranscript, // Fallback to original if English fails
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ error: 'No subtitles available for this video' }, { status: 404 });
  }
}
