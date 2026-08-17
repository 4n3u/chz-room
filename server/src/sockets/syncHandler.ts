import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { ChzzkUser } from '../auth/types';
import { fetchYouTubeMetadata, parseYouTubeId, isShortsUrl } from '../utils/youtube';
import { fetchSoundCloudMetadata, isSoundCloudUrl, parseSoundCloudUrl } from '../utils/soundcloud';
import { UserRole, VideoItem, QueueLimitMode, RoomSettings } from '../rooms/types';
import crypto from 'crypto';

export function registerSyncHandlers(io: SocketIOServer, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {
    // 1. Join Room
    socket.on(
      'room:join',
      async (
        data: { roomId: string; user: ChzzkUser },
        callback?: (res: { success: boolean; role?: UserRole; room?: any; error?: string }) => void
      ) => {
        const { roomId, user } = data;
        if (!roomId || !user?.channelId) {
          return callback?.({ success: false, error: '유효하지 않은 요청입니다.' });
        }

        const joinResult = roomManager.joinRoom(roomId, socket.id, user);
        if (!joinResult) {
          return callback?.({ success: false, error: '존재하지 않는 룸입니다.' });
        }

        socket.join(roomId);

        const calculatedTime = roomManager.getCalculatedCurrentTime(joinResult.room);

        callback?.({
          success: true,
          role: joinResult.role,
          room: {
            ...joinResult.room,
            playback: {
              ...joinResult.room.playback,
              currentTime: calculatedTime,
            },
          },
        });

        // Broadcast updated member list to everyone in room
        io.to(roomId).emit('members:updated', joinResult.room.members);
      }
    );

    // 2. Video Control (Play / Pause / Seek / Rate) - Host & Mod only
    socket.on(
      'video:control',
      (
        data: {
          roomId: string;
          user: ChzzkUser;
          isPlaying: boolean;
          currentTime: number;
          playbackRate?: number;
        },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, user, isPlaying, currentTime, playbackRate = 1 } = data;
        if (!roomId || !user?.channelId) {
          return callback?.({ error: '인증 정보가 없습니다.' });
        }

        if (!roomManager.hasControlPermission(roomId, user.channelId)) {
          return callback?.({ error: '영상을 제어할 수 있는 권한(어드민/매니저)이 없습니다.' });
        }

        const updatedRoom = roomManager.updatePlayback(roomId, isPlaying, currentTime, playbackRate);
        if (!updatedRoom) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        // Broadcast sync to all clients in the room
        io.to(roomId).emit('video:sync', {
          videoId: updatedRoom.currentVideo?.videoId,
          isPlaying: updatedRoom.playback.isPlaying,
          currentTime: updatedRoom.playback.currentTime,
          lastUpdatedTimestamp: updatedRoom.playback.lastUpdatedTimestamp,
          playbackRate: updatedRoom.playback.playbackRate,
        });

        callback?.({ success: true });
      }
    );

    // 3. Add to Queue - Anyone can add (Subject to queueLimitMode for viewers)
    socket.on(
      'queue:add',
      async (
        data: { roomId: string; url: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string; videoItem?: VideoItem }) => void
      ) => {
        const { roomId, url, user } = data;
        if (!roomId || !url || !user?.channelId) {
          return callback?.({ error: '유효하지 않은 요청입니다.' });
        }

        let videoItem: VideoItem | null = null;

        // Check if SoundCloud URL
        if (isSoundCloudUrl(url)) {
          const scUrl = parseSoundCloudUrl(url);
          if (!scUrl) {
            return callback?.({ error: '올바른 SoundCloud 주소를 입력해주세요.' });
          }
          const scMeta = await fetchSoundCloudMetadata(scUrl);
          videoItem = {
            id: `item-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            videoId: scMeta.soundcloudUrl,
            source: 'soundcloud',
            soundcloudUrl: scMeta.soundcloudUrl,
            embedUrl: scMeta.embedUrl,
            title: scMeta.title,
            thumbnailUrl: scMeta.thumbnailUrl,
            duration: scMeta.duration,
            addedBy: user,
            authorName: scMeta.authorName,
            authorUrl: scMeta.authorUrl,
          };
        } else {
          // Check YouTube
          const videoId = parseYouTubeId(url);
          if (!videoId) {
            return callback?.({ error: '올바른 YouTube 또는 SoundCloud 주소를 입력해주세요.' });
          }

          const metadata = await fetchYouTubeMetadata(videoId);
          const isShorts = isShortsUrl(url) || !!metadata.isShorts;
          videoItem = {
            id: `item-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            videoId,
            source: 'youtube',
            title: metadata.title,
            thumbnailUrl: metadata.thumbnailUrl,
            duration: metadata.duration,
            addedBy: user,
            authorName: metadata.authorName,
            authorUrl: metadata.authorUrl,
            uploadDate: metadata.uploadDate,
            viewCount: metadata.viewCount,
            viewCountFormatted: metadata.viewCountFormatted,
            isShorts,
          };
        }

        const currentRoomBefore = roomManager.getRoom(roomId);
        const wasEmpty = !currentRoomBefore?.currentVideo;

        const bypassLimit = roomManager.hasControlPermission(roomId, user.channelId);
        const addResult = roomManager.addToQueue(roomId, videoItem, bypassLimit);
        if (!addResult.success || !addResult.room) {
          return callback?.({ error: addResult.error || '룸을 찾을 수 없습니다.' });
        }

        const updatedRoom = addResult.room;

        // If it became the currently playing video immediately
        if (wasEmpty) {
          io.to(roomId).emit('video:sync', {
            videoId: updatedRoom.currentVideo?.videoId,
            isPlaying: updatedRoom.playback.isPlaying,
            currentTime: 0,
            lastUpdatedTimestamp: updatedRoom.playback.lastUpdatedTimestamp,
            playbackRate: 1,
          });
        }

        // Broadcast updated queue and current video state
        io.to(roomId).emit('queue:updated', {
          currentVideo: updatedRoom.currentVideo,
          queue: updatedRoom.queue,
        });

        callback?.({ success: true, videoItem });
      }
    );

    // 4. Remove from Queue - Host & Mod only
    socket.on(
      'queue:remove',
      (
        data: { roomId: string; queueItemId: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, queueItemId, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '대기열을 관리할 권한이 없습니다.' });
        }

        const updatedRoom = roomManager.removeFromQueue(roomId, queueItemId);
        if (!updatedRoom) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        io.to(roomId).emit('queue:updated', {
          currentVideo: updatedRoom.currentVideo,
          queue: updatedRoom.queue,
        });

        callback?.({ success: true });
      }
    );

    // 5. Reorder Queue (Drag & Drop) - Host & Mod only
    socket.on(
      'queue:reorder',
      (
        data: { roomId: string; fromIndex: number; toIndex: number; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, fromIndex, toIndex, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '대기열 순서를 변경할 권한(어드민/매니저)이 없습니다.' });
        }

        const updatedRoom = roomManager.reorderQueue(roomId, fromIndex, toIndex);
        if (!updatedRoom) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        io.to(roomId).emit('queue:updated', {
          currentVideo: updatedRoom.currentVideo,
          queue: updatedRoom.queue,
        });

        callback?.({ success: true });
      }
    );

    // 6. Play Mode (Sequential vs Random Shuffle) - Host & Mod only
    socket.on(
      'queue:mode',
      (
        data: { roomId: string; isShuffle: boolean; user: ChzzkUser },
        callback?: (res: { success?: boolean; isShuffle?: boolean; error?: string }) => void
      ) => {
        const { roomId, isShuffle, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '재생 모드를 변경할 권한(어드민/매니저)이 없습니다.' });
        }

        const updatedRoom = roomManager.setShuffleMode(roomId, isShuffle);
        if (!updatedRoom) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        io.to(roomId).emit('queue:mode_updated', {
          isShuffle: updatedRoom.isShuffle,
        });

        callback?.({ success: true, isShuffle: updatedRoom.isShuffle });
      }
    );

    // 7. Skip / Next Video - Host & Mod only
    socket.on(
      'queue:next',
      (
        data: { roomId: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '다음 영상으로 넘길 권한이 없습니다.' });
        }

        const nextRes = roomManager.nextVideo(roomId);
        if (!nextRes) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        // Broadcast video sync and queue update
        io.to(roomId).emit('video:sync', {
          videoId: nextRes.currentVideo?.videoId || null,
          isPlaying: !!nextRes.currentVideo,
          currentTime: 0,
          lastUpdatedTimestamp: Date.now(),
          playbackRate: 1,
        });

        io.to(roomId).emit('queue:updated', {
          currentVideo: nextRes.currentVideo,
          queue: nextRes.room.queue,
        });

        io.to(roomId).emit('history:updated', {
          history: nextRes.room.history,
        });

        callback?.({ success: true });
      }
    );

    // 8. Play Specific Video Immediately (Play Now) - Host & Mod only
    socket.on(
      'queue:play_now',
      (
        data: { roomId: string; queueItemId: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, queueItemId, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '영상을 즉시 재생할 권한(어드민/매니저)이 없습니다.' });
        }

        const playRes = roomManager.playSpecificVideo(roomId, queueItemId);
        if (!playRes) {
          return callback?.({ error: '영상을 찾을 수 없거나 룸이 존재하지 않습니다.' });
        }

        io.to(roomId).emit('video:sync', {
          videoId: playRes.currentVideo?.videoId || null,
          isPlaying: true,
          currentTime: 0,
          lastUpdatedTimestamp: Date.now(),
          playbackRate: 1,
        });

        io.to(roomId).emit('queue:updated', {
          currentVideo: playRes.currentVideo,
          queue: playRes.room.queue,
        });

        io.to(roomId).emit('history:updated', {
          history: playRes.room.history,
        });

        callback?.({ success: true });
      }
    );

    // 9. Re-add Video from History - Anyone can re-add (Subject to limit)
    socket.on(
      'history:readd',
      (
        data: { roomId: string; historyItemId: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, historyItemId, user } = data;
        if (!roomId || !historyItemId || !user?.channelId) {
          return callback?.({ error: '유효하지 않은 요청입니다.' });
        }

        const bypassLimit = roomManager.hasControlPermission(roomId, user.channelId);
        const res = roomManager.reAddFromHistory(roomId, historyItemId, user.channelId, bypassLimit);
        if (!res.success || !res.room || !res.reAddedVideo) {
          return callback?.({ error: res.error || '영상을 찾을 수 없거나 룸이 존재하지 않습니다.' });
        }

        io.to(roomId).emit('queue:updated', {
          currentVideo: res.room.currentVideo,
          queue: res.room.queue,
        });

        if (res.room.currentVideo?.id === res.reAddedVideo.id) {
          io.to(roomId).emit('video:sync', {
            videoId: res.room.currentVideo.videoId,
            isPlaying: true,
            currentTime: 0,
            lastUpdatedTimestamp: Date.now(),
            playbackRate: 1,
          });
        }

        callback?.({ success: true });
      }
    );

    // 10. Play Video from History Immediately (Play Now) - Host & Mod only
    socket.on(
      'history:play_now',
      (
        data: { roomId: string; historyItemId: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, historyItemId, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '영상을 즉시 재생할 권한(어드민/매니저)이 없습니다.' });
        }

        const res = roomManager.playHistoryNow(roomId, historyItemId);
        if (!res) {
          return callback?.({ error: '영상을 찾을 수 없거나 룸이 존재하지 않습니다.' });
        }

        io.to(roomId).emit('video:sync', {
          videoId: res.currentVideo?.videoId || null,
          isPlaying: true,
          currentTime: 0,
          lastUpdatedTimestamp: Date.now(),
          playbackRate: 1,
        });

        io.to(roomId).emit('queue:updated', {
          currentVideo: res.currentVideo,
          queue: res.room.queue,
        });

        io.to(roomId).emit('history:updated', {
          history: res.room.history,
        });

        callback?.({ success: true });
      }
    );

    // 11. Clear History - Host & Mod only
    socket.on(
      'history:clear',
      (
        data: { roomId: string; user: ChzzkUser },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '히스토리를 비울 권한이 없습니다.' });
        }

        const updatedRoom = roomManager.clearHistory(roomId);
        if (!updatedRoom) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        io.to(roomId).emit('history:updated', {
          history: updatedRoom.history,
        });

        callback?.({ success: true });
      }
    );

    // 12. Role Update (Promote / Demote Moderator) - Host only
    socket.on(
      'role:update',
      (
        data: { roomId: string; user: ChzzkUser; targetUserId: string; newRole: UserRole },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, user, targetUserId, newRole } = data;
        const success = roomManager.setRole(roomId, user?.channelId, targetUserId, newRole);

        if (!success) {
          return callback?.({ error: '권한을 변경할 수 없습니다 (어드민 전용 기능).' });
        }

        const room = roomManager.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('members:updated', room.members);
        }

        callback?.({ success: true });
      }
    );

    // 13. Room Settings Update (Queue Limit, Duration, Duplicate, Permission, Capacity, Shorts) - Host & Mod only
    socket.on(
      'room:settings_update',
      (
        data: {
          roomId: string;
          settings?: Partial<RoomSettings>;
          queueLimitMode?: QueueLimitMode;
          user: ChzzkUser;
        },
        callback?: (res: { success?: boolean; settings?: RoomSettings; error?: string }) => void
      ) => {
        const { roomId, settings, queueLimitMode, user } = data;
        if (!roomManager.hasControlPermission(roomId, user?.channelId)) {
          return callback?.({ error: '룸 설정을 변경할 권한(어드민/매니저)이 없습니다.' });
        }

        const newSettings: Partial<RoomSettings> = settings || (queueLimitMode ? { queueLimitMode } : {});
        const updatedRoom = roomManager.updateRoomSettings(roomId, newSettings);
        if (!updatedRoom) {
          return callback?.({ error: '룸을 찾을 수 없습니다.' });
        }

        io.to(roomId).emit('room:settings_updated', {
          settings: updatedRoom.settings,
          queueLimitMode: updatedRoom.settings.queueLimitMode,
        });

        callback?.({ success: true, settings: updatedRoom.settings });
      }
    );

    // 7. Disconnect / Leave Room
    const handleDisconnect = () => {
      const leaveResult = roomManager.leaveRoom(socket.id);
      if (leaveResult && leaveResult.room) {
        io.to(leaveResult.roomId).emit('members:updated', leaveResult.room.members);
      }
    };

    socket.on('room:leave', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
  });
}
