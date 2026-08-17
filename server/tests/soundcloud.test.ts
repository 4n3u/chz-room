import { describe, it, expect } from 'vitest';
import { isSoundCloudUrl, parseSoundCloudUrl } from '../src/utils/soundcloud';

describe('SoundCloud URL Parser Tests', () => {
  it('should detect soundcloud.com URLs', () => {
    expect(isSoundCloudUrl('https://soundcloud.com/artist/track-name')).toBe(true);
    expect(isSoundCloudUrl('https://m.soundcloud.com/artist/track-name')).toBe(true);
    expect(isSoundCloudUrl('https://on.soundcloud.com/abcdef')).toBe(true);
  });

  it('should normalize valid SoundCloud URLs', () => {
    expect(parseSoundCloudUrl('https://soundcloud.com/artist/track-name')).toBe('https://soundcloud.com/artist/track-name');
    expect(parseSoundCloudUrl('soundcloud.com/artist/track-name')).toBe('https://soundcloud.com/artist/track-name');
    expect(parseSoundCloudUrl('https://on.soundcloud.com/abcdef')).toBe('https://on.soundcloud.com/abcdef');
  });

  it('should reject non-SoundCloud URLs', () => {
    expect(isSoundCloudUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isSoundCloudUrl('https://google.com')).toBe(false);
    expect(isSoundCloudUrl('')).toBe(false);
    expect(parseSoundCloudUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });
});
