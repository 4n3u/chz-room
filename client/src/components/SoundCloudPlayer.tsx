import React, { useEffect, useRef, useState } from 'react';
import { PlaybackState, UserRole, VideoItem } from '../types';
import { Volume2, VolumeX, Shield, Music } from 'lucide-react';

declare global {
  interface Window {
    SC?: {
      Widget: {
        (iframeElement: HTMLIFrameElement | string): SoundCloudWidget;
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          SEEK: string;
          PLAY_PROGRESS: string;
          LOAD_PROGRESS: string;
          ERROR: string;
        };
      };
    };
  }
}

interface SoundCloudWidget {
  bind(eventName: string, callback: (data?: any) => void): void;
  unbind(eventName: string): void;
  load(url: string, options?: any): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(milliseconds: number): void;
  setVolume(volume: number): void;
  getVolume(callback: (volume: number) => void): void;
  getDuration(callback: (duration: number) => void): void;
  getPosition(callback: (position: number) => void): void;
  getSounds(callback: (sounds: any[]) => void): void;
  getCurrentSound(callback: (sound: any) => void): void;
  isPaused(callback: (paused: boolean) => void): void;
}

interface SoundCloudPlayerProps {
  currentVideo: VideoItem | null;
  playback: PlaybackState;
  role: UserRole;
  onVideoControl: (isPlaying: boolean, currentTime: number, playbackRate?: number) => void;
  onVideoEnded: (videoId?: string, itemId?: string) => void;
  onVideoReady?: (videoId?: string) => void;
}

