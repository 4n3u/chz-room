import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { SoundCloudPlayer } from '../components/SoundCloudPlayer';
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
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

function formatViewCount(num?: number, formatted?: string): string {
  if (formatted) return formatted;
  if (!num) return '';
  if (num >= 100000000) {
    const val = (num / 100000000).toFixed(1).replace(/\.0$/, '');
    return `${val}억회`;
  }
  if (num >= 10000) {
    const val = (num / 10000).toFixed(1).replace(/\.0$/, '');
    return `${val}만회`;
  }
  return `${num.toLocaleString()}회`;
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
    sendVideoReady,
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

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('[Clipboard] navigator.clipboard failed, falling back to textarea copy:', err);
      }
    }

    // Fallback for HTTP (non-secure context) e.g. http://101.79.29.53
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('[Clipboard] Fallback copy failed:', err);
      return false;
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt('초대 링크를 복사해주세요:', url);
    }
  };

  return (
    <div
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Toast Error Notification */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 75, 75, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(255, 75, 75, 0.4)',
            zIndex: 1000,
            fontSize: 13,
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              marginLeft: 8,
              fontSize: 14,
              opacity: 0.8,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Guest Banner */}
      {!user && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(0, 255, 163, 0.08)',
            border: '1px solid rgba(0, 255, 163, 0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="var(--brand-green)" />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              현재 <strong>게스트(시청 전용)</strong> 모드로 시청 중입니다. 대기열에 곡을 추가하거나 역할을 받으려면 로그인해주세요.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              onClick={loginWithChzzk}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              치지직 로그인
            </button>
            {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true') && (
              <button
                className="btn-secondary"
                onClick={() => setShowMockLogin(true)}
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                테스트 로그인
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: YouTube / SoundCloud Player (Left/Center) + Right Sidebar (Queue, History & Members) */}
      <div className="room-grid-layout">
        {/* Left: Sync Player & Minimal Video Info */}
        <div>
          {currentVideo?.source === 'soundcloud' ? (
            <SoundCloudPlayer
              currentVideo={currentVideo}
              playback={playback}
              role={role}
              onVideoControl={sendVideoControl}
              onVideoEnded={skipNext}
              onVideoReady={sendVideoReady}
            />
          ) : (
            <YouTubePlayer
              currentVideo={currentVideo}
              playback={playback}
              role={role}
              onVideoControl={sendVideoControl}
              onVideoEnded={skipNext}
              onVideoReady={sendVideoReady}
            />
          )}

          {/* Current Video Info (Clean YouTube-style typography without card box) */}
          {currentVideo && (
            <div
              style={{
                marginTop: 12,
                padding: '2px 2px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Title & External Link */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
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
                  href={
                    currentVideo.source === 'soundcloud'
                      ? currentVideo.soundcloudUrl || currentVideo.authorUrl || currentVideo.videoId
                      : `https://www.youtube.com/watch?v=${currentVideo.videoId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title={currentVideo.source === 'soundcloud' ? '사운드클라우드에서 새 탭으로 열기' : '유튜브에서 새 탭으로 보기'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
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
              <span>대기열</span>
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

      {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true') && (
        <MockLoginModal isOpen={showMockLogin} onClose={() => setShowMockLogin(false)} />
      )}
    </div>
  );
};
