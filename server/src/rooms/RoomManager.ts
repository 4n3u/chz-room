import crypto from 'crypto';
import {
  CreateRoomOptions,
  PlaybackState,
  PublicRoomSummary,
  RoomMember,
  RoomState,
  UserRole,
  VideoItem,
} from './types';
import { ChzzkUser } from '../auth/types';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  // Map socketId -> roomId
  private socketToRoom: Map<string, string> = new Map();

  /**
   * Generates a unique room ID
   */
  private generateRoomId(): string {
    return crypto.randomBytes(3).toString('hex');
  }

  /**
   * Create a new room
   */
  public createRoom(options: CreateRoomOptions): RoomState {
    const id = this.generateRoomId();
    const now = Date.now();

    const initialPlayback: PlaybackState = {
      isPlaying: false,
      currentTime: 0,
      lastUpdatedTimestamp: now,
      playbackRate: 1,
    };

    const room: RoomState = {
      id,
      title: options.title.trim() || '치지직 시청 룸',
      hostUserId: options.hostUser.channelId,
      moderatorUserIds: [],
      isPrivate: !!options.isPrivate,
      password: options.password || undefined,
      createdAt: now,
      currentVideo: null,
      playback: initialPlayback,
      queue: [],
      members: [],
      isShuffle: false,
    };

    this.rooms.set(id, room);
    return room;
  }

  /**
   * Get room by ID
   */
  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all active public rooms
   */
  public getPublicRooms(): PublicRoomSummary[] {
    const list: PublicRoomSummary[] = [];

    for (const room of this.rooms.values()) {
      if (!room.isPrivate) {
        const hostMember = room.members.find((m) => m.user.channelId === room.hostUserId);
        list.push({
          id: room.id,
          title: room.title,
          hostName: hostMember?.user.channelName || '어드민',
          hostAvatar: hostMember?.user.channelImageUrl,
          memberCount: room.members.length,
          currentVideoTitle: room.currentVideo?.title,
          currentVideoThumbnail: room.currentVideo?.thumbnailUrl,
          isPrivate: false,
          createdAt: room.createdAt,
        });
      }
    }

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Add a member to a room
   */
  public joinRoom(
    roomId: string,
    socketId: string,
    user: ChzzkUser
  ): { room: RoomState; role: UserRole } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Check existing socket and remove if re-joining
    this.leaveRoom(socketId);

    // Determine role
    let role: UserRole = 'viewer';
    if (room.hostUserId === user.channelId) {
      role = 'host';
    } else if (room.moderatorUserIds.includes(user.channelId)) {
      role = 'mod';
    }

    // Remove any previous member entry with the same socketId or user.channelId
    room.members = room.members.filter((m) => m.socketId !== socketId && m.user.channelId !== user.channelId);

    const newMember: RoomMember = {
      socketId,
      user,
      role,
      joinedAt: Date.now(),
    };

    room.members.push(newMember);
    this.socketToRoom.set(socketId, roomId);

    return { room, role };
  }

  /**
   * Remove a member by socket ID and handle host migration if needed
   */
  public leaveRoom(socketId: string): {
    roomId: string;
    wasHost: boolean;
    newHostUserId?: string;
    room?: RoomState;
  } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const leavingMember = room.members.find((m) => m.socketId === socketId);
    if (!leavingMember) return null;

    const wasHost = leavingMember.role === 'host' || leavingMember.user.channelId === room.hostUserId;
    room.members = room.members.filter((m) => m.socketId !== socketId);

    let newHostUserId: string | undefined = undefined;

    // If the host left and there are still members
    if (wasHost && room.members.length > 0) {
      // Find first moderator or first remaining member
      const nextHostMember =
        room.members.find((m) => room.moderatorUserIds.includes(m.user.channelId)) ||
        room.members[0];

      if (nextHostMember) {
        room.hostUserId = nextHostMember.user.channelId;
        nextHostMember.role = 'host';
        newHostUserId = nextHostMember.user.channelId;
        // Remove from mod list if was mod
        room.moderatorUserIds = room.moderatorUserIds.filter((id) => id !== newHostUserId);
      }
    }

    // If room is empty, delete room
    if (room.members.length === 0) {
      this.rooms.delete(roomId);
    }

    return { roomId, wasHost, newHostUserId, room };
  }

  /**
   * Get user role in a specific room
   */
  public getUserRole(roomId: string, userId: string): UserRole {
    const room = this.rooms.get(roomId);
    if (!room) return 'viewer';
    if (room.hostUserId === userId) return 'host';
    if (room.moderatorUserIds.includes(userId)) return 'mod';
    return 'viewer';
  }

  /**
   * Check if user has management permissions (Host or Mod)
   */
  public hasControlPermission(roomId: string, userId: string): boolean {
    const role = this.getUserRole(roomId, userId);
    return role === 'host' || role === 'mod';
  }

  /**
   * Update video playback state
   */
  public updatePlayback(
    roomId: string,
    isPlaying: boolean,
    currentTime: number,
    playbackRate: number = 1
  ): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.playback = {
      isPlaying,
      currentTime: Math.max(0, currentTime),
      lastUpdatedTimestamp: Date.now(),
      playbackRate: Math.max(0.25, Math.min(2, playbackRate)),
    };

    return room;
  }

  /**
   * Calculate expected current playback time based on elapsed wall clock time
   */
  public getCalculatedCurrentTime(room: RoomState): number {
    if (!room.playback.isPlaying) {
      return room.playback.currentTime;
    }
    const elapsedSeconds = (Date.now() - room.playback.lastUpdatedTimestamp) / 1000;
    return room.playback.currentTime + elapsedSeconds * room.playback.playbackRate;
  }

  /**
   * Add a video to queue
   */
  public addToQueue(roomId: string, video: VideoItem): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // If no video is currently playing, set as currentVideo and play immediately
    if (!room.currentVideo) {
      room.currentVideo = video;
      room.playback = {
        isPlaying: true,
        currentTime: 0,
        lastUpdatedTimestamp: Date.now(),
        playbackRate: 1,
      };
    } else {
      room.queue.push(video);
    }

    return room;
  }

  /**
   * Remove an item from the queue
   */
  public removeFromQueue(roomId: string, queueItemId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.queue = room.queue.filter((item) => item.id !== queueItemId);
    return room;
  }

  /**
   * Reorder items in the queue (drag & drop)
   */
  public reorderQueue(roomId: string, fromIndex: number, toIndex: number): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (
      fromIndex < 0 ||
      fromIndex >= room.queue.length ||
      toIndex < 0 ||
      toIndex >= room.queue.length
    ) {
      return room;
    }

    const [movedItem] = room.queue.splice(fromIndex, 1);
    room.queue.splice(toIndex, 0, movedItem);
    return room;
  }

  /**
   * Set playback mode (Sequential vs Shuffle)
   */
  public setShuffleMode(roomId: string, isShuffle: boolean): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.isShuffle = isShuffle;
    return room;
  }

  /**
   * Skip to next video in queue (Sequential or Random Shuffle)
   */
  public nextVideo(roomId: string): { currentVideo: VideoItem | null; room: RoomState } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    let nextVideo: VideoItem | null = null;
    if (room.queue.length > 0) {
      if (room.isShuffle) {
        const randomIndex = Math.floor(Math.random() * room.queue.length);
        [nextVideo] = room.queue.splice(randomIndex, 1);
      } else {
        nextVideo = room.queue.shift() || null;
      }
    }

    room.currentVideo = nextVideo;
    room.playback = {
      isPlaying: !!nextVideo,
      currentTime: 0,
      lastUpdatedTimestamp: Date.now(),
      playbackRate: 1,
    };

    return { currentVideo: nextVideo, room };
  }

  /**
   * Promote or demote a user role (Host only)
   */
  public setRole(
    roomId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: UserRole
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Only host can change roles
    if (room.hostUserId !== actorUserId) return false;
    // Cannot change host's own role this way
    if (targetUserId === room.hostUserId) return false;

    if (newRole === 'mod') {
      if (!room.moderatorUserIds.includes(targetUserId)) {
        room.moderatorUserIds.push(targetUserId);
      }
    } else if (newRole === 'viewer') {
      room.moderatorUserIds = room.moderatorUserIds.filter((id) => id !== targetUserId);
    }

    // Update active member role
    const member = room.members.find((m) => m.user.channelId === targetUserId);
    if (member) {
      member.role = newRole;
    }

    return true;
  }
}

export const globalRoomManager = new RoomManager();
