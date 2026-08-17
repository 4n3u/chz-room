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
    expect(res1.room?.currentVideo?.videoId).toBe('vid-111');
    expect(res1.room?.queue.length).toBe(0);

    // Add second video -> goes into queue
    const res2 = roomManager.addToQueue(room.id, video2);
    expect(res2.room?.currentVideo?.videoId).toBe('vid-111');
    expect(res2.room?.queue.length).toBe(1);

    // Skip to next video
    const nextRes = roomManager.nextVideo(room.id);
    expect(nextRes?.currentVideo?.videoId).toBe('vid-222');
    expect(nextRes?.room.queue.length).toBe(0);
  });

  it('should reorder items in queue', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    const v1 = { id: 'item-1', videoId: 'vid-1', title: '1', thumbnailUrl: '', addedBy: hostUser };
    const v2 = { id: 'item-2', videoId: 'vid-2', title: '2', thumbnailUrl: '', addedBy: hostUser };
    const v3 = { id: 'item-3', videoId: 'vid-3', title: '3', thumbnailUrl: '', addedBy: hostUser };
    const v4 = { id: 'item-4', videoId: 'vid-4', title: '4', thumbnailUrl: '', addedBy: hostUser };

    roomManager.addToQueue(room.id, v1); // becomes currentVideo
    roomManager.addToQueue(room.id, v2); // queue[0]
    roomManager.addToQueue(room.id, v3); // queue[1]
    roomManager.addToQueue(room.id, v4); // queue[2]

    expect(roomManager.getRoom(room.id)?.queue.map((q) => q.id)).toEqual(['item-2', 'item-3', 'item-4']);

    // Move item at index 2 ('item-4') to index 0
    roomManager.reorderQueue(room.id, 2, 0);
    expect(roomManager.getRoom(room.id)?.queue.map((q) => q.id)).toEqual(['item-4', 'item-2', 'item-3']);
  });

  it('should toggle shuffle mode and randomly pick next video', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    const v1 = { id: 'item-1', videoId: 'vid-1', title: '1', thumbnailUrl: '', addedBy: hostUser };
    const v2 = { id: 'item-2', videoId: 'vid-2', title: '2', thumbnailUrl: '', addedBy: hostUser };
    const v3 = { id: 'item-3', videoId: 'vid-3', title: '3', thumbnailUrl: '', addedBy: hostUser };

    roomManager.addToQueue(room.id, v1);
    roomManager.addToQueue(room.id, v2);
    roomManager.addToQueue(room.id, v3);

    expect(roomManager.getRoom(room.id)?.isShuffle).toBe(false);

    roomManager.setShuffleMode(room.id, true);
    expect(roomManager.getRoom(room.id)?.isShuffle).toBe(true);

    const nextRes = roomManager.nextVideo(room.id);
    expect(['vid-2', 'vid-3']).toContain(nextRes?.currentVideo?.videoId);
    expect(nextRes?.room.queue.length).toBe(1);
  });

  it('should preserve host ownership when host leaves and rejoins', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    roomManager.joinRoom(room.id, 'socket-host-1', hostUser);
    roomManager.joinRoom(room.id, 'socket-viewer-1', viewerUser);

    // Host leaves
    const leaveRes = roomManager.leaveRoom('socket-host-1');
    expect(leaveRes?.wasHost).toBe(true);

    // Room still belongs to original host
    const roomAfterLeave = roomManager.getRoom(room.id);
    expect(roomAfterLeave?.hostUserId).toBe('host-123');

    // Viewer is still a viewer, not promoted automatically
    expect(roomManager.getUserRole(room.id, 'viewer-456')).toBe('viewer');

    // Host rejoins with a new socket
    const rejoinRes = roomManager.joinRoom(room.id, 'socket-host-2', hostUser);
    expect(rejoinRes?.role).toBe('host');
    expect(roomManager.getUserRole(room.id, 'host-123')).toBe('host');
  });

  it('should track played videos in history, support re-adding, and clearing', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    const v1 = { id: 'item-1', videoId: 'vid-1', title: '1', thumbnailUrl: '', addedBy: hostUser };
    const v2 = { id: 'item-2', videoId: 'vid-2', title: '2', thumbnailUrl: '', addedBy: hostUser };

    roomManager.addToQueue(room.id, v1);
    roomManager.addToQueue(room.id, v2);

    expect(roomManager.getRoom(room.id)?.history.length).toBe(0);

    // Skip to next -> v1 goes to history
    roomManager.nextVideo(room.id);
    const roomAfterNext = roomManager.getRoom(room.id);
    expect(roomAfterNext?.history.length).toBe(1);
    expect(roomAfterNext?.history[0].videoId).toBe('vid-1');
    expect(roomAfterNext?.history[0].playedAt).toBeDefined();

    // Re-add v1 from history to queue
    const reAddRes = roomManager.reAddFromHistory(room.id, 'item-1');
    expect(reAddRes).not.toBeNull();
    expect(roomManager.getRoom(room.id)?.queue.length).toBe(1);
    expect(roomManager.getRoom(room.id)?.queue[0].videoId).toBe('vid-1');

    // Clear history
    roomManager.clearHistory(room.id);
    expect(roomManager.getRoom(room.id)?.history.length).toBe(0);
  });

  it('should enforce queue limit mode settings (unlimited, once_in_queue, once_in_room)', () => {
    const room = roomManager.createRoom({
      title: '테스트방',
      hostUser,
    });

    const userA = { channelId: 'user-a', channelName: 'User A' };
    const userB = { channelId: 'user-b', channelName: 'User B' };

    const vA1 = { id: 'item-a1', videoId: 'vid-a1', title: 'A1', thumbnailUrl: '', addedBy: userA };
    const vA2 = { id: 'item-a2', videoId: 'vid-a2', title: 'A2', thumbnailUrl: '', addedBy: userA };
    const vB1 = { id: 'item-b1', videoId: 'vid-b1', title: 'B1', thumbnailUrl: '', addedBy: userB };

    // 1. Unlimited (Default)
    expect(roomManager.getRoom(room.id)?.queueLimitMode).toBe('unlimited');
    const resA1 = roomManager.addToQueue(room.id, vA1, false);
    expect(resA1.success).toBe(true);

    const resA2 = roomManager.addToQueue(room.id, vA2, false);
    expect(resA2.success).toBe(true);

    // 2. Set to 'once_in_queue'
    roomManager.setQueueLimitMode(room.id, 'once_in_queue');
    const vA3 = { id: 'item-a3', videoId: 'vid-a3', title: 'A3', thumbnailUrl: '', addedBy: userA };
    const resA3 = roomManager.addToQueue(room.id, vA3, false);
    expect(resA3.success).toBe(false);
    expect(resA3.error).toContain('1곡 제한');

    // Admin / Mod bypass
    const resA3Bypass = roomManager.addToQueue(room.id, vA3, true);
    expect(resA3Bypass.success).toBe(true);

    // 3. Set to 'once_in_room'
    roomManager.setQueueLimitMode(room.id, 'once_in_room');
    // User B adds 1st video
    const resB1 = roomManager.addToQueue(room.id, vB1, false);
    expect(resB1.success).toBe(true);

    // Skip so that B1 moves to history or finishes
    roomManager.nextVideo(room.id); // moves current to history
    roomManager.nextVideo(room.id);
    roomManager.nextVideo(room.id);
    roomManager.nextVideo(room.id);

    // User B tries to add 2nd video after their 1st was played and moved to history
    const vB2 = { id: 'item-b2', videoId: 'vid-b2', title: 'B2', thumbnailUrl: '', addedBy: userB };
    const resB2 = roomManager.addToQueue(room.id, vB2, false);
    expect(resB2.success).toBe(false);
    expect(resB2.error).toContain('1회만 영상을 신청');
  });
});


