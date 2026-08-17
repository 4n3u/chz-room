import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { QueuePanel } from '../components/QueuePanel';
import { HistoryPanel } from '../components/HistoryPanel';
import { MemberList } from '../components/MemberList';
import { RoomSettingsModal } from '../components/RoomSettingsModal';
import { MockLoginModal } from '../components/MockLoginModal';
import {
  Copy,
  Check,
  ListMusic,
  History,
  Users,
  AlertCircle,
  Sparkles,
  Eye,
  Calendar,
  User,
  ExternalLink,
  Settings,
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
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'members'>('queue');
  const [copied, setCopied] = useState(false);
  const [showMockLogin, setShowMockLogin] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {
    role,
    members,
    currentVideo,
    queue,
    history,
    isShuffle,
    settings,
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
    reAddFromHistory,
    playHistoryNow,
    clearHistory,
    updateRoomSettings,
    updateRole,
  } = useSocket({ roomId, user });

  const canManage = role === 'host' || role === 'mod';

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1600, width: '100%', margin: '0 auto', padding: '16px 24px' }}>
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

      {/* Main Grid: YouTube Player (Left/Center) + Right Sidebar (Queue, History & Members) */}
      <div className="room-grid-layout">
        {/* Left: YouTube Sync Player & Minimal Video Info */}
        <div>
          <YouTubePlayer
            currentVideo={currentVideo}
            playback={playback}
            role={role}
            onVideoControl={sendVideoControl}
            onVideoEnded={skipNext}
          />

          {/* Current Video Info Banner (Clean typography & YouTube tab icon) */}
          {currentVideo && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 16px',
                backgroundColor: 'var(--surface-dark)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Title & External YouTube Link */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {currentVideo.title}
                </h2>

                <a
                  href={`https://www.youtube.com/watch?v=${currentVideo.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="유튜브에서 새 탭으로 보기"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-dark-alt)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-green)';
                    e.currentTarget.style.borderColor = 'var(--brand-green)';
                    e.currentTarget.style.backgroundColor = 'var(--brand-green-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--surface-dark-alt)';
                  }}
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Channel name, views, date, and user */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                }}
              >
                {/* YouTube Channel Name (Text Only) */}
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

        {/* Right: Sidebar Tabs + Copy Link Button + Room Settings */}
        <div style={{ height: 'calc(100vh - 130px)', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          {/* Top Header Actions (Unified Toolbar with 3 Tabs & Room Settings) */}
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
                gap: 5,
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                color: activeTab === 'queue' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                backgroundColor: activeTab === 'queue' ? 'var(--brand-green)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <ListMusic size={14} />
              <span>대기열 ({queue.length})</span>
            </button>

            {/* History Tab Button */}
            <button
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                color: activeTab === 'history' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                backgroundColor: activeTab === 'history' ? 'var(--brand-green)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={14} />
              <span>히스토리</span>
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
                gap: 5,
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                color: activeTab === 'members' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                backgroundColor: activeTab === 'members' ? 'var(--brand-green)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={14} />
              <span>참가자</span>
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

            {/* Room Settings Button (Host & Mod only) */}
            {canManage && (
              <button
                onClick={() => setShowSettingsModal(true)}
                title="룸 설정 (신청 제한 등)"
                style={{
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  color: 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--brand-green)';
                  e.currentTarget.style.backgroundColor = 'var(--brand-green-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={15} />
              </button>
            )}

            {/* Compact Invite Link Copy Button */}
            <button
              onClick={handleCopyLink}
              title="초대 링크 복사"
              style={{
                height: 34,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                backgroundColor: copied ? 'var(--brand-green-glow)' : 'transparent',
                borderRadius: 7,
                color: copied ? 'var(--brand-green)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
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
              <span>{copied ? '복사됨' : '초대'}</span>
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
            ) : activeTab === 'history' ? (
              <HistoryPanel
                history={history}
                role={role}
                onReAdd={reAddFromHistory}
                onPlayNow={playHistoryNow}
                onClearHistory={clearHistory}
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

      <RoomSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={updateRoomSettings}
      />

      <MockLoginModal isOpen={showMockLogin} onClose={() => setShowMockLogin(false)} />
    </div>
  );
};
