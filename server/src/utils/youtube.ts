import axios from 'axios';

export interface YouTubeVideoMetadata {
  title: string;
  thumbnailUrl: string;
  duration?: number;
  authorName?: string;
  authorUrl?: string;
  uploadDate?: string;
  viewCount?: number;
  viewCountFormatted?: string;
  isShorts?: boolean;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Checks if a given input URL is explicitly a YouTube Shorts URL
 */
export function isShortsUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return input.includes('/shorts/');
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

// In-memory cache for YouTube metadata (30-minute TTL)
const metadataCache = new Map<string, { data: YouTubeVideoMetadata; timestamp: number }>();
const METADATA_CACHE_TTL = 30 * 60 * 1000;

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

/**
 * Fetches YouTube video metadata: title, channel name, thumbnail, upload date, and view count
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
  const cached = metadataCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < METADATA_CACHE_TTL) {
    return cached.data;
  }

  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const fallbackTitle = `YouTube 영상 (${videoId})`;

  let title = fallbackTitle;
  let thumbnailUrl = fallbackThumbnail;
  let duration: number | undefined = undefined;
  let authorName: string | undefined = undefined;
  let authorUrl: string | undefined = undefined;
  let uploadDate: string | undefined = undefined;
  let viewCount: number | undefined = undefined;
  let viewCountFormatted: string | undefined = undefined;
  let isShorts: boolean = false;

  // 1. Fetch oEmbed metadata (Title, Author Name, Author URL, Thumbnail) with browser headers
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await axios.get(oembedUrl, {
      headers: DEFAULT_HEADERS,
      timeout: 5000,
    });
    if (res.data) {
      if (res.data.title) {
        title = decodeHtmlEntities(res.data.title);
      }
      thumbnailUrl = res.data.thumbnail_url || fallbackThumbnail;
      authorName = res.data.author_name ? decodeHtmlEntities(res.data.author_name) : undefined;
      authorUrl = res.data.author_url || undefined;
    }
  } catch (error) {
    // Continue with fallback scraping
  }

  // 2. Fetch HTML page to scrape uploadDate, duration, viewCount, and fallback title/author
  try {
    const pageRes = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: DEFAULT_HEADERS,
      timeout: 6000,
    });
    const html = String(pageRes.data || '');

    // Fallback title from HTML if oEmbed failed or returned fallback
    if (title === fallbackTitle) {
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
      const metaTitle = html.match(/<meta\s+name=["']title["']\s+content=["'](.*?)["']/i);
      const titleTag = html.match(/<title>(.*?)<\/title>/i);
      const rawTitle = ogTitle?.[1] || metaTitle?.[1] || (titleTag?.[1] ? titleTag[1].replace(/ - YouTube$/, '') : null);
      if (rawTitle && rawTitle.trim()) {
        title = decodeHtmlEntities(rawTitle.trim());
      }
    }

    // Fallback author from HTML if oEmbed didn't provide it
    if (!authorName) {
      const linkAuthor = html.match(/<link\s+itemprop=["']name["']\s+content=["'](.*?)["']/i);
      const ownerChannelName = html.match(/"ownerChannelName":\s*"([^"]+)"/);
      const authorField = html.match(/"author":\s*"([^"]+)"/);
      const rawAuthor = linkAuthor?.[1] || ownerChannelName?.[1] || authorField?.[1];
      if (rawAuthor && rawAuthor.trim()) {
        authorName = decodeHtmlEntities(rawAuthor.trim());
      }
    }

    // Fallback thumbnail from og:image
    if (thumbnailUrl === fallbackThumbnail) {
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
      if (ogImage && ogImage[1]) {
        thumbnailUrl = ogImage[1];
      }
    }

    // datePublished
    const dateMatch = html.match(/itemprop=["']datePublished["']\s+content=["']([^"']+)["']/i);
    if (dateMatch) {
      uploadDate = dateMatch[1];
    }

    // lengthSeconds
    const lengthMatch = html.match(/"lengthSeconds":\s*"(\d+)"/);
    if (lengthMatch) {
      duration = parseInt(lengthMatch[1], 10);
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

  const result: YouTubeVideoMetadata = {
    title,
    thumbnailUrl,
    duration,
    authorName,
    authorUrl,
    uploadDate,
    viewCount,
    viewCountFormatted,
    isShorts,
  };

  metadataCache.set(videoId, { data: result, timestamp: Date.now() });
  return result;
}
