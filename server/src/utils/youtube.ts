import axios from 'axios';

export interface YouTubeVideoMetadata {
  title: string;
  thumbnailUrl: string;
  authorName?: string;
  authorUrl?: string;
  uploadDate?: string;
  viewCount?: number;
  viewCountFormatted?: string;
}

/**
 * Extracts YouTube Video ID from various URL formats (watch, youtu.be, shorts, embed, direct ID)
 */
export function parseYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // If already an 11-character alphanumeric/dash/underscore video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    // youtu.be/<id>
    if (parsedUrl.hostname === 'youtu.be') {
      const id = parsedUrl.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // youtube.com / m.youtube.com / music.youtube.com
    if (parsedUrl.hostname.includes('youtube.com')) {
      // /watch?v=<id>
      if (parsedUrl.pathname === '/watch') {
        const v = parsedUrl.searchParams.get('v');
        return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
      }

      // /shorts/<id>
      if (parsedUrl.pathname.startsWith('/shorts/')) {
        const id = parsedUrl.pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      // /embed/<id>
      if (parsedUrl.pathname.startsWith('/embed/')) {
        const id = parsedUrl.pathname.split('/embed/')[1]?.split('/')[0]?.split('?')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      // /live/<id>
      if (parsedUrl.pathname.startsWith('/live/')) {
        const id = parsedUrl.pathname.split('/live/')[1]?.split('/')[0]?.split('?')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch (e) {
    // If not a valid URL, try regex matching
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetches YouTube video metadata: title, channel name, thumbnail, upload date, and view count
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const fallbackTitle = `YouTube 영상 (${videoId})`;

  let title = fallbackTitle;
  let thumbnailUrl = fallbackThumbnail;
  let authorName: string | undefined = undefined;
  let authorUrl: string | undefined = undefined;
  let uploadDate: string | undefined = undefined;
  let viewCount: number | undefined = undefined;
  let viewCountFormatted: string | undefined = undefined;

  // 1. Fetch oEmbed metadata (Title, Author Name, Author URL, Thumbnail)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await axios.get(oembedUrl, { timeout: 4000 });
    if (res.data) {
      title = res.data.title || fallbackTitle;
      thumbnailUrl = res.data.thumbnail_url || fallbackThumbnail;
      authorName = res.data.author_name || undefined;
      authorUrl = res.data.author_url || undefined;
    }
  } catch (error) {
    // Continue with fallback
  }

  // 2. Fetch HTML page to scrape uploadDate and viewCount
  try {
    const pageRes = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 5000,
    });
    const html = pageRes.data;

    // datePublished
    const dateMatch = html.match(/itemprop=["']datePublished["']\s+content=["']([^"']+)["']/i);
    if (dateMatch) {
      uploadDate = dateMatch[1];
    }

    // viewCount (raw number)
    const viewCountNumMatch = html.match(/"viewCount":\s*"(\d+)"/);
    if (viewCountNumMatch) {
      viewCount = parseInt(viewCountNumMatch[1], 10);
    }

    // viewCountText (formatted string)
    const viewCountTextMatch = html.match(/"viewCountText":\s*\{"simpleText":\s*"([^"]+)"\}/);
    if (viewCountTextMatch) {
      viewCountFormatted = viewCountTextMatch[1];
    } else {
      const shortViewMatch = html.match(/"shortViewCount":\s*\{"simpleText":\s*"([^"]+)"\}/);
      if (shortViewMatch) {
        viewCountFormatted = shortViewMatch[1];
      }
    }
  } catch (e) {
    // Ignore HTML scrape errors and use what we have
  }

  return {
    title,
    thumbnailUrl,
    authorName,
    authorUrl,
    uploadDate,
    viewCount,
    viewCountFormatted,
  };
}
