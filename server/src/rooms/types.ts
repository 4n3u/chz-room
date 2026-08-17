import { ChzzkUser } from '../auth/types';

export type UserRole = 'host' | 'mod' | 'viewer';

export interface VideoItem {
  id: string; // unique item id in playlist
  videoId: string; // YouTube 11-char ID
  title: string;
  thumbnailUrl: string;
  duration?: number;
  addedBy: ChzzkUser;
}

export interface RoomMember {
  socketId: string;
  user: ChzzkUser;
  role: UserRole;
  joinedAt: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdatedTimestamp: number;
  playbackRate: number;
}

export interface RoomState {
  id: string;
  title: string;
  hostUserId: string;
  moderatorUserIds: string[];
  isPrivate: boolean;
  password?: string;
  createdAt: number;
  currentVideo: VideoItem | null;
  playback: PlaybackState;
  queue: VideoItem[];
  members: RoomMember[];
}

export interface CreateRoomOptions {
  title: string;
  hostUser: ChzzkUser;
  isPrivate?: boolean;
  password?: string;
}

export interface PublicRoomSummary {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  memberCount: number;
  currentVideoTitle?: string;
  currentVideoThumbnail?: string;
  isPrivate: boolean;
  createdAt: number;
}
