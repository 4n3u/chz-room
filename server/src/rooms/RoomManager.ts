import crypto from 'crypto';
import {
  CreateRoomOptions,
  PlaybackState,
  PublicRoomSummary,
  RoomMember,
  RoomState,
  UserRole,
  VideoItem,
  QueueLimitMode,
  RoomSettings,
  DEFAULT_ROOM_SETTINGS,
} from './types';
import { ChzzkUser } from '../auth/types';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  // Map socketId -> roomId
  private socketToRoom: Map<string, string> = new Map();
  // Empty room cleanup timers (5-min grace period)
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

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
      history: [],
      members: [],
      isShuffle: false,
      settings: { ...DEFAULT_ROOM_SETTINGS },
      queueLimitMode: 'unlimited',
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

    // Cancel empty room cleanup timer if someone joins
    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId)!);
      this.cleanupTimers.delete(roomId);
    }

    // Auto-resume playback if paused due to empty room
    if (room.wasAutoPausedByEmpty && room.currentVideo) {
      room.wasAutoPausedByEmpty = false;
      room.playback = {
        ...room.playback,
        isPlaying: true,
        lastUpdatedTimestamp: Date.now(),
      };
    }

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
   * Remove a member by socket ID. The room's hostUserId is preserved so that
   * the original admin retains host ownership upon rejoining.
   */
  public leaveRoom(socketId: string): {
    roomId: string;
    wasHost: boolean;
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

    // If room is empty, pause video and schedule cleanup timer with a 5-minute grace period
    if (room.members.length === 0) {
      if (room.playback.isPlaying) {
        room.playback.currentTime = this.getCalculatedCurrentTime(room);
        room.playback.isPlaying = false;
        room.playback.lastUpdatedTimestamp = Date.now();
        room.wasAutoPausedByEmpty = true;
      }

      if (this.cleanupTimers.has(roomId)) {
        clearTimeout(this.cleanupTimers.get(roomId)!);
      }
      const timer = setTimeout(() => {
        const targetRoom = this.rooms.get(roomId);
        if (targetRoom && targetRoom.members.length === 0) {
          if (targetRoom.bufferingState?.startTimeout) {
            clearTimeout(targetRoom.bufferingState.startTimeout);
          }
          this.rooms.delete(roomId);
        }
        this.cleanupTimers.delete(roomId);
      }, 5 * 60 * 1000); // 5 minutes grace period
      this.cleanupTimers.set(roomId, timer);
    }

    return { roomId, wasHost, room };
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
   * Add a video to queue with optional limit enforcement
   */
  public addToQueue(
    roomId: string,
    video: VideoItem,
    bypassLimit: boolean = false
  ): { success: boolean; room?: RoomState; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '룸을 찾을 수 없습니다.' };

    const settings = room.settings || DEFAULT_ROOM_SETTINGS;

    // Check submission policy rules for viewers (Non-admins)
    if (!bypassLimit) {
      const userChannelId = video.addedBy?.channelId;

      // 1. Request Permission Check
      if (settings.requestPermission === 'admin_only') {
        return {
          success: false,
          error: '현재 어드민과 매니저만 영상을 신청할 수 있도록 설정된 룸입니다.',
        };
      }

      // 2. Max Queue Capacity Check
      if (settings.maxQueueCapacity > 0 && room.queue.length >= settings.maxQueueCapacity) {
        return {
          success: false,
          error: `대기열이 꽉 찼습니다 (최대 ${settings.maxQueueCapacity}곡). 이전 영상이 재생된 후 다시 신청해주세요.`,
        };
      }

      // 3. Shorts Restriction Check
      if (settings.allowShorts === false && (video.isShorts || (video.duration && video.duration <= 60))) {
        return {
          success: false,
          error: '이 룸에서는 YouTube Shorts(쇼츠) 영상을 신청할 수 없습니다.',
        };
      }

      // 4. Max Duration Check
      if (settings.maxDurationLimit > 0 && video.duration && video.duration > settings.maxDurationLimit) {
        const maxMin = Math.floor(settings.maxDurationLimit / 60);
        const vidMin = Math.floor(video.duration / 60);
        const vidSec = video.duration % 60;
        return {
          success: false,
          error: `이 룸에서는 최대 ${maxMin}분 이하의 영상만 신청할 수 있습니다 (현재 영상: ${vidMin}분 ${vidSec}초).`,
        };
      }

      // 5. Duplicate Video Prevention Check
      if (settings.duplicatePolicy === 'prevent_in_queue') {
        const isCurrentSame = room.currentVideo?.videoId === video.videoId;
        const isInQueue = room.queue.some((item) => item.videoId === video.videoId);
        if (isCurrentSame || isInQueue) {
          return {
            success: false,
            error: '현재 재생 중이거나 대기열에 이미 동일한 영상이 등록되어 있습니다 (중복 신청 금지).',
          };
        }
      } else if (settings.duplicatePolicy === 'prevent_in_history') {
        const isCurrentSame = room.currentVideo?.videoId === video.videoId;
        const isInQueue = room.queue.some((item) => item.videoId === video.videoId);
        const isInHistory = room.history?.some((item) => item.videoId === video.videoId);
        if (isCurrentSame || isInQueue || isInHistory) {
          return {
            success: false,
            error: '이미 재생되었거나 대기열에 존재하는 중복 영상입니다.',
          };
        }
      }

      // 6. 1-Person Submission Limit Check
      const limitMode = settings.queueLimitMode || room.queueLimitMode;
      if (limitMode === 'once_in_queue') {
        const isPlayingMine = room.currentVideo?.addedBy?.channelId === userChannelId;
        const isInQueue = room.queue.some((item) => item.addedBy?.channelId === userChannelId);

        if (isPlayingMine || isInQueue) {
          return {
            success: false,
            error: '현재 대기열에 이미 신청하신 영상이 있습니다. (재생목록 내 1곡 제한)',
          };
        }
      } else if (limitMode === 'once_in_room') {
        const isPlayingMine = room.currentVideo?.addedBy?.channelId === userChannelId;
        const isInQueue = room.queue.some((item) => item.addedBy?.channelId === userChannelId);
        const isInHistory = room.history?.some((item) => item.addedBy?.channelId === userChannelId);

        if (isPlayingMine || isInQueue || isInHistory) {
          return {
            success: false,
            error: '이 룸에서는 1인당 1회만 영상을 신청할 수 있습니다. (룸당 1곡 제한)',
          };
        }
      }
    }

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

    return { success: true, room };
  }

  /**
   * Update comprehensive room settings (Host & Mod only)
   */
  public updateRoomSettings(roomId: string, newSettings: Partial<RoomSettings>): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.settings = {
      ...(room.settings || DEFAULT_ROOM_SETTINGS),
      ...newSettings,
    };
    if (newSettings.queueLimitMode) {
      room.queueLimitMode = newSettings.queueLimitMode;
    }
    return room;
  }

  /**
   * Set queue submission limit mode (Legacy shortcut)
   */
  public setQueueLimitMode(roomId: string, mode: QueueLimitMode): RoomState | null {
    return this.updateRoomSettings(roomId, { queueLimitMode: mode });
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
   * Helper to push a video to room history
   */
  private pushToHistory(room: RoomState, video: VideoItem | null) {
    if (!video) return;
    const historyItem: VideoItem = {
      ...video,
      playedAt: Date.now(),
    };
    if (!room.history) {
      room.history = [];
    }
    // Add to front (newest first)
    room.history.unshift(historyItem);
    // Keep max 50 items
    if (room.history.length > 50) {
      room.history = room.history.slice(0, 50);
    }
  }

  /**
   * Skip to next video in queue (Sequential or Random Shuffle)
   */
  public nextVideo(roomId: string): { currentVideo: VideoItem | null; room: RoomState } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.currentVideo) {
      this.pushToHistory(room, room.currentVideo);
    }

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
   * Play a specific video immediately from the queue
   */
  public playSpecificVideo(
    roomId: string,
    queueItemId: string
  ): { currentVideo: VideoItem | null; room: RoomState } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const itemIndex = room.queue.findIndex((item) => item.id === queueItemId);
    if (itemIndex === -1) return null;

    if (room.currentVideo) {
      this.pushToHistory(room, room.currentVideo);
    }

    const [targetVideo] = room.queue.splice(itemIndex, 1);
    room.currentVideo = targetVideo;
    room.playback = {
      isPlaying: true,
      currentTime: 0,
      lastUpdatedTimestamp: Date.now(),
      playbackRate: 1,
    };

    return { currentVideo: targetVideo, room };
  }

  /**
   * Re-add a video from history to queue with full settings check
   */
  public reAddFromHistory(
    roomId: string,
    historyItemId: string,
    currentUser: ChzzkUser,
    bypassLimit: boolean = false
  ): { success: boolean; reAddedVideo?: VideoItem; room?: RoomState; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '룸을 찾을 수 없습니다.' };

    const item = room.history?.find((h) => h.id === historyItemId);
    if (!item) return { success: false, error: '히스토리 영상을 찾을 수 없습니다.' };

    const newQueueItem: VideoItem = {
      ...item,
      id: crypto.randomBytes(4).toString('hex'),
      addedBy: currentUser,
      playedAt: undefined,
    };

    const addRes = this.addToQueue(roomId, newQueueItem, bypassLimit);
    if (!addRes.success || !addRes.room) {
      return { success: false, error: addRes.error || '대기열 추가에 실패했습니다.' };
    }

    return { success: true, reAddedVideo: newQueueItem, room: addRes.room };
  }

  /**
   * Play a video from history immediately (Host & Mod only)
   */
  public playHistoryNow(
    roomId: string,
    historyItemId: string,
    currentUser?: ChzzkUser
  ): { currentVideo: VideoItem | null; room: RoomState } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const item = room.history?.find((h) => h.id === historyItemId);
    if (!item) return null;

    if (room.currentVideo) {
      this.pushToHistory(room, room.currentVideo);
    }

    const targetVideo: VideoItem = {
      ...item,
      id: crypto.randomBytes(4).toString('hex'),
      addedBy: currentUser || item.addedBy,
      playedAt: undefined,
    };

    room.currentVideo = targetVideo;
    room.playback = {
      isPlaying: true,
      currentTime: 0,
      lastUpdatedTimestamp: Date.now(),
      playbackRate: 1,
    };

    return { currentVideo: targetVideo, room };
  }

  /**
   * Clear playback history (Host & Mod only)
   */
  public clearHistory(roomId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.history = [];
    return room;
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

  /**
   * Get all active room IDs (used for server-side auto-advance ticks)
   */
  public getAllRoomIds(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Server-side Auto-Advance Check
   * If video duration has passed (calculated time >= duration + 1.5s),
   * server automatically skips to next video so playback never gets stuck if client is in background.
   */
  public checkAutoAdvance(roomId: string): { currentVideo: VideoItem | null; room: RoomState } | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentVideo || !room.playback.isPlaying || room.playback.isBuffering) {
      return null;
    }

    const duration = room.currentVideo.duration;
    if (!duration || duration <= 0) {
      return null;
    }

    const calculatedTime = this.getCalculatedCurrentTime(room);
    // If video reached or exceeded duration (+ 1.5s tolerance margin)
    if (calculatedTime >= duration + 1.5) {
      return this.nextVideo(roomId);
    }

    return null;
  }

  /**
   * Start Buffering Handshake when a new video is loaded.
   * Gives clients up to maxWaitMs (default 2.5s) to prepare their iframes,
   * after which playback starts simultaneously for all viewers.
   */
  public startBuffering(
    roomId: string,
    maxWaitMs: number = 2500,
    onStart?: (room: RoomState) => void
  ): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentVideo) return null;

    // Clear any existing buffering timer
    if (room.bufferingState?.startTimeout) {
      clearTimeout(room.bufferingState.startTimeout);
    }

    room.playback = {
      ...room.playback,
      isPlaying: false,
      isBuffering: true,
      currentTime: 0,
      lastUpdatedTimestamp: Date.now(),
    };

    const timeout = setTimeout(() => {
      this.finishBuffering(roomId, onStart);
    }, maxWaitMs);

    room.bufferingState = {
      isWaiting: true,
      readyClients: new Set<string>(),
      startTimeout: timeout,
    };

    return room;
  }

  /**
   * Mark a client as ready for the current video.
   * If all active members in the room are ready, start playback immediately without waiting for timeout.
   */
  public markClientReady(
    roomId: string,
    socketId: string,
    onStart?: (room: RoomState) => void
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.bufferingState || !room.bufferingState.isWaiting) {
      return false;
    }

    room.bufferingState.readyClients.add(socketId);

    // If all room members are ready, start playback immediately
    const totalMembers = room.members.length;
    if (totalMembers > 0 && room.bufferingState.readyClients.size >= totalMembers) {
      this.finishBuffering(roomId, onStart);
      return true;
    }

    return false;
  }

  /**
   * Finish Buffering and start playback simultaneously
   */
  public finishBuffering(roomId: string, onStart?: (room: RoomState) => void): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.bufferingState?.startTimeout) {
      clearTimeout(room.bufferingState.startTimeout);
    }
    room.bufferingState = undefined;

    room.playback = {
      ...room.playback,
      isPlaying: !!room.currentVideo,
      isBuffering: false,
      currentTime: 0,
      lastUpdatedTimestamp: Date.now(),
    };

    if (onStart) {
      onStart(room);
    }

    return room;
  }
}

export const globalRoomManager = new RoomManager();
