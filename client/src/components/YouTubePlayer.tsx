import React, { useEffect, useRef, useState } from 'react';
import { PlaybackState, UserRole, VideoItem } from '../types';
import { Film, Radio, Volume2, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  currentVideo: VideoItem | null;
  playback: PlaybackState;
  role: UserRole;
  onVideoControl: (isPlaying: boolean, currentTime: number, playbackRate?: number) => void;
  onVideoEnded: () => void;
  onVideoReady?: (videoId?: string) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentVideo,
  playback,
  role,
  onVideoControl,
  onVideoEnded,
  onVideoReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isApiLoadedRef = useRef(false);
  const isInternalChangeRef = useRef(false);
  const lastControlSentTimeRef = useRef<number>(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isAutoplayMuted, setIsAutoplayMuted] = useState(false);
  
  // Track if viewer has manually desynced locally (seeking/pausing privately)
  const [isLocalDesynced, setIsLocalDesynced] = useState(false);

  const canControl = role === 'host' || role === 'mod';

  // 1. Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiLoadedRef.current = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      isApiLoadedRef.current = true;
    };
  }, []);

  // Reset local desync when video changes
  useEffect(() => {
    setIsLocalDesynced(false);
  }, [currentVideo?.videoId]);

  // Safe play attempt with Autoplay Policy Mute Fallback
  const safePlay = (player: any) => {
    if (!player || typeof player.playVideo !== 'function') return;
    try {
      const playPromise = player.playVideo();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay blocked by browser policy -> mute and retry
          if (typeof player.mute === 'function') {
            player.mute();
            setIsAutoplayMuted(true);
            player.playVideo();
          }
        });
      }
    } catch (e) {
      if (typeof player.mute === 'function') {
        player.mute();
        setIsAutoplayMuted(true);
        player.playVideo();
      }
    }
  };

  // 2. Initialize or Update Player when currentVideo changes
  useEffect(() => {
    if (!currentVideo?.videoId) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        setPlayerReady(false);
      }
      return;
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      if (playerRef.current) {
        // Load new video if player already exists
        isInternalChangeRef.current = true;
        playerRef.current.loadVideoById({
          videoId: currentVideo.videoId,
          startSeconds: playback.currentTime,
        });

        if (playback.isPlaying && !playback.isBuffering) {
          safePlay(playerRef.current);
        } else {
          playerRef.current.pauseVideo();
        }

        onVideoReady?.(currentVideo.videoId);

        setTimeout(() => {
          isInternalChangeRef.current = false;
        }, 800);
        return;
      }

      // Create new player
      playerRef.current = new window.YT.Player('youtube-player-element', {
        videoId: currentVideo.videoId,
        playerVars: {
          autoplay: playback.isPlaying && !playback.isBuffering ? 1 : 0,
          controls: 1, // Native YouTube controls
          disablekb: 0, // Enable keyboard
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            const calculatedTime = playback.isPlaying
              ? playback.currentTime + (Date.now() - playback.lastUpdatedTimestamp) / 1000
              : playback.currentTime;
            
            event.target.seekTo(Math.max(0, calculatedTime), true);
            if (playback.isPlaying && !playback.isBuffering) {
              safePlay(event.target);
            } else {
              event.target.pauseVideo();
            }

            // Signal ready handshake to backend
            onVideoReady?.(currentVideo.videoId);
          },
          onStateChange: (event: any) => {
            if (isInternalChangeRef.current) return;

            // Video ended
            if (event.data === window.YT.PlayerState.ENDED) {
              if (canControl) {
                onVideoEnded();
              }
              return;
            }

            // Propagate control events if user is Admin or Manager (with echo & jitter filter)
            if (canControl) {
              const currentTime = event.target.getCurrentTime();
              const playbackRate = event.target.getPlaybackRate();
              const now = Date.now();

              // Avoid spamming identical control events within 400ms
              if (now - lastControlSentTimeRef.current < 400) return;

              if (event.data === window.YT.PlayerState.PLAYING) {
                lastControlSentTimeRef.current = now;
                onVideoControl(true, currentTime, playbackRate);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                lastControlSentTimeRef.current = now;
                onVideoControl(false, currentTime, playbackRate);
              }
            } else {
              // Regular Viewer: keep control locally without broadcasting globally
              setIsLocalDesynced(true);
            }
          },
        },
      });
    };

    initPlayer();
  }, [currentVideo?.videoId]);

  // 3. Synchronize incoming server playback state (Only when NOT locally desynced or when user is controller)
  useEffect(() => {
    if (!playerRef.current || !playerReady || !currentVideo) return;
    // If viewer is enjoying private local seek/pause, do not interrupt
    if (!canControl && isLocalDesynced) return;

    const player = playerRef.current;
    if (typeof player.getPlayerState !== 'function') return;

    const currentState = player.getPlayerState();
    const isActuallyPlaying = currentState === window.YT.PlayerState.PLAYING;

    isInternalChangeRef.current = true;

    // Sync play/pause state according to isBuffering & isPlaying
    if (playback.isBuffering) {
      if (isActuallyPlaying) {
        player.pauseVideo();
      }
    } else if (playback.isPlaying && !isActuallyPlaying) {
      safePlay(player);
    } else if (!playback.isPlaying && isActuallyPlaying) {
      player.pauseVideo();
    }

    // Sync playback rate if changed
    if (typeof player.getPlaybackRate === 'function' && player.getPlaybackRate() !== playback.playbackRate) {
      player.setPlaybackRate(playback.playbackRate);
    }

    // Check drift & seek if needed
    const expectedTime = playback.isPlaying
      ? playback.currentTime + (Date.now() - playback.lastUpdatedTimestamp) / 1000
      : playback.currentTime;

    const playerTime = player.getCurrentTime();
    if (Math.abs(playerTime - expectedTime) > 1.5) {
      player.seekTo(Math.max(0, expectedTime), true);
    }

    setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 600);
  }, [playback.isPlaying, playback.isBuffering, playback.currentTime, playback.lastUpdatedTimestamp, playback.playbackRate, isLocalDesynced]);

  // 4. Periodic Drift Correction Check (Only when synchronized with the room)
  useEffect(() => {
    if (!playerRef.current || !playerReady || !currentVideo || !playback.isPlaying || playback.isBuffering) return;
    if (!canControl && isLocalDesynced) return;

    const interval = setInterval(() => {
      if (isInternalChangeRef.current || !playerRef.current?.getCurrentTime) return;
      if (!canControl && isLocalDesynced) return;

      const player = playerRef.current;
      const expectedTime =
        playback.currentTime + (Date.now() - playback.lastUpdatedTimestamp) / 1000;
      const actualTime = player.getCurrentTime();

      // If drifted more than 1.5 seconds, smoothly seek
      if (Math.abs(actualTime - expectedTime) > 1.5) {
        isInternalChangeRef.current = true;
        player.seekTo(Math.max(0, expectedTime), true);
        setTimeout(() => {
          isInternalChangeRef.current = false;
        }, 500);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [playback, playerReady, currentVideo, isLocalDesynced]);

  // Manual Re-sync handler for viewers
  const handleSyncToLive = () => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    
    isInternalChangeRef.current = true;
    const expectedTime = playback.isPlaying
      ? playback.currentTime + (Date.now() - playback.lastUpdatedTimestamp) / 1000
      : playback.currentTime;

    player.seekTo(Math.max(0, expectedTime), true);
    if (playback.isPlaying && !playback.isBuffering) {
      safePlay(player);
    } else {
      player.pauseVideo();
    }

    setIsLocalDesynced(false);
    setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 600);
  };

  // Unmute handler for Autoplay Policy Mute Fallback
  const handleUnmute = () => {
    if (playerRef.current && typeof playerRef.current.unMute === 'function') {
      playerRef.current.unMute();
      setIsAutoplayMuted(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 Aspect Ratio
        backgroundColor: '#000000',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      {currentVideo ? (
        <>
          <div
            id="youtube-player-element"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />

          {/* Buffering Indicator Overlay */}
          {playback.isBuffering && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'var(--brand-green)',
                border: '1px solid rgba(0, 255, 163, 0.4)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Loader2 size={13} className="animate-spin" />
              <span>동시 시청 준비 중...</span>
            </div>
          )}

          {/* Autoplay Mute Fallback Banner / Button */}
          {isAutoplayMuted && (
            <button
              onClick={handleUnmute}
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'var(--brand-green)',
                border: '1px solid var(--brand-green)',
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 6px 20px rgba(0, 255, 163, 0.35)',
                cursor: 'pointer',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            >
              <Volume2 size={16} />
              <span>사운드 켜기 (음소거 해제)</span>
            </button>
          )}

          {/* Floating "Re-sync to Room" Badge/Button when Viewer is locally desynced */}
          {!canControl && isLocalDesynced && (
            <button
              onClick={handleSyncToLive}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                zIndex: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'var(--brand-green)',
                border: '1px solid rgba(0, 255, 163, 0.4)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-green)';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
                e.currentTarget.style.color = 'var(--brand-green)';
              }}
            >
              <Radio size={13} className="animate-pulse" />
              <span>실시간 싱크 맞추기</span>
            </button>
          )}
        </>
      ) : (
        /* Empty Queue Placeholder */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            background: 'radial-gradient(circle at center, #1b1d22 0%, #0c0d0f 100%)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 255, 163, 0.1)',
              border: '1px solid rgba(0, 255, 163, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Film size={32} color="var(--brand-green)" />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8, color: '#ffffff' }}>
            재생 중인 영상이 없습니다
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.5 }}>
            오른쪽 대기열 창에 유튜브 영상 URL을 입력하면 즉시 모든 참가자와 함께 시청이 시작됩니다.
          </p>
        </div>
      )}
    </div>
  );
};
