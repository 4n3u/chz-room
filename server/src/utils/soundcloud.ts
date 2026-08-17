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
 * Fetches SoundCloud track metadata via official oEmbed API and resolves shortlinks/redirects
 */
export async function fetchSoundCloudMetadata(rawUrl: string): Promise<SoundCloudTrackMetadata> {
  let finalUrl = rawUrl.trim();
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = `https://${finalUrl}`;
  }

  // 1. Follow shortlink redirects (e.g. on.soundcloud.com or mobile share links)
  if (finalUrl.includes('on.soundcloud.com') || finalUrl.includes('soundcloud.app.goo.gl')) {
    try {
      const redirectRes = await axios.get(finalUrl, {
        maxRedirects: 5,
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      finalUrl = redirectRes.request?.res?.responseUrl || redirectRes.config?.url || finalUrl;
    } catch (e: any) {
      console.warn(`[SoundCloud] Failed to resolve shortlink ${rawUrl}:`, e.message);
    }
  }

  // 2. Strip tracking query parameters like ?si=... ?ref=... but preserve secret_token if any
  try {
    const urlObj = new URL(finalUrl);
    const secretToken = urlObj.searchParams.get('secret_token');
    urlObj.search = '';
    if (secretToken) {
      urlObj.searchParams.set('secret_token', secretToken);
    }
    finalUrl = urlObj.toString();
  } catch (e) {
    // Ignore URL parse error
  }

  const cached = scMetadataCache.get(finalUrl);
  if (cached && Date.now() - cached.timestamp < SC_METADATA_CACHE_TTL) {
    return cached.data;
  }

  const fallbackThumbnail = 'https://a-v2.sndcdn.com/assets/images/sc-custom-image-1200x630-c70f0383.jpg';
  const fallbackTitle = 'SoundCloud Track';

  try {
    const oEmbedApiUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(finalUrl)}&format=json`;
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

    // Extract official embed iframe src URL from oEmbed HTML response
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
      soundcloudUrl: finalUrl,
      embedUrl,
    };

    scMetadataCache.set(finalUrl, {
      data: metadata,
      timestamp: Date.now(),
    });

    return metadata;
  } catch (err: any) {
    console.warn(`[SoundCloud] oEmbed failed for ${finalUrl}:`, err.message || err);

    // Fallback: Direct OpenGraph scraping
    try {
      const pageRes = await axios.get(finalUrl, {
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = pageRes.data;
      const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
      const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      const appLinkMatch = html.match(/<meta\s+property="al:ios:url"\s+content="sounds:tracks:([0-9]+)"/i);

      let title = ogTitleMatch ? ogTitleMatch[1] : fallbackTitle;
      const thumbnailUrl = ogImageMatch ? ogImageMatch[1] : fallbackThumbnail;
      const trackId = appLinkMatch ? appLinkMatch[1] : null;

      let embedUrl: string | undefined = undefined;
      if (trackId) {
        embedUrl = `https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F${trackId}&show_artwork=true`;
      }

      const metadata: SoundCloudTrackMetadata = {
        title,
        thumbnailUrl,
        soundcloudUrl: finalUrl,
        embedUrl,
      };

      scMetadataCache.set(finalUrl, {
        data: metadata,
        timestamp: Date.now(),
      });

      return metadata;
    } catch (scrapErr: any) {
      console.warn(`[SoundCloud] Fallback scraping failed for ${finalUrl}:`, scrapErr.message || scrapErr);

      return {
        title: fallbackTitle,
        thumbnailUrl: fallbackThumbnail,
        soundcloudUrl: finalUrl,
      };
    }
  }
}
