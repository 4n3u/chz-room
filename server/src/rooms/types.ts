import { ChzzkUser } from '../auth/types';

export type UserRole = 'host' | 'mod' | 'viewer';
export type QueueLimitMode = 'unlimited' | 'once_in_queue' | 'once_in_room';
export type DuplicatePolicy = 'allow' | 'prevent_in_queue' | 'prevent_in_history';
export type RequestPermission = 'all' | 'admin_only';

export interface RoomSettings {
  queueLimitMode: QueueLimitMode; // 1인당 신청 제한
  maxDurationLimit: number; // 최대 영상 길이 (초 단위, 0: 무제한)
  duplicatePolicy: DuplicatePolicy; // 중복 영상 신청 방지
  requestPermission: RequestPermission; // 신청 권한
  maxQueueCapacity: number; // 대기열 최대 수용 개수 (0: 무제한)
  allowShorts: boolean; // YouTube 쇼츠 허용 여부
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  queueLimitMode: 'unlimited',
  maxDurationLimit: 0,
  duplicatePolicy: 'allow',
  requestPermission: 'all',
  maxQueueCapacity: 0,
  allowShorts: true,
};

export interface VideoItem {
  id: string; // unique item id in playlist
  videoId: string; // YouTube ID or SoundCloud ID/URL
  title: string;
  thumbnailUrl: string;
  duration?: number;
  addedBy: ChzzkUser;
  source?: 'youtube' | 'soundcloud'; // Media provider
  soundcloudUrl?: string; // Direct SoundCloud track URL
  embedUrl?: string; // Direct SoundCloud iframe embed URL
  authorName?: string; // 게시 채널 프로필 이름 / 아티스트명
  authorUrl?: string; // 채널 링크
  uploadDate?: string; // 업로드 날짜 (ISO string or YYYY-MM-DD)
  viewCount?: number; // 조회수 (숫자)
  viewCountFormatted?: string; // 조회수 (포맷된 문자열: 예 "18억회", "1,250회")
  playedAt?: number; // 재생된 시각 타임스탬프
  isShorts?: boolean;
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
  isBuffering?: boolean;
  senderSocketId?: string;
}

export interface BufferingState {
  isWaiting: boolean;
  readyClients: Set<string>;
  startTimeout?: NodeJS.Timeout;
}

export interface RoomState {
  id: string;
  title: string;
  hostUserId: string;
  moderatorUserIds: string[];
  isPrivate: boolean;
  createdAt: number;
  currentVideo: VideoItem | null;
  playback: PlaybackState;
  queue: VideoItem[];
  history: VideoItem[];
  members: RoomMember[];
  isShuffle: boolean;
  settings: RoomSettings;
  queueLimitMode?: QueueLimitMode;
  wasAutoPausedByEmpty?: boolean;
  bufferingState?: BufferingState;
  lastSkipTimestamp?: number;
}

export interface CreateRoomOptions {
  title: string;
  hostUser: ChzzkUser;
  isPrivate?: boolean;
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
