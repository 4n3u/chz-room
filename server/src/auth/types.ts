export interface ChzzkUser {
  channelId: string;
  channelName: string;
  channelImageUrl?: string;
  verifiedMark?: boolean;
}

export interface ChzzkTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ChzzkUserMeResponse {
  code?: number;
  message?: string;
  content?: {
    channelId: string;
    channelName: string;
  };
  channelId?: string;
  channelName?: string;
}

export interface ChzzkChannelResponse {
  code?: number;
  message?: string;
  content?: {
    data?: Array<{
      channelId: string;
      channelName: string;
      channelImageUrl?: string;
      followerCount?: number;
      verifiedMark?: boolean;
    }>;
  };
  data?: Array<{
    channelId: string;
    channelName: string;
    channelImageUrl?: string;
    followerCount?: number;
    verifiedMark?: boolean;
  }>;
}
