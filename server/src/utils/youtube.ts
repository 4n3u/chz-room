import axios from 'axios';

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
 * Fetches YouTube video title and thumbnail using YouTube oEmbed API
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<{ title: string; thumbnailUrl: string }> {
  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const fallbackTitle = `YouTube 영상 (${videoId})`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await axios.get(oembedUrl, { timeout: 4000 });
    return {
      title: res.data?.title || fallbackTitle,
      thumbnailUrl: res.data?.thumbnail_url || fallbackThumbnail,
    };
  } catch (error) {
    return {
      title: fallbackTitle,
      thumbnailUrl: fallbackThumbnail,
    };
  }
}
