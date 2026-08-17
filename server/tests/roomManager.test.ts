import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../src/rooms/RoomManager';
import { ChzzkUser } from '../src/auth/types';

describe('RoomManager Tests', () => {
  let roomManager: RoomManager;
  const hostUser: ChzzkUser = {
    channelId: 'host-123',
    channelName: '방장유저',
    channelImageUrl: 'https://example.com/host.png',
  };
  const viewerUser: ChzzkUser = {
    channelId: 'viewer-456',
    channelName: '시청자유저',
    channelImageUrl: 'https://example.com/viewer.png',
  };

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('should create a room with correct default state', () => {
    const room = roomManager.createRoom({
      title: '침착맨 같이보기',
      hostUser,
      isPrivate: false,
    });

    expect(room.id).toBeDefined();
    expect(room.title).toBe('침착맨 같이보기');
    expect(room.hostUserId).toBe('host-123');
    expect(room.currentVideo).toBeNull();
    expect(room.queue.length).toBe(0);
    expect(room.playback.isPlaying).toBe(false);
  });

  it('should assign host role to creator when joining', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    const joinResult = roomManager.joinRoom(room.id, 'socket-host-1', hostUser);
    expect(joinResult).not.toBeNull();
    expect(joinResult?.role).toBe('host');
    expect(joinResult?.room.members.length).toBe(1);
  });

  it('should assign viewer role to other users when joining', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    roomManager.joinRoom(room.id, 'socket-host-1', hostUser);
    const viewerJoin = roomManager.joinRoom(room.id, 'socket-viewer-1', viewerUser);

    expect(viewerJoin?.role).toBe('viewer');
    expect(viewerJoin?.room.members.length).toBe(2);
  });

  it('should promote and demote moderator', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    roomManager.joinRoom(room.id, 'socket-host-1', hostUser);
    roomManager.joinRoom(room.id, 'socket-viewer-1', viewerUser);

    // Promote to mod
    const promoted = roomManager.setRole(room.id, 'host-123', 'viewer-456', 'mod');
    expect(promoted).toBe(true);

    const userRoleAfterPromote = roomManager.getUserRole(room.id, 'viewer-456');
    expect(userRoleAfterPromote).toBe('mod');

    // Demote back to viewer
    const demoted = roomManager.setRole(room.id, 'host-123', 'viewer-456', 'viewer');
    expect(demoted).toBe(true);

    const userRoleAfterDemote = roomManager.getUserRole(room.id, 'viewer-456');
    expect(userRoleAfterDemote).toBe('viewer');
  });

  it('should add items to queue and play next video', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    const video1 = {
      id: 'item-1',
      videoId: 'vid-111',
      title: '영상 1',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      addedBy: hostUser,
    };
    const video2 = {
      id: 'item-2',
      videoId: 'vid-222',
      title: '영상 2',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      addedBy: viewerUser,
    };

    // Add first video -> If currentVideo is null, it should automatically become currentVideo
    const res1 = roomManager.addToQueue(room.id, video1);
    expect(res1?.currentVideo?.videoId).toBe('vid-111');
    expect(res1?.queue.length).toBe(0);

    // Add second video -> goes into queue
    const res2 = roomManager.addToQueue(room.id, video2);
    expect(res2?.currentVideo?.videoId).toBe('vid-111');
    expect(res2?.queue.length).toBe(1);

    // Skip to next video
    const nextRes = roomManager.nextVideo(room.id);
    expect(nextRes?.currentVideo?.videoId).toBe('vid-222');
    expect(nextRes?.room.queue.length).toBe(0);
  });

  it('should migrate host when host leaves the room', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    roomManager.joinRoom(room.id, 'socket-host-1', hostUser);
    roomManager.joinRoom(room.id, 'socket-viewer-1', viewerUser);

    // Host leaves
    const leaveRes = roomManager.leaveRoom('socket-host-1');
    expect(leaveRes?.wasHost).toBe(true);
    expect(leaveRes?.newHostUserId).toBe('viewer-456');

    const updatedRoom = roomManager.getRoom(room.id);
    expect(updatedRoom?.hostUserId).toBe('viewer-456');
    expect(roomManager.getUserRole(room.id, 'viewer-456')).toBe('host');
  });
});
