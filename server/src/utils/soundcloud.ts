import axios from 'axios';

export interface SoundCloudTrackMetadata {
  title: string;
  thumbnailUrl: string;
  authorName?: string;
  authorUrl?: string;
  duration?: number;
  soundcloudUrl: string;
  embedUrl?: string;
}

/**
 * Checks if a given input URL is a SoundCloud URL
 */
export function isSoundCloudUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  return (
    trimmed.includes('soundcloud.com/') ||
    trimmed.includes('on.soundcloud.com/') ||
    trimmed.includes('soundcloud.app.goo.gl/')
  );
}

/**
 * Normalizes a SoundCloud URL
 */
export function parseSoundCloudUrl(input: string): string | null {
  if (!isSoundCloudUrl(input)) return null;

  let trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    if (
      url.hostname === 'soundcloud.com' ||
      url.hostname === 'm.soundcloud.com' ||
      url.hostname === 'on.soundcloud.com' ||
      url.hostname.endsWith('.soundcloud.com')
    ) {
      return url.toString();
    }
  } catch (e) {
    // Ignore invalid URL
  }

  return null;
}

// In-memory cache for SoundCloud metadata (30-minute TTL)
const scMetadataCache = new Map<string, { data: SoundCloudTrackMetadata; timestamp: number }>();
const SC_METADATA_CACHE_TTL = 30 * 60 * 1000;

/**
 * Fetches SoundCloud track metadata via official oEmbed API
 */
export async function fetchSoundCloudMetadata(rawUrl: string): Promise<SoundCloudTrackMetadata> {
  const normalizedUrl = parseSoundCloudUrl(rawUrl) || rawUrl.trim();

  const cached = scMetadataCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < SC_METADATA_CACHE_TTL) {
    return cached.data;
  }

  const fallbackThumbnail = 'https://a-v2.sndcdn.com/assets/images/sc-custom-image-1200x630-c70f0383.jpg';
  const fallbackTitle = 'SoundCloud Track';

  try {
    const oEmbedApiUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
    const response = await axios.get(oEmbedApiUrl, {
      timeout: 6000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const data = response.data;
    let title = data.title || fallbackTitle;
    const authorName = data.author_name;
    const authorUrl = data.author_url;
    let thumbnailUrl = data.thumbnail_url || fallbackThumbnail;

    // Enhance thumbnail to larger 500x500 if available
    if (thumbnailUrl.includes('-large.jpg')) {
      thumbnailUrl = thumbnailUrl.replace('-large.jpg', '-t500x500.jpg');
    }

    // Clean title if it contains " by Author Name" suffix from oEmbed
    if (authorName && title.endsWith(` by ${authorName}`)) {
      title = title.substring(0, title.length - (` by ${authorName}`).length).trim();
    }

    // Extract embed iframe src URL if present
    let embedUrl: string | undefined = undefined;
    if (data.html) {
      const srcMatch = data.html.match(/src="([^"]+)"/);
      if (srcMatch && srcMatch[1]) {
        embedUrl = srcMatch[1];
      }
    }

    const metadata: SoundCloudTrackMetadata = {
      title,
      thumbnailUrl,
      authorName,
      authorUrl,
      soundcloudUrl: normalizedUrl,
      embedUrl,
    };

    scMetadataCache.set(normalizedUrl, {
      data: metadata,
      timestamp: Date.now(),
    });

    return metadata;
  } catch (err: any) {
    console.warn(`[SoundCloud] Failed to fetch oEmbed metadata for ${normalizedUrl}:`, err.message || err);

    return {
      title: fallbackTitle,
      thumbnailUrl: fallbackThumbnail,
      soundcloudUrl: normalizedUrl,
    };
  }
}