export const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  currentVideo,
  playback,
  role,
  onVideoControl,
  onVideoEnded,
  onVideoReady,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const isHostOrMod = role === 'host' || role === 'mod';

  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const isInternalChangeRef = useRef(false);
  const lastSyncTimestampRef = useRef<number>(0);
  const lastTrackUrlRef = useRef<string | null>(null);
  const lastUserControlTimeRef = useRef<number>(0);
  const hasEndedRef = useRef<boolean>(false);

  // 1. Load SoundCloud Widget API script once
  useEffect(() => {
    if (window.SC?.Widget) return;

    const existingScript = document.getElementById('sc-widget-api');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'sc-widget-api';
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 2. Initialize or reload Widget when track changes
  useEffect(() => {
    if (!currentVideo || currentVideo.source !== 'soundcloud') return;
    hasEndedRef.current = false;

    const trackUrl = currentVideo.soundcloudUrl || currentVideo.videoId;
    if (!trackUrl) return;

    const initWidget = () => {
      const SC = window.SC;
      if (!iframeRef.current || !SC?.Widget) return;

      try {
        const widget = SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        widget.bind(SC.Widget.Events.READY, () => {
          setIsReady(true);
          onVideoReady?.(trackUrl);

          // Listen to widget state changes
          widget.bind(SC.Widget.Events.PLAY, () => {
            if (isInternalChangeRef.current) return;
            if (isHostOrMod) {
              lastUserControlTimeRef.current = Date.now();
              widget.getPosition((posMs) => {
                onVideoControl(true, Math.floor(posMs / 1000));
              });
            }
          });

          widget.bind(SC.Widget.Events.PAUSE, () => {
            if (isInternalChangeRef.current) return;
            if (isHostOrMod) {
              lastUserControlTimeRef.current = Date.now();
              widget.getPosition((posMs) => {
                onVideoControl(false, Math.floor(posMs / 1000));
              });
            }
          });

          widget.bind(SC.Widget.Events.SEEK, (data: any) => {
            if (isInternalChangeRef.current) return;
            if (isHostOrMod) {
              lastUserControlTimeRef.current = Date.now();
              const posSec = data?.currentPosition ? Math.floor(data.currentPosition / 1000) : 0;
              widget.isPaused((paused) => {
                onVideoControl(!paused, posSec);
              });
            }
          });

          widget.bind(SC.Widget.Events.FINISH, () => {
            if (hasEndedRef.current) return;
            hasEndedRef.current = true;
            if (isHostOrMod) {
              onVideoEnded(currentVideo?.videoId, currentVideo?.id);
            }
          });
        });
      } catch (err) {
        console.warn('[SoundCloud] Widget initialization error:', err);
      }
    };

    // If script is already loaded
    if (window.SC?.Widget && iframeRef.current) {
      if (lastTrackUrlRef.current !== trackUrl) {
        lastTrackUrlRef.current = trackUrl;
        initWidget();
      }
    } else {
      const interval = setInterval(() => {
        if (window.SC?.Widget && iframeRef.current) {
          clearInterval(interval);
          lastTrackUrlRef.current = trackUrl;
          initWidget();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [currentVideo?.id, currentVideo?.soundcloudUrl, isHostOrMod, onVideoControl, onVideoEnded]);

  // 3. React to Socket.io Playback Sync updates
  useEffect(() => {
    if (!widgetRef.current || !isReady || !currentVideo) return;
    if (lastSyncTimestampRef.current === playback.lastUpdatedTimestamp) return;

    lastSyncTimestampRef.current = playback.lastUpdatedTimestamp;

    // Calculate elapsed time if playing
    let targetTimeSec = playback.currentTime;
    if (playback.isPlaying) {
      const elapsedSec = (Date.now() - playback.lastUpdatedTimestamp) / 1000;
      targetTimeSec += elapsedSec * (playback.playbackRate || 1);
    }

    const targetTimeMs = Math.max(0, targetTimeSec * 1000);

    isInternalChangeRef.current = true;

    widgetRef.current.getPosition((currentPosMs) => {
      const timeDiff = Math.abs(currentPosMs - targetTimeMs);

      // Re-sync seek position if drift > 2.5 seconds and not own echo
      const isOwnEcho = playback.isOwnSync || (Date.now() - lastUserControlTimeRef.current < 3000);
      if (!isOwnEcho && timeDiff > 2500) {
        widgetRef.current?.seekTo(targetTimeMs);
      }

      if (playback.isPlaying && !playback.isBuffering) {
        widgetRef.current?.play();
      } else {
        widgetRef.current?.pause();
      }

      setTimeout(() => {
        isInternalChangeRef.current = false;
      }, 500);
    });
  }, [playback, isReady, currentVideo]);

  const handleMuteToggle = () => {
    if (!widgetRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    widgetRef.current.setVolume(nextMuted ? 0 : 100);
  };

  const getWidgetSrc = () => {
    if (currentVideo?.embedUrl) {
      let src = currentVideo.embedUrl;
      if (!src.includes('auto_play')) src += '&auto_play=true';
      if (!src.includes('color=')) src += '&color=%2300ffa3';
      if (!src.includes('visual=')) src += '&visual=true';
      if (!src.includes('show_artwork=')) src += '&show_artwork=true';
      return src;
    }

    const rawTrackUrl = currentVideo?.soundcloudUrl || currentVideo?.videoId || '';
    const cleanTrackUrl = rawTrackUrl.split('?')[0];
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      cleanTrackUrl
    )}&color=%2300ffa3&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
  };

  const widgetSrc = getWidgetSrc();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#050706',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-color)',
      }}
      onClick={() => setUserInteracted(true)}
    >
      {currentVideo ? (
        <>
          <iframe
            ref={iframeRef}
            src={widgetSrc}
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            title={currentVideo.title}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />

          {/* Autoplay Unmute Overlay for Viewers */}
          {!userInteracted && !isHostOrMod && (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 20,
              }}
            >
              <button
                className="btn-primary"
                onClick={handleMuteToggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  fontSize: 13,
                  boxShadow: '0 4px 14px rgba(0, 255, 163, 0.4)',
                }}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{isMuted ? '음소거 해제' : '사운드 켜기'}</span>
              </button>
            </div>
          )}

          {/* Controller Badge */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 700,
              color: isHostOrMod ? 'var(--brand-green)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {isHostOrMod ? <Shield size={12} /> : <Music size={12} />}
            <span>{isHostOrMod ? 'SoundCloud 제어 중' : 'SoundCloud 동기화 중'}</span>
          </div>
        </>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            gap: 12,
          }}
        >
          <Music size={48} color="var(--border-color)" />
          <p style={{ fontSize: 15, fontWeight: 600 }}>재생 중인 트랙이 없습니다</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            우측 대기열에서 유튜브 영상이나 사운드클라우드 링크를 추가해보세요
          </p>
        </div>
      )}
    </div>
  );
};
