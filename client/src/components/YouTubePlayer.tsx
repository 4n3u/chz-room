import React, { useEffect, useRef, useState } from 'react';
import { PlaybackState, UserRole, VideoItem } from '../types';
import { Play, Film, AlertCircle } from 'lucide-react';

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
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentVideo,
  playback,
  role,
  onVideoControl,
  onVideoEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isApiLoadedRef = useRef(false);
  const isInternalChangeRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);

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
        // Just load new video if player already exists
        isInternalChangeRef.current = true;
        playerRef.current.loadVideoById({
          videoId: currentVideo.videoId,
          startSeconds: playback.currentTime,
        });
        if (playback.isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
        setTimeout(() => {
          isInternalChangeRef.current = false;
        }, 800);
        return;
      }

      // Create new player
      playerRef.current = new window.YT.Player('youtube-player-element', {
        videoId: currentVideo.videoId,
        playerVars: {
          autoplay: playback.isPlaying ? 1 : 0,
          controls: 1, // Always allow native controls
          disablekb: canControl ? 0 : 1, // Disable keyboard for viewers
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
            if (playback.isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
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

            // Only propagate control events if user is Host or Mod
            if (canControl) {
              const currentTime = event.target.getCurrentTime();
              const playbackRate = event.target.getPlaybackRate();

              if (event.data === window.YT.PlayerState.PLAYING) {
                onVideoControl(true, currentTime, playbackRate);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                onVideoControl(false, currentTime, playbackRate);
              }
            }
          },
        },
      });
    };

    initPlayer();
  }, [currentVideo?.videoId]);

  // 3. Synchronize incoming server playback state (for Viewers & sync updates)
  useEffect(() => {
    if (!playerRef.current || !playerReady || !currentVideo) return;

    const player = playerRef.current;
    if (typeof player.getPlayerState !== 'function') return;

    const currentState = player.getPlayerState();
    const isActuallyPlaying = currentState === window.YT.PlayerState.PLAYING;

    isInternalChangeRef.current = true;

    // Sync play/pause state
    if (playback.isPlaying && !isActuallyPlaying) {
      player.playVideo();
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
  }, [playback.isPlaying, playback.currentTime, playback.lastUpdatedTimestamp, playback.playbackRate]);

  // 4. Periodic Drift Correction Check (every 2 seconds)
  useEffect(() => {
    if (!playerRef.current || !playerReady || !currentVideo || !playback.isPlaying) return;

    const interval = setInterval(() => {
      if (isInternalChangeRef.current || !playerRef.current?.getCurrentTime) return;

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
  }, [playback, playerReady, currentVideo]);

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
