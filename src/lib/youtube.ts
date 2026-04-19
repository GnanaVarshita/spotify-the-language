const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export async function searchVideos(query: string, language?: string): Promise<YouTubeVideo[]> {
  if (!API_KEY) {
    console.error('YouTube API Key is missing');
    return [];
  }

  const q = language ? `${query} in ${language} songs` : query;
  const url = `${BASE_URL}/search?part=snippet&maxResults=12&q=${encodeURIComponent(q)}&type=video&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
}

export async function getVideoDetails(videoId: string) {
  if (!API_KEY) return null;

  const url = `${BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}
