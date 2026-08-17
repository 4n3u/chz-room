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
} from 'lucide-react';

interface RoomPageProps {
  roomId: string;
  onLeaveRoom: () => void;
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
    playback,
    error,
    clearError,
    sendVideoControl,
    addToQueue,
    removeFromQueue,
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
        {/* Left: YouTube Sync Player */}
        <div>
          <YouTubePlayer
            currentVideo={currentVideo}
            playback={playback}
            role={role}
            onVideoControl={sendVideoControl}
            onVideoEnded={skipNext}
          />
        </div>

        {/* Right: Sidebar Tabs + Copy Link Button */}
        <div style={{ height: 'calc(100vh - 100px)', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          {/* Top Header Actions (Tabs + Compact Copy Button) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            {/* Tab Selector Buttons */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                backgroundColor: 'var(--surface-dark)',
                borderRadius: 'var(--radius-md)',
                padding: 3,
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => setActiveTab('queue')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: activeTab === 'queue' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                  backgroundColor: activeTab === 'queue' ? 'var(--brand-green)' : 'transparent',
                }}
              >
                <ListMusic size={14} />
                <span>대기열 ({queue.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('members')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: activeTab === 'members' ? 'var(--text-on-brand)' : 'var(--text-muted)',
                  backgroundColor: activeTab === 'members' ? 'var(--brand-green)' : 'transparent',
                }}
              >
                <Users size={14} />
                <span>참가자 ({members.length})</span>
              </button>
            </div>

            {/* Compact Invite Link Copy Button */}
            <button
              className="btn-secondary"
              onClick={handleCopyLink}
              title="초대 링크 복사"
              style={{
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                height: 38,
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
                onAddToQueue={addToQueue}
                onRemoveFromQueue={removeFromQueue}
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
