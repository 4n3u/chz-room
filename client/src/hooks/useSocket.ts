import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChzzkUser, PlaybackState, RoomMember, RoomState, UserRole, VideoItem } from '../types';

interface UseSocketProps {
  roomId: string;
  user: ChzzkUser | null;
}

export function useSocket({ roomId, user }: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [history, setHistory] = useState<VideoItem[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    lastUpdatedTimestamp: Date.now(),
    playbackRate: 1,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const socket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Join room
      socket.emit(
        'room:join',
        { roomId, user },
        (res: { success: boolean; role?: UserRole; room?: RoomState; error?: string }) => {
          if (res.success && res.room) {
            setRoom(res.room);
            setRole(res.role || 'viewer');
            setMembers(res.room.members || []);
            setCurrentVideo(res.room.currentVideo || null);
            setQueue(res.room.queue || []);
            setHistory(res.room.history || []);
            setPlayback(res.room.playback);
            setIsShuffle(!!res.room.isShuffle);
          } else {
            setError(res.error || '방에 입장하지 못했습니다.');
          }
        }
      );
    });

    // Event Listeners
    socket.on('video:sync', (data: PlaybackState & { videoId?: string }) => {
      setPlayback({
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        lastUpdatedTimestamp: data.lastUpdatedTimestamp,
        playbackRate: data.playbackRate,
      });
    });

    socket.on('queue:updated', (data: { currentVideo: VideoItem | null; queue: VideoItem[] }) => {
      setCurrentVideo(data.currentVideo);
      setQueue(data.queue);
    });

    socket.on('history:updated', (data: { history: VideoItem[] }) => {
      setHistory(data.history || []);
    });

    socket.on('queue:mode_updated', (data: { isShuffle: boolean }) => {
      setIsShuffle(data.isShuffle);
    });

    socket.on('members:updated', (newMembers: RoomMember[]) => {
      setMembers(newMembers);
      // Update my own role if changed
      const me = newMembers.find((m) => m.user.channelId === user.channelId);
      if (me) {
        setRole(me.role);
      }
    });

    socket.on('host:migrated', (data: { newHostUserId: string }) => {
      if (user.channelId === data.newHostUserId) {
        setRole('host');
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.emit('room:leave');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, user?.channelId]);

  // Actions
  const sendVideoControl = useCallback(
    (isPlaying: boolean, currentTime: number, playbackRate: number = 1) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit(
        'video:control',
        {
          roomId,
          user,
          isPlaying,
          currentTime,
          playbackRate,
        },
        (res: any) => {
          if (res?.error) {
            setError(res.error);
          }
        }
      );
    },
    [roomId, user]
  );

  const addToQueue = useCallback(
    (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socketRef.current || !user) return resolve(false);
        socketRef.current.emit(
          'queue:add',
          { roomId, url, user },
          (res: { success?: boolean; error?: string }) => {
            if (res.error) {
              setError(res.error);
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });
    },
    [roomId, user]
  );

  const removeFromQueue = useCallback(
    (queueItemId: string) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit('queue:remove', { roomId, queueItemId, user }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit('queue:reorder', { roomId, fromIndex, toIndex, user }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  const toggleShuffle = useCallback(
    (newShuffle: boolean) => {
      if (!socketRef.current || !user) return;
      setIsShuffle(newShuffle);
      socketRef.current.emit('queue:mode', { roomId, isShuffle: newShuffle, user }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  const playNow = useCallback(
    (queueItemId: string) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit('queue:play_now', { roomId, queueItemId, user }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  const skipNext = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('queue:next', { roomId, user }, (res: any) => {
      if (res?.error) setError(res.error);
    });
  }, [roomId, user]);

  const reAddFromHistory = useCallback(
    (historyItemId: string) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit('history:readd', { roomId, historyItemId, user }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  const playHistoryNow = useCallback(
    (historyItemId: string) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit('history:play_now', { roomId, historyItemId, user }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  const clearHistory = useCallback(() => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('history:clear', { roomId, user }, (res: any) => {
      if (res?.error) setError(res.error);
    });
  }, [roomId, user]);

  const updateRole = useCallback(
    (targetUserId: string, newRole: UserRole) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit('role:update', { roomId, user, targetUserId, newRole }, (res: any) => {
        if (res?.error) setError(res.error);
      });
    },
    [roomId, user]
  );

  return {
    connected,
    room,
    role,
    members,
    currentVideo,
    queue,
    history,
    isShuffle,
    playback,
    error,
    clearError: () => setError(null),
    sendVideoControl,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    toggleShuffle,
    playNow,
    skipNext,
    reAddFromHistory,
    playHistoryNow,
    clearHistory,
    updateRole,
  };
}
