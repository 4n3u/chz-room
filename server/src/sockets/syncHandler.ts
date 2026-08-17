import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { ChzzkUser } from '../auth/types';
import { fetchYouTubeMetadata, parseYouTubeId } from '../utils/youtube';
import { UserRole, VideoItem } from '../rooms/types';
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
          return callback?.({ success: false, error: '존재하지 않는 방입니다.' });
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
          return callback?.({ error: '영상을 제어할 수 있는 권한(방장/관리자)이 없습니다.' });
        }

        const updatedRoom = roomManager.updatePlayback(roomId, isPlaying, currentTime, playbackRate);
        if (!updatedRoom) {
          return callback?.({ error: '방을 찾을 수 없습니다.' });
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

    // 3. Add to Queue - Anyone can add
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

        const videoId = parseYouTubeId(url);
        if (!videoId) {
          return callback?.({ error: '올바른 YouTube 영상 주소를 입력해주세요.' });
        }

        const metadata = await fetchYouTubeMetadata(videoId);
        const videoItem: VideoItem = {
          id: `item-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          videoId,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          addedBy: user,
        };

        const currentRoomBefore = roomManager.getRoom(roomId);
        const wasEmpty = !currentRoomBefore?.currentVideo;

        const updatedRoom = roomManager.addToQueue(roomId, videoItem);
        if (!updatedRoom) {
          return callback?.({ error: '방을 찾을 수 없습니다.' });
        }

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
          return callback?.({ error: '방을 찾을 수 없습니다.' });
        }

        io.to(roomId).emit('queue:updated', {
          currentVideo: updatedRoom.currentVideo,
          queue: updatedRoom.queue,
        });

        callback?.({ success: true });
      }
    );

    // 5. Skip / Next Video - Host & Mod only
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
          return callback?.({ error: '방을 찾을 수 없습니다.' });
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

        callback?.({ success: true });
      }
    );

    // 6. Role Update (Promote / Demote Moderator) - Host only
    socket.on(
      'role:update',
      (
        data: { roomId: string; user: ChzzkUser; targetUserId: string; newRole: UserRole },
        callback?: (res: { success?: boolean; error?: string }) => void
      ) => {
        const { roomId, user, targetUserId, newRole } = data;
        const success = roomManager.setRole(roomId, user?.channelId, targetUserId, newRole);

        if (!success) {
          return callback?.({ error: '권한을 변경할 수 없습니다 (방장 전용 기능).' });
        }

        const room = roomManager.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('members:updated', room.members);
        }

        callback?.({ success: true });
      }
    );

    // 7. Disconnect / Leave Room
    const handleDisconnect = () => {
      const leaveResult = roomManager.leaveRoom(socket.id);
      if (leaveResult && leaveResult.room) {
        if (leaveResult.wasHost && leaveResult.newHostUserId) {
          io.to(leaveResult.roomId).emit('host:migrated', {
            newHostUserId: leaveResult.newHostUserId,
          });
        }
        io.to(leaveResult.roomId).emit('members:updated', leaveResult.room.members);
      }
    };

    socket.on('room:leave', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
  });
}
