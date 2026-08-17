import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { QueuePanel } from '../components/QueuePanel';
import { MemberList } from '../components/MemberList';
import { MockLoginModal } from '../components/MockLoginModal';
import {
  Copy,
  Check,
  ListMusic,
  Users,
  AlertCircle,
  Sparkles,
  Eye,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';

interface RoomPageProps {
  roomId: string;
  onLeaveRoom: () => void;
}

function formatUploadDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
  } catch {
    return dateStr;
  }
}

function formatViewCount(viewCount?: number, viewCountFormatted?: string): string {
  if (viewCountFormatted) {
    return viewCountFormatted.replace(/^조회수\s*/, '');
  }
  if (!viewCount) return '';
  if (viewCount >= 100000000) return `${(viewCount / 100000000).toFixed(1)}억회`;
  if (viewCount >= 10000) return `${Math.floor(viewCount / 10000)}만회`;
  return `${viewCount.toLocaleString()}회`;
}

export const RoomPage: React.FC<RoomPageProps> = ({ roomId }) => {
  const { user, loginWithChzzk } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'members'>('queue');
  const [copied, setCopied] = useState(false);
  const [showMockLogin, setShowMockLogin] = useState(false);

  const {
    role,
    members,
    currentVideo,
    queue,
    isShuffle,
    playback,
    error,
    clearError,
    sendVideoControl,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    toggleShuffle,
    playNow,
    skipNext,
    updateRole,
  } = useSocket({ roomId, user });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '16px 24px' }}>
      {/* Error Toast */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 75, 75, 0.15)',
            border: '1px solid rgba(255, 75, 75, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-red)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={clearError} style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            닫기
          </button>
        </div>
      )}

      {/* Non-login Notice Banner */}
      {!user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: 'var(--surface-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--brand-green)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              로그인하면 유튜브 영상을 대기열에 등록할 수 있습니다.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => setShowMockLogin(true)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              테스트 로그인
            </button>
            <button
              className="btn-primary"
              onClick={loginWithChzzk}
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              치지직 로그인
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: YouTube Player (Left/Center) + Right Sidebar (Queue & Members) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Left: YouTube Sync Player & Minimal Video Info */}
        <div>
          <YouTubePlayer
            currentVideo={currentVideo}
            playback={playback}
            role={role}
            onVideoControl={sendVideoControl}
            onVideoEnded={skipNext}
          />

          {/* Minimal Clean Video Info (No card box, no icons, no '조회수' text) */}
          {currentVideo && (
            <div style={{ marginTop: 12, padding: '0 2px' }}>
              {/* Title & Open in YouTube Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    flex: 1,
                  }}
                >
                  {currentVideo.title}
                </h2>

                <a
                  href={`https://www.youtube.com/watch?v=${currentVideo.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="유튜브에서 새 탭으로 열기"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    backgroundColor: 'transparent',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-green)';
                    e.currentTarget.style.backgroundColor = 'var(--surface-dark-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Sub Meta Line: Channel • Views • Upload Date • Added By */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                {/* Channel Name */}
                {currentVideo.authorName && (
                  <>
                    {currentVideo.authorUrl ? (
                      <a
                        href={currentVideo.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-green)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      >
                        {currentVideo.authorName}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {currentVideo.authorName}
                      </span>
                    )}
                  </>
                )}

                {/* Dot Divider & View Count with Eye Icon */}
                {(currentVideo.viewCount || currentVideo.viewCountFormatted) && (
                  <>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                      <Eye size={14} color="var(--text-dim)" />
                      <span>{formatViewCount(currentVideo.viewCount, currentVideo.viewCountFormatted)}</span>
                    </div>
                  </>
                )}

                {/* Dot Divider & Upload Date with Calendar Icon */}
                {currentVideo.uploadDate && (
                  <>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                      <Calendar size={14} color="var(--text-dim)" />
                      <span>{formatUploadDate(currentVideo.uploadDate)}</span>
                    </div>
                  </>
                )}

                {/* Dot Divider & Added by Nickname with User Icon */}
                {currentVideo.addedBy?.channelName && (
                  <>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                      <User size={13} color="var(--text-dim)" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {currentVideo.addedBy.channelName}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar Tabs + Copy Link Button */}
        <div style={{ height: 'calc(100vh - 130px)', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          {/* Top Header Actions (Unified Toolbar with Tabs & Invite Link) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-dark)',
              borderRadius: 'var(--radius-md)',
              padding: 3,
              border: '1px solid var(--border-color)',
              marginBottom: 10,
              gap: 3,
            }}
          >
            {/* Queue Tab Button */}
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                flex: 1,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === 'queue' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                backgroundColor: activeTab === 'queue' ? 'var(--brand-green)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <ListMusic size={15} />
              <span>대기열 ({queue.length})</span>
            </button>

            {/* Members Tab Button */}
            <button
              onClick={() => setActiveTab('members')}
              style={{
                flex: 1,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === 'members' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                backgroundColor: activeTab === 'members' ? 'var(--brand-green)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={15} />
              <span>참가자 ({members.length})</span>
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

            {/* Compact Invite Link Copy Button (Identical Inner Button Style) */}
            <button
              onClick={handleCopyLink}
              title="초대 링크 복사"
              style={{
                height: 34,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                backgroundColor: copied ? 'var(--brand-green-glow)' : 'transparent',
                borderRadius: 7,
                color: copied ? 'var(--brand-green)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!copied) e.currentTarget.style.backgroundColor = 'var(--surface-dark-hover)';
              }}
              onMouseLeave={(e) => {
                if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {copied ? <Check size={14} color="var(--brand-green)" /> : <Copy size={14} />}
              <span>{copied ? '복사됨' : '초대 링크'}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {activeTab === 'queue' ? (
              <QueuePanel
                currentVideo={currentVideo}
                queue={queue}
                role={role}
                isShuffle={isShuffle}
                onAddToQueue={addToQueue}
                onRemoveFromQueue={removeFromQueue}
                onReorderQueue={reorderQueue}
                onToggleShuffle={toggleShuffle}
                onPlayNow={playNow}
                onSkipNext={skipNext}
              />
            ) : (
              <MemberList
                members={members}
                myRole={role}
                myUserId={user?.channelId}
                onUpdateRole={updateRole}
              />
            )}
          </div>
        </div>
      </div>

      <MockLoginModal isOpen={showMockLogin} onClose={() => setShowMockLogin(false)} />
    </div>
  );
};
