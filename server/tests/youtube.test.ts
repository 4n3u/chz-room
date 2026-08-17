import { describe, it, expect } from 'vitest';
import { parseYouTubeId } from '../src/utils/youtube';

describe('YouTube URL Parser Tests', () => {
  it('should parse standard youtube.com/watch?v=... URLs', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
  });

  it('should parse youtu.be short URLs', () => {
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=abcdef')).toBe('dQw4w9WgXcQ');
  });

  it('should parse youtube.com/shorts/... URLs', () => {
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should parse youtube.com/embed/... URLs', () => {
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should return raw 11-char video ID if directly input', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should return null for invalid URLs', () => {
    expect(parseYouTubeId('https://google.com')).toBeNull();
    expect(parseYouTubeId('invalid_string_not_id')).toBeNull();
    expect(parseYouTubeId('')).toBeNull();
  });
});
